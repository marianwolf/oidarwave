"""
Website- und Stream-Tests für Oidarwave.
Benötigt: pip install pytest playwright && playwright install chromium
Strukturierte und einheitliche Testorganisation mit Fixtures und parametrisierten Tests.
"""
import pytest
from pathlib import Path
from typing import Generator
from playwright.sync_api import sync_playwright, Page, Browser


BASE_DIR = str(Path(__file__).resolve().parent.parent)

STREAMS: tuple[tuple[str, str], ...] = (
    ("DLF", "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3"),
    ("DLF Nova", "https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3"),
    ("NDR 1", "https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3"),
    ("NDR 2", "https://f131.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3"),
    ("NDR Info", "https://f131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3"),
    ("NDR Kultur", "https://d141.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3"),
    ("N-JOY", "https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3"),
    ("80s80s", "https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667"),
    ("90s90s", "https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761"),
    ("BBG", "https://radio.bbg-bew.de"),
)

VIDEO_STREAMS: tuple[tuple[str, str], ...] = (
    ("Das Erste", "https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8"),
    ("ZDF", "https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8"),
    ("ARTE", "https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8"),
    ("Tagesschau24", "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8"),
)

PAGES: tuple[tuple[str, str], ...] = (
    ("index", f"file://{BASE_DIR}/index.html"),
    ("video", f"file://{BASE_DIR}/video/index.html"),
    ("impressum", f"file://{BASE_DIR}/impressum/index.html"),
)


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    """Startet Browser für alle Tests (Session-scoped)."""
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture
def page(browser: Browser) -> Generator[Page, None, None]:
    """Neue Seite für jeden Test."""
    p = browser.new_page()
    yield p
    p.close()


@pytest.fixture(scope="session")
def pages() -> tuple[tuple[str, str], ...]:
    """Alle Seiten-URLs."""
    return PAGES


@pytest.fixture(scope="session")
def audio_streams() -> tuple[tuple[str, str], ...]:
    """Alle Audio-Stream-URLs."""
    return STREAMS


@pytest.fixture(scope="session")
def video_streams() -> tuple[tuple[str, str], ...]:
    """Alle Video-Stream-URLs."""
    return VIDEO_STREAMS


@pytest.mark.parametrize("name,url", PAGES, ids=[p[0] for p in PAGES])
class TestPages:
    """Tests für alle Seiten."""
    
    def test_page_loads(self, page: Page, name: str, url: str):
        """Seiten laden ohne kritische Fehler."""
        page.goto(url)
        title = page.title()
        assert "Oidarwave" in title or "Impressum" in title


@pytest.mark.parametrize("name,url", PAGES, ids=[p[0] for p in PAGES])
class TestPageElements:
    """Tests für Seiten-Elemente (parametrisiert pro Seite)."""
    
    def test_elements_present(self, page: Page, name: str, url: str):
        """Erforderliche Elemente sind vorhanden."""
        page.goto(url)
        
        if name == "index":
            assert page.locator(".logo").is_visible()
            assert page.locator("nav").is_visible()
            assert page.locator(".station-btn").count() > 0
        elif name == "video":
            assert page.locator("#videoPlayer").is_visible()
            assert page.locator(".station-btn").count() >= 4
        elif name == "impressum":
            assert page.locator("h1").first.is_visible()


@pytest.mark.parametrize("name,url", STREAMS, ids=[s[0] for s in STREAMS])
class TestAudioStreams:
    """Tests für Audio-Stream-URLs."""
    
    def test_audio_stream_url_format(self, name: str, url: str):
        """Audio-Stream-URLs haben das richtige Format."""
        assert url.startswith(("http://", "https://"))
        assert len(url) > 10


@pytest.mark.parametrize("name,url", VIDEO_STREAMS, ids=[v[0] for v in VIDEO_STREAMS])
class TestVideoStreams:
    """Tests für Video-Stream-URLs."""
    
    def test_video_stream_url_format(self, name: str, url: str):
        """Video-Stream-URLs haben das richtige Format."""
        assert url.endswith(".m3u8")
        assert url.startswith("https://")


class TestIndexSpecific:
    """Spezifische Tests für die Index-Seite."""
    
    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        """Lädt die Index-Seite für jeden Test."""
        page.goto(PAGES[0][1])
        self.page = page
    
    def test_navigation(self):
        """Navigation hat alle erforderlichen Links."""
        links = self.page.locator("nav a")
        assert links.count() >= 3
        
        texts = [links.nth(i).inner_text() for i in range(links.count())]
        assert "Radio" in texts
        assert "Video" in texts
    
    def test_player(self):
        """Audio-Player ist vorhanden und hat Controls."""
        audio = self.page.locator("#audioPlayer")
        assert audio.is_visible()
        assert audio.get_attribute("controls") is not None
    
    def test_cookie_banner(self):
        """Cookie-Banner ist vorhanden."""
        banner = self.page.locator("#cookieBanner")
        assert banner.is_visible()
        assert self.page.locator("#acceptCookies").is_visible()
        assert self.page.locator("#declineCookies").is_visible()
    
    def test_status_display(self):
        """Status und Song-Titel sind vorhanden."""
        assert self.page.locator("#statusIndicator").count() > 0
        assert self.page.locator("#currentSongTitle").count() > 0


class TestResponsiveLayout:
    """Tests für die neu hinzugefügten responsiven Styles bei 768px und 480px."""

    INDEX_URL: str = PAGES[0][1]

    def _open_at_width(self, browser: Browser, width: int) -> Page:
        """Öffnet die Index-Seite in einem Browser mit der angegebenen Viewport-Breite."""
        page = browser.new_page(viewport={"width": width, "height": 800})
        page.goto(self.INDEX_URL)
        return page

    # --- @media (max-width: 768px): .container padding ---

    def test_768_container_has_padding(self, browser: Browser):
        """.container hat bei 768px Viewport das korrekte padding."""
        page = self._open_at_width(browser, 768)
        try:
            container = page.locator(".container").first
            padding_top = container.evaluate(
                "el => getComputedStyle(el).paddingTop"
            )
            padding_right = container.evaluate(
                "el => getComputedStyle(el).paddingRight"
            )
            # Padding must be non-zero (rule was applied)
            assert padding_top != '0px', \
                f"paddingTop sollte nicht 0px sein bei 768px, war: {padding_top}"
            assert padding_right != '0px', \
                f"paddingRight sollte nicht 0px sein bei 768px, war: {padding_right}"
        finally:
            page.close()

    def test_768_container_padding_differs_from_480(self, browser: Browser):
        """.container hat bei 768px anderen padding-right als bei 480px."""
        page_768 = self._open_at_width(browser, 768)
        page_480 = self._open_at_width(browser, 479)
        try:
            padding_right_768 = page_768.locator(".container").first.evaluate(
                "el => getComputedStyle(el).paddingRight"
            )
            padding_right_480 = page_480.locator(".container").first.evaluate(
                "el => getComputedStyle(el).paddingRight"
            )
            # At 768px --space-md padding; at 480px --space-sm padding — values differ
            assert padding_right_768 != padding_right_480, \
                "padding-right bei 768px und 479px sollte unterschiedlich sein"
        finally:
            page_768.close()
            page_480.close()

    # --- @media (max-width: 480px): nav layout ---

    def test_480_nav_is_column(self, browser: Browser):
        """nav hat bei 479px Viewport flex-direction: column."""
        page = self._open_at_width(browser, 479)
        try:
            flex_dir = page.locator("nav").first.evaluate(
                "el => getComputedStyle(el).flexDirection"
            )
            assert flex_dir == 'column', \
                f"nav flexDirection sollte 'column' sein bei 479px, war: {flex_dir}"
        finally:
            page.close()

    def test_769_nav_is_not_column(self, browser: Browser):
        """nav hat bei 769px keinen flex-direction: column (Regel greift nicht)."""
        page = self._open_at_width(browser, 769)
        try:
            flex_dir = page.locator("nav").first.evaluate(
                "el => getComputedStyle(el).flexDirection"
            )
            assert flex_dir != 'column', \
                f"nav flexDirection sollte bei 769px nicht 'column' sein, war: {flex_dir}"
        finally:
            page.close()

    # --- @media (max-width: 480px): .logo font-size ---

    def test_480_logo_font_size_smaller_than_768(self, browser: Browser):
        """.logo hat bei 479px kleinere font-size als bei 768px."""
        page_768 = self._open_at_width(browser, 768)
        page_480 = self._open_at_width(browser, 479)
        try:
            def px_value(page: Page) -> float:
                val = page.locator(".logo").first.evaluate(
                    "el => getComputedStyle(el).fontSize"
                )
                return float(val.replace('px', ''))

            size_768 = px_value(page_768)
            size_480 = px_value(page_480)
            assert size_480 < size_768, \
                f".logo font-size bei 479px ({size_480}px) sollte kleiner sein als bei 768px ({size_768}px)"
        finally:
            page_768.close()
            page_480.close()

    # --- @media (max-width: 480px): .station-btn font-size ---

    def test_480_station_btn_font_size(self, browser: Browser):
        """.station-btn hat bei 479px eine kleinere font-size (0.9rem entspricht ca. 14px)."""
        page = self._open_at_width(browser, 479)
        try:
            btn = page.locator(".station-btn").first
            font_size_px = btn.evaluate("el => parseFloat(getComputedStyle(el).fontSize)")
            # 0.9rem with a 16px base font = 14.4px; allow a small tolerance
            assert font_size_px <= 16, \
                f".station-btn font-size sollte ≤ 16px bei 479px sein, war: {font_size_px}px"
        finally:
            page.close()

    # --- @media (max-width: 480px): .current-station text-align ---

    def test_480_current_station_text_align_center(self, browser: Browser):
        """.current-station hat bei 479px text-align: center."""
        page = self._open_at_width(browser, 479)
        try:
            text_align = page.locator(".current-station").first.evaluate(
                "el => getComputedStyle(el).textAlign"
            )
            assert text_align == 'center', \
                f".current-station text-align sollte 'center' sein bei 479px, war: {text_align}"
        finally:
            page.close()

    # --- Boundary: exactly at 480px breakpoint ---

    def test_480_boundary_nav_column(self, browser: Browser):
        """nav hat bei exakt 480px Viewport flex-direction: column."""
        page = self._open_at_width(browser, 480)
        try:
            flex_dir = page.locator("nav").first.evaluate(
                "el => getComputedStyle(el).flexDirection"
            )
            assert flex_dir == 'column', \
                f"nav flexDirection sollte 'column' bei exakt 480px sein, war: {flex_dir}"
        finally:
            page.close()

    # --- Regression: 480px styles do not bleed into desktop widths ---

    def test_desktop_nav_not_column(self, browser: Browser):
        """nav hat bei 1200px (Desktop) kein flex-direction: column."""
        page = self._open_at_width(browser, 1200)
        try:
            flex_dir = page.locator("nav").first.evaluate(
                "el => getComputedStyle(el).flexDirection"
            )
            assert flex_dir != 'column', \
                f"nav flexDirection sollte bei 1200px nicht 'column' sein, war: {flex_dir}"
        finally:
            page.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
