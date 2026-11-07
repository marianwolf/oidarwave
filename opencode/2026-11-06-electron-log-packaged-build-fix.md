# 2026-11-06 – electron-log im gepackten Electron-Build gefixt

## Ziel

Electron-Builds (`npm run pack`) liefen zwar durch, aber die gepackte App stürzte sofort ab: `Error: Cannot find module 'electron-log'` – das Fenster öffnete sich nie.

## Ursache

- `electron-log` stand in `devDependencies` → landet nicht in `app.asar`.
- `electron/main.js` machte die require **ohne** Fallback (Zeile 5) → der Main-Prozess stirbt beim Start des gepackten Builds.
- `src/js/errors.js` hat denselben require bereits mit try/catch und Konsolen-Fallback gesichert – nur `main.js` nicht.

## Geändert

- `package.json`: `electron-log` von `devDependencies` → `dependencies` (kommt jetzt mit ins asar), `package-lock.json` aktualisiert.
- `electron/main.js`: require von `electron-log` in `createLoggerFallback()` mit try/catch verpackt; Fallback auf `console`, damit ein fehlender Logger nie wieder den Main-Prozess killen kann. Transport-Format/Level unverändert.

## Testergebnis

- `npm run pack` → exit 0, `electron-log` korrekt in `app.asar/node_modules`.
- Gepackter Build (`dist/linux-unpacked/oidarwave --no-sandbox`) läuft stabil bis timeout; externes Script (Vercel Insights) wird korrekt mit 403 geblockt.
- `pytest tests/test_unit.py -m unit` → 11 passed, 1 xfailed.

## Offene Punkte

- Log-Level (`transports.file.level = 'debug'`) schreibt alle Navigations-URLs auf Disk – für den DSGVO-Release prüfen, ob Warn/Error reicht.
