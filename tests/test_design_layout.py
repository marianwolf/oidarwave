"""Design-/Layoutshift-Warntest fuer Mobil & Desktop (nur Hinweis, kein harter Fehler)."""

import re
from pathlib import Path

import pytest
from playwright.sync_api import Browser, ViewportSize

pytestmark = pytest.mark.integration

VIEWPORTS: dict[str, ViewportSize] = {
    "mobile": {"width": 375, "height": 667},
    "desktop": {"width": 1280, "height": 800},
}

# Kern-Elemente je Seite (Design-Anker, muessen sichtbar und im Viewport liegen).
DESIGN_CHECKS = {
    "index": [".logo", "nav", ".station-btn"],
    "video": ["#videoPlayer", ".station-btn"],
    "impressum": ["h1"],
}

# CLS-Schwelle nach Web-Vitals ("good" <= 0.1). Nur Warnung via xfail(strict=False).
CLS_BUDGET = 0.1


@pytest.mark.xfail(strict=False, reason="Design-/Layoutshift-Warnung: Hinweis, kein harter Fehler")
@pytest.mark.parametrize("viewport_name", ["mobile", "desktop"])
@pytest.mark.parametrize("page_name", ["index", "video", "impressum"])
def test_design_layout_no_shift(browser: Browser, page_urls: dict[str, str], page_name: str, viewport_name: str):
    """Kein horizontaler Overflow, Kern-Elemente im Viewport, CLS-Risiken und gemessener CLS im Budget."""
    viewport = VIEWPORTS[viewport_name]
    context = browser.new_context(viewport=viewport)
    layout_page = context.new_page()
    # CLS-Observer vor dem Seitenaufruf installieren, damit fruehe Shifts erfasst werden.
    layout_page.add_init_script(
        """window.__clsValue = 0;
        try {
            new PerformanceObserver((list) => {
                for (const e of list.getEntries()) {
                    if (!e.hadRecentInput) window.__clsValue += e.value;
                }
            }).observe({type: 'layout-shift', buffered: true});
        } catch (err) { /* PerformanceObserver nicht verfuegbar */ }"""
    )
    try:
        layout_page.goto(page_urls[page_name])
        layout_page.wait_for_load_state("domcontentloaded")
        # Fonts/Bilder kurz setzen lassen, dann einmal scrollen (Lazy-Layout triggern).
        layout_page.wait_for_timeout(1000)
        layout_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        layout_page.wait_for_timeout(300)
        layout_page.evaluate("window.scrollTo(0, 0)")

        # 1. Design-Basis: viewport-Meta vorhanden.
        viewport_meta = layout_page.locator('meta[name="viewport"]').count()
        assert viewport_meta > 0, f"{page_name}/{viewport_name}: <meta name=viewport> fehlt"

        # 2. Kein horizontaler Overflow (= haeufigster Mobil-Designfehler).
        overflow = layout_page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        assert overflow <= 1, f"{page_name}/{viewport_name}: horizontaler Overflow {overflow}px"

        # 3. Kern-Elemente sichtbar und nicht breiter als der Viewport.
        for selector in DESIGN_CHECKS[page_name]:
            locator = layout_page.locator(selector).first
            assert locator.count() > 0, f"{page_name}/{viewport_name}: {selector} fehlt"
            box = locator.bounding_box()
            assert box is not None, f"{page_name}/{viewport_name}: {selector} ohne Box (unsichtbar?)"
            assert box["width"] <= viewport["width"] + 1, (
                f"{page_name}/{viewport_name}: {selector} breiter ({box['width']:.0f}px) als Viewport"
            )

        # 4. CLS-Risiko: sichtbare img/video/iframe ohne feste Masse (width+height oder aspect-ratio).
        risky = layout_page.evaluate(
            """Array.from(document.querySelectorAll('img, video, iframe')).filter((el) => {
                // Nur Medien mit spaet ladendem Inhalt koennen Layoutshift verursachen;
                // leere Player-Platzhalter (z. B. <video> ohne src) auslassen.
                const hasSrc = el.getAttribute('src') || el.currentSrc
                    || el.querySelector('source[src]');
                if (!hasSrc) return false;
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) return false;
                const style = getComputedStyle(el);
                const fixed = (el.hasAttribute('width') && el.hasAttribute('height'))
                    || (style.aspectRatio !== 'auto');
                return !fixed;
            }).map((el) => el.tagName + ':' + (el.getAttribute('src') || el.currentSrc || '(ohne src)')).slice(0, 5)"""
        )
        assert not risky, f"{page_name}/{viewport_name}: CLS-Risiko, Medien ohne Masse: {risky}"

        # 5. Gemessener Cumulative Layout Shift im Budget.
        cls = layout_page.evaluate("window.__clsValue || 0")
        assert cls <= CLS_BUDGET, f"{page_name}/{viewport_name}: CLS {cls:.3f} > Budget {CLS_BUDGET}"
    finally:
        layout_page.close()
        context.close()


def _regex_findings(html: str, css: str, name: str) -> list[str]:
    """Statische Regex-Checks fuer Design-/Layoutshift-Fehler (strukturell)."""
    findings: list[str] = []
    if not re.search(r'<meta[^>]+name=["\']viewport["\']', html, re.I):
        findings.append(f"{name}: viewport-meta fehlt")
    for m in re.finditer(r"<img\b[^>]*>", html, re.I):
        tag = m.group(0)
        if not re.search(r"\bwidth\s*=", tag, re.I) or not re.search(r"\bheight\s*=", tag, re.I):
            findings.append(f"{name}: <img> ohne width+height-Reserve: {tag[:80]}")
    if re.search(r'<[^>]+style\s*=\s*"[^"]*\b(position\s*:\s*absolute|float\s*:)', html, re.I):
        findings.append(f"{name}: inline-style mit absolute/float (Layoutshift-Risiko)")
    if "overflow-x" not in css:
        findings.append(f"{name}: overflow-x-Guard fehlt im CSS")
    for selector, reserve in [
        (".station-btn", "min-height"),
        (".current-station", "min-height"),
        ("header", "contain-intrinsic-size"),
    ]:
        if selector in css and reserve not in css:
            findings.append(f"{name}: {selector} ohne {reserve}-Reserve")
    banners = list(re.finditer(r"\.cookie-banner\s*\{([^}]*)\}", css, re.S))
    # .cookie-banner kommt auch in Gruppen-Selektoren vor (ohne position);
    # entscheidend ist, dass mindestens ein Block ihn fixiert (kein Layout-Push).
    if not banners:
        findings.append(f"{name}: .cookie-banner-Regel fehlt (Banner schiebt Layout)")
    elif not any("position" in b.group(1) and "fixed" in b.group(1) for b in banners):
        findings.append(f"{name}: .cookie-banner nicht fixiert (schiebt Layout)")
    if "prefers-reduced-motion" not in css:
        findings.append(f"{name}: prefers-reduced-motion fehlt")
    for width in ("768", "480"):
        if not re.search(rf"@media\s*\([^)]*max-width\s*:\s*{width}px", css):
            findings.append(f"{name}: @media (max-width: {width}px) fehlt")
    return findings


@pytest.mark.xfail(strict=False, reason="Design-Regex-Warnung: Hinweis, kein harter Fehler")
@pytest.mark.parametrize("page_name", ["index", "video", "impressum"])
def test_design_regex_guard(base_dir: Path, index_html: str, video_html: str,
                            main_css_content: str, page_name: str):
    """Regex-Guard: statische Design-/Layoutshift-Muster, warnt nur (xfail, nie rot)."""
    pages = {
        "index": index_html,
        "video": video_html,
        "impressum": (base_dir / "impressum" / "index.html").read_text(encoding="utf-8"),
    }
    css = main_css_content
    if page_name == "video":
        css += "\n" + (base_dir / "src" / "css" / "style-video.css").read_text(encoding="utf-8")
        if "aspect-ratio" not in css:
            pytest.fail("video: aspect-ratio-Reserve fehlt (video-container springt)")
    findings = _regex_findings(pages[page_name], css, page_name)
    assert not findings, "Regex-Designwarnungen: " + "; ".join(findings)
