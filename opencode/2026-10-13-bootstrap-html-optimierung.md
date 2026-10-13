# 2026-10-13 – HTML-Dateien mit Bootstrap optimieren

## Ziel

Die drei HTML-Seiten (`index.html`, `video/index.html`, `impressum/index.html`) mit Bootstrap strukturell optimieren, **ohne die bestehende Optik zu verändern**. Einbindung lokal (kein CDN), Version 5.3.x (stabil) statt der zuvor in `package.json` deklarierten `6.0.0-alpha.1`.

## Geänderte Dateien

- `src/vendor/bootstrap/bootstrap.min.css` + `LICENSE` + `README.md` (neu): Bootstrap 5.3.8 aus `node_modules` kopiert, `sourceMappingURL`-Zeile entfernt (sonst 404 unter `file://`/Electron). Nur CSS – das JS-Bundle fehlt bewusst, es wird keine interaktive Bootstrap-Komponente genutzt.
- `package.json` / `package-lock.json`: devDependency `bootstrap` von `^6.0.0-alpha.1` auf `^5.3.8`.
- `.prettierignore` (neu): schützt `src/vendor/` vor `npm run format`.
- `index.html`, `video/index.html`, `impressum/index.html`:
  - Bootstrap-CSS per absolutem Pfad **vor** `style.css` eingebunden.
  - Logo `div` → `<h1 class="logo">` (die Seiten hatten vorher keine H1).
  - Navigation als semantische Liste `<ul class="nav">` mit `.nav-link`.
  - Player-Zweispalter auf Bootstrap-Grid: `.player-section.row.align-items-start` mit `col-12 col-md-6`-Containern (Padding bleibt an den Karten, damit das Gutter-Maß stimmt).
  - Cookie-Banner über Utilities (`d-flex`, `flex-column`, `flex-md-row`, `gap-*`, `w-100`, `text-center`), Buttons als `btn btn-light` / `btn btn-outline-light`.
  - Alle Buttons mit `type="button"`; fehlende `id="cookieBannerHeading"` auf Index/Video ergänzt (das Banner verwies per `aria-labelledby` auf ein nicht existentes Element).
- `src/css/style.css`: Reboot-Anpassungs-Block (Überschriften-Gewicht/-Zeilenhöhe, Element-Margen, `hr`-Deckkraft, `code`-Farbe, `color-scheme: dark`); Grid-Regeln für `.player-section` durch Bootstrap-Gutter-Variablen ersetzt; Cookie-Banner-Layout-Regeln entfernt (jetzt Utilities); `nav a` → `nav .nav-link` (Bootstrap-Klassenselektoren haben höhere Spezifität).
- `src/css/style-impressum.css`: `font-weight` für `.impressum-toc a` explizit gesetzt (fiel sonst von 500 auf 400, weil die alte `nav a`-Regel auch die TOC traf).
- `README.md`: Roadmap-Eintrag ergänzt.

## Verifikation

- `pytest tests/ -q` → **15 passed, 1 xfailed** (bekannter Token-Test), **9 xpassed** (Design-Guards).
- Rendering-Vergleich vorher/nachher über lokalen HTTP-Server (Playwright, 375/768/1280 px): berechnete Styles aller Elemente gelistet und Screenshots pixelweise verglichen. Kein Overflow, keine Layout-Verschiebung.

## Offene Punkte / bewusste Abweichungen

- Cookie-Button-Schrift 13,33 px (Browser-Standard) → 16 px (Bootstrap-Reboot „font-size: inherit"); das Banner ist dadurch ~16 px höher. Sieht konsistent zum Fließtext aus.
- `<code>` im Impressum 11,4 px → 14 px (der eigene `0.875em`-Wert greift jetzt, vorher kam der Chrom-UA-Wert `0.8125em` mit).
- Cookie-Buttons liegen bei **genau 768 px** nebeneinander statt untereinander (Bootstrap `md` beginnt ab 768, die alte Media-Query bis 768). Die Player-Spalten behalten dank eigener Regel ihr altes Stappelverhalten.
- Version noch nicht in `package.json` gebumpt und nichts committet – Produktentscheidung.
