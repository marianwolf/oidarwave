# 2026-10-19 – JS-Logik und Background-CSS optimieren

## Ziel

Laufzeitkosten senken, ohne die Optik zu verändern: keine Dauer-Repaints des Seitenhintergrunds, animierbare Zustandswechsel statt nicht animierbarer Gradienten, weniger Style-/DOM-Arbeit pro Mausbewegung und pro Metadaten-Poll.

## Geänderte Dateien

- `src/css/style.css`
  - Body: toten `background-attachment: fixed` und die `background`-Shorthand entfernt; nur noch `background-color`. Der Verlauf liegt auf einer fixierten `body::after`-Ebene (einmal in Viewport-Größe gerastert, danach nur komponiert statt bei jedem Scroll neu gezeichnet).
  - Maus-Glow: `body::before` + `--mouse-x/--mouse-y` auf `:root` ersetzt durch das von `mouse.js` erzeugte `.mouse-glow`-Element (keine Inheritance- Invalidierung des ganzen Baums mehr).
  - Logo: `gradient-pan` (`background-position` = Paint, keine Compositor-Property) pausiert im Leerlauf und läuft nur bei Hover/Fokus. Der statische Gradient sieht identisch aus.
  - `.station-btn`: Gradient-Basis → `background-color` + ein gemeinsames `::before`-Overlay (`isolation: isolate`, `z-index: -1`, damit der Verlauf hinter dem Text bleibt). Hover (0.22) und Aktiv (1) blenden jetzt per Opacity weich, statt hart zwischen `background-image`-Werten zu springen. Irreführende Kommentare zur angeblichen Gradient-Interpolation entfernt.
  - `audio`: undefinierte Variable `--color-media-panel` → `--color-bg-elevated` (Hintergrund war vorher transparent).
  - Solide Flächen von `background` auf `background-color` geschärft (`::selection`, Scrollbar, `nav`, `.current-station`, Status-Punkt, Notification-Toggle, Songtitel, Cookie-Buttons).
- `src/css/style-video.css`: gleiches Overlay-Muster für Datensparmodus- und CC-Toggle (Hover 0.16, Aktiv 1); `#000` als `background-color`.
- `src/css/style-impressum.css`: `<code>`-Fläche als `background-color`.
- `src/js/mouse.js`: `pointermove` statt `mousemove`, rAF-Batching, eigenes Glow-Element, direkte `transform`-Zuweisung (nur dieses Element wird invalidiert), Touch wird ignoriert, reagiert auf Änderungen von `prefers-reduced-motion`/`pointer: coarse`.
- `src/js/player.js`: Metadaten-Polling pausiert bei `document.hidden` und holt beim Zurückkehren sofort frische Daten; `AbortController` bricht die Anfrage beim Senderwechsel ab (keine veralteten Titel mehr); Poll überspringt Offline; `textContent` statt `innerText` und DOM-Update nur bei echter Änderung; letzter Sender über `dataset.url` statt Attribut-Selektor.
- `src/js/player-core.js`: `MediaMetadata`/Action-Handler nur noch bei geändertem Track setzen (kein Objekt-Churn alle 3 s); Reset beim Clearen.
- `src/js/history.js`: Storage-Writes sind synchron – `async`/`await`-Umweg entfernt.
- `src/js/cookie.js`: Banner über `hidden` statt Inline-`display`.
- `src/js/video.js`: Null-Guards für die Toggles, `event.target` statt `document.activeElement` im Keydown-Handler.

## Verifikation

- `pytest tests/` → **15 passed, 1 xfailed** (bekannter Token-Test), **9 xpassed** (Design-Guards, `strict=False`).
- Zusätzlich lokaler HTTP-Server + Playwright/Chromium:
  - `body` computed: `background-image: none`, `attachment: scroll`; `body::after` = Verlauf, `position: fixed`.
  - `.station-btn.active::before` = Marken-Gradient, `opacity: 1`, `z-index: -1`; Hover-Overlay `opacity: 0.22`; Text bleibt lesbar.
  - `audio` Hintergrund = `rgb(30, 41, 59)` (Variable aufgelöst).
  - Logo: `animation-play-state: paused` im Leerlauf, `running` bei Hover.
  - Cookie-Banner: `hidden` nach Akzeptieren und nach Reload `true`.
  - Polling: 0 Requests bei simuliertem `document.hidden`, 1 Request direkt nach Rückkehr.
  - Video-Seite: Toggle-Overlay `opacity: 1`, Basis `rgba(255,255,255,0.05)`.
  - `prefers-reduced-motion`: kein `.mouse-glow`, Animationen ~0.
  - Konsole ohne JS-Fehler; nur erwartete lokale 404 der Vercel-Analytics- Skripte und HLS-Streamfehler im Headless-Browser.
- Screenshots (Desktop, Mobile, Video, Impressum-Unterkante, Hover) gesichtet: keine sichtbare Regression. Prüf-Screenshots wurden danach entfernt.

## Offene Punkte

- Logo-Pan läuft bewusst nur bei Hover/Fokus. Für dauerhafte Bewegung wäre ein Crossfade zweier statischer Gradient-Layer (nur Opacity) die Compositor-freundliche Variante – kostet aber doppelte Textschicht/Markup.
- Bei 390 px besteht ein horizontaler Overflow von 4 px (Bootstrap-`.row`- Negativmarge vs. Container-Padding bei ≤480 px). Bestand schon vorher, nicht angefasst (Layout-, kein Performance-Thema).
- Die Testsuite prüft CSS nur strukturell; die Design-Guards laden unter `file://` keine absoluten Assets und sind deshalb `xfail`/`xpass`.
