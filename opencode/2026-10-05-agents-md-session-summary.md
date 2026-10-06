# Session-Summary 2026-10-05 — AGENTS.md + Session-Summary-Regel

## Ziel

AGENTS.md kompakt halten und User-Vorgabe umsetzen: jede Session als Summary in `./opencode/` speichern.

## Geänderte Dateien

- `AGENTS.md`: neue Sektion `Session-Summary (./opencode/)` (Dateiname `YYYY-MM-DD-<kurzthema>.md`, Kurzinhalt, keine Secrets); Test-Zeile korrigiert — CI `test.yml` läuft alle drei Suiten (`test_unit.py -m unit`, `test_website.py`, `test_design_layout.py`).
- `opencode/` Ordner angelegt (+ diese Datei als erste Summary).

## Testergebnis

- Keine Code-Änderung, daher keine pytest/Playwright-Läufe. Verifiziert per Read: `package.json`, `pytest.ini`, `tests/conftest.py`, `tests/`-Inhalt, `.github/workflows/test.yml`, `pyrightconfig.json`, `eslint.config.mjs`, `README.md`.

## Offene Punkte

- Keine. Optional: `.gitignore`-Regel für `opencode/` prüfen (aktuell wird committet, wie in AGENTS.md festgelegt).
