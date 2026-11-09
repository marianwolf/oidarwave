# Feature.md: Versionierte Roadmap

## Ziel

`FEATURE.md` geprüft und neu strukturiert: Feature-Vorschläge gestaffelt nach Nebenversionen (0.9.x, 0.10.0) und Hauptversionen (1.0.0, 1.1.x).

## Geänderte Dateien

- `Feature.md` – vollständig überarbeitet (Markdown, kein Code)

## Recherche-Ergebnis

- Umgesetzt/Teilstand bestätigt: Favoriten (`src/js/favorite.js`), Media Session Background-Audio, `manifest.json` + Link in `index.html:21`
- Fehlt: Service Worker/`offline.html`, Theme-Umschaltung, Sleep-Timer, Skeleton-CSS, i18n, Weckfunktion
- Version laut `package.json`: 0.9.18

## Testergebnis

Kein Code-Change; `pytest tests/test_unit.py -m unit` nicht erforderlich.

## Offene Punkte

- README-Roadmap bei Umsetzung jeweils mitsynchronisieren
- Push-Benachrichtigungen bleiben bewusst zurückgestellt (DSGVO-Gewichtung)
