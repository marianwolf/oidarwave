# 🎵 Oidarwave

![Project Status](https://img.shields.io/badge/Status-Aktiv-brightgreen)
![Datenschutz](https://img.shields.io/badge/Datenschutz-DSGVO--konform-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/Version-0.9.16-blue)

<div align="center">
  <p>
    <strong>Oidarwave</strong> ist ein minimalistisches und werbefreies Webradio für Desktop und Browser — elegant, schnell und respektvoll mit deiner Privatsphäre.
  </p>
  <p>
    <a href="https://oidarwave.vercel.app"><strong>🎧 Live Demo</strong></a> ·
    <a href="/openwiki/quickstart.md"><strong>📖 Dokumentation</strong></a> ·
    <a href="https://github.com/marianwolf/oidarwave/issues"><strong>❓ Issues</strong></a>
  </p>
</div>

<br/>

## 📖 Inhaltsverzeichnis

- [🏠 Über das Projekt](#-über-das-projekt)
- [💾 Installation und Nutzung](#--installation-und-nutzung)
- [🤝 Mitwirken](#-mitwirken)
- [🚀 Roadmap](#-roadmap)

## 🏠 Über das Projekt

**Oidarwave** ist ein minimalistisches und werbefreies Webradio, das ein reibungsloses Hörerlebnis direkt im Browser ermöglicht. Das Projekt wurde mit dem Ziel entwickelt, eine einfache und ablenkungsfreie Möglichkeit zu bieten, eine handverlesene Auswahl deutscher Radiosender und Fernsehprogramme zu hören und zu sehen.

Durch die Nutzung moderner Browser-APIs, einer schlanken Architektur und der strikten Fokussierung auf Privatsphäre bietet Oidarwave eine Alternative zu kommerziellen Streaming-Plattformen — **ohne Tracking, ohne Werbung, ohne Kompromisse**.

## 💾 Installation und Nutzung

Da Oidarwave eine **statische Webseite** ist, ist keine serverseitige Installation erforderlich.

1.  **Repository klonen:** Öffne dein Terminal und führe folgenden Befehl aus:
```bash
git clone https://github.com/marianwolf/oidarwave.git
```
2.  **Datei öffnen:** Navigiere in das neu geklonte Verzeichnis und öffne die `index.html`-Datei in deinem bevorzugten Webbrowser. Alternativ kannst du die Live-Version jederzeit hier nutzen:
[https://oidarwave.vercel.app](https://oidarwave.vercel.app)

3. Entwicklung & Tests

Für die Ausführung der Tests ist eine Python-Virtuelle Umgebung erforderlich:

```bash
# Virtuelle Umgebung erstellen und Abhängigkeiten installieren
python3 -m venv .venv
source .venv/bin/activate  # Auf Windows: .venv\Scripts\activate
pip install playwright pytest
playwright install chromium
```

4. Tests ausführen (z.B.):
```bash
python tests/test_syntax.py
```

## 🤝 Mitwirken

Beiträge sind jederzeit willkommen\! Ob es sich um Fehlerberichte, Funktionsvorschläge oder Code-Verbesserungen handelt, wir freuen uns über deine Beteiligung.

1.  **Fehler melden:** Erstelle ein [Issue](https://github.com/marianwolf/oidarwave/issues) im GitHub-Repository.
2.  **Funktionen vorschlagen:** Nutze ebenfalls die [Issues](https://github.com/marianwolf/oidarwave/issues), um neue Ideen zu diskutieren.
3.  **Code beitragen:** Sende einen [Pull Request](https://github.com/marianwolf/oidarwave/pulls) mit deinen Änderungen. Bitte beachte, dass dein Code den Projektstandards entspricht.

## 🚀 Roadmap

  - [x] Speichern des zuletzt gehörten Senders im `localStorage` (0.9.3)
  - [x] Wiedergabe von Metadaten (0.9.4)
  - [x] Verkürze die Latenz zum Datensparmodus (0.9.5)
  - [x] neues Design (0.9.6)
  - [x] verbessertes Design und Video Vor- und Rückspulen (0.9.7)
  - [x] Verlauf im `localStorage` als `.json` (0.9.8)
  - [x] Download des Verlaufs mit `Ctrl + S` (0.9.9)
  - [x] Erweiterte Video-Fehlerdiagnose, PWA-Vorbereitung (0.9.10)
  - [x] PWA, Design Optimierung, Download mit `Ctrl + S` gefixt (0.9.11)
  - [x] Wiedergabeanzeige (0.9.12)
  - [x] Aktualisierung des Design-Systems und Verbesserung der JavaScript-Fehlerbehandlung (0.9.13)
  - [x] Elektron Build und npm (0.9.14)
  - [x] Entwicklerdokumentation, Elektron Fehlerbehebungen und Renovate Bot (0.9.15)
  - [ ] Integration weiterer Sender
  - [ ] Umschaltung zwischen Dunkel- und Hellmodus
  - [ ] Favoriten
  - [ ] Nutzerprofile