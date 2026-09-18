## 🎯 Feature-Vorschläge für Oidarwave

> **Stand:** September 2026 – abgehakt = im Code umgesetzt, Notizen zeigen Teilstände.

### 8. **PWA-Optimierung (Progressive Web App)**
- [ ] Offline-Fallback-Seite
- [x] Installierbare App
- [x] Background-Audio-Wiedergabe
- [ ] Push-Benachrichtigungen

---

### 9. **Personalisierte Empfehlungen**
- [ ] Basierend auf Hörgewohnheiten
- [ ] "Ähnliche Sender"-Vorschläge
- [ ] Zeitbasierte Empfehlungen (Morgen/Abend)

---

### 10. **Mehrsprachigkeit (i18n)**
- [ ] Englische Übersetzung
- [ ] Sprachumschalter im Footer
- [ ] JSON-basierte Übersetzungsdateien

---

### 11. **Podcast-Modus**
- [ ] Aufnahme-Funktion (MediaRecorder API)
- [ ] Als MP3 herunterladen
- [ ] Lokale Podcast-Bibliothek

---

### 12. **Weckfunktion**
- [ ] Uhrzeit einstellen
- [ ] Sender als Weckton wählen
- [ ] Sanftes Aufwachen (Lautstärke hochfahren)

---

### 13. **Hörverlauf im UI anzeigen**
Der Verlauf wird bereits getrackt und per `Strg+S` als JSON exportiert – fehlt nur noch die Sichtbarkeit im App-UI.
- [ ] "Zuletzt gehört"-Liste mit Spielzeit pro Sender (Daten in `station_history`)
- [ ] Detailansicht: letzte Titelanzeigen pro Sender (Metadata-Log in `localStorage`)
- [ ] Verlauf löschen / einzelnen Eintrag entfernen

---

### 14. **Eigene Sender verwalten**
- [ ] Dialog zum Hinzufügen eigener Stream-URLs (Name + URL + optional Metadata-URL)
- [ ] Eigene Sender in `localStorage` speichern und ins Sender-Raster mischen
- [ ] Bearbeiten/Löschen eigener Sender
- [ ] Validierung der Stream-URL (Erreichbarkeit prüfen, Fehlermeldung)

---

### 15. **Auto-Reconnect bei Verbindungsabbruch (Radio)**
Der Videoplayer hat bereits Retry-Logik mit exponentiellem Backoff (hls.js) – der Audioplayer startet bei Streamabbrüchen nicht neu.
- [ ] Exponentielles Backoff (z. B. 1s/2s/4s, max. 3 Versuche) für Audio-Streams
- [ ] Statusanzeige „Verbinde erneut…" im Status-Indikator
- [ ] Automatische Wiederaufnahme nach Netzwerkrückkehr (`online`-Event, Listener existiert schon)

---

### 16. **Equalizer / Klangprofile**
- [ ] Web Audio API: BiquadFilter-Kette (Bass/Mitten/Höhen)
- [ ] Presets: Sprache, Pop, Rock, Bass-Boost, Flat
- [ ] Einstellungen in `localStorage` persistieren (analog `dataSaveMode`)

---

### 17. **Electron: Tray-Modus & Medientasten**
- [ ] Minimieren in den Tray statt App-Beenden (optional)
- [ ] Tray-Menü: Play/Pause, Senderwechsel, Beenden
- [ ] Globale Medientasten zuverlässig abfangen (Play/Pause/Stop)

---

### 18. **Bild-in-Bild für Video**
- [ ] PiP-Button im Videoplayer (`requestPictureInPicture`)
- [ ] Optional: automatisches PiP beim Tab-Wechsel

---

### 19. **Teilen-Funktion**
- [ ] Web Share API für den aktuellen Sender (Name + URL)
- [ ] Fallback: Link in Zwischenablage kopieren mit Hinweis
- [ ] Teilen-Button pro Sender bzw. im Player

---

### 20. **Senderkatalog-Integration (radio-browser.info)**
- [ ] Senderkatalog über die radio-browser.info API laden
- [ ] Suche nach Name, Genre und Land
- [ ] Senderliste lokal cachen (Offline-Fähigkeit)

---

### Prioritäts-Empfehlung:
1. **Sofort umsetzbar:** Auto-Reconnect Radio (15), Hörverlauf-UI (13, Datenbasis vorhanden), Tastaturkürzel erweitern (6)
2. **Kurzfristig:** Eigene Sender (14), Favoriten-UI (2, Modul vorhanden), Bild-in-Bild (18)
3. **Mittelfristig:** Statistik-Dashboard (7, Datenbasis vorhanden), Equalizer (16), Teilen-Funktion (19), Mehrsprachigkeit (10)
4. **Langfristig:** Podcast-Modus (11), Weckfunktion (12), Empfehlungen (9), Senderkatalog (20), Tray-Modus (17)
