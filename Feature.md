## 🎯 Feature-Vorschläge für Oidarwave

> **Stand:** September 2026 – abgehakt = im Code umgesetzt, Notizen zeigen Teilstände.

### 8. **PWA-Optimierung (Progressive Web App)**
- [x] Offline-Fallback-Seite
- [x] Installierbare App
- [x] Background-Audio-Wiedergabe
- [x] Skeleton
- [x] Push-Benachrichtigungen

---

### 10. **Mehrsprachigkeit (i18n)**
- [ ] Englische Übersetzung
- [ ] JSON-basierte Übersetzungsdateien

---

### 12. **Weckfunktion**
- [ ] Uhrzeit einstellen
- [ ] Sender als Weckton wählen
- [ ] Sanftes Aufwachen (Lautstärke hochfahren)

---

### 15. **Auto-Reconnect bei Verbindungsabbruch (Radio)**
Der Videoplayer hat bereits Retry-Logik mit exponentiellem Backoff (hls.js) – der Audioplayer startet bei Streamabbrüchen nicht neu.
- [ ] Exponentielles Backoff (z. B. 1s/2s/4s, max. 3 Versuche) für Audio-Streams
- [ ] Automatische Wiederaufnahme nach Netzwerkrückkehr (`online`-Event, Listener existiert schon)
