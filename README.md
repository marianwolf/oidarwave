# 🎵 Oidarwave

![Project Status](https://img.shields.io/badge/Status-Aktiv-brightgreen)
![Datenschutz](https://img.shields.io/badge/Datenschutz-DSGVO--konform-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/Version-0.9.15-blue)

<div align="center">
  <p>
    <strong>Oidarwave</strong> ist ein minimalistisches und werbefreies Webradio für Desktop und Browser — elegant, schnell und respektvoll mit deiner Privatsphäre.
  </p>
  <p>
    <a href="https://oidarwave.vercel.app"><strong>🎧 Live Demo</strong></a> ·
    <a href="#️-installation-und-nutzung"><strong>📖 Dokumentation</strong></a> ·
    <a href="https://github.com/marianwolf/oidarwave/issues"><strong>❓ Issues</strong></a>
  </p>
</div>

<br/>

## 📖 Inhaltsverzeichnis

- [🏠 Über das Projekt](#-über-das-projekt)
- [✨ Hauptfunktionen](#-hauptfunktionen)
- [🎧 Verfügbare Streams](#-verfügbare-streams)
  - [📻 Radio](#-radio)
  - [📺 Fernsehen](#fernsehen)
- [🔧 Technologien](#-technologien)
- [💾 Installation und Nutzung](#-installation-und-nutzung)
- [🤝 Mitwirken](#-mitwirken)
- [🔐 Datenschutz](#️-datenschutz)
- [📊 Roadmap](#-roadmap)

## 🚀 Über das Projekt

**Oidarwave** ist ein minimalistisches und werbefreies Webradio, das ein reibungsloses Hörerlebnis direkt im Browser ermöglicht. Das Projekt wurde mit dem Ziel entwickelt, eine einfache und ablenkungsfreie Möglichkeit zu bieten, eine handverlesene Auswahl deutscher Radiosender und Fernsehprogramme zu hören und zu sehen.

Durch die Nutzung moderner Browser-APIs, einer schlanken Architektur und der strikten Fokussierung auf Privatsphäre bietet Oidarwave eine Alternative zu kommerziellen Streaming-Plattformen — **ohne Tracking, ohne Werbung, ohne Kompromisse**.

## ✨ Hauptfunktionen

  - **HTML5-Audio & -Video:** Die Anwendung nutzt `https`-Adressen, um Audio- und Videoinhalte abzurufen und wiederzugeben.
  - **HLS-Unterstützung:** `hls.js` ermöglicht die Wiedergabe von HTTP Live Streaming (HLS) Inhalten in kompatiblen Webbrowsern.
  - **Echtzeit-Statusanzeige:** Visuelle Indikatoren informieren sofort über den aktuellen Wiedergabe- und Verbindungsstatus.
  - **Live-TV Streams:** Unterstützung für öffentlich-rechtliche deutsche Fernsehsender.
  - **Verlauf & Download:** Wiedergabeverlauf wird lokal gespeichert und kann als JSON heruntergeladen werden.
  - **Hosting:** Dieses Projekt wird auf Vercel gehostet.

## 📻 Verfügbare Streams

### Radio

| Sender | Livestream | Metadaten |
| :--- | :--- | :--- |
| Deutschlandfunk | [Livestream](https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3) | [Metadaten](https://streamtext.dradio.de/dlf.txt) |
| Deutschlandfunk Nova | [Livestream](https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3) | [Metadaten](https://static.deutschlandfunknova.de/actions/dradio/playlist/onair) |
| NDR 1 | [Livestream](https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3?aggregator=web&cid=01FCT9XYE3C7Y8087XEWPRC38Z&sid=30aynlfxURrCQmDeTH1p0OqVsoV&token=3Wf1JnFUByNruoizm4AdR_YPX5_CvsRtTKXV3VK-004&tvf=qhyw4VgcVxhmMTIxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndr1niedersachsen.json) |
| NDR 2 | [Livestream](https://f131.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2CWDYWJHGF4QAJ0SVV730&sid=30ayvsXjJydzMH4MNiWpLV4nURH&token=FMhlmkJlc2prmQ6CBBjpYxFSaNHq6IDWPQKR9jRDjMA&tvf=0axLwWccVxhmMTMxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndr2.json) |
| NDR Info | [Livestream](https://f131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBRKHKTB73QDVNX7A9RT082R&sid=30az5c4cyuUHsy4tHS3YkD5oDcc&token=Z-H6aIgEFsx5kBPmtfq5x2UNGGmMOtyjcoYox9RHg2E&tvf=np8tvHkcVxhmMTMxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/epg/current/station-ndrinfo) |
| NDR Kultur | [Livestream](https://d141.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2EJ6T7QK3WENQ5KT9S2FB&sid=30azBxZOH15ri7EofrRpS1t3RXT&token=T_eVqj_rP6Bkb57di3056sjieytJKHDUnaT86DKLi-o&tvf=P4FiYIUcVxhkMTQxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndrkultur.json) |
| N-JOY | [Livestream](https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3?aggregator=web&cid=01FBRKKTM6TVGA3B3W6Y8NMXK8&sid=30azMobKXI3x91RNnGaf7v0Jpbl&token=VvAbuddXUjbU602noIVp6b7CQBEikUS280qPiNmxABM&tvf=i4pneZkcVxhmMTIxLnJuZGZuay5jb20) | [Metadaten](https://www.ndr.de/public/radioplaylists/njoy.json) |
| 80s80s | [Livestream](https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667) | [Metadaten](https://iris-80s80s.loverad.io/flow.json?station=62) |
| 90s90s | [Livestream](https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761) | - |
| BBG Radio | [Livestream](https://radio.bbg-bew.de) | - |

### Fernsehen

| Sender | Livestream |
| :--- | :--- |
| Das Erste | [Livestream](https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8) |
| ZDF | [Livestream](https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8) |
| ARTE | [Livestream](https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8) |
| Tagesschau24 | [Livestream](https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8) |

## 🛡️ Datenschutz

Oidarwave wurde von Grund auf so konzipiert, dass es die Privatsphäre der Nutzer respektiert und den **EU-Richtlinien** sowie der **DSGVO** entspricht.

  - **Keine Tracking-Cookies:** Das Projekt verwendet keine persistenten Cookies zur Verfolgung von Nutzeraktivitäten.
  - **Lokale Speicherung:** Einstellungen werden lokal im Browser (`localStorage`) gespeichert, was die Privatsphäre der Nutzer schützt. Diese Daten werden gespeichert:
    | Attribut | Wert |
    | :--- | :--- |
    | Cookie | `ja` od. `nein` |
    | Cookie-Datum | `Datum` |
    | Letzer Radiosender | `URL` |
    | Letzer Fernsehsender | `URL` |
    | Datensparmodus | `ja` od. `nein` |
  - **Transparente Einwilligung:** Externe Skripte (wie z. B. für Web-Analytics) werden nur mit Ihrer expliziten Zustimmung geladen, sodass Sie stets die volle Kontrolle über Ihre Daten haben.

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