# 🎵 Oidarwave

![Project Status](https://img.shields.io/badge/Status-Aktive-brightgreen)
[![Datenschutz](https://img.shields.io/badge/Datenschutz-DSGVO--konform-blue)](#-datenschutz)
## 📖 Inhaltsverzeichnis

- [Über das Projekt](#-über-das-projekt)
- [Hauptfunktionen](#-hauptfunktionen)
- [Verfügbare Streams](#-verfügbare-streams)
- [Technologien](#-technologien)
- [Installation und Nutzung](#-installation-und-nutzung)
- [Mitwirken](#-mitwirken)
- [Datenschutz](#-datenschutz)
- [Roadmap](#-roadmap)

## 🚀 Über das Projekt

**Oidarwave** ist ein **minimalistisches und benutzerfreundliches Webradio**, das ein reibungsloses Hörerlebnis direkt im Browser bietet. Es wurde speziell entwickelt, um eine ablenkungsfreie und schnelle Möglichkeit zu schaffen, eine handverlesene Auswahl deutscher Radiosender zu hören. Das Projekt nutzt native Browser-APIs, um eine hohe Performance und Werbefreiheit zu gewährleisten.

## ✨ Hauptfunktionen

- **HTML5-Audio**: Nutzt die native Browser-API für zuverlässige Audiowiedergabe ohne externe Abhängigkeiten.
- **HTML5-Wiedergabe**: Verwendet die native HTML5-Video-API für effiziente Wiedergabe.
- **HLS-Unterstützung**: Die Integration der JavaScript-Bibliothek **hls.js** ermöglicht das Abspielen von HTTP Live Streaming (HLS)-Streams in kompatiblen Browsern.
- **Vielfältige Senderauswahl**: Eine sorgfältig kuratierte Liste beliebter deutscher Radiosender.
- **Echtzeit-Statusanzeige**: Visuelle Indikatoren informieren den Nutzer sofort über den aktuellen Verbindungs- und Wiedergabestatus.

## 📻 Verfügbare Streams

Radio:

| Sender |
| :--- |
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

Fernesehstream:

| Sender |
| :--- |
| **ZDF** |

## 💻 Technologien

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Video-Streaming**: `hls.js` für HLS-Streams
- **Hosting**: Vercel

## 🛡️ Datenschutz

Oidarwave ist so entwickelt, dass es die Privatsphäre der Nutzer respektiert und den **EU-Richtlinien** sowie der **DSGVO** entspricht.

* **Keine Tracking-Cookies**: Das Projekt verwendet keine persistenten Cookies zur Verfolgung von Nutzeraktivitäten.
* **Lokale Speicherung**: Einstellungen wie die Einwilligung zur Nutzung von Diensten (wie Vercel Analytics) werden lokal im Browser des Nutzers (`localStorage`) gespeichert, um die Privatsphäre zu wahren.
* **Transparente Einwilligung**: Der Nutzer hat die volle Kontrolle über die Datenfreigabe. Externe Skripte (z.B. für Web-Analytics) werden nur mit expliziter Zustimmung des Nutzers geladen.

## 🛠️ Installation und Nutzung

Da Oidarwave eine **statische Webseite** ist, benötigst du keine serverseitige Installation. Folge einfach diesen Schritten, um das Projekt lokal auszuführen:

1.  **Repository klonen**: Öffne dein Terminal oder deine Eingabeaufforderung und führe den folgenden Befehl aus:
    `git clone https://github.com/marianwolf/oidarwave.git`
2.  **Dateien öffnen**: Navigiere in das neu geklonte Verzeichnis und öffne die Datei `index.html` in deinem bevorzugten Webbrowser.

Alternativ kannst du die Live-Version unter folgender URL nutzen:
[https://oidarwave.vercel.app](https://oidarwave.vercel.app)

## 🤝 Mitwirken

Beiträge sind jederzeit willkommen! Ob es sich um Fehlerberichte, Funktionsvorschläge oder Code-Verbesserungen handelt, zögere nicht, uns zu kontaktieren.

1.  **Melde Fehler**: Erstelle ein [Issue](https://github.com/marianwolf/oidarwave/issues) im GitHub-Repository.
2.  **Schlage Funktionen vor**: Nutze ebenfalls die [Issues](https://github.com/marianwolf/oidarwave/issues), um neue Funktionen zu besprechen.
3.  **Trage Code bei**: Sende einen [Pull Request](https://github.com/marianwolf/oidarwave/pulls) mit deinen Änderungen. Bitte achte darauf, dass dein Code den Projektstandards entspricht.

## 🚀 Roadmap

- [ ] Hinzufügen einer Suche nach Sendern
- [ ] Implementierung eines Lautstärkereglers in der UI
- [ ] Speichern des zuletzt gehörten Senders im Local Storage
- [ ] Integration weiterer Sender
- [ ] Dunkel- und Hellmodus-Umschaltung