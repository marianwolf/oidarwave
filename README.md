# 🎵 Oidarwave

![Project Status](https://img.shields.io/badge/Status-Aktive-brightgreen)
![Datenschutz](https://img.shields.io/badge/Datenschutz-DSGVO--konform-blue)

## 📖 Inhaltsverzeichnis

- [Über das Projekt](#-über-das-projekt)
- [Hauptfunktionen](#-hauptfunktionen)
- [Verfügbare Streams](#-verfügbare-streams)
- [Technologien](#-technologien)
- [Installation und Nutzung](#️-installation-und-nutzung)
- [Mitwirken](#-mitwirken)
- [Datenschutz](#️-datenschutz)
- [Roadmap](#-roadmap)

## 🚀 Über das Projekt

**Oidarwave** ist ein **minimalistisches und werbefreies Webradio**, das ein reibungsloses Hörerlebnis direkt im Browser ermöglicht. Das Projekt wurde mit dem Ziel entwickelt, eine einfache und ablenkungsfreie Möglichkeit zu bieten, eine handverlesene Auswahl deutscher Radiosender zu hören. Durch die Nutzung nativer Browser-APIs wird eine hohe Performance und ein schlankes Design gewährleistet.

## ✨ Hauptfunktionen

  - **HTML5-Audio & -Video:** Nutzt native Browser-APIs für eine zuverlässige Audio- und Videowiedergabe, komplett ohne externe Abhängigkeiten.
  - **HLS-Unterstützung:** Dank der **`hls.js`**-Bibliothek können auch HTTP Live Streaming (HLS)-Streams problemlos in kompatiblen Browsern abgespielt werden.
  - **Sorgfältige Senderauswahl:** Eine handverlesene Liste beliebter deutscher Radio- und Fernsehsender.
  - **Echtzeit-Statusanzeige:** Visuelle Indikatoren informieren sofort über den aktuellen Wiedergabe- und Verbindungsstatus.

## 📻 Verfügbare Streams

#### Radio

| Sender |
| **Deutschlandfunk** |
| **Deutschlandfunk Kultur** |
| **Deutschlandfunk Nova** |
| **NDR 1** |
| **NDR 2** |
| **NDR Info** |
| **NDR Kultur** |
| **N-JOY** |
| **80s80s NDS** |
| **90s90s** |

#### Fernsehstream

| Sender |
| **ZDF** |

## 💻 Technologien

  - **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS)
  - **Video-Streaming:** `hls.js` für HLS-Streams
  - **Hosting:** Vercel

## 🛡️ Datenschutz

Oidarwave wurde von Grund auf so konzipiert, dass es die Privatsphäre der Nutzer respektiert und den **EU-Richtlinien** sowie der **DSGVO** entspricht.

  - **Keine Tracking-Cookies:** Das Projekt verwendet keine persistenten Cookies zur Verfolgung von Nutzeraktivitäten.
  - **Lokale Speicherung:** Einstellungen (z. B. die Zustimmung zur Nutzung von Vercel Analytics) werden lokal im Browser (`localStorage`) gespeichert, was die Privatsphäre der Nutzer schützt.
  - **Transparente Einwilligung:** Externe Skripte (wie z. B. für Web-Analytics) werden nur mit Ihrer expliziten Zustimmung geladen, sodass Sie stets die volle Kontrolle über Ihre Daten haben.

## 🛠️ Installation und Nutzung

Da Oidarwave eine **statische Webseite** ist, ist keine serverseitige Installation erforderlich.

1.  **Repository klonen:** Öffne dein Terminal und führe folgenden Befehl aus:
 ```bash
git clone https://github.com/marianwolf/oidarwave.git
```
2.  **Datei öffnen:** Navigiere in das neu geklonte Verzeichnis und öffne die `index.html`-Datei in deinem bevorzugten Webbrowser.

Alternativ kannst du die Live-Version jederzeit hier nutzen:
[https://oidarwave.vercel.app](https://oidarwave.vercel.app)

## 🤝 Mitwirken

Beiträge sind jederzeit willkommen\! Ob es sich um Fehlerberichte, Funktionsvorschläge oder Code-Verbesserungen handelt, wir freuen uns über deine Beteiligung.

1.  **Fehler melden:** Erstelle ein [Issue](https://github.com/marianwolf/oidarwave/issues) im GitHub-Repository.
2.  **Funktionen vorschlagen:** Nutze ebenfalls die [Issues](https://github.com/marianwolf/oidarwave/issues), um neue Ideen zu diskutieren.
3.  **Code beitragen:** Sende einen [Pull Request](https://github.com/marianwolf/oidarwave/pulls) mit deinen Änderungen. Bitte beachte, dass dein Code den Projektstandards entspricht.

## 🚀 Roadmap

  - [ ] Hinzufügen einer Suchfunktion für Sender
  - [ ] Implementierung eines Lautstärkereglers in der Benutzeroberfläche
  - [ ] Speichern des zuletzt gehörten Senders im `localStorage`
  - [ ] Integration weiterer Sender
  - [ ] Umschaltung zwischen Dunkel- und Hellmodus
