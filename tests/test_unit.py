"""Unit-Tests (ohne Browser/Netzwerk): Syntax, Streams, Electron-Build."""

import json
import re
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

import pytest

pytestmark = pytest.mark.unit

BASE_DIR = Path(__file__).resolve().parent.parent
EXCLUDE = {"node_modules", ".venv", ".git", "__pycache__", "dist", "build", ".pytest_cache"}

# --- Syntax-Helfer ---


def _balanced(content: str, *pairs: tuple[str, str]) -> list[str]:
    errors = []
    for open_c, close_c in pairs:
        depth = 0
        for i, char in enumerate(content):
            if char == open_c:
                depth += 1
            elif char == close_c:
                depth -= 1
                if depth < 0:
                    errors.append(f"Unmatched '{close_c}' at {i}")
                    break
        else:
            if depth:
                errors.append(f"Unmatched '{open_c}'")
    return errors


def _check_html(c: str) -> list[str]:
    cl, issues = c.lower(), []
    if "<!doctype" not in cl:
        issues.append("Fehlender <doctype>")
    issues += [f"Fehlender <{t}>" for t in ("html", "head", "body", "title") if f"<{t}" not in cl]
    if "charset" not in cl:
        issues.append("Fehlender charset")
    if any(re.search(rf"<{t}[^>]*>", c, re.I) and not re.search(rf"</{t}>", c, re.I)
           for t in ("div", "span", "nav", "header", "footer", "main", "section")):
        issues.append("Ungeschlossener Tag")
    if re.search(r"</script>", c, re.I) and not re.search(r"<script", c, re.I):
        issues.append("Mehr </script> als <script>")
    if re.search(r"</style>", c, re.I) and not re.search(r"<style", c, re.I):
        issues.append("Mehr </style> als <style>")
    return issues


def _check_js(c: str) -> list[str]:
    issues = _balanced(c, ("[", "]"), ("{", "}"), ("(", ")"))
    if c.count("`") % 2:
        issues.append("Ungerade Backticks")
    if c.count("/*") != c.count("*/"):
        issues.append("Ungleiche Blockkommentare")
    if ";;" in c:
        issues.append("Doppelte Semikolons")
    return issues


def _check_css(c: str) -> list[str]:
    return _balanced(c, ("{", "}"), ("(", ")"))


def _check_md(c: str) -> list[str]:
    return ["Ungleiche Code-Fences"] if c.count("```") % 2 else []


def _check_json(c: str) -> list[str]:
    issues = _balanced(c, ("{", "}"), ("[", "]"))
    try:
        json.loads(c)
    except json.JSONDecodeError as e:
        issues.append(f"JSON-Fehler: {e}")
    return issues


CHECKERS = {".html": _check_html, ".js": _check_js, ".css": _check_css, ".md": _check_md, ".json": _check_json}


@lru_cache(maxsize=None)
def _find(ext: str) -> tuple[str, ...]:
    return tuple(sorted(
        p.relative_to(BASE_DIR).as_posix()
        for p in BASE_DIR.rglob(f"*{ext}")
        if not any(part in EXCLUDE for part in p.parts)
    ))


@pytest.mark.parametrize("ext", list(CHECKERS), ids=["HTML", "JavaScript", "CSS", "Markdown", "JSON"])
def test_syntax_valid(ext: str):
    paths = _find(ext)
    assert paths, f"Keine {ext}-Dateien gefunden"
    errors = [
        f"{path}: {e}"
        for path in paths
        for e in CHECKERS[ext]((BASE_DIR / path).read_text(encoding="utf-8"))
    ]
    assert not errors, f"{ext} Syntax-Fehler: {errors}"


# --- CSS-Breakpoints (strukturell, keine Wert-Regexes) ---


def _media_block(css: str, width: int) -> str:
    m = re.search(rf"@media\s*\(\s*max-width\s*:\s*{width}px\s*\)\s*\{{", css)
    if not m:
        return ""
    depth, i = 1, m.end()
    while i < len(css) and depth:
        depth += (css[i] == "{") - (css[i] == "}")
        i += 1
    return css[m.end():i - 1]


def test_css_768_container(main_css_content: str):
    block = _media_block(main_css_content, 768)
    assert block, "@media (max-width: 768px) fehlt"
    assert len(re.findall(r"\.container\s*\{", block)) == 1, ".container muss genau 1x im 768px-Block stehen"


def test_css_480_structure(main_css_content: str):
    block = _media_block(main_css_content, 480)
    assert block, "@media (max-width: 480px) fehlt"
    assert not _balanced(block, ("{", "}")), "Unbalancierte Klammern im 480px-Block"
    assert block.count("{") >= 9, f"Zu wenige Regeln im 480px-Block: {block.count('{')}"
    for selector in (".container", "header", ".logo", "nav", ".station-grid",
                     ".station-btn", ".current-station", ".audio-controls"):
        assert selector in block, f"{selector} fehlt im 480px-Block"
    assert "prefers-reduced-motion" not in block, "reduced-motion gehoert nicht in den 480px-Block"


# --- Streams (Source of Truth: data-url in index.html / video/index.html) ---

EXPECTED_HOSTS = {"st01.sslstream.dlf.de", "rndfnk.com", "streamabc.net"}


def _assert_http_url(url: str):
    parsed = urlparse(url)
    assert parsed.scheme in ("http", "https") and parsed.netloc, f"Ungueltige URL: {url}"


def test_audio_streams(audio_stations):
    assert len(audio_stations) >= 5, f"Zu wenige Audio-Sender: {len(audio_stations)}"
    urls = [url for _, url in audio_stations]
    for host in EXPECTED_HOSTS:
        assert any(host in u for u in urls), f"Erwarteter Audio-Host {host} fehlt"
    for url in urls:
        _assert_http_url(url)


def test_video_streams(video_stations):
    assert len(video_stations) >= 4, f"Zu wenige Video-Sender: {len(video_stations)}"
    for name, url in video_stations:
        _assert_http_url(url)
        assert url.endswith(".m3u8"), f"{name}: erwartet .m3u8, erhalten {url}"


def test_no_duplicate_station_urls(audio_stations, video_stations):
    urls = [url for _, url in audio_stations + video_stations]
    assert len(urls) == len(set(urls)), "Doppelte Stream-URLs gefunden"


@pytest.mark.xfail(reason="index.html enthaelt Session-Token (Produktentscheidung, s. AGENTS.md)", strict=False)
def test_no_secrets_in_station_urls(index_html: str):
    for param in ("token=", "sid=", "cid=", "tvf="):
        assert param not in index_html, f"Session-Parameter {param!r} in index.html"


# --- Electron-Build ---


def test_electron_build(base_dir: Path, package_json: dict):
    assert (base_dir / "electron" / "main.js").exists(), "electron/main.js fehlt"
    build = package_json.get("build", {})
    for key in ("appId", "productName", "directories", "files"):
        assert key in build, f"build.{key} fehlt"
    for pattern in ("electron/**/*", "src/**/*", "index.html", "favicon/**/*",
                    "manifest.json", "video/**/*", "impressum/**/*"):
        assert pattern in build["files"], f"build.files ohne {pattern}"
    dev_deps = package_json.get("devDependencies", {})
    assert "electron" in dev_deps and "electron-builder" in dev_deps, "electron(-builder) fehlt in devDependencies"
