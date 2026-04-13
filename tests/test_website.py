"""
Website- und Stream-Tests für Oidarwave.
Benötigt: pip install pytest playwright && playwright install chromium
Strukturierte und einheitliche Testorganisation mit Fixtures und parametrisierten Tests.
"""
import pytest
from typing import Generator
from playwright.sync_api import sync_playwright, Page, Browser


BASE_DIR = "/home/marian/nextcloud/github/oidarwave"

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


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])