# Oidarwave - Entwickler- und Projektdokumentation

## Inhaltsverzeichnis
1. [Einleitung](#einleitung)
2. [Features](#features)
3. [Technologie-Stack](#technologie-stack)
4. [Projektstruktur](#projektstruktur)
5. [Installation & Setup](#installation--setup)
6. [Build-Prozess](#build-prozess)
7. [Architektur & Kernkomponenten](#architektur--kernkomponenten)

---

## Einleitung
**Oidarwave** ist eine performante, plattformübergreifende Webradio-Desktopanwendung. Sie bietet dem Nutzer eine einfache und moderne Oberfläche (mit Dark Mode/Light Mode), um verschiedene Radiosender (v.a. öffentlich-rechtliche wie Deutschlandfunk und NDR, sowie diverse andere Sender) bequem auf dem Desktop zu streamen.

## Features
- **Plattformübergreifend**: Verfügbar für Windows, macOS und Linux.
- **Vorkonfigurierte Sender**: Schneller Zugriff auf Sender wie Deutschlandfunk, NDR 1, NDR 2, NDR Info, NDR Kultur, N-JOY, 80s80s, 90s90s und BBG Radio.
- **Metadaten-Anzeige**: Live-Anzeige von laufenden Titeln oder Sendungen über externe APIs.
- **Historie**: Speichert den zuletzt gehörten Verlauf (lokal sowie in einer Redis-Datenbank).
- **Benachrichtigungen**: Optionale Desktop-Benachrichtigungen bei einem Titelwechsel.
- **Offline- / Fehlerbehandlung**: Stabiles Routing und Fallbacks, falls Verbindungen abbrechen.

## Technologie-Stack
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend / Desktop-Rahmen**: [Electron](https://www.electronjs.org/) (aktuell v41.5.0).
- **Datenbank**: [Redis](https://redis.io/) (v5.12.1) zur zentralen/lokalen Speicherung des Sender-Verlaufs (`station_history`).
- **Build-Tool**: `electron-builder` für das Erstellen von Installationsdateien und Binaries (AppImage, deb, rpm, snap, nsis, dmg).

## Projektstruktur

```text
oidarwave/
├── docs/                   # Projektdokumentation (dieser Ordner)
├── electron/               # Electron-spezifischer Code
│   ├── main.js             # Haupteinstiegspunkt für Electron, Fenster-Management & IPC
│   └── preload.js          # Preload-Skript für sichere IPC-Kommunikation
├── favicon/                # Icons für verschiedene Betriebssysteme (.ico, .icns, .svg)
├── src/                    # Frontend-Quellcode
│   ├── css/                # Stylesheets (style.css)
│   └── js/                 # Client-seitige Logik (player.js, history.js, notification.js, mouse.js, etc.)
├── index.html              # Haupt-Benutzeroberfläche (Radio-Player)
├── package.json            # Projektkonfiguration und Abhängigkeiten
└── manifest.json           # PWA-ähnliches Web-Manifest
```

## Installation & Setup

### Voraussetzungen
- **Node.js** (Empfohlen: v18+ oder v20+)
- **npm** (wird meistens mit Node.js installiert)
- **Redis-Server** (Lokal installiert und laufend, wenn die Historien-Synchronisation getestet werden soll)

### Schritte zur Einrichtung
1. **Repository klonen** (oder den Quellordner öffnen)
2. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```
3. **Applikation starten (Development)**:
   ```bash
   npm start
   ```
   *Dadurch wird Electron gestartet und das Hauptfenster geöffnet.*

## Build-Prozess

Das Projekt nutzt `electron-builder` für die Erstellung von Distributionspaketen. Es existieren verschiedene NPM-Skripte für die jeweiligen Plattformen.

- **Alle Plattformen bauen (Linux, Windows, Mac):**
  ```bash
  npm run dist
  ```
- **Nur für Windows bauen (.exe / .zip / NSIS):**
  ```bash
  npm run dist:win
  ```
- **Nur für Linux bauen (.AppImage, .deb, .tar.gz, .rpm, .snap):**
  ```bash
  npm run dist:linux
  ```
- **Nur für macOS bauen (.dmg):**
  ```bash
  npm run dist:mac
  ```

Die fertig gebauten Pakete werden standardmäßig im Ordner `dist/` abgelegt.

## Architektur & Kernkomponenten

### Routing (Electron Main Process)
Die Datei `electron/main.js` steuert das Laden von Unterseiten (z. B. `/video`, `/impressum`) und fängt die Web-Navigation ab (`will-navigate`). Es wird ein dynamischer Seitenbaum generiert (`discoverPages`), um lokale Dateipfade schnell den passenden Routen zuzuordnen und 404-Fehler zu vermeiden. Externe URLs (http/https) werden sicher im Standardbrowser des Betriebssystems geöffnet (`shell.openExternal`).

### Redis-Integration
Beim Start der Applikation (`app.whenReady`) wird versucht, eine Verbindung zu einer lokalen Redis-Instanz herzustellen (`initRedis`).
- Über die Inter-Process Communication (IPC) (`history-get`, `history-save`) kann das Frontend (Renderer Process) die zuletzt gehörten Sender in Redis speichern oder von dort laden.
- Falls Redis nicht erreichbar ist, wird der Fehler intern abgefangen und die App läuft fehlerfrei weiter (als Fallback wird auf Client-Seite meist LocalStorage oder SessionStorage genutzt).

### Audiowiedergabe
Das Herzstück der Anwendung ist der HTML5 `<audio>` Player in der `index.html`. 
Über JavaScript (`src/js/player.js`) werden die Stream-URLs der öffentlich-rechtlichen Sender in den Player geladen und abgespielt. Parallele Skripte (`history.js`) loggen dabei die Aktivität mit.
