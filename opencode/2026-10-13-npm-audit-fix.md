# 2026-10-13 – npm audit fix (ohne Netto-Aenderung)

Ziel: `npm audit fix` ausfuehren und offene Vulnerabilities reduzieren.

Befund (vorher, identisch wie nachher): 13 vulnerabilities (8 moderate, 5 high), alle in devDependencies – prod-Deps nicht betroffen.

- 5 high: `openwiki` -> `deepagents` -> `fast-glob`/`micromatch` -> `braces` (GHSA-vfj7-8cjw-p6xm, Range `*`, installiert ist bereits `braces@3.0.3` = latest) -> **kein Upstream-Fix**.
- 8 moderate: `electron-builder` -> `app-builder-lib` -> `@electron/get@3` -> `global-agent` -> `roarr` -> `sprintf-js` (Range `*`). Npm's einziger "Fix" ist der Breaking-Downgrade auf `electron-builder@26.5.0`.

Ausprobiert und zurueckgerollt:

- `npm audit fix` (plain): kein Effekt, keine Datei-Aenderung.
- `npm audit fix --force` (auf Wunsch): setzt `electron-builder` auf 26.5.0 -> **verschlechtert** den Befund auf 14 (13 high, 1 critical, `tar@7.5.3`, dazu echte Advisories in `electron-updater`/`builder-util-runtime`). Nachlaufendes `npm audit fix` pendelt zwischen 26.5.0 (schlechter) und 26.15.3 (gleichwertig) hin und her.
- Deshalb: `package.json` auf Original `^26.17.0` zurueckgesetzt, `npm install`, dann `git checkout package-lock.json` -> Arbeitsbaum sauber (`git status` leer).

Nicht genutzt (bewusst): Override `@electron/get@^5` waere zwar ein Nicht-Breaking-Fix fuer 4 Moderate, ist aber ESM-only (`type: module`) gegenueber CJS-konsumierendem `app-builder-lib` -> Bruchrisiko beim Packaging.

Geaendert: keine (Arbeitsbaum unveraendert).

Testergebnis:

- `pytest tests/test_unit.py -m unit`: 11 passed, 1 xfailed (erwartetes `test_no_secrets_in_station_urls`-xfail).
- `npm ls --depth=0` sauber, `electron-builder --version` = 26.17.0.

Offen:

- `braces`-Advisory abwarten (Upstream-Fix); betroffen ist nur die `openwiki`-CLI-Abhaengigkeit, keine Laufzeit der App.
- Moderate-Kette loest sich, sobald `electron-builder`/`app-builder-lib` `@electron/get@>=5` (ohne `global-agent`) nachzieht – dann `npm audit` erneut pruefen.
