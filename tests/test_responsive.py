"""
Responsive-CSS-Tests für Oidarwave.
Testet die Media-Query-Breakpoints für 768px und 480px Viewports.
Benötigt: pip install pytest playwright && playwright install chromium
"""
import pytest
from pathlib import Path
from typing import Generator
from playwright.sync_api import sync_playwright, Page, Browser


BASE_DIR = str(Path(__file__).resolve().parent.parent)
INDEX_URL = f"file://{BASE_DIR}/index.html"

# CSS custom property resolved values (16px base font)
# --space-sm: 0.5rem  = 8px
# --space-md: 1rem    = 16px
# --space-lg: 1.5rem  = 24px
# --space-xl: 2rem    = 32px
# --radius-sm: 0.5rem = 8px
# --radius-md: 1rem   = 16px


def get_computed_style(page: Page, selector: str, property_name: str) -> str:
    """Hilfsfunktion: Gibt den berechneten CSS-Wert eines Elements zurück."""
    return page.evaluate(
        f"getComputedStyle(document.querySelector('{selector}')).{property_name}"
    )


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    """Startet Browser für alle Tests (Session-scoped)."""
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture
def page_768(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 768px-Viewport (Grenzwert des Breakpoints)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 768, "height": 1024})
    p.goto(INDEX_URL)
    yield p
    p.close()


@pytest.fixture
def page_600(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 600px-Viewport (innerhalb des 768px-Breakpoints)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 600, "height": 1024})
    p.goto(INDEX_URL)
    yield p
    p.close()


@pytest.fixture
def page_480(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 480px-Viewport (Grenzwert des 480px-Breakpoints)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 480, "height": 900})
    p.goto(INDEX_URL)
    yield p
    p.close()


@pytest.fixture
def page_375(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 375px-Viewport (typisches kleines Smartphone)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 375, "height": 812})
    p.goto(INDEX_URL)
    yield p
    p.close()


@pytest.fixture
def page_320(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 320px-Viewport (sehr kleines Gerät, Grenzfall)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 320, "height": 568})
    p.goto(INDEX_URL)
    yield p
    p.close()


@pytest.fixture
def page_desktop(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 1280px-Viewport (Desktop, keine Breakpoints aktiv)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 1280, "height": 800})
    p.goto(INDEX_URL)
    yield p
    p.close()


@pytest.fixture
def page_769(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 769px-Viewport (knapp oberhalb des 768px-Breakpoints)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 769, "height": 1024})
    p.goto(INDEX_URL)
    yield p
    p.close()


@pytest.fixture
def page_481(browser: Browser) -> Generator[Page, None, None]:
    """Seite mit 481px-Viewport (knapp oberhalb des 480px-Breakpoints)."""
    p = browser.new_page()
    p.set_viewport_size({"width": 481, "height": 900})
    p.goto(INDEX_URL)
    yield p
    p.close()


class TestBreakpoint768px:
    """Tests für @media (max-width: 768px) - neu hinzugefügter .container-Stil."""

    def test_container_padding_top_at_768(self, page_768: Page):
        """Bei 768px hat .container den korrekten oberen Padding-Wert (--space-lg = 24px)."""
        padding = get_computed_style(page_768, ".container", "paddingTop")
        assert padding == "24px", f"Erwartet 24px, bekommen: {padding}"

    def test_container_padding_bottom_at_768(self, page_768: Page):
        """Bei 768px hat .container den korrekten unteren Padding-Wert (--space-lg = 24px)."""
        padding = get_computed_style(page_768, ".container", "paddingBottom")
        assert padding == "24px", f"Erwartet 24px, bekommen: {padding}"

    def test_container_padding_left_at_768(self, page_768: Page):
        """Bei 768px hat .container den korrekten linken Padding-Wert (--space-md = 16px)."""
        padding = get_computed_style(page_768, ".container", "paddingLeft")
        assert padding == "16px", f"Erwartet 16px, bekommen: {padding}"

    def test_container_padding_right_at_768(self, page_768: Page):
        """Bei 768px hat .container den korrekten rechten Padding-Wert (--space-md = 16px)."""
        padding = get_computed_style(page_768, ".container", "paddingRight")
        assert padding == "16px", f"Erwartet 16px, bekommen: {padding}"

    def test_container_padding_at_600(self, page_600: Page):
        """Bei 600px (innerhalb 768px-Breakpoint) hat .container den 768px-Padding."""
        padding_top = get_computed_style(page_600, ".container", "paddingTop")
        padding_left = get_computed_style(page_600, ".container", "paddingLeft")
        assert padding_top == "24px", f"Erwartet paddingTop 24px, bekommen: {padding_top}"
        assert padding_left == "16px", f"Erwartet paddingLeft 16px, bekommen: {padding_left}"

    def test_container_has_larger_padding_on_desktop(self, page_desktop: Page):
        """Auf Desktop (1280px) hat .container größeren Padding-Wert (--space-xl = 32px)."""
        padding_top = get_computed_style(page_desktop, ".container", "paddingTop")
        assert padding_top == "32px", f"Desktop: Erwartet paddingTop 32px, bekommen: {padding_top}"

    def test_768_breakpoint_is_boundary(self, page_769: Page):
        """Bei 769px greift der 768px-Breakpoint nicht – .container hat Desktop-Padding."""
        padding_top = get_computed_style(page_769, ".container", "paddingTop")
        assert padding_top == "32px", (
            f"Bei 769px sollte Desktop-Padding gelten (32px), bekommen: {padding_top}"
        )

    def test_player_section_single_column_at_768(self, page_768: Page):
        """Bei 768px hat .player-section eine einzige Spalte."""
        columns = get_computed_style(page_768, ".player-section", "gridTemplateColumns")
        # 1fr ergibt eine einzelne Spalte; der tatsächliche Wert ist eine Pixelbreite
        assert columns != "none", "gridTemplateColumns sollte gesetzt sein"
        # Stellt sicher, dass nur eine Spalte vorhanden ist (kein Komma im Wert)
        assert "," not in columns, f"Erwartet eine Spalte, bekommen: {columns}"


class TestBreakpoint480px:
    """Tests für den neuen @media (max-width: 480px) Block."""

    def test_container_padding_top_at_480(self, page_480: Page):
        """Bei 480px hat .container den korrekten oberen Padding-Wert (--space-md = 16px)."""
        padding = get_computed_style(page_480, ".container", "paddingTop")
        assert padding == "16px", f"Erwartet 16px, bekommen: {padding}"

    def test_container_padding_left_at_480(self, page_480: Page):
        """Bei 480px hat .container den korrekten linken Padding-Wert (--space-sm = 8px)."""
        padding = get_computed_style(page_480, ".container", "paddingLeft")
        assert padding == "8px", f"Erwartet 8px, bekommen: {padding}"

    def test_container_padding_right_at_480(self, page_480: Page):
        """Bei 480px hat .container den korrekten rechten Padding-Wert (--space-sm = 8px)."""
        padding = get_computed_style(page_480, ".container", "paddingRight")
        assert padding == "8px", f"Erwartet 8px, bekommen: {padding}"

    def test_container_gap_at_480(self, page_480: Page):
        """Bei 480px hat .container den korrekten Gap-Wert (--space-lg = 24px)."""
        gap = get_computed_style(page_480, ".container", "gap")
        assert gap == "24px", f"Erwartet 24px, bekommen: {gap}"

    def test_logo_font_size_at_480(self, page_480: Page):
        """Bei 480px hat .logo eine Schriftgröße von 2rem (32px)."""
        font_size = get_computed_style(page_480, ".logo", "fontSize")
        assert font_size == "32px", f"Erwartet 32px, bekommen: {font_size}"

    def test_nav_flex_direction_at_480(self, page_480: Page):
        """Bei 480px hat nav flex-direction: column."""
        direction = get_computed_style(page_480, "nav", "flexDirection")
        assert direction == "column", f"Erwartet column, bekommen: {direction}"

    def test_nav_width_at_480(self, page_480: Page):
        """Bei 480px hat nav width: 100% (entspricht der Viewport-Breite abzüglich Margins)."""
        width_px = page_480.evaluate(
            "document.querySelector('nav').getBoundingClientRect().width"
        )
        container_width = page_480.evaluate(
            "document.querySelector('.container').getBoundingClientRect().width"
        )
        # nav sollte die volle Breite des Containers einnehmen
        assert abs(width_px - container_width) < 2, (
            f"nav-Breite ({width_px}px) sollte Container-Breite ({container_width}px) entsprechen"
        )

    def test_nav_gap_is_zero_at_480(self, page_480: Page):
        """Bei 480px hat nav gap: 0."""
        gap = get_computed_style(page_480, "nav", "gap")
        assert gap == "0px", f"Erwartet 0px, bekommen: {gap}"

    def test_nav_a_text_align_at_480(self, page_480: Page):
        """Bei 480px hat nav a text-align: center."""
        text_align = get_computed_style(page_480, "nav a", "textAlign")
        assert text_align == "center", f"Erwartet center, bekommen: {text_align}"

    def test_nav_a_padding_at_480(self, page_480: Page):
        """Bei 480px hat nav a padding: --space-md (16px) auf allen Seiten."""
        padding_top = get_computed_style(page_480, "nav a", "paddingTop")
        padding_bottom = get_computed_style(page_480, "nav a", "paddingBottom")
        padding_left = get_computed_style(page_480, "nav a", "paddingLeft")
        padding_right = get_computed_style(page_480, "nav a", "paddingRight")
        assert padding_top == "16px", f"nav a paddingTop: Erwartet 16px, bekommen: {padding_top}"
        assert padding_bottom == "16px", f"nav a paddingBottom: Erwartet 16px, bekommen: {padding_bottom}"
        assert padding_left == "16px", f"nav a paddingLeft: Erwartet 16px, bekommen: {padding_left}"
        assert padding_right == "16px", f"nav a paddingRight: Erwartet 16px, bekommen: {padding_right}"

    def test_station_btn_font_size_at_480(self, page_480: Page):
        """Bei 480px hat .station-btn eine Schriftgröße von 0.9rem (14.4px)."""
        font_size = get_computed_style(page_480, ".station-btn", "fontSize")
        assert font_size == "14.4px", f"Erwartet 14.4px, bekommen: {font_size}"

    def test_station_btn_padding_at_480(self, page_480: Page):
        """Bei 480px hat .station-btn padding: --space-sm (8px) auf allen Seiten."""
        padding_top = get_computed_style(page_480, ".station-btn", "paddingTop")
        assert padding_top == "8px", f"station-btn paddingTop: Erwartet 8px, bekommen: {padding_top}"

    def test_current_station_font_size_at_480(self, page_480: Page):
        """Bei 480px hat .current-station font-size: 1.1rem (17.6px)."""
        font_size = get_computed_style(page_480, ".current-station", "fontSize")
        assert font_size == "17.6px", f"Erwartet 17.6px, bekommen: {font_size}"

    def test_current_station_flex_wrap_at_480(self, page_480: Page):
        """Bei 480px hat .current-station flex-wrap: wrap."""
        flex_wrap = get_computed_style(page_480, ".current-station", "flexWrap")
        assert flex_wrap == "wrap", f"Erwartet wrap, bekommen: {flex_wrap}"

    def test_current_station_text_align_at_480(self, page_480: Page):
        """Bei 480px hat .current-station text-align: center."""
        text_align = get_computed_style(page_480, ".current-station", "textAlign")
        assert text_align == "center", f"Erwartet center, bekommen: {text_align}"

    def test_station_selector_padding_at_480(self, page_480: Page):
        """Bei 480px hat .station-selector padding: --space-md (16px)."""
        padding_top = get_computed_style(page_480, ".station-selector", "paddingTop")
        padding_left = get_computed_style(page_480, ".station-selector", "paddingLeft")
        assert padding_top == "16px", f"station-selector paddingTop: Erwartet 16px, bekommen: {padding_top}"
        assert padding_left == "16px", f"station-selector paddingLeft: Erwartet 16px, bekommen: {padding_left}"

    def test_player_controls_padding_at_480(self, page_480: Page):
        """Bei 480px hat .player-controls padding: --space-md (16px)."""
        padding_top = get_computed_style(page_480, ".player-controls", "paddingTop")
        assert padding_top == "16px", f"player-controls paddingTop: Erwartet 16px, bekommen: {padding_top}"

    def test_audio_controls_gap_at_480(self, page_480: Page):
        """Bei 480px hat .audio-controls gap: --space-lg (24px)."""
        gap = get_computed_style(page_480, ".audio-controls", "gap")
        assert gap == "24px", f"Erwartet 24px, bekommen: {gap}"

    def test_header_padding_at_480(self, page_480: Page):
        """Bei 480px hat header padding-top: --space-md (16px) und padding-left/right: 0."""
        padding_top = get_computed_style(page_480, "header", "paddingTop")
        padding_left = get_computed_style(page_480, "header", "paddingLeft")
        assert padding_top == "16px", f"header paddingTop: Erwartet 16px, bekommen: {padding_top}"
        assert padding_left == "0px", f"header paddingLeft: Erwartet 0px, bekommen: {padding_left}"

    def test_480_breakpoint_boundary(self, page_481: Page):
        """Bei 481px greift der 480px-Breakpoint nicht – Logo hat 2.5rem (768px-Stil)."""
        font_size = get_computed_style(page_481, ".logo", "fontSize")
        # Bei 481px gilt der 768px-Breakpoint: font-size: 2.5rem = 40px
        assert font_size == "40px", (
            f"Bei 481px sollte 768px-Breakpoint gelten (40px), bekommen: {font_size}"
        )

    def test_container_padding_at_375(self, page_375: Page):
        """Bei 375px (typisches Smartphone) hat .container den 480px-Breakpoint-Padding."""
        padding_top = get_computed_style(page_375, ".container", "paddingTop")
        padding_left = get_computed_style(page_375, ".container", "paddingLeft")
        assert padding_top == "16px", f"Erwartet paddingTop 16px, bekommen: {padding_top}"
        assert padding_left == "8px", f"Erwartet paddingLeft 8px, bekommen: {padding_left}"

    def test_nav_is_column_at_375(self, page_375: Page):
        """Bei 375px hat nav weiterhin flex-direction: column."""
        direction = get_computed_style(page_375, "nav", "flexDirection")
        assert direction == "column", f"Erwartet column, bekommen: {direction}"

    def test_logo_font_size_at_375(self, page_375: Page):
        """Bei 375px hat .logo font-size: 2rem (32px)."""
        font_size = get_computed_style(page_375, ".logo", "fontSize")
        assert font_size == "32px", f"Erwartet 32px, bekommen: {font_size}"


class TestBreakpoint480pxSmallestDevice:
    """Grenzfall-Tests für sehr kleine Geräte (320px)."""

    def test_container_padding_at_320(self, page_320: Page):
        """Bei 320px hat .container den 480px-Breakpoint-Padding (--space-md/--space-sm)."""
        padding_top = get_computed_style(page_320, ".container", "paddingTop")
        padding_left = get_computed_style(page_320, ".container", "paddingLeft")
        assert padding_top == "16px", f"Erwartet paddingTop 16px, bekommen: {padding_top}"
        assert padding_left == "8px", f"Erwartet paddingLeft 8px, bekommen: {padding_left}"

    def test_nav_column_at_320(self, page_320: Page):
        """Bei 320px hat nav flex-direction: column."""
        direction = get_computed_style(page_320, "nav", "flexDirection")
        assert direction == "column", f"Erwartet column, bekommen: {direction}"

    def test_station_btn_font_size_at_320(self, page_320: Page):
        """Bei 320px hat .station-btn font-size: 0.9rem (14.4px)."""
        font_size = get_computed_style(page_320, ".station-btn", "fontSize")
        assert font_size == "14.4px", f"Erwartet 14.4px, bekommen: {font_size}"

    def test_audio_controls_gap_at_320(self, page_320: Page):
        """Bei 320px hat .audio-controls gap: --space-lg (24px) – Regressions-Check."""
        gap = get_computed_style(page_320, ".audio-controls", "gap")
        assert gap == "24px", f"Regressions-Check: Erwartet 24px, bekommen: {gap}"


class TestDesktopUnaffected:
    """Sicherstellt, dass 480px-Stile auf Desktop nicht aktiv sind."""

    def test_container_desktop_padding(self, page_desktop: Page):
        """Desktop: .container hat --space-xl (32px) padding, kein Breakpoint aktiv."""
        padding_top = get_computed_style(page_desktop, ".container", "paddingTop")
        assert padding_top == "32px", f"Erwartet 32px, bekommen: {padding_top}"

    def test_nav_desktop_flex_row(self, page_desktop: Page):
        """Desktop: nav hat flex-direction: row (nicht column)."""
        direction = get_computed_style(page_desktop, "nav", "flexDirection")
        assert direction == "row", f"Desktop: Erwartet row, bekommen: {direction}"

    def test_logo_desktop_font_size(self, page_desktop: Page):
        """Desktop: .logo hat 3.5rem (56px), keine mobilen Stile aktiv."""
        font_size = get_computed_style(page_desktop, ".logo", "fontSize")
        assert font_size == "56px", f"Desktop: Erwartet 56px, bekommen: {font_size}"

    def test_station_btn_desktop_font_size(self, page_desktop: Page):
        """Desktop: .station-btn hat 0.95rem (15.2px), nicht den 480px-Wert."""
        font_size = get_computed_style(page_desktop, ".station-btn", "fontSize")
        assert font_size == "15.2px", f"Desktop: Erwartet 15.2px, bekommen: {font_size}"

    def test_audio_controls_desktop_gap(self, page_desktop: Page):
        """Desktop: .audio-controls hat --space-xl (32px) gap, nicht --space-lg."""
        gap = get_computed_style(page_desktop, ".audio-controls", "gap")
        assert gap == "32px", f"Desktop: Erwartet 32px, bekommen: {gap}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
