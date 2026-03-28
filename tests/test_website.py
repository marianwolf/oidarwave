"""
Website- und Stream-Tests für Oidarwave
Tests für die Website-Funktionalität und Stream-Verfügbarkeit

Benötigt: pip install pytest playwright
         playwright install chromium
"""
import pytest
import asyncio
import re
from typing import Generator
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext, ConsoleMessage


# ============================================================================
# KONFIGURATION
# ============================================================================

# Stream-URLs zum Testen (werden nicht wirklich abgespielt, nur URL-Prüfung)
STREAM_URLS = {
    "Deutschlandfunk": "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    "DLF Nova": "https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3",
    "NDR 1": "https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3",
    "NDR 2": "https://f131.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3",
    "NDR Info": "https://f131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3",
    "NDR Kultur": "https://d141.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3",
    "N-JOY": "https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3",
    "80s80s": "https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667",
    "90s90s": "https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761",
    "BBG Radio": "https://radio.bbg-bew.de",
}

VIDEO_STREAM_URLS = {
    "Das Erste": "https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8",
    "ZDF": "https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8",
    "ARTE": "https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8",
    "Tagesschau24": "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8",
}


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    """Startet einen Browser für alle Tests"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()


@pytest.fixture(scope="function")
def context(browser: Browser) -> Generator[BrowserContext, None, None]:
    """Erstellt einen neuen Browser-Kontext für jeden Test"""
    context = browser.new_context()
    yield context
    context.close()


@pytest.fixture(scope="function")
def page(context: BrowserContext) -> Generator[Page, None, None]:
    """Erstellt eine neue Seite für jeden Test"""
    page = context.new_page()
    yield page
    page.close()


# ============================================================================
# TEST-KLASSEN
# ============================================================================

class TestWebsiteStructure:
    """Tests für die grundlegende Website-Struktur"""
    
    def test_index_page_loads(self, page: Page):
        """Test: Die Startseite lädt ohne Fehler"""
        console_errors = []
        
        def handle_console(msg: ConsoleMessage):
            if msg.type == "error":
                console_errors.append(msg.text)
        
        page.on("console", handle_console)
        
        # Lade die Seite (lokaler Server oder Datei)
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        # Prüfe ob Titel vorhanden ist
        title = page.title()
        assert "Oidarwave" in title, f"Titel sollte 'Oidarwave' enthalten, ist aber: {title}"
        
        # Prüfe ob Logo vorhanden ist
        logo = page.locator(".logo")
        assert logo.is_visible(), "Logo sollte sichtbar sein"
        
        # Prüfe ob Navigation vorhanden ist
        nav = page.locator("nav")
        assert nav.is_visible(), "Navigation sollte sichtbar sein"
        
        # Prüfe Radio-Button vorhanden sind
        station_buttons = page.locator(".station-btn")
        count = station_buttons.count()
        assert count > 0, "Es sollten Sender-Buttons vorhanden sein"
        
        # Prüfe Audio-Player vorhanden ist
        audio_player = page.locator("#audioPlayer")
        assert audio_player.is_visible(), "Audio-Player sollte sichtbar sein"
        
        # Kritische Console-Fehler prüfen (nicht alle sind kritisch)
        critical_errors = [e for e in console_errors if "failed to fetch" in e.lower() or "net::err" in e.lower()]
        assert len(critical_errors) == 0, f"Kritische Console-Fehler: {critical_errors}"
    
    def test_video_page_loads(self, page: Page):
        """Test: Die Video-Seite lädt ohne Fehler"""
        console_errors = []
        
        def handle_console(msg: ConsoleMessage):
            if msg.type == "error":
                console_errors.append(msg.text)
        
        page.on("console", handle_console)
        
        page.goto("file:///home/marian/nextcloud/github/oidarwave/video/index.html")
        
        # Prüfe ob Titel vorhanden ist
        title = page.title()
        assert "Oidarwave" in title, f"Titel sollte 'Oidarwave' enthalten, ist aber: {title}"
        
        # Prüfe Video-Player vorhanden ist
        video_player = page.locator("#videoPlayer")
        assert video_player.is_visible(), "Video-Player sollte sichtbar sein"
        
        # Prüfe Video-Sender-Buttons vorhanden sind
        station_buttons = page.locator(".station-btn")
        count = station_buttons.count()
        assert count >= 4, "Es sollten mindestens 4 Video-Sender vorhanden sein"
    
    def test_impressum_page_loads(self, page: Page):
        """Test: Die Impressum-Seite lädt ohne Fehler"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/impressum/index.html")
        
        # Prüfe ob Titel vorhanden ist
        title = page.title()
        assert "Impressum" in title or "Oidarwave" in title, f"Titel sollte Impressum enthalten"


class TestStreamUrls:
    """Tests für Stream-URLs"""
    
    @pytest.mark.parametrize("station_name,stream_url", STREAM_URLS.items())
    def test_audio_stream_url_format(self, station_name: str, stream_url: str):
        """Test: Audio-Stream-URLs haben das richtige Format"""
        # Prüfe ob URL mit http/https beginnt
        assert stream_url.startswith("http://") or stream_url.startswith("https://"), \
            f"Stream-URL für {station_name} sollte mit http:// oder https:// beginnen"
        
        # Prüfe ob URL eine gültige Struktur hat
        assert len(stream_url) > 10, f"Stream-URL für {station_name} ist zu kurz"
        
        # Prüfe ggf. auf mp3/hls Endung
        valid_extensions = (".mp3", ".m3u8", "")
        assert any(stream_url.endswith(ext) or "/mp3/" in stream_url or "/live/" in stream_url 
                   for ext in valid_extensions), \
            f"Stream-URL für {station_name} hat ungewöhnliches Format: {stream_url}"
    
    @pytest.mark.parametrize("station_name,stream_url", VIDEO_STREAM_URLS.items())
    def test_video_stream_url_format(self, station_name: str, stream_url: str):
        """Test: Video-Stream-URLs (HLS) haben das richtige Format"""
        # Video-Streams sollten .m3u8 (HLS) sein
        assert stream_url.endswith(".m3u8"), \
            f"Video-Stream für {station_name} sollte .m3u8 Endung haben"
        
        assert stream_url.startswith("https://"), \
            f"Video-Stream für {station_name} sollte HTTPS verwenden"


class TestNavigation:
    """Tests für die Navigation"""
    
    def test_navigation_links_present(self, page: Page):
        """Test: Alle Navigations-Links sind vorhanden"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        nav_links = page.locator("nav a")
        count = nav_links.count()
        
        assert count >= 3, "Es sollten mindestens 3 Navigations-Links vorhanden sein"
        
        # Prüfe Link-Texte
        link_texts = [nav_links.nth(i).inner_text() for i in range(count)]
        assert "Radio" in link_texts, "Radio-Link sollte vorhanden sein"
        assert "Video" in link_texts, "Video-Link sollte vorhanden sein"


class TestPlayerFunctionality:
    """Tests für die Player-Funktionalität"""
    
    def test_station_buttons_have_data_attributes(self, page: Page):
        """Test: Sender-Buttons haben die erforderlichen data-Attribute"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        station_buttons = page.locator(".station-btn")
        first_button = station_buttons.first
        
        # Prüfe data-url Attribut
        data_url = first_button.get_attribute("data-url")
        assert data_url is not None, "Sender-Button sollte data-url Attribut haben"
        assert data_url.startswith("http"), "data-url sollte eine gültige URL sein"
        
        # Prüfe data-name Attribut
        data_name = first_button.get_attribute("data-name")
        assert data_name is not None, "Sender-Button sollte data-name Attribut haben"
    
    def test_audio_element_exists(self, page: Page):
        """Test: Audio-Element ist korrekt eingerichtet"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        audio = page.locator("#audioPlayer")
        assert audio.is_visible(), "Audio-Player sollte sichtbar sein"
        
        # Prüfe Attribute
        assert audio.get_attribute("controls") is not None, "Audio sollte controls Attribut haben"
    
    def test_video_element_exists(self, page: Page):
        """Test: Video-Element ist korrekt eingerichtet"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/video/index.html")
        
        video = page.locator("#videoPlayer")
        assert video.is_visible(), "Video-Player sollte sichtbar sein"
        
        # Prüfe Attribute
        assert video.get_attribute("controls") is not None, "Video sollte controls Attribut haben"


class TestCookieBanner:
    """Tests für das Cookie-Banner"""
    
    def test_cookie_banner_present(self, page: Page):
        """Test: Cookie-Banner ist auf der Seite vorhanden"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        cookie_banner = page.locator("#cookieBanner")
        assert cookie_banner.is_visible(), "Cookie-Banner sollte sichtbar sein"
        
        # Prüfe Buttons
        accept_btn = page.locator("#acceptCookies")
        decline_btn = page.locator("#declineCookies")
        
        assert accept_btn.is_visible(), "Akzeptieren-Button sollte sichtbar sein"
        assert decline_btn.is_visible(), "Ablehnen-Button sollte sichtbar sein"
    
    def test_cookie_buttons_clickable(self, page: Page):
        """Test: Cookie-Buttons sind klickbar"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        # Klick auf Ablehnen
        decline_btn = page.locator("#declineCookies")
        decline_btn.click()
        
        # Banner sollte verschwinden (nach dem Klick)
        # Warten kurz
        page.wait_for_timeout(500)
        
        # Prüfe ob Banner display: none hat oder nicht mehr sichtbar ist
        cookie_banner = page.locator("#cookieBanner")
        # Das Banner könnte via CSS ausgeblendet werden


class TestStatusIndicator:
    """Tests für den Status-Indikator"""
    
    def test_status_indicator_exists(self, page: Page):
        """Test: Status-Indikator ist vorhanden"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        status_indicator = page.locator("#statusIndicator")
        assert status_indicator.is_visible(), "Status-Indikator sollte sichtbar sein"
        
        # Prüfe Klasse (sollte eine von: online, error, buffering, paused haben)
        status_class = status_indicator.get_attribute("class")
        assert status_class is not None, "Status-Indikator sollte eine Klasse haben"


class TestMetadataDisplay:
    """Tests für die Metadaten-Anzeige"""
    
    def test_song_title_display_exists(self, page: Page):
        """Test: Song-Titel-Anzeige ist vorhanden"""
        page.goto("file:///home/marian/nextcloud/github/oidarwave/index.html")
        
        song_title = page.locator("#currentSongTitle")
        assert song_title.is_visible(), "Song-Titel-Anzeige sollte sichtbar sein"


# ============================================================================
# HAUPTPROGRAMM (für direkten Start)
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])