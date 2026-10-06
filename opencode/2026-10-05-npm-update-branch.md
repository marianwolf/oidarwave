# 2026-10-05 – npm-update-branch bereinigt

Ziel: Branch-Struktur von `chore/weekly-npm-update` (npm-auto-update) optimieren.

Befund:

- Branch war von `gamma` divergiert (Merge-Base `e2f6c03`): Merge-Commits
  `f970d71`/`57bf2e8` (lokale `git pull`-Merges), doppelter
  `chore(deps)`-Commits (`dd9fc70`, `ec70471`), alter openwiki-Dump und
  stale `package-lock.json`. Diff `gamma...chore` = 40 Dateien.
- Kein offener PR auf dem Branch (nur gemergte #85/#87/#88/#89).

Geaendert:

- `chore/weekly-npm-update` (lokal + remote) geloescht und sauber ab `gamma`
  neu erstellt; nach Workflow-Fix per Fast-Forward synchronisiert (Diff = 0).
- `.github/workflows/npm-auto-update.yml` (auf `gamma`, Commit `be691bf`):
    - Checkout mit `fetch-depth: 0` (saubere CPR-Basis, keine Merge-Commits).
    - Neuer Step „Reset stale update branch (self-heal)“: loescht den Branch
      zu Laufbeginn, wenn kein offener PR ihn benutzt.
    - PR-Body-Hinweis: Branch ist ephemer (Bot-only), nie manuell pullen/mergen.

Testergebnis:

- `pytest tests/test_unit.py -m unit`: 11 passed, 1 xfailed (erwartetes
  `test_no_secrets_in_station_urls`-xfail).

Offen:

- `origin/main` enthaelt eine aeltere Variante der Workflow-Datei (ohne
  `ref: gamma`/`base: gamma`); Angleichung erfolgt ueber normale
  Promotion `gamma -> beta -> main` (Schedule laeuft auf Default-Branch).
- Regel: Update-Branch nie manuell bespielen, nur PR reviewen.
