"""
Website- und Stream-Tests für Oidarwave
Benötigt: pip install pytest playwright && playwright install chromium
"""
import pytest
from typing import Generator
from playwright.sync_api import sync_playwright, Page, Browser


# Stream-URLs
STREAMS = (
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

VIDEO_STREAMS = (
    ("Das Erste", "https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8"),
    ("ZDF", "https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8"),
    ("ARTE", "https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8"),
    ("Tagesschau24", "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8"),
)

PAGES = (
    ("index", "file:///home/marian/nextcloud/github/oidarwave/index.html"),
    ("video", "file:///home/marian/nextcloud/github/oidarwave/video/index.html"),
    ("impressum", "file:///home/marian/nextcloud/github/oidarwave/impressum/index.html"),
)


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture
def page(browser: Browser) -> Generator[Page, None, None]:
    p = browser.new_page()
    yield p
    p.close()


class TestPages:
    """Tests für alle Seiten."""
    
    @pytest.mark.parametrize("name,url", PAGES)
    def test_page_loads(self, page: Page, name: str, url: str):
        """Seiten laden ohne kritische Fehler."""
        page.goto(url)
        title = page.title()
        assert "Oidarwave" in title or "Impressum" in title


class TestIndexElements:
    """Tests für Index-Seiten-Elemente."""
    
    @pytest.fixture
    def index_page(self, page: Page) -> Page:
        page.goto(PAGES[0][1])
        return page
    
    def test_logo_and_nav(self, index_page: Page):
        """Logo und Navigation sind vorhanden."""
        assert index_page.locator(".logo").is_visible()
        assert index_page.locator("nav").is_visible()
    
    def test_station_buttons(self, index_page: Page):
        """Mindestens ein Sender-Button ist vorhanden."""
        assert index_page.locator(".station-btn").count() > 0
    
    def test_audio_player(self, index_page: Page):
        """Audio-Player ist vorhanden und hat Controls."""
        audio = index_page.locator("#audioPlayer")
        assert audio.is_visible()
        assert audio.get_attribute("controls") is not None
    
    def test_navigation_links(self, index_page: Page):
        """Navigation hat alle erforderlichen Links."""
        links = index_page.locator("nav a")
        assert links.count() >= 3
        
        texts = [links.nth(i).inner_text() for i in range(links.count())]
        assert "Radio" in texts
        assert "Video" in texts
    
    def test_player_buttons(self, index_page: Page):
        """Player-Buttons haben erforderliche Attribute."""
        btn = index_page.locator(".station-btn").first
        assert btn.get_attribute("data-url")
        assert btn.get_attribute("data-name")
    
    def test_cookie_banner(self, index_page: Page):
        """Cookie-Banner ist vorhanden."""
        banner = index_page.locator("#cookieBanner")
        assert banner.is_visible()
        assert index_page.locator("#acceptCookies").is_visible()
        assert index_page.locator("#declineCookies").is_visible()
    
    def test_status_display(self, index_page: Page):
        """Status und Song-Titel sind vorhanden."""
        assert index_page.locator("#statusIndicator").count() > 0
        assert index_page.locator("#currentSongTitle").count() > 0


class TestVideoPage:
    """Tests für Video-Seite."""
    
    @pytest.fixture
    def video_page(self, page: Page) -> Page:
        page.goto(PAGES[1][1])
        return page
    
    def test_video_player(self, video_page: Page):
        """Video-Player ist vorhanden."""
        assert video_page.locator("#videoPlayer").is_visible()
    
    def test_station_buttons(self, video_page: Page):
        """Mindestens 4 Sender-Buttons sind vorhanden."""
        assert video_page.locator(".station-btn").count() >= 4


class TestStreams:
    """Tests für Stream-URLs."""
    
    @pytest.mark.parametrize("name,url", STREAMS)
    def test_audio_stream(self, name: str, url: str):
        """Audio-Stream-URLs haben das richtige Format."""
        assert url.startswith(("http://", "https://"))
        assert len(url) > 10
    
    @pytest.mark.parametrize("name,url", VIDEO_STREAMS)
    def test_video_stream(self, name: str, url: str):
        """Video-Stream-URLs haben das richtige Format."""
        assert url.endswith(".m3u8")
        assert url.startswith("https://")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])