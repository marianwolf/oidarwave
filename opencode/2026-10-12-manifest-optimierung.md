# 2026-10-12 manifest-optimierung

## Ziel

`manifest.json` PWA-tauglich und schlank machen (installierbar, valide Icons, keine toten Felder).

## Geänderte Dateien

- `manifest.json`: neu geschrieben (s. Details unten)

## Was am Manifest falsch war

- 6x derselbe `favicon.svg`-Eintrag mit erfundenen Raster-`sizes` (180/192/512 als `image/svg+xml`) — ungültig; SVG darf nur `sizes: any` tragen.
- Kein PNG ≥ 144 px → Chrome-Installierbarkeit (192 + 512 Pflicht) nicht erfüllt (nur 128-px-PNG vorhanden).
- `theme_color`/`background_color` fehlten → kein Splash-Screen (Farbe `#0f172a` aus `src/css/style.css` übernommen).
- `share_target` mit leerem `params: {}` (spez-widrig), `screenshots: []`, `version` (Chrome-Extension-Feld, kein Web-Manifest), `orientation: any` (= Default), `dir: ltr` (= Default), `prefer_related_applications: false` (No-Op ohne `related_applications`) — alle entfernt.
- Shortcut 2 mit relativer URL `video` → absolut `/video` (Projekt-Regel: absolute Pfade).
- `id: /` ergänzt (explizit, zukunftssicher).

## Testergebnis

- `pytest tests/test_unit.py -m unit`: 11 passed, 1 xfailed (bekannter `test_no_secrets_in_station_urls`-xfail)
- Manifest per Skript validiert: JSON ok, alle PNG-`sizes` stimmen mit echten Bildmaßen überein, alle Shortcut-URLs absolut.

## Offene Punkte

- Optional: `<meta name="theme-color" content="#0f172a">` in `index.html` + `video/index.html` ergänzen (Lighthouse-PWA-Punkt, liegt außerhalb `manifest.json`).
- Optional: echte Screenshots für Install-Dialog nachtragen, falls gewünscht.
