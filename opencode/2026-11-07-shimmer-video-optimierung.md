# Video-Shimmer verfeinert (Skeleton-Overlay)

## Ziel

Skeleton-Shimmer im Video (`FEATURES.md` 0.9.x „Skeleton-Loading") vom reinen `background-position`-Ansatz zu einem professionellen, GPU-freundlichen Sweep weiterentwickeln: weiche Kanten, Crossfade in die Wiedergabe, ruhige `prefers-reduced-motion`-Variante. Baut auf der uncommitteten 0.9.18- Skeleton-Umsetzung vom selben Tag auf (siehe `opencode/2026-11-07-skeleton-loading.md`).

## Was war unprofessionell

- `background-position`-Animation => Paint/Repaint pro Frame, ruckelig auf schwächeren Geräten (gerade im Video-Kontext)
- Harte Gradient-Stufen (30/50/70 %) => sichtbare Kanten des Blinkes
- Skeleton erscheint/verschwindet hart (`hidden`-Attribut) => kein Crossfade in die Video-Wiedergabe

## Geänderte Dateien

- `src/css/style.css` – `.skeleton`: Sweep jetzt auf `::after`-Layer via `transform: translate3d()` (Compositor), `isolation: isolate` + `z-index: -1` (Layer über Fläche, unter Inhalt); weiche Gradient-Kanten (24/40/50/60/76 %); Sweep 1.8 s; `@keyframes shimmer` auf Transform umgestellt; ID-Workaround `#currentSongTitle.skeleton` entfernt (Konflikt entfällt); `prefers-reduced-motion`: Sweep statisch aus (`animation: none`, ruhige Fläche)
- `src/css/style-video.css` – `.video-skeleton`: opacity/visibility-Crossfade (0.45 s, `--ease-out-quint`), Sichtbarkeit via `.is-active`-Klasse, dezente Aufhellung `rgba(255,255,255,0.03)` statt reines Schwarz
- `src/js/video.js` – `showSkeleton`/`hideSkeleton` auf `classList`-Toggle (`is-active`) umgestellt statt `hidden`-Attribut
- `video/index.html` – `hidden`-Attribut am Overlay entfernt (CSS versteckt initial; ohne JS bleibt die Fläche schwarz, wie vorher)
- `FEATURES.md` – Skeleton-Stand um die Verfeinerung ergänzt

## Testergebnis

- `pytest tests/test_unit.py -m unit`: 11 passed, 1 xfail (bekannt)
- `pytest tests/test_design_layout.py`: 9 xpassed (Advisory, wie ohne Änderung)
- `pytest tests/test_website.py`: 4 passed

## Offene Punkte

- `package.json` steht auf 0.9.18, während die Skeleton-Summary 0.9.18 ankündigte – Versionssprung war nicht committet; Versionierung ist Release-Entscheidung und wurde hier nicht still angehoben
- Manuelle Sichtprüfung simulierte Verlauf via Playwright läuft in `test_website.py`; eigenes Frames-Verhalten im Browser ggf. nochmal ansehen (Player-Titel `#currentSongTitle` nutzt denselben `.skeleton`-Mechanik)
