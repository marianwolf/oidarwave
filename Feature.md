## 🎯 Feature-Vorschläge für Oidarwave

> **Stand:** September 2026 – abgehakt = im Code umgesetzt, Notizen zeigen Teilstände.

### 8. **PWA-Optimierung (Progressive Web App)**
- [ ] Offline-Fallback-Seite – fehlt: kein Service Worker, keine `offline.html`, keine SW-Registrierung im Code
- [ ] Installierbare App – Teilstand: `manifest.json` + `<link rel="manifest">` in `index.html:21` vorhanden, aber ohne Service Worker nicht nach PWA-Kriterien installierbar
- [x] Background-Audio-Wiedergabe – umgesetzt via Media Session API (`src/js/player-core.js:33`, genutzt in `src/js/player.js:32`, `src/js/video.js:267`)
- [ ] Skeleton – fehlt: kein Skeleton-Markup, keine `.skeleton`/Shimmer-CSS in `src/css/`
- [ ] Push-Benachrichtigungen – fehlt: nur lokale `Notification`-API bei Titelwechsel (`src/js/notification.js:72`), kein Push-API/`PushManager`, kein Service Worker, kein VAPID

---

### 10. **Mehrsprachigkeit (i18n)**
- [ ] Englische Übersetzung
- [ ] JSON-basierte Übersetzungsdateien

---

### 12. **Weckfunktion**
- [ ] Uhrzeit einstellen
- [ ] Sender als Weckton wählen
- [ ] Sanftes Aufwachen (Lautstärke hochfahren)
