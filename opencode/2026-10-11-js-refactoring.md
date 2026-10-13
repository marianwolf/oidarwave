# 2026-10-11 – JS lesbarer, Duplikate entfernt

## Ziel

`src/js/*` lesbarer machen, funktionale Duplikate in `player-core.js` zentralisieren.

## Geändert

- `src/js/player-core.js`: erweitert um `HISTORY_KEY`, `readJSON/writeJSON/removeSetting`, `createRetryState/getRetryDelay/scheduleRetry/clearRetry/resetRetry`, `createStatusDisplay`, `setActiveStation`, `isEditableTarget`, `clamp`, `getMusicInfo/formatTrackDisplay`; defensiver Zugriff auf `errors.js`-Globals; Export zusätzlich via `module.exports`.
- `src/js/errors.js`: nur Lesbarkeit (`parseLogLevelName`, Kommentare, `catch ohne binding`); Verhalten unverändert.
- `src/js/uuid.js`, `mouse.js`: IIFE + `window`/`module.exports`, toter Code in `mouse.js` entfernt.
- `src/js/cookie.js`, `notification.js`: nutzen `PlayerCore`-Storage, kleinteilige Funktionen, keine Globals.
- `src/js/history.js`, `favorite.js`: nutzen `PlayerCore.readJSON/writeJSON` + `HISTORY_KEY`; Sitzungs-/Präferenzlogik in benannte Helfer zerlegt; `window.*` + `module.exports`.
- `src/js/download_history.js`: nutzt `PlayerCore.HISTORY_KEY/readSetting`.
- `src/js/player.js`, `video.js`: nutzen Retry-/Status-/Storage-/Metadaten-Helfer aus `PlayerCore`; Verhalten (Retry-Texte, Events, HLS-Fehlerpfade, Shortcuts) erhalten.

## Tests

- `node --check src/js/*.js electron/main.js`: alle OK.
- `pytest tests/test_unit.py -m unit`: 11 passed, 1 xfailed (erwartet: Session-Token in `index.html`).
- Node-Smoke-Test (`errors.js`+`player-core.js`+`uuid.js` in `vm`): Exporte, Retry-Delays (1000/2000/4000), `clamp`, Track-Format, Storage, UUID, `HISTORY_KEY` OK.

## Offen

- `history.js` enthält noch einen `localStorage`-Fallback für den Fall, dass `PlayerCore` fehlt.
- Manueller Browser-Test (Audio/Video, Retry, CC, Banner) steht aus.
