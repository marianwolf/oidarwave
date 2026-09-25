<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->

## OpenCode (Kodierhinweise)

* Kein Web-Build nötig: `index.html` direkt im Browser öffnen. Desktop: `npm start` (Electron, `electron/main.js`); Pakete via `npm run build:*`.
* Python-Umgebung: `.venv` (siehe `pyrightconfig.json`), Deps aus `requirements-dev.txt`. Browser einmalig installieren: `python -m playwright install chromium` (CI-Workflow `test.yml` macht das automatisch via `--with-deps`).
* Tests: `pytest -m unit` (schnell, ohne Browser) bzw. gezielt `pytest tests/<datei>.py`. Website-Tests (`tests/test_website.py`) laufen ausschließlich mit Playwright (`integration`-Marker, zentrale `browser`/`page`-Fixtures in `tests/conftest.py`).
* Geteilte Fixtures in `tests/conftest.py` nutzen (`base_dir`, `index_html`, `video_html`, `package_json`, `main_css_content`) statt lokaler Pfad-/JSON-Duplikate.
* Stream-URLs nie hardcoden: Single Source of Truth sind die `data-url`-Attribute in `index.html` / `video/index.html` (vgl. `tests/test_streams.py`).
* CSS-Tests nur strukturell (Blöcke vorhanden, Klammern balanciert, Kern-Selektoren), keine exakten Wert-Regexes — brechen bei jedem Redesign.
* Bekannt fehlschlagend: `TestNoSecretsInStationUrls` (`index.html` enthält `token=`/`sid=`/`cid=`/`tvf=`). Test nicht löschen, Fix von `index.html` ist eine Produktentscheidung.
