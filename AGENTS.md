<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->

## OpenCode

- Statische Seite ohne Bundler/Build: `index.html` direkt im Browser öffnen. Desktop: `npm start` (Electron, `electron/main.js`); Paketieren via `npm run pack` / `npm run dist*` (kein `build:*`-Skript).
- JS-Ladereihenfolge einhalten (`defer` in `index.html` / `video/index.html`): `errors.js` → `player-core.js` → `player.js`/`video.js`. Module hängen sich an `window.*` (`ErrorCode`, `PlayerCore`) und exportieren zusätzlich via `module.exports` für Electron (`src/js/errors.js:161-187`) – beim Hinzufügen neuer Module beides pflegen.
- Absolute Asset-Pfade (`/src/...`, `/favicon/...`) nicht auf relativ umschreiben: Electron fängt sie per `file`-Protokoll-Fallback ab (`electron/main.js:200-260`). Externe `http(s)`-Links immer via `shell.openExternal` (Navigation-Guard), `sandbox:true` + `nodeIntegration:false` bleiben an.
- Python-Umgebung: `.venv` (siehe `pyrightconfig.json`), Deps aus `requirements-dev.txt`. Browser einmalig: `python -m playwright install chromium` (CI `test.yml` nutzt `--with-deps`; Branches `main`, `beta`, `gamma`).
- Tests: `pytest tests/test_unit.py -m unit` (schnell, ohne Browser), `pytest tests/test_website.py` (Playwright, `integration`-Marker) bzw. `pytest tests/test_design_layout.py` (Layout) — CI `test.yml` läuft alle drei. Fixtures `browser`/`page` aus `tests/conftest.py`. Kein `test_syntax.py` / `test_streams.py` – das ist jetzt alles in `test_unit.py`.
- Fixtures in `tests/conftest.py` wiederverwenden (`base_dir`, `index_html`, `video_html`, `package_json`, `main_css_content`, `audio_stations`, `video_stations`, `page_urls`) statt lokale Pfad-/JSON-Duplikate.
- Stream-URLs nie hardcoden: Single Source of Truth sind die `data-url`-Attribute in `index.html` / `video/index.html` (Tests: `test_audio_streams`, `test_video_streams`, `test_no_duplicate_station_urls` in `tests/test_unit.py`).
- CSS-Tests nur strukturell (Blöcke vorhanden, Klammern balanciert, Kern-Selektoren), keine exakten Wert-Regexes — brechen bei jedem Redesign.
- Bekannt per `xfail`: `test_no_secrets_in_station_urls` (`index.html` enthält `token=`/`sid=`/`cid=`/`tvf=`). Test nicht löschen, Fix von `index.html` ist eine Produktentscheidung.

## Session-Summary (`./opencode/`)

- Jede Session endet mit einer Summary-Datei in `./opencode/`: `YYYY-MM-DD-<kurzthema>.md` (Ordner anlegen falls fehlt).
- Inhalt (kurz): Ziel, geänderte Dateien, Testergebnis (`pytest tests/test_unit.py -m unit` + ggf. Website/Design-Tests), offene Punkte.
- Summaries werden committet, enthalten aber nie Secrets/Tokens/personenbezogene Daten.

## KI-Leitlinien

_KI-Nutzung ist erlaubt, ersetzt aber keine Verantwortung. Es gilt: Mensch prüft, Mensch haftet für den PR._

- **Kennzeichnen:** KI-unterstützte PRs im PR-Text kurz angeben (Tool + Umfang, z. B. „mit Copilot entworfen, manuell getestet"). Vollständig KI-generierte PRs ohne eigenen Review werden geschlossen.
- **Prüfpflicht:** Jeden KI-Vorschlag selbst verifizieren: `pytest tests/test_unit.py -m unit`, bei UI-Änderungen zusätzlich manuell im Browser + ggf. `pytest tests/test_website.py`. Blindes Copy-Paste ist kein Beitrag.
- **Projekt-Regeln gehen vor:** Stream-URLs nur aus `data-url` in `index.html` / `video/index.html` (Single Source of Truth), JS-Ladereihenfolge und absolute Asset-Pfade einhalten (s. oben), keine Tracker/Werbung/externen Skripte einschleusen – auch nicht „weil die KI es vorgeschlagen hat".
- **Lizenz-Sauberkeit:** Nur MIT-kompatiblen Code einbringen. Keine Snippets unklarer Herkunft, keine GPL-/Copyleft-Fragmente, keine 1:1-Kopien aus fremden Repos ohne Nachweis. Im Zweifel neu schreiben + Quelle im PR nennen.
- **Datenschutz (DSGVO-Projekt):** Keine Secrets, Tokens, privaten URLs oder personenbezogenen Daten in öffentliche KI-Tools / Prompts kopieren. `index.html` enthält bereits Session-Token (`xfail`-Test beachten) – diese nicht weiter verbreiten.
- **Keine Flut:** Keine KI-Massen-PRs (viele kleine PRs statt einem sauberen), keine automatischen Renovate-Duplikate, kein Spam in Issues. Ein guter PR > zehn mittelmäßige.
- **Ehrlichkeit:** KI-Fehler eingestehen, nicht vertuschen. Halluzinierte APIs/URLs im Review ansprechen statt zu raten.
