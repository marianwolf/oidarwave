# Vendor: Bootstrap

Statisch eingebundene Bootstrap-Dateien – das Projekt bewusst ohne Bundler (siehe `AGENTS.md`).

- **Version:** 5.3.8 (Lizenz: MIT, siehe [`LICENSE`](LICENSE))
- **Herkunft:** npm-Paket `bootstrap` (devDependency), Datei
  `node_modules/bootstrap/dist/css/bootstrap.min.css`
- **Umfang:** nur das CSS. Das JS-Bundle (`bootstrap.bundle.min.js`) wird nicht gebunden, weil keine
  interaktiven Bootstrap-Komponenten (Dropdown, Modal, Collapse, Tooltip) verwendet werden.
- **Abweichung vom Upstream:** die letzte Zeile (`/*# sourceMappingURL= … */`) wurde entfernt, damit
  im `file://`-Betrieb (Electron) keine Konsolen-Fehler auf die fehlende `.map`-Datei entstehen.
  Inhaltlich ist die Datei ansonsten unverändert.

## Einbindung

```html
<link rel="stylesheet" href="/src/vendor/bootstrap/bootstrap.min.css" />
<link rel="stylesheet" href="/src/css/style.css" />
```

Bootstrap muss **vor** `style.css` geladen werden – nur so kann das eigene Design Bootstrap
überschreiben. `style.css` enthält dafür einen kleinen Reboot-Anpassungs-Block (Überschriften,
Element-Margen, `hr`, `code`), weil unser Layout mit Flex-Gaps statt Element-Margen arbeitet.

## Aktualisieren

```bash
npm install --save-dev bootstrap@^5.3
cp node_modules/bootstrap/dist/css/bootstrap.min.css src/vendor/bootstrap/bootstrap.min.css
cp node_modules/bootstrap/LICENSE src/vendor/bootstrap/LICENSE
# sourceMappingURL-Zeile am Dateiende entfernen, danach Rendering (3 Seiten, mobile/tablet/desktop)
# mit dem Ausgangszustand vergleichen.
```

`npm run format` lässt diese Dateien unangetastet (siehe `.prettierignore`).
