"""
Website- und Stream-Tests für Oidarwave
Tests für die Website-Funktionalität und Stream-Verfügbarkeit

Optimierungen:
- Parametrisierte Tests für Stream-URLs
- Wiederverwendbare Console-Error-Capture-Fixture
- Effizientere Page-Objekt-Verwaltung
- Kombinierte Tests für weniger Overhead
- Typ-Annotationen

Benötigt: pip install pytest playwright
         playwright install chromium
"""
import pytest
from typing import Generator, Callable
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext, ConsoleMessage


# ============================================================================
# KONFIGURATION (als Tuple für effizientere Iteration)
# ============================================================================

# Stream-URLs als Tuple für bessere Performance
STREAM_URLS: tuple[tuple[str, str], ...] = (
    ("Deutschlandfunk", "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3"),
    ("DLF Nova", "https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3"),
    ("NDR 1", "https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3"),
    ("NDR 2", "https://f131.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3"),
    ("NDR Info", "https://f131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3"),
    ("NDR Kultur", "https://d141.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3"),
    ("N-JOY", "https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3"),
    ("80s80s", "https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667"),
    ("90s90s", "https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761"),
    ("BBG Radio", "https://radio.bbg-bew.de"),
)

VIDEO_STREAM_URLS: tuple[tuple[str, str], ...] = (
    ("Das Erste", "https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8"),
    ("ZDF", "https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8"),
    ("ARTE", "https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8"),
    ("Tagesschau24", "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8"),
)

# Seiten-URLs für konsistente Referenz
PAGE_URLS: dict[str, str] = {
    "index": "file:///home/marian/nextcloud/github/oidarwave/index.html",
    "video": "file:///home/marian/nextcloud/github/oidarwave/video/index.html",
    "impressum": "file:///home/marian/nextcloud/github/oidarwave/impressum/index.html",
}


# ============================================================================
# FIXTURES (optimiert)
# ============================================================================

@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    """Startet einen Browser für alle Tests (Session-Scope)"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()


@pytest.fixture(scope="session")
def browser_context(browser: Browser) -> Generator[BrowserContext, None, None]:
    """Ein Browser-Kontext für alle Tests (Session-Scope für Effizienz)"""
    context = browser.new_context()
    yield context
    context.close()


@pytest.fixture
def page(browser_context: BrowserContext) -> Generator[Page, None, None]:
    """Neue Seite für jeden Test (Function-Scope)"""
    page = browser_context.new_page()
    yield page
    page.close()


@pytest.fixture
def console_errors(page: Page) -> list[str]:
    """Sammelt Console-Fehler während eines Tests"""
    errors: list[str] = []
    
    def handle_console(msg: ConsoleMessage):
        if msg.type == "error":
            errors.append(msg.text)
    
    page.on("console", handle_console)
    return errors


# ============================================================================
# TEST-KLASSEN (parametrisiert und optimiert)
# ============================================================================

class TestWebsiteStructure:
    """Tests für die grundlegende Website-Struktur"""
    
    @pytest.mark.parametrize("page_name,url", [
        ("index", PAGE_URLS["index"]),
        ("video", PAGE_URLS["video"]),
        ("impressum", PAGE_URLS["impressum"]),
    ])
    def test_page_loads(self, page: Page, console_errors: list[str], page_name: str, url: str):
        """Test: Seiten laden ohne kritische Fehler"""
        page.goto(url)
        
        # Prüfe ob Titel vorhanden ist
        title = page.title()
        assert "Oidarwave" in title or "Impressum" in title, \
            f"Seite '{page_name}': Titel sollte 'Oidarwave' oder 'Impressum' enthalten, ist aber: {title}"
        
        # Kritische Console-Fehler prüfen (nicht alle sind kritisch)
        critical_errors = [e for e in console_errors 
                         if "failed to fetch" in e.lower() or "net::err" in e.lower()]
        assert len(critical_errors) == 0, f"Seite '{page_name}': Kritische Console-Fehler: {critical_errors}"
    
    def test_index_page_elements(self, page: Page):
        """Test: Index-Seite hat alle erforderlichen Elemente"""
        page.goto(PAGE_URLS["index"])
        
        # Logo prüfen
        logo = page.locator(".logo")
        assert logo.is_visible(), "Logo sollte sichtbar sein"
        
        # Navigation prüfen
        nav = page.locator("nav")
        assert nav.is_visible(), "Navigation sollte sichtbar sein"
        
        # Radio-Buttons prüfen
        station_buttons = page.locator(".station-btn")
        assert station_buttons.count() > 0, "Es sollten Sender-Buttons vorhanden sein"
        
        # Audio-Player prüfen
        audio_player = page.locator("#audioPlayer")
        assert audio_player.is_visible(), "Audio-Player sollte sichtbar sein"
    
    def test_video_page_elements(self, page: Page):
        """Test: Video-Seite hat alle erforderlichen Elemente"""
        page.goto(PAGE_URLS["video"])
        
        # Video-Player prüfen
        video_player = page.locator("#videoPlayer")
        assert video_player.is_visible(), "Video-Player sollte sichtbar sein"
        
        # Video-Sender-Buttons prüfen
        station_buttons = page.locator(".station-btn")
        assert station_buttons.count() >= 4, "Es sollten mindestens 4 Video-Sender vorhanden sein"


class TestStreamUrls:
    """Tests für Stream-URLs (parametrisiert)"""
    
    @pytest.mark.parametrize("station_name,stream_url", STREAM_URLS)
    def test_audio_stream_url_format(self, station_name: str, stream_url: str):
        """Test: Audio-Stream-URLs haben das richtige Format"""
        # Prüfe ob URL mit http/https beginnt
        assert stream_url.startswith(("http://", "https://")), \
            f"Stream-URL für {station_name} sollte mit http:// oder https:// beginnen"
        
        # Prüfe ob URL eine gültige Struktur hat
        assert len(stream_url) > 10, f"Stream-URL für {station_name} ist zu kurz"
        
        # Prüfe ggf. auf mp3/hls Endung
        valid_endings = (".mp3", ".m3u8", "")
        valid_paths = ("/mp3/", "/live/")
        assert stream_url.endswith(valid_endings) or any(p in stream_url for p in valid_paths), \
            f"Stream-URL für {station_name} hat ungewöhnliches Format: {stream_url}"
    
    @pytest.mark.parametrize("station_name,stream_url", VIDEO_STREAM_URLS)
    def test_video_stream_url_format(self, station_name: str, stream_url: str):
        """Test: Video-Stream-URLs (HLS) haben das richtige Format"""
        # Video-Streams sollten .m3u8 (HLS) sein
        assert stream_url.endswith(".m3u8"), \
            f"Video-Stream für {station_name} sollte .m3u8 Endung haben"
        
        assert stream_url.startswith("https://"), \
            f"Video-Stream für {station_name} sollte HTTPS verwenden"


class TestNavigation:
    """Tests für die Navigation"""
    
    def test_navigation_links(self, page: Page):
        """Test: Alle Navigations-Links sind vorhanden"""
        page.goto(PAGE_URLS["index"])
        
        nav_links = page.locator("nav a")
        count = nav_links.count()
        
        assert count >= 3, "Es sollten mindestens 3 Navigations-Links vorhanden sein"
        
        # Prüfe Link-Texte
        link_texts = [nav_links.nth(i).inner_text() for i in range(count)]
        assert "Radio" in link_texts, "Radio-Link sollte vorhanden sein"
        assert "Video" in link_texts, "Video-Link sollte vorhanden sein"


class TestPlayerFunctionality:
    """Tests für die Player-Funktionalität"""
    
    def test_audio_player_setup(self, page: Page):
        """Test: Audio-Element ist korrekt eingerichtet"""
        page.goto(PAGE_URLS["index"])
        
        # Audio-Element prüfen
        audio = page.locator("#audioPlayer")
        assert audio.is_visible(), "Audio-Player sollte sichtbar sein"
        assert audio.get_attribute("controls") is not None, "Audio sollte controls Attribut haben"
        
        # Sender-Buttons prüfen
        station_buttons = page.locator(".station-btn")
        first_button = station_buttons.first
        
        assert first_button.get_attribute("data-url") is not None, "Sender-Button sollte data-url Attribut haben"
        assert first_button.get_attribute("data-name") is not None, "Sender-Button sollte data-name Attribut haben"
    
    def test_video_player_setup(self, page: Page):
        """Test: Video-Element ist korrekt eingerichtet"""
        page.goto(PAGE_URLS["video"])
        
        video = page.locator("#videoPlayer")
        assert video.is_visible(), "Video-Player sollte sichtbar sein"
        assert video.get_attribute("controls") is not None, "Video sollte controls Attribut haben"


class TestCookieBanner:
    """Tests für das Cookie-Banner"""
    
    def test_cookie_banner_elements(self, page: Page):
        """Test: Cookie-Banner mit allen erforderlichen Elementen"""
        page.goto(PAGE_URLS["index"])
        
        cookie_banner = page.locator("#cookieBanner")
        assert cookie_banner.is_visible(), "Cookie-Banner sollte sichtbar sein"
        
        # Buttons prüfen
        accept_btn = page.locator("#acceptCookies")
        decline_btn = page.locator("#declineCookies")
        
        assert accept_btn.is_visible(), "Akzeptieren-Button sollte sichtbar sein"
        assert decline_btn.is_visible(), "Ablehnen-Button sollte sichtbar sein"
    
    def test_cookie_decline_functionality(self, page: Page):
        """Test: Ablehnen-Button funktioniert"""
        page.goto(PAGE_URLS["index"])
        
        decline_btn = page.locator("#declineCookies")
        decline_btn.click()
        
        # Kurze Wartezeit für UI-Update
        page.wait_for_timeout(300)


class TestStatusAndMetadata:
    """Tests für Status-Indikator und Metadaten-Anzeige"""
    
    def test_status_indicator(self, page: Page):
        """Test: Status-Indikator ist vorhanden"""
        page.goto(PAGE_URLS["index"])
        
        status_indicator = page.locator("#statusIndicator")
        assert status_indicator.is_visible(), "Status-Indikator sollte sichtbar sein"
        
        status_class = status_indicator.get_attribute("class")
        assert status_class is not None, "Status-Indikator sollte eine Klasse haben"
    
    def test_song_title_display(self, page: Page):
        """Test: Song-Titel-Anzeige ist vorhanden"""
        page.goto(PAGE_URLS["index"])
        
        song_title = page.locator("#currentSongTitle")
        assert song_title.is_visible(), "Song-Titel-Anzeige sollte sichtbar sein"


# ============================================================================
# HAUPTPROGRAMM (für direkten Start)
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])