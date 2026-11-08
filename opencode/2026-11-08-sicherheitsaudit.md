# Sicherheitsaudit Oidarwave (2026-11-08)

## Ziel

Quellcode-basierte Suche nach Sicherheitslücken, durch die das Projekt bzw. seine Nutzer angreifbar sind
(Web-App, Electron-Desktop-Build, CI). Kein Live-Test, keine Änderung am Produktivcode.

## Vorgehen

- Manuelle Quelltext-Prüfung: `electron/main.js`, `src/js/*.js`, `index.html`, `video/index.html`,
  `impressum/index.html`, `manifest.json`, `package.json`.
- Muster-Suche nach gefährlichen Sinks (`innerHTML`, `eval`, `document.write`, `srcdoc`, `javascript:`)
  → keine Treffer.
- CI-Workflows (`.github/workflows/*.yml`), Renovate- und Ignore-Konfiguration geprüft.
- `npm audit` (Production und inkl. Dev) ausgeführt.
- Angelehnt an den security-audit-Skill (Full-Audit-Phasen), aber ohne separate Verifier-Agenten, daher
  sind die Befunde als quellcode-belegt und nicht als unabhängig gegengeprüft zu lesen.

## Befunde (nach Priorität)

### 1. Mittel — Drittanbieter-JavaScript ohne SRI und ohne CSP

- `video/index.html:53` lädt `https://cdn.jsdelivr.net/npm/hls.js@1.7.3` ohne `integrity`/`crossorigin`.
- `src/js/cookie.js:37-44` injiziert nach Consent Vercel Analytics/Speed Insights und Google Tag Manager
  (`googletagmanager.com/gtag/js`) als neue `<script>`-Elemente.
- In `index.html`, `video/index.html`, `impressum/index.html` existiert keine CSP (kein Meta-Tag, kein
  Header-Setup in `electron/main.js`); Inline-Handler (`onload="this.media='all'"`) verhindern eine
  strikte CSP zusätzlich.
- Wirkung: Wird jsDelivr/npm-Paket, GTM oder Vercel kompromittiert, läuft fremder Code im Renderer der
  Desktop-App und im Browser. Er erreicht localStorage (`station_history`, Consent), alle Stream-URLs und
  alle Dateien, die der `file`-Handler unter `APP_DIR` ausliefert. Node-Zugriff ist durch
  `contextIsolation`/`sandbox` (`electron/main.js:33-35`) ausgeschlossen, die Wirkung ist also begrenzt,
  aber real.
- Kleinstmöglicher Fix: hls.js wie Bootstrap nach `src/vendor/` vendorn (oder `integrity` + `crossorigin`
  ergänzen); CSP per `<meta http-equiv="Content-Security-Policy">` bzw. in Electron per
  `session.defaultSession.webRequest.onHeadersReceived`; GTM nur in der Web-Version laden.

### 2. Mittel — Electron vergibt Berechtigungen ohne Rückfrage

- `electron/main.js` setzt weder `session.setPermissionRequestHandler` noch
  `setPermissionCheckHandler`. Electron erteilt Permission-Requests ohne Handler standardmäßig statt.
- Wirkung: Jeder im Renderer laufende Inhalt (inkl. der Skripte aus Befund 1) kann Kamera, Mikrofon,
  Standort, Benachrichtigungen, Clipboard-Lesen usw. ohne Nutzerentscheidung anfordern.
- Fix: Handler registrieren, alles außer `notifications` für den eigenen Origin ablehnen.

### 3. Niedrig — Stream-Tokens im öffentlichen Repo

- `index.html:110,119,128,137,146` enthalten `token=`/`sid=`/`cid=`/`tvf=` in `data-url`.
  Bekannt und per `xfail` markiert (`tests/test_unit.py:168`), laut AGENTS.md eine Produktentscheidung.
- Wirkung: Die Tokens der Sender (NDR/ARD) stehen in Git-Historie, Forks, Release-Zips und im
  ausgelieferten Desktop-Paket. Missbrauch trifft die Sender-Infrastruktur, nicht eigene Systeme; möglich
  sind Sperrung/Ratenbegrenzung. Kein Zugriff auf eigene Konten.
- Fix (Produktentscheidung): Token zur Laufzeit über eine eigene Route auflösen oder tokenfreie
  Endpunkte verwenden; History-Bereinigung nur mit ausdrücklicher Freigabe.

### 4. Niedrig — Tokens landen im Logfile

- `src/js/player.js:96,107,192` loggen `currentPlayer.src` samt Query-String; `electron-log` schreibt die
  Einträge mit `level = 'debug'` in eine persistente Datei (`createLoggerFallback` in `electron/main.js`).
- Wirkung: Tokens aus Befund 3 liegen zusätzlich in Logdateien, die bei Support-Fällen häufig
  weitergegeben werden.
- Fix: kleinen Helper `redactUrl()` einführen und vor dem Loggen die Query entfernen.

### 5. Niedrig / validierungsbedürftig — `file`-Handler liefert alles unterhalb `APP_DIR`

- `electron/main.js:257-283` beantwortet jeden `file://`-Request, der unter `APP_DIR` liegt; der
  Path-Traversal-Check (Zeile 286-299) greift korrekt, aber innerhalb des App-Verzeichnisses gibt es keine
  Allowlist. Im Dev-Betrieb ist `APP_DIR` das komplette Repo (u. a. `.env` falls vorhanden, `package.json`,
  Quellcode, `.git/`).
- Offener Punkt: Ob ein kompromittierter Renderer die Antwort per `fetch()` auch lesen darf, hängt von den
  Chromium-Origin-Regeln für das überschriebene `file`-Schema ab. Das ist ohne lokalen Electron-Test nicht
  belegt (kein Display/Sandbox in dieser Session) → needs validation. Im gepackten Build enthält das asar
  nur die in `build.files` gelisteten Dateien, das Risiko sinkt dort deutlich.
- Fix (Härtung): im Handler nur eine Endungs-Allowlist (`html/css/js/svg/json/ico/png`) ausliefern.

### 6. Niedrig — CI/CD-Vertrauen

- `.github/workflows/npm-auto-update.yml` führt wöchentlich `npm install && npm update --no-audit` aus,
  erstellt einen PR und aktiviert Auto-Merge. Der Workflow hat `contents: write`, führt also
  Lifecycle-Scripts fremder Pakete mit Schreibrechten aus.
- `package-lock.json` ist in `.gitignore:4` ausgeschlossen → keine reproduzierbaren Builds, jede CI-Auflösung
  kann neue Versionen ziehen. Renovate (`minimumReleaseAge: 2 days`, Electron ohne Automerge) mildert das.
- `.github/workflows/openwiki-update.yml` installiert ein Dritt-Tool global und führt es mit
  `NVIDIA_API_KEY`, `LANGSMITH_API_KEY` und `contents: write` aus (nur `workflow_dispatch`).
- `.github/workflows/summary.yml` schickt Issue-Titel/-Body an ein Modell und postet die Antwort als
  Kommentar; Prompt-Injection ist im Prompt adressiert, ein injizierter Kommentar (z. B. Phishing-Link)
  bleibt aber möglich.
- Fix: Lockfile committen, `--ignore-scripts` beim CI-Install, Auto-Merge für `npm update` nur mit
  bestandenen Checks und manueller Freigabe.

### 7. Informational — Abhängigkeiten

- `npm audit --omit=dev`: 0 Schwachstellen (Production-Dependency ist nur `electron-log`).
- `npm audit` inkl. Dev: 6 × moderate über `minimatch` (GHSA-g3hv-75wg-m249, DoS) in der
  electron-builder-Kette. Nur Build-Zeit, kein Laufzeitpfad; `fixAvailable` schlägt einen
  electron-builder-Downgrade vor, der nicht sinnvoll ist → beobachten, nicht erzwingen.

### 8. Informational — wirkungslose Install-Script-Beschränkung

- `package.json:134-139` definiert `allowScripts`. npm kennt diese Option nicht (nur `ignore-scripts`),
  die beabsichtigte Einschränkung greift daher nicht. Kein akutes Risiko, aber der vermeintliche Schutz
  existiert nicht.

## Bereits solide umgesetzt

- `nodeIntegration: false`, `contextIsolation: true`, `webSecurity: true`, `sandbox: true`
  (`electron/main.js:32-35`), kein Preload/`contextBridge`.
- Navigations-Guards für `will-navigate`, `will-redirect`, `will-frame-navigate`
  (`electron/main.js:232-234`), `setWindowOpenHandler` mit `deny` plus `shell.openExternal` nur für
  http/https/mailto.
- Path-Traversal-Schutz im `file`-Handler (`electron/main.js:286-299`).
- Keine `innerHTML`/`eval`/`document.write`-Sinks; alle dynamischen Texte (Titel, Sendername, Status) über
  `textContent`; Metadaten-Fetch mit `AbortController` und ohne `withCredentials`.
- Keine Secrets, `.env`-Dateien oder Credentials im Repo oder in der Git-Historie.

## Nicht sicherheitsrelevant, aber aufgefallen

`impressum/index.html:390` hat `style="display: none"` am Consent-Banner, während `src/js/cookie.js` die
Sichtbarkeit über das `hidden`-Attribut steuert. Der Banner kann dort nie erscheinen (DSGVO-/UX-Thema,
keine Sicherheitslücke).

## Geänderte Dateien

- `opencode/2026-11-08-sicherheitsaudit.md` (neu, dieser Bericht)
- Keine Änderungen an Produktivcode.

## Testergebnis

- `pytest tests/test_unit.py -m unit` → 11 passed, 1 xfailed (Exit 0).
- `npm audit --omit=dev` → 0 Schwachstellen; `npm audit` (inkl. Dev) → 6 moderate, s. Befund 7.
- Website-/Design-Tests nicht ausgeführt (keine UI-Änderung).

## Offene Punkte

1. Befund 5 (Lesbarkeit von `file://`-Antworten im Renderer) braucht einen lokalen Electron-Test mit
   Sandbox/Display, um aus „validierungsbedürftig" einen bestätigten Befund zu machen.
2. Befund 3 ist eine Produktentscheidung (Token-Rotation, History-Bereinigung) und bleibt offen, bis sie
   getroffen ist.
3. Fixes für Befunde 1, 2 und 4 sind klein und unabhängig umsetzbar; sie wurden in dieser Session bewusst
   nicht angewendet, weil nur die Analyse beauftragt war.

## Nachtrag: Dependency-Bump pytest/playwright

- `requirements-dev.txt`: `pytest==9.1.1` → `9.2.0`, `playwright==1.62.0` → `1.64.1` (jeweils aktuellste
  PyPI-Version, beide `requires_python >=3.10`, passend zu Python 3.12 lokal und 3.14 in CI).
- `.venv` neu installiert, Chromium für Playwright 1.64.1 (chromium-headless-shell v1248) nachgeladen.
- Testergebnis: `pytest tests/test_unit.py -m unit` → 11 passed, 1 xfailed; `tests/test_website.py` →
  4 passed; `tests/test_design_layout.py` → 9 xpassed (`xfail(strict=False)`-Warnungen, Exit 0).
- Offen: CI nutzt Python 3.14 — dort noch nicht gelaufen, der nächste Workflow-Lauf bestätigt es.

## Nachtrag 2: Design-Tests von xfail auf harte Checks

- `tests/test_design_layout.py`: beide `@pytest.mark.xfail(strict=False, …)`-Marker entfernt, Docstrings und
  CLS-Kommentar angepasst (kein „nur Warnung" mehr).
- Testregeln geprüft, keine inhaltliche Änderung nötig: Overflow-Toleranz 1 px, Elementbreite ≤ Viewport
  + 1 px, CLS-Budget 0.1 und die statischen CSS-Muster sind korrekt und stabil (5 Läufe grün).
- Testergebnis: `pytest tests/test_design_layout.py` → 9 passed (vorher 9 xpassed), Exit 0;
  `tests/test_unit.py -m unit` → 11 passed, 1 xfailed; `tests/test_website.py` → 4 passed.
- Hinweis: Die Regex-Checks auf Breakpoints (768/480 px) und Reserven (`min-height`,
  `contain-intrinsic-size`) brechen bei einem bewussten Redesign und müssen dann mitgezogen werden.
