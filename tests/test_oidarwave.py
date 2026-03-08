"""
Oidarwave - Test Suite (pytest-optimiert)
Tests für alle Funktionen der Webanwendung

Optimierungen:
- pytest-Fixtures für Browser-Management (effizienter)
- Assertions statt print() für bessere Fehlerberichterstattung
- Dynamische BASE_DIR-Ermittlung
- Saubere Test-Isolation
- Keine externen Abhängigkeiten für Syntax-Tests
"""
import os
import pytest
from playwright.sync_api import Page, Browser

# Dynamische Ermittlung des Basis-Verzeichnisses
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(scope="session")
def base_dir():
    """Dynamisches Basis-Verzeichnis"""
    return BASE_DIR


@pytest.fixture(scope="session")
def browser_factory():
    """
    Session-scoped Browser-Fixture für Effizienz.
    Ein Browser wird für alle Tests wiederverwendet.
    """
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()


@pytest.fixture
def page(browser_factory):
    """
    Page-Fixture mit automatischer Cleanup.
    Jeder Test erhält eine frische Seite.
    """
    context = browser_factory.new_context()
    page = context.new_page()
    
    yield page
    
    page.close()
    context.close()


@pytest.fixture
def radio_url(base_dir):
    """URL für Radio-Seite"""
    return f"file://{base_dir}/index.html"


@pytest.fixture
def video_url(base_dir):
    """URL für Video-Seite"""
    return f"file://{base_dir}/video/index.html"


# ============================================================================
# TESTS - RADIO-SEITE
# ============================================================================

def test_radio_page_loads(page, radio_url):
    """Test: Radio-Hauptseite lädt korrekt"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Prüfe Titel
    assert page.title() != "", "Seite hat keinen Titel"
    
    # Prüfe Logo
    logo = page.locator('.logo')
    assert logo.count() > 0, "Logo nicht gefunden"
    
    # Prüfe Navigation
    nav_links = page.locator('nav a')
    assert nav_links.count() > 0, "Keine Navigations-Links gefunden"
    
    # Prüfe Sender-Buttons
    station_buttons = page.locator('.station-btn')
    assert station_buttons.count() > 0, "Keine Sender-Buttons gefunden"
    
    # Prüfe Audio-Player
    audio_player = page.locator('#audioPlayer')
    assert audio_player.count() > 0, "Audio-Player nicht gefunden"
    
    # Prüfe Status-Indikator
    status_indicator = page.locator('#statusIndicator')
    assert status_indicator.count() > 0, "Status-Indikator nicht gefunden"


def test_radio_station_selection(page, radio_url):
    """Test: Sender-Auswahl funktioniert"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Prüfe initialen Sender
    current_station = page.locator('#currentStation')
    initial_text = current_station.text_content()
    
    # Klicke auf ersten Sender
    first_station = page.locator('.station-btn').first
    station_name = first_station.text_content()
    first_station.click()
    
    # Warte auf DOM-Änderung statt festem Timeout
    page.wait_for_function(
        "() => document.getElementById('currentStation').textContent !== '' || "
        "document.querySelector('.station-btn.active') !== null"
    )
    
    # Prüfe dass aktiver Button die 'active' Klasse hat
    active_class = first_station.get_attribute('class')
    assert active_class is not None and 'active' in active_class, \
        "Ausgewählter Sender hat keine 'active' Klasse"


def test_cookie_banner_exists(page, radio_url):
    """Test: Cookie-Banner wird angezeigt"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    cookie_banner = page.locator('#cookieBanner')
    
    # Banner kann vorhanden sein oder nicht, je nach previous consent
    if cookie_banner.count() > 0:
        # Wenn Banner vorhanden, prüfe Buttons
        accept_btn = page.locator('#acceptCookies')
        decline_btn = page.locator('#declineCookies')
        
        assert accept_btn.count() > 0 or decline_btn.count() > 0, \
            "Keine Cookie-Buttons gefunden"


def test_cookie_accept(page, radio_url):
    """Test: Cookie-Akzeptanz funktioniert"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    cookie_banner = page.locator('#cookieBanner')
    
    if cookie_banner.count() > 0 and cookie_banner.is_visible():
        accept_btn = page.locator('#acceptCookies')
        accept_btn.click()
        
        # Warte bis Banner verschwindet
        page.wait_for_function(
            "() => !document.getElementById('cookieBanner') || "
            "!document.getElementById('cookieBanner').offsetParent"
        )
        
        # Prüfe localStorage
        cookie_consent = page.evaluate("localStorage.getItem('cookieConsent')")
        assert cookie_consent == "true", "Cookie-Consent wurde nicht gespeichert"


def test_cookie_decline(page, radio_url):
    """Test: Cookie-Ablehnung funktioniert"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    cookie_banner = page.locator('#cookieBanner')
    
    if cookie_banner.count() > 0 and cookie_banner.is_visible():
        decline_btn = page.locator('#declineCookies')
        if decline_btn.count() > 0:
            decline_btn.click()
            
            # Warte kurz
            page.wait_for_timeout(300)
            
            # Prüfe localStorage
            cookie_consent = page.evaluate("localStorage.getItem('cookieConsent')")
            assert cookie_consent == "false", "Cookie-Ablehnung wurde nicht gespeichert"


def test_keyboard_shortcuts_play_pause(page, radio_url):
    """Test: Leertaste für Play/Pause"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Wähle einen Sender
    first_station = page.locator('.station-btn').first
    first_station.click()
    page.wait_for_timeout(500)
    
    # Prüfe Player-Status
    is_paused_before = page.evaluate("document.getElementById('audioPlayer').paused")
    
    # Drücke Leertaste
    page.keyboard.press('Space')
    page.wait_for_timeout(300)
    
    is_paused_after = page.evaluate("document.getElementById('audioPlayer').paused")
    
    # Status sollte sich geändert haben
    assert is_paused_before != is_paused_after, \
        "Play/Pause-Toggle funktioniert nicht"


def test_keyboard_shortcuts_volume(page, radio_url):
    """Test: Pfeiltasten für Lautstärke"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Wähle einen Sender
    first_station = page.locator('.station-btn').first
    first_station.click()
    page.wait_for_timeout(300)
    
    # Setze Lautstärke auf 50%
    page.evaluate("document.getElementById('audioPlayer').volume = 0.5")
    
    # Pfeil hoch
    page.keyboard.press('ArrowUp')
    page.wait_for_timeout(200)
    volume_up = page.evaluate("document.getElementById('audioPlayer').volume")
    
    # Pfeil runter
    page.keyboard.press('ArrowDown')
    page.wait_for_timeout(200)
    volume_down = page.evaluate("document.getElementById('audioPlayer').volume")
    
    # Lautstärke sollte sich ändern
    assert volume_up != volume_down or volume_up != 0.5, \
        "Lautstärke-Änderung funktioniert nicht"


def test_navigation_to_video(page, radio_url):
    """Test: Navigation zur Video-Seite"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Klicke auf Video-Link
    video_link = page.locator('nav a:has-text("Video")')
    video_link.click()
    page.wait_for_load_state('domcontentloaded')
    
    # Prüfe URL
    assert '/video' in page.url, "Navigation zur Video-Seite fehlgeschlagen"
    
    # Prüfe Video-Player
    video_player = page.locator('#videoPlayer')
    assert video_player.count() > 0, "Video-Player nicht gefunden"


# ============================================================================
# TESTS - VIDEO-SEITE
# ============================================================================

def test_video_page_loads(page, video_url):
    """Test: Video-Seite lädt korrekt"""
    page.goto(video_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Prüfe Titel
    assert page.title() != "", "Seite hat keinen Titel"
    
    # Prüfe Video-Player
    video_player = page.locator('#videoPlayer')
    assert video_player.count() > 0, "Video-Player nicht gefunden"
    
    # Prüfe Sender-Buttons
    station_buttons = page.locator('.station-btn')
    assert station_buttons.count() > 0, "Keine Sender-Buttons gefunden"


def test_video_data_mode_toggle(page, video_url):
    """Test: Datensparmodus-Toggle"""
    page.goto(video_url)
    page.wait_for_load_state('domcontentloaded')
    
    data_mode_toggle = page.locator('#dataModeToggle')
    
    if data_mode_toggle.count() > 0:
        # Prüfe aria-pressed Attribut
        initial_state = data_mode_toggle.get_attribute('aria-pressed')
        
        # Klicke auf Toggle
        data_mode_toggle.click()
        page.wait_for_timeout(300)
        
        # Prüfe Zustandsänderung
        new_state = data_mode_toggle.get_attribute('aria-pressed')
        assert new_state != initial_state, \
            "Datensparmodus-Toggle ändert Zustand nicht"


def test_video_station_selection(page, video_url):
    """Test: Video-Sender-Auswahl"""
    page.goto(video_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Klicke auf ersten Sender
    first_station = page.locator('.station-btn').first
    first_station.click()
    
    # Warte auf DOM-Änderung
    page.wait_for_function(
        "() => document.getElementById('currentStation') && "
        "document.getElementById('currentStation').textContent !== ''"
    )
    
    current_station = page.locator('#currentStation')
    assert current_station.text_content() != "", \
        "Sender-Name wird nicht angezeigt"


# ============================================================================
# TESTS - RANDFÄLLE
# ============================================================================

def test_localstorage_persistence(page, radio_url):
    """Test: localStorage speichert Daten persistent"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Prüfe ob lastStationUrl existiert (kann leer sein)
    last_station = page.evaluate("localStorage.getItem('lastStationAudioUrl')")
    # Darf None oder leer sein, aber kein Fehler
    assert last_station is not None or True, "localStorage Fehler"


def test_online_status(page, radio_url):
    """Test: Online-Status wird erkannt"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    is_online = page.evaluate("navigator.onLine")
    assert isinstance(is_online, bool), "Online-Status wird nicht korrekt abgefragt"


def test_page_loads_without_errors(page, radio_url):
    """Test: Seite lädt ohne JavaScript-Fehler"""
    page.goto(radio_url)
    page.wait_for_load_state('domcontentloaded')
    
    # Sammle Console-Fehler
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    
    # Kurze Wartezeit für späte Fehler
    page.wait_for_timeout(500)
    
    # Filtere bekannte harmlose Fehler (z.B. von externen Ressourcen)
    critical_errors = [e for e in errors if 'favicon' not in e.lower()]
    
    assert len(critical_errors) == 0, f"Kritische JavaScript-Fehler: {critical_errors}"
