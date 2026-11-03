# 2026-11-03 – Station-Button-CSS (Properties) optimiert

## Ziel

Die `.station-btn`-Regeln in `src/css/style.css` (Buttons im `player-section`-Block) auf Ebene der einzelnen Eigenschaften prüfen und optimieren: tote Deklarationen entfernen, native Button-Chrome neutralisieren, Print-Verhalten korrigieren – ohne Optikänderung auf dem Screen.

## Geänderte Dateien

- `src/css/style.css` (nur `.station-btn`-Regeln):
  - `appearance: none;` ergänzt. Neutralisiert UA-Default und Bootstraps `button{-webkit-appearance:button}` (in `bootstrap.min.css` enthalten), damit `background-color`, `border` und `border-radius` in jedem Browser die einzige Quelle der Optik sind.
  - `accent-color: var(--color-brand-primary);` entfernt – `accent-color` wirkt nur auf Formular-Widgets (Checkbox, Radio, Select, Meter), nie auf einem schlichten `<button>`; reine toete Deklaration.
  - `@media print`: `box-shadow: none !important;` ergänzt, damit der Aktiv-Glow des ausgewählten Senders nicht als grauer Hof mitgedruckt wird.

## Verifikation

- Pixel-Vergleich (Playwright-Screenshots, Fonts geblockt, deterministisch) vorher/nachher, je 224.360 Pixel:
  - `rest`, `hover`, `active`, `active_hover`: **0 Pixel Unterschied** (Ausnahme: 6 Pixel mit Kanal-Delta ≤ 5 = Anti-Aliasing-Rauschen) → Screen-Optik unverändert.
  - `@media print`: 11.252 Pixel geändert (max. Delta 40) = genau der unterdrückte Glow; Vergleich mit injiziertem `box-shadow: none` auf dem alten Stand deckungsgleich (73 Pixel, Delta ≤ 2) → keine Nebenwirkung.
  - `forced-colors`: 0 Pixel Unterschied (Gradient ist dort ohnehin nicht sichtbar, `::before`-Regel war nicht noetig).
- Berechnete Styles: `appearance` `button` → `none`, `accent-color` `rgb(179,102,255)` → `auto`, alles andere identisch.
- `pytest -q` → **15 passed, 1 xfailed (bekannt), 9 xpassed**.

## Offene Punkte

- Kontrast im Aktiv-Zustand: `#f8fafc` auf dem Verlauf `hsl(270,100%,70%)`/`hsl(345,100%,70%)` ≈ **3,3:1** – unter WCAG AA (4,5:1) für Normaltext. Fix wäre z. B. `color: var(--color-bg-base)` in `.station-btn.active` (≈ 5,3:1), ist aber eine Designentscheidung und wurde bewusst nicht geändert.
- Geprüft, ohne Handlungsbedarf: `text-align: center` (UA-Default ist bereits `center`, aus Klarheit behalten), `cursor: pointer` (UA-Default ist `default`, also noetig), `font-weight` 500 → 600 bei `.active` (Button-Hoehen vorher/nachher identisch, kein CLS-Risiko).
- Scope laut Absprache: nur `.station-btn` in `style.css`. Die nahezu identischen Regeln für `.data-mode-toggle`/`.caption-toggle` in `style-video.css` sowie `.notification-toggle`/`.cookie-btn` sind unveraendert und weiterhin Kandidaten fuer eine gemeinsame Button-Basis.
