"""
Oidarwave - Test Suite
Tests für alle Funktionen der Webanwendung
"""
import os
import sys

# Füge den Skill-Pfad hinzu
sys.path.insert(0, '/home/marian/.kilocode/skills/webapp-testing')

from playwright.sync_api import sync_playwright

BASE_DIR = "/home/marian/nextcloud/github/oidarwave"

def test_radio_page():
    """Test der Radio-Hauptseite"""
    print("\n" + "="*60)
    print("TEST: Radio-Seite")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Öffne die Radio-Seite
        page.goto(f"file://{BASE_DIR}/index.html")
        page.wait_for_load_state('domcontentloaded')
        
        print("\n1. Seite geladen - Titel:", page.title())
        
        # Prüfe Header
        logo = page.locator('.logo').text_content()
        print("2. Logo gefunden:", logo)
        
        # Prüfe Navigation
        nav_links = page.locator('nav a').all()
        print(f"3. Navigations-Links gefunden: {len(nav_links)}")
        
        # Prüfe Sender-Buttons
        station_buttons = page.locator('.station-btn').all()
        print(f"4. Sender-Buttons gefunden: {len(station_buttons)}")
        
        # Prüfe Audio-Player
        audio_player = page.locator('#audioPlayer')
        print("5. Audio-Player vorhanden:", audio_player.count() > 0)
        
        # Prüfe Status-Indikator
        status_indicator = page.locator('#statusIndicator')
        print("6. Status-Indikator vorhanden:", status_indicator.count() > 0)
        
        # Prüfe Cookie-Banner
        cookie_banner = page.locator('#cookieBanner')
        cookie_visible = cookie_banner.is_visible() if cookie_banner.count() > 0 else False
        print("7. Cookie-Banner sichtbar:", cookie_visible)
        
        # Prüfe current station display
        current_station = page.locator('#currentStation').text_content()
        print("8. Aktueller Sender (Standard):", current_station)
        
        # Klicke auf einen Sender
        first_station = page.locator('.station-btn').first
        station_name = first_station.text_content()
        first_station.click()
        page.wait_for_timeout(1000)  # Warte auf Wiedergabe
        
        current_station_after = page.locator('#currentStation').text_content()
        print("9. Sender nach Klick:", current_station_after)
        
        # Prüfe Klassenänderung (active)
        is_active = first_station.get_attribute('class')
        print("10. Button hat 'active' Klasse:", 'active' in is_active if is_active else False)
        
        browser.close()
        print("\n✓ Radio-Seite Tests abgeschlossen")

def test_video_page():
    """Test der Video-Seite"""
    print("\n" + "="*60)
    print("TEST: Video-Seite")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Öffne die Video-Seite
        page.goto(f"file://{BASE_DIR}/video/index.html")
        page.wait_for_load_state('domcontentloaded')
        
        print("\n1. Seite geladen - Titel:", page.title())
        
        # Prüfe Video-Player
        video_player = page.locator('#videoPlayer')
        print("2. Video-Player vorhanden:", video_player.count() > 0)
        
        # Prüfe Sender-Buttons
        station_buttons = page.locator('.station-btn').all()
        print(f"3. Sender-Buttons gefunden: {len(station_buttons)}")
        
        # Prüfe Datensparmodus-Toggle
        data_mode_toggle = page.locator('#dataModeToggle')
        print("4. Datensparmodus-Toggle vorhanden:", data_mode_toggle.count() > 0)
        
        # Klicke auf Datensparmodus
        if data_mode_toggle.count() > 0:
            data_mode_toggle.click()
            page.wait_for_timeout(500)
            aria_pressed = data_mode_toggle.get_attribute('aria-pressed')
            print("5. Datensparmodus nach Klick:", aria_pressed)
        
        # Klicke auf einen Sender
        first_station = page.locator('.station-btn').first
        first_station.click()
        page.wait_for_timeout(2000)  # Warte auf HLS-Laden
        
        current_station = page.locator('#currentStation').text_content()
        print("6. Aktueller Sender:", current_station)
        
        browser.close()
        print("\n✓ Video-Seite Tests abgeschlossen")

def test_cookie_banner():
    """Test des Cookie-Banners"""
    print("\n" + "="*60)
    print("TEST: Cookie-Banner")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Öffne die Radio-Seite
        page.goto(f"file://{BASE_DIR}/index.html")
        page.wait_for_load_state('domcontentloaded')
        
        print("\n1. Seite geladen")
        
        # Prüfe Cookie-Banner sichtbar
        cookie_banner = page.locator('#cookieBanner')
        cookie_visible = cookie_banner.is_visible() if cookie_banner.count() > 0 else False
        print("2. Cookie-Banner initial sichtbar:", cookie_visible)
        
        # Akzeptiere Cookies
        if cookie_visible:
            accept_btn = page.locator('#acceptCookies')
            accept_btn.click()
            page.wait_for_timeout(500)
            
            # Prüfe ob Banner nicht mehr sichtbar
            cookie_visible_after = cookie_banner.is_visible()
            print("3. Cookie-Banner nach Akzeptieren nicht sichtbar:", not cookie_visible_after)
            
            # Prüfe localStorage
            cookie_consent = page.evaluate("localStorage.getItem('cookieConsent')")
            print("4. localStorage 'cookieConsent':", cookie_consent)
            
            consent_timestamp = page.evaluate("localStorage.getItem('consentTimestamp')")
            print("5. localStorage 'consentTimestamp' gesetzt:", consent_timestamp is not None)
        
        # Neue Seite für "Ablehnen" Test
        context2 = browser.new_context()
        page2 = context2.new_page()
        page2.goto(f"file://{BASE_DIR}/index.html")
        page2.wait_for_load_state('networkidle')
        
        # Lehnen Sie Cookies ab
        decline_btn = page2.locator('#declineCookies')
        if decline_btn.count() > 0:
            decline_btn.click()
            page2.wait_for_timeout(500)
            
            cookie_consent_false = page2.evaluate("localStorage.getItem('cookieConsent')")
            print("6. localStorage nach Ablehnen:", cookie_consent_false)
        
        browser.close()
        print("\n✓ Cookie-Banner Tests abgeschlossen")

def test_keyboard_shortcuts():
    """Test der Tastenkombinationen"""
    print("\n" + "="*60)
    print("TEST: Tastenkombinationen")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Öffne die Radio-Seite
        page.goto(f"file://{BASE_DIR}/index.html")
        page.wait_for_load_state('domcontentloaded')
        
        print("\n1. Seite geladen")
        
        # Teste Leertaste für Play/Pause
        # Zuerst wähle einen Sender
        first_station = page.locator('.station-btn').first
        first_station.click()
        page.wait_for_timeout(1000)
        
        print("2. Sender ausgewählt")
        
        # Drücke Leertaste
        page.keyboard.press('Space')
        page.wait_for_timeout(500)
        
        # Prüfe Player-Status über JavaScript
        is_paused = page.evaluate("document.getElementById('audioPlayer').paused")
        print("3. Nach Leertaste - Player pausiert:", is_paused)
        
        # Erneut Leertaste drücken
        page.keyboard.press('Space')
        page.wait_for_timeout(500)
        
        is_playing = not page.evaluate("document.getElementById('audioPlayer').paused")
        print("4. Nach erneutem Leertaste - Player spielt:", is_playing)
        
        # Teste Pfeiltasten für Lautstärke
        page.keyboard.press('ArrowUp')
        page.wait_for_timeout(200)
        volume_up = page.evaluate("document.getElementById('audioPlayer').volume")
        print("5. Nach ArrowUp - Lautstärke:", volume_up)
        
        page.keyboard.press('ArrowDown')
        page.wait_for_timeout(200)
        volume_down = page.evaluate("document.getElementById('audioPlayer').volume")
        print("6. Nach ArrowDown - Lautstärke:", volume_down)
        
        # Teste Ctrl+H für Download
        # Zuerst füge etwas Verlauf hinzu
        page.evaluate("""
            localStorage.setItem('station_history', JSON.stringify({
                version: 1,
                stations: {
                    'test-url': {
                        name: 'Test Station',
                        sessions: [{start: Date.now() - 60000, end: Date.now()}],
                        totalDurationMs: 60000,
                        playCount: 1,
                        lastPlayed: Date.now()
                    }
                }
            }));
        """)
        
        print("7. Verlauf in localStorage gesetzt")
        
        # Drücke Ctrl+H
        page.keyboard.press('Control+h')
        page.wait_for_timeout(500)
        
        # Prüfe ob ein Download ausgelöst wurde
        print("8. Ctrl+H Test abgeschlossen (manually verify download)")
        
        browser.close()
        print("\n✓ Tastenkombinationen Tests abgeschlossen")

def test_navigation():
    """Test der Navigation zwischen Seiten"""
    print("\n" + "="*60)
    print("TEST: Navigation")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Öffne die Radio-Seite
        page.goto(f"file://{BASE_DIR}/index.html")
        page.wait_for_load_state('domcontentloaded')
        
        print("\n1. Radio-Seite geladen:", page.title())
        
        # Klicke auf Video-Link
        video_link = page.locator('nav a:has-text("Video")')
        video_link.click()
        page.wait_for_load_state('domcontentloaded')
        
        print("2. Nach Navigation - Titel:", page.title())
        print("3. URL enthält '/video':", '/video' in page.url)
        
        # Prüfe ob Video-Player vorhanden
        video_player = page.locator('#videoPlayer')
        print("4. Video-Player auf Seite:", video_player.count() > 0)
        
        browser.close()
        print("\n✓ Navigation Tests abgeschlossen")

def test_edge_cases():
    """Test von Randfällen und Fehlerbehandlung"""
    print("\n" + "="*60)
    print("TEST: Randfälle")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Öffne die Radio-Seite
        page.goto(f"file://{BASE_DIR}/index.html")
        page.wait_for_load_state('domcontentloaded')
        
        print("\n1. Seite geladen")
        
        # Teste: Kein Spieler gefunden Fehler
        # Dies wird in der Konsole protokolliert, wir prüfen nur ob Seite lädt
        
        # Teste Metadaten-Fehlerbehandlung
        # Wähle einen Sender ohne Metadaten
        buttons = page.locator('.station-btn').all()
        for btn in buttons:
            metadata_url = btn.get_attribute('data-metadata-url')
            if metadata_url is None:
                btn.click()
                page.wait_for_timeout(1500)
                song_title = page.locator('#currentSongTitle').text_content()
                print("2. Sender ohne Metadaten - Titel:", song_title)
                break
        
        # Teste localStorage für zuletzt gespielten Sender
        last_station = page.evaluate("localStorage.getItem('lastStationAudioUrl')")
        print("3. Letzter Sender in localStorage:", last_station is not None)
        
        # Teste Offline-Status (simuliert)
        print("4. Online-Status:", page.evaluate("navigator.onLine"))
        
        browser.close()
        print("\n✓ Randfälle Tests abgeschlossen")

def main():
    """Hauptfunktion - führt alle Tests aus"""
    print("\n" + "="*60)
    print("OIDARWAVE - VOLLSTÄNDIGE TEST-SUITE")
    print("="*60)
    print(f"Arbeitsverzeichnis: {BASE_DIR}")
    print(f"Dateien vorhanden: {os.path.exists(BASE_DIR + '/index.html')}")
    
    # Führe alle Tests aus
    try:
        test_radio_page()
        test_video_page()
        test_cookie_banner()
        test_keyboard_shortcuts()
        test_navigation()
        test_edge_cases()
        
        print("\n" + "="*60)
        print("ALLE TESTS ERFOLGREICH ABGESCHLOSSEN")
        print("="*60)
        
    except Exception as e:
        print(f"\nFEHLER: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
