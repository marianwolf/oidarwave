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

### Radio

| Sender | Livestream | Metadaten |
| :--- | :--- | :--- |
| Deutschlandfunk | [Livestream](https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3) | [Metadaten](https://streamtext.dradio.de/dlf.txt) |
| Deutschlandfunk Nova [Livestream](https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3) | [Metadaten](https://static.deutschlandfunknova.de/actions/dradio/playlist/onair) |
| NDR 1 | [Livestream](https://d111.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3?aggregator=web&cid=01FCT9XYE3C7Y8087XEWPRC38Z&sid=33NXhseb5oHwfjK6NHAldb5dMgN&token=oaVqfQAjBSBToKJNS0DrFtMh4OeDJGHYfczkunm_CWg&tvf=eA1xTBjdaRhkMTExLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndr1niedersachsen.json) |
| NDR 2 | [Livestream](https://f141.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2CWDYWJHGF4QAJ0SVV730&sid=33NXpq4dEQb6nqCK3SJ4FI2VvIC&token=FvKj5SFnjo1RlN6lFFQMJAE1pbqyhvLnCwSQNC1kDA4&tvf=6_sc7CbdaRhmMTQxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndr2.json) |
| NDR Info | [Livestream](https://d131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBRKHKTB73QDVNX7A9RT082R&sid=33NY0rtXgJU4RS7ccOohYbATCzl&token=yOhIicasTcfAAplTmaK336FvLk8Ix75Z5eJsIZNxIg4&tvf=k11WQTvdaRhkMTMxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/epg/current/station-ndrinfo) |
| NDR Kultur | [Livestream](https://f111.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2EJ6T7QK3WENQ5KT9S2FB&sid=33NXuzuR35IV1v0HyoF9kmpkOrj&token=1lWHiBTgvXl5e6QzGMVNpjhCgIfCbnTNnCVdB-_ZNF0&tvf=DvL_VjDdaRhmMTExLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndrkultur.json) |
| N-JOY | [Livestream](https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3?aggregator=web&cid=01FBRKKTM6TVGA3B3W6Y8NMXK8&sid=30azMobKXI3x91RNnGaf7v0Jpbl&token=VvAbuddXUjbU602noIVp6b7CQBEikUS280qPiNmxABM&tvf=i4pneZkcVxhmMTIxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/njoy.json) |
| 80s80s NDS | [Livestream](https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667) | [Metadaten](https://iris-80s80s.loverad.io/flow.json?station=62) |
| 90s90s | [Livestream](https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761) | [Metadaten]() |

### Fernsehstream

| Sender |
| :--- |
| ZDF |

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

  - [x] Speichern des zuletzt gehörten Senders im `localStorage` (0.9.3)
  - [x] Wiedergabe von Metadaten (0.9.4)
  - [x] Verkürze die Latenz zum Datensparmodus (0.9.5)
  - [x] neues Design (0.9.6)
  - [ ] Integration weiterer Sender
  - [ ] Umschaltung zwischen Dunkel- und Hellmodus
  - [ ] Favoriten und Verlauf
  - [ ] Nutzerprofile