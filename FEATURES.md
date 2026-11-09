## 🎯 Feature-Vorschläge für Oidarwave

> **Stand:** November 2026 – aktuelle Version: **0.9.18** (siehe `package.json`) Abgehakt = im Code umgesetzt, „Teilstand" = in Teilen vorhanden. Die Vorschläge sind nach Nebenversionen (klein, einzeln auslieferbar) und Hauptversionen (größere Umbauten) gestaffelt. Bei Umsetzung jeweils die [Roadmap im README](README.md#-roadmap) mitpflegen.

---

## 🪜 Nebenversionen (Minor)

### Version 0.9.x – schnell umsetzbare Verbesserungen

- [x] **Favoriten** – umgesetzt via `src/js/favorite.js` (inkl. Migration alter Favoriten-Formate)
- [ ] **Hell-/Dunkelmodus-Umschaltung** – fehlt: kein `prefers-color-scheme`-Handling, keine Theme-Klasse in `src/css/` bzw. `index.html`. Umschalter in `index.html` ergänzen und Wahl im `localStorage` persistent speichern.
- [ ] **Sleep-Timer** – fehlt: kein Timer-Code. Wählbare Zeitspannen (z. B. 15/30/60 min) mit sanftem Lautstärke-Ausblenden vor dem Stop.
- [x] **Skeleton-Loading** – umgesetzt via `.skeleton`-Shimmer-CSS in `src/css/style.css` (Radio: `#currentSongTitle`, Video: `.video-skeleton`-Overlay in `video/index.html` + `src/css/style-video.css`); Statuswechsel in `src/js/player.js` (loadstart/canplay/error/pause) und `src/js/video.js` (Senderwahl/MANIFEST_PARSED/loadedmetadata/Fehler). Verfeinert: Sweep läuft GPU-freundlich über `transform` auf einem `::after`-Layer statt `background-position`, weiche Gradient-Kanten, Crossfade des Video-Overlays (`.is-active`), statische Variante unter `prefers-reduced-motion`.
- [ ] **Lautstärke per Mausrad** – fehlt: `src/js/mouse.js` behandelt kein `wheel`-Event auf dem Lautstärke-Regler.

### Version 0.10.0 – mittlere Nebenversion: PWA-Offensive

_(bisheriger Punkt 8 „PWA-Optimierung", Stand am 6. November 2026 geprüft)_

- [x] **Background-Audio-Wiedergabe** – umgesetzt via Media Session API (`src/js/player-core.js:33`, genutzt in `src/js/player.js:32`, `src/js/video.js:267`)
- [ ] **Offline-Fallback-Seite** – fehlt: kein Service Worker, keine `offline.html`, keine SW-Registrierung im Code (`index.html` bindet nur die neun App-Module ein)
- [ ] **Installierbare App** – Teilstand: `manifest.json` + `<link rel="manifest">` in `index.html:21` vorhanden, aber ohne Service Worker nicht nach PWA-Kriterien installierbar
- [ ] **Cache-Strategie** – App-Shell cache-first, Stream-URLs immer network-only; Skeleton-Rendering dafür ist seit 0.9.18 vorhanden (`.skeleton` wiederverwendbar)
- [ ] **Push-Benachrichtigungen** – bewusst hinten: nur lokale `Notification`-API bei Titelwechsel (`src/js/notification.js:72`); Push bräuchte Service Worker + VAPID-Schlüssel und widerspricht dem DSGVO-minimalen Ansatz. Erst umsetzen, wenn das Datenschutz-Budget bewusst entschieden ist.

**Empfohlene Reihenfolge:** Service Worker + `offline.html` → installierbar machen → Cache-Strategie verfeinern → Push-Abwägung.

---

## 🚩 Hauptversionen (Major)

### Version 1.0.0 – erstes stabiles Release

**Übersetzung:**

- [ ] **Mehrsprachigkeit (i18n)** – Englische Übersetzung der Oberfläche, JSON-basierte Übersetzungsdateien (z. B. `src/i18n/de.json` + `en.json`); Sprachwechsel persistiert, ohne Reload wo möglich.

**Senderprogramm:**

- [ ] **Integration weiterer Sender** – nur über `data-url`-Attribute in `index.html` / `video/index.html` (Single Source of Truth); organisch bis zum Release erweitern.

**Feature-Programm für das Release:**

- [ ] **Weckfunktion** (bisheriger Punkt 12):
  - [ ] Uhrzeit einstellen
  - [ ] Sender als Weckton wählen
  - [ ] Sanftes Aufwachen (Lautstärke hochfahren)
- [ ] **Nutzerprofile** – pro Profil Favoriten, Verlauf und zuletzt gehörte Sender (aufbauend auf der UUID-Basis aus 0.9.17); Cloud-Sync bewusst weglassen, lokale Profile genügen dem Datenschutzansatz.

### Version 1.1.x – spätere Hauptversionen (Ideenpark)

- [ ] Favoriten in Kategorien/Sammlungen gruppieren (aufbauend auf dem Profilmodell)
- [ ] Suche/Filter über die Senderliste (Volltext, Region, Format)
- [ ] Desktop-Integration: Tray-Popup (Electron) mit Start/Pause/Stop
- [ ] Tastenkombinationen-Übersicht im Hilfe-/Info-Dialog
