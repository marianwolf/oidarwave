<!-- OPENWIKI:START -->

## OpenWiki

This repository uses OpenWiki for recurring code documentation. Start with `openwiki/quickstart.md`, then follow its links to architecture, workflows, domain concepts, operations, integrations, testing guidance, and source maps.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->

## OpenCode (Kodierhinweise)

* Kein Web-Build nötig: `index.html` direkt im Browser öffnen. Desktop: `npm start` (Electron, `electron/main.js`); Pakete via `npm run build:*`.
* Python-Umgebung: `.venv` (siehe `pyrightconfig.json`), Deps aus `requirements-dev.txt`. Vor `tests/test_website.py` einmalig `playwright install chromium` ausführen (CI-Workflow `test.yml` installiert das nicht selbst).
* Tests: `pytest -m unit` (schnell, ohne Browser) bzw. gezielt `pytest tests/<datei>.py`. Marker `unit`/`integration` aus `pytest.ini` immer setzen.
* Geteilte Fixtures in `tests/conftest.py` nutzen (`base_dir`, `index_html`, `video_html`, `package_json`, `main_css_content`) statt lokaler Pfad-/JSON-Duplikate.
* Stream-URLs nie hardcoden: Single Source of Truth sind die `data-url`-Attribute in `index.html` / `video/index.html` (vgl. `tests/test_streams.py`).
* CSS-Tests nur strukturell (Blöcke vorhanden, Klammern balanciert, Kern-Selektoren), keine exakten Wert-Regexes — brechen bei jedem Redesign.
* Bekannt fehlschlagend: `TestNoSecretsInStationUrls` (`index.html` enthält `token=`/`sid=`/`cid=`/`tvf=`). Test nicht löschen, Fix von `index.html` ist eine Produktentscheidung.
