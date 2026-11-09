# 2026-11-03 – Code-Duplikate bereinigt (JS, Tests, Electron, HTML-Partials)

## Ziel

Duplikate im Repo finden und bereinigen – ohne Optik-/Verhaltensänderung auf den Seiten, ohne Einführung eines Bundlers (statische Seite bleibt statisch).

## Geänderte Dateien

### JS: Retry-Logik in `PlayerCore` zusammengeführt

- `src/js/player-core.js`: `MAX_RETRIES = 3` / `RETRY_BASE_DELAY = 1000` ergänzt und exportiert (waren bisher 2× identisch deklariert).
- `src/js/player.js`, `src/js/video.js`: Konstanten entfernt, aus `window.PlayerCore` destrukturiert; die beiden identischen `if (retryState.timerId) { clearTimeout(...) }`-Blöcke in `player.js` (offline-/online-Handler) durch den vorhandenen `clearRetry(retryState)` ersetzt.
- `src/js/cookie.js`: `storage()`-Variante `window.PlayerCore || null` auf `window.PlayerCore` vereinheitlicht (identisch zu `history.js`/`favorite.js`; `storage() ? ... : ...`-Checks bleiben korrekt).
- `src/js/favorite.js`: `uuid()`-Fallback `fav-${Date.now()}` → wie in `history.js` (`fallback-${Date.now()}-${Math.random()}`), damit die beiden Wrapper nicht weiter driften.

### Tests: gemeinsame Konstanten/Fixtures in `conftest.py`

- `tests/conftest.py`: `PAGE_CHECKS` (war 2× identisch als `CHECKS` in `test_website.py` und `DESIGN_CHECKS` in `test_design_layout.py`) plus Fixture `page_checks`; neue Fixtures `impressum_html` und `video_css_content` ersetzen die inline duplizierten Pfade in `test_design_layout.py` (`base_dir / "impressum" / "index.html"`, `.../style-video.css`).
- `tests/test_website.py`, `tests/test_design_layout.py`: lokale Dicts entfernt, Fixtures genutzt; ungenutzter `Path`-Import raus.
- `tests/test_unit.py`: neuer Guard `test_html_partials_up_to_date` (ruft `scripts/build_html.py --check`).

### Electron: `electron/main.js`

- `isExternalUrl()` + `openExternalSafe()` ersetzen die 2× identische http/https/mailto-Bedingung samt identischem `.catch(...)` in `will-navigate`/`will-redirect` und `setWindowOpenHandler`.
- `createBrowserWindow()` ersetzt die doppelte `new BrowserWindow(WINDOW_OPTIONS)` + `ready-to-show → show()`-Erzeugung.
- `APP_DIR`/`INDEX_HTML` auf Modulebene: `path.resolve(path.join(__dirname, '..'))` wird nicht mehr zweimal berechnet, `path.join(appDir, 'index.html')` 3× ersetzt (Log-Key `appDir` bleibt erhalten).

## Testergebnis

- `pytest tests/ -q` → **16 passed, 1 xfailed (bekannt: `test_no_secrets_in_station_urls`), 9 xpassed**.
- `pytest tests/test_unit.py -m unit` → 12 passed, 1 xfailed.
- `npx prettier --check .` → sauber; `node --check` für alle `src/js/*.js` + `electron/main.js` → ok.
- `python scripts/build_html.py --check` → ok; Negativtest (manuelle Änderung innerhalb eines Marker-Blocks) → Exit 1 und rotierender Pytest-Guard, nach Wiederherstellung wieder grün.
- Manuelle Playwright-Prüfung über lokalen HTTP-Server (file:// lädt die absoluten `/src/...`-Pfade nicht): Impressum hat jetzt `PlayerCore`/`logError`, Banner sichtbar → nach „Akzeptieren" verborgen → nach Reload verborgen (`cookieConsent=true` gespeichert), Strg+S lädt `station_history_*.json` herunter, nur ein `h1`, Logo weiter `<a class="logo">`. Video-/Index-Seiten unverändert.

## Offene Punkte / Befunde

- **`src/js/favorite.js` (252 Zeilen) bleibt bewusst erhalten** (Entscheidung im Review): Die Datei wird von keiner HTML-Seite geladen und wertet den Verlauf gegen ein veraltetes Schema aus (`station.playCount`/`station.lastPlayed` werden in `history.js` nie persistiert – gespeichert wird `{url, name, sessions, favicon}`). Folge, sobald sie geladen würde: `mostPlayed`/`lastPlayed` sind immer `stations[0]`, `totalPlayCount` immer 0. Empfehlung: entweder an `StationHistory.getLastStations()` anbinden (nutzt `summarizeStation` korrekt) oder die Datei ganz entfernen – Produktentscheidung.
- **`storage()`/`historyKey()`-Fallback** (`window.PlayerCore?.HISTORY_KEY || 'station_history'`, 3×) und der `uuid()`-Wrapper (2×) sind **bewusst gelassen**: Sie fangen den Fall ab, dass `player-core.js` bzw. `uuid.js` (noch) nicht geladen ist – `history.js` unterstützt diesen Modus explizit (`readLegacyRaw`). Ohne Bundler gibt es keinen gemeinsamen Ort für den Literal-Fallback; Zusammenführung würde nur Indirection hinzufügen oder Graceful Degradation entfernen.
- **Nicht angefasst (Scope):** CSS-Duplikate (`.station-btn:active` ≡ `.cookie-btn:active` in `style.css`, Button-Basis `style.css` ↔ `style-video.css`, Glass-Card-Block ↔ `style-impressum.css`) – bräuchten eine gemeinsame Klasse im HTML; seitenspezifische `<head>`-Metas (title/description/og/canonical).
- **Nebenbefund, nicht behoben:** `electron/main.js` `.split('\\n')` spaltet auf das Literal `\n`, nicht auf den Zeilenumbruch – `.npmignore`-Zeilen würden nie eingelesen. Die Datei existiert im Repo ohnehin nicht (ENOTP → `defaultIgnored`), der Fehler ist daher latent.
- Nach dem Ändern von `templates/*.inc` oder eines markierten Blocks: `npm run build:html` ausführen – sonst rotiert `test_html_partials_up_to_date`.
