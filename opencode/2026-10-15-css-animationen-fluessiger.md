# 2026-10-15 – CSS-Animationen flüssiger optimieren

## Ziel

Bestehende CSS-Animationen und -Transitions flüssiger und performanter machen, ohne die Optik bewusst zu verändern. Fokus: Compositor-Properties, Timing-Trennung nach Property-Typ, weichere Keyframes, weniger permanent erzeugte Compositing-Ebenen.

## Geänderte Dateien

- `src/css/style.css`
  - Neue Design-Tokens in `:root`: `--ease-out-quint`, `--ease-spring`, `--transition-tactile` (0.18s, Transform), `--transition-lift` (0.28s Spring, Hover-Lifts), `--transition-press` (0.08s, `:active`-Druck-Feedback), `--transition-color` (0.3s, Farben/Schatten). Unbenutzte Tokens `--transition-snappy`/`--transition-smooth` entfernt (nirgends referenziert).
  - Timing nach Property-Typ getrennt: Transform/Bewegung läuft schnell mit sanftem Auslaufen, Farben/Box-Shadow ruhiger – statt einer einheitlichen Duration für alles.
  - `body::before` (Maus-Glow): `transition: transform 90ms linear` glättet die rAF-getakteten Maussprünge; `will-change: transform` bleibt (bewusst, ein Element).
  - `.station-btn`: `will-change: transform` entfernt (pro Grid-Button dauerhaft eigene Ebene = Speicher-/Rasterkosten ohne Nutzen). Basis-Hintergrund als `linear-gradient` mit gleicher Struktur wie der aktive Zustand, damit Senderwechsel weich interpoliert statt springt. Hover-Regeln in `@media (hover: hover) and (pointer: fine)` (Touch klebt sonst im `:hover`).
  - Hover-Regeln für `nav .nav-link`, `.notification-toggle`, `.cookie-btn` ebenfalls unter `@media (hover: hover) and (pointer: fine)`.
  - `:active`-Regeln mit `transition-duration: var(--transition-press)` für schnelles Druck-Feedback.
  - `background` → `background-color` bei `nav .nav-link[aria-current]`, `.status-indicator*`, `.notification-toggle*` (genauer, kein unnötiges Shorthand).
  - Keyframes: `fade-in`/`banner-in` auf `translate3d` (Compositor-Hinweis), `pulse` mit `ease-in-out`, Puffer-Indikator `animation: pulse 1.5s ease-in-out infinite`, Logo `gradient-pan` mit `ease-in-out` (weichere Richtungsumkehr), Cookie-Banner und Songtitle auf `--ease-out-quint`.
- `src/css/style-video.css`: gleiche Timing-Trennung (`--transition-tactile`/`--transition-color`/`--transition-press` statt hartkodierter `0.2s ease`-Listen), Basis-Hintergrund als Gradient gleicher Struktur wie Hover/Aktiv, Hover unter `@media (hover: hover) and (pointer: fine)`.
- `src/css/style-impressum.css`: `--transition-snappy` → `--transition-color` (Token-Umzug).

## Verifikation

- `pytest tests/ -q` (alle drei CI-Dateien) → **15 passed, 1 xfailed** (bekannter Token-Test, `strict=False`), **9 xpassed** (Design-Guards).
- `pytest tests/test_unit.py -m unit` → **11 passed, 1 xfailed**.
- Berechnete Styles per Playwright über lokalen HTTP-Server geprüft: `.station-btn` = `transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), … 0.3s`, `will-change: auto`, aktiver Button als Gradient, `banner-in` = `cubic-bezier(0.22, 1, 0.36, 1)`, `pulse` = `1.5s ease-in-out infinite`.
- Screenshots (Desktop 1280, Mobile 375, Video-Seite): Start, Hover, aktiv, Video-Toggle aktiv, `prefers-reduced-motion` (`animation-duration: 1e-05s`, Glow `display: none`). Kein sichtbarer Optik-Regression.

## Offene Punkte

- `body::before`-Glow hat jetzt 90 ms Nachlauf – gewollt (Glättung), bei sehr schnellen Mausbewegungen wirkt er minimal „hinterher". Wert bei Bedarf anpassen oder auf 0 ms reduzieren.
- `background-attachment: fixed` am Body ist durch die nachfolgende `background`-Shorthand-Regel ohnehin wirkungslos (unverändert, nur Hinweis).
- Nichts committet – Produktentscheidung.
