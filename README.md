# 🎵 Oidarwave

![Project Status](https://img.shields.io/badge/Status-Aktiv-brightgreen)
![Datenschutz](https://img.shields.io/badge/Datenschutz-DSGVO--konform-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📖 Inhaltsverzeichnis

- [Über Oidarwave](#-über-oidarwave)
- [Hauptfunktionen](#-hauptfunktionen)
- [Verfügbare Streams](#-verfügbare-streams)
- [Datenschutz & DSGVO](#️-datenschutz--dsgvo)
- [Installation und Nutzung](#️-installation-und-nutzung)
- [Technologien](#-technologien)
- [Roadmap](#-roadmap)
- [Mitwirken](#-mitwirken)

---

## 🚀 Über Oidarwave

**Oidarwave** ist ein **minimalistisches, werbefreies Webradio** für den Browser. Das Ziel des Projekts ist es, ein reibungsloses und ablenkungsfreies Hörerlebnis durch eine handverlesene Auswahl deutscher Radio- und Fernsehsender zu bieten.

Durch die Nutzung **nativer Browser-APIs** und **schlanken Designs** wird eine hohe Performance gewährleistet. Das Projekt wird auf **Vercel** gehostet.

---

## ✨ Hauptfunktionen

* **Werbefrei & Minimalistisch:** Fokus auf das reine Hörerlebnis ohne Ablenkungen.
* **Hohe Kompatibilität:** Unterstützung von **HTML5-Audio/Video** und **HLS** (`hls.js`) für die Wiedergabe in kompatiblen Browsern.
* **Echtzeit-Statusanzeige:** Visuelle Indikatoren für Wiedergabe-, Verbindungs- und Fehlerstatus.
* **Metadaten-Anzeige:** Anzeige des aktuell gespielten Titels (sofern verfügbar).
* **Datensparmodus:** Option zur Reduzierung der Video-Qualität für eine geringere Datennutzung (Roadmap-Feature).
* **Lokal gespeicherte Einstellungen:** Speicherung des zuletzt gehörten Senders und des Datensparmodus im `localStorage`.

---

## 📻 Verfügbare Streams

### Radio

| Sender | Livestream | Metadaten (Titelanzeige) |
| :--- | :--- | :--- |
| Deutschlandfunk | [Stream](https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3) | [Metadaten](https://streamtext.dradio.de/dlf.txt) |
| Deutschlandfunk Nova | [Stream](https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3) | [Metadaten](https://static.deutschlandfunknova.de/actions/dradio/playlist/onair) |
| NDR 1 | [Stream](https://d111.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3?...) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndr1niedersachsen.json) |
| NDR 2 | [Stream](https://f141.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3?...) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndr2.json) |
| NDR Info | [Stream](https://d131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3?...) | [Metadaten](https://www.ndr.de/epg/current/station-ndrinfo) |
| NDR Kultur | [Stream](https://f111.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3?...) | [Metadaten](https://www.ndr.de/public/radioplaylists/ndrkultur.json) |
| N-JOY | [Stream](https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3?...) | [Metadaten](https://www.ndr.de/public/radioplaylists/njoy.json) |
| 80s80s NDS | [Stream](https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667) | [Metadaten](https://iris-80s80s.loverad.io/flow.json?station=62) |
| 90s90s | [Stream](https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761) | **Nicht verfügbar** |

> **Hinweis:** Aus Platzgründen sind die `Livestream`-URLs in der Tabelle gekürzt.

### Fernsehstream

| Sender |
| :--- |
| peaceholder |

---

## 🛡️ Datenschutz & DSGVO

Oidarwave wurde von Grund auf unter Beachtung des Datenschutzes und in **voller Konformität mit der DSGVO** konzipiert.

* **Keine Tracking-Cookies:** Es werden keine persistenten Cookies zur Verfolgung von Nutzeraktivitäten verwendet.
* **Transparente Einwilligung:** Externe Skripte (z. B. für Web-Analytics von Vercel und Google Analytics, siehe `cookie.js`) werden **nur mit Ihrer expliziten Zustimmung** geladen.
* **Lokale Speicherung:** Nutzerpräferenzen werden **ausschließlich lokal im Browser (`localStorage`)** gespeichert:
    | Attribut | Zweck |
    | :--- | :--- |
    | `cookieConsent` & `consentTimestamp` | Speicherung der Cookie-Einwilligung |
    | `lastStationAudioUrl` / `lastStationVideoUrl` | URL des zuletzt gehörten Senders |
    | `dataSaveMode` | Status des Datensparmodus (Roadmap-Feature) |

---

## 🛠️ Installation und Nutzung

Oidarwave ist eine **statische Webseite**; es ist keine serverseitige Installation erforderlich.

### Live-Nutzung

Die aktuelle Version ist jederzeit hier verfügbar:
[**https://oidarwave.vercel.app**](https://oidarwave.vercel.app)

### Lokale Nutzung

1.  **Repository klonen:**
    ```bash
    git clone [https://github.com/marianwolf/oidarwave.git](https://github.com/marianwolf/oidarwave.git)
    ```
2.  **Datei öffnen:**
    Navigieren Sie in das geklonte Verzeichnis und öffnen Sie die `index.html`-Datei in Ihrem bevorzugten Webbrowser.

---

## 💻 Technologien

* **Frontend:** HTML5, CSS, JavaScript (Vanilla JS)
* **Video-Wiedergabe:** `hls.js` für HLS-Stream-Unterstützung
* **Hosting:** Vercel

---

## 🗺️ Roadmap

**Abgeschlossene Versionen:**

* [x] Speichern des zuletzt gehörten Senders im `localStorage` (0.9.3)
* [x] Wiedergabe von Metadaten (0.9.4)
* [x] Verkürzte Latenz durch Datensparmodus (0.9.5)
* [x] Neues Design (0.9.6)
* [x] Verbessertes Design und Video Vor- und Rückspulen von 10s (0.9.7)

**Geplante Features:**

* [ ] Integration weiterer Sender (Radio und Video)
* [ ] Umschaltung zwischen Dunkel- und Hellmodus (Dark/Light Mode)
* [ ] Favoriten und Wiedergabeverlauf
* [ ] Nutzerprofile (lokal)

---

## 🤝 Mitwirken

Beiträge sind jederzeit willkommen! Wir freuen uns über Fehlerberichte, Funktionsvorschläge oder Code-Verbesserungen.

1.  **Fehler melden:** Erstellen Sie ein [Issue](https://github.com/marianwolf/oidarwave/issues) im GitHub-Repository.
2.  **Funktionen vorschlagen:** Nutzen Sie ebenfalls die [Issues](https://github.com/marianwolf/oidarwave/issues), um neue Ideen zu diskutieren.
3.  **Code beitragen:** Senden Sie einen [Pull Request](https://github.com/marianwolf/oidarwave/pulls) mit Ihren Änderungen. Achten Sie bitte darauf, dass Ihr Code den Projektstandards entspricht.