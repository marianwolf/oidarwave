# Skeleton-Loading umgesetzt (0.9.18)

## Ziel

FEATURES.md Punkt „Skeleton-Loading" (0.9.x) umsetzen: Ladezustand während der Stream-Vorbereitung als Shimmer-Skeleton anzeigen, gegenüber 0.10.0 (Cache- Strategie) wiederverwendbar.

## Geänderte Dateien

- `src/css/style.css` – generische `.skeleton`-Shimmer-Klasse + `@keyframes shimmer`; `#currentSongTitle.skeleton` überschreibt die fade-in-Animation explizit
- `src/css/style-video.css` – `.video-container` als `position: relative`-Anker, `.video-skeleton` als Overlay
- `video/index.html` – `<div id="videoSkeleton" ... hidden>` im Video-Container
- `src/js/player.js` – Skeleton an Media-Events gekoppelt: an auf `loadstart`, aus auf `canplay`, `pause` und `error` (Retry blendet über `loadstart` wieder ein)
- `src/js/video.js` – Skeleton an Senderwahl (an), `MANIFEST_PARSED` / `loadedmetadata` (aus), terminale HLS-Fehler (aus) und `playing` als Sicherheitsnetz
- `FEATURES.md` – Punkt abgehakt, Stand auf 0.9.18
- `README.md` – Roadmap ergänzt
- `package.json` – Version 0.9.18

## Testergebnis

- `pytest tests/test_unit.py -m unit`: 11 passed, 1 xfail (bekannt, `test_no_secrets_in_station_urls`)
- `pytest tests/test_design_layout.py`: 9 xpassed (Advisory-Marker `xfail(strict=False)`, identisches Ergebnis ohne Änderung)
- `pytest tests/test_website.py`: 4 passed
- Manuelle Playwright-Verifizierung via lokalem HTTP-Server: Radio (`loadstart` → Skeleton an, `canplay` → aus), Video (Senderwahl → Overlay an, Manifest bereit → aus)

## Offene Punkte

- Hell-/Dunkelmodus und Sleep-Timer aus 0.9.x noch offen
- 0.10.0: Cache-Strategie kann auf die generische `.skeleton`-Klasse zurückgreifen
