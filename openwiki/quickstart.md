---
type: "Overview"
title: "Oidarwave"
description: "Minimalistisches und werbefreies Webradio für Desktop und Browser."
tags: ["radio", "web", "html5", "privatsphäre"]
---

# 🎵 Oidarwave

**Oidarwave** ist ein minimalistisches und werbefreies Webradio, das ein reibungsloses Hörerlebnis direkt im Browser ermöglicht. Das Projekt wurde mit dem Ziel entwickelt, eine einfache und ablenkungsfreie Möglichkeit zu bieten, eine handverlesene Auswahl deutscher Radiosender und Fernsehprogramme zu hören und zu sehen.

Durch die Nutzung moderner Browser-APIs, einer schlanken Architektur und der strikten Fokussierung auf Privatsphäre bietet Oidarwave eine Alternative zu kommerziellen Streaming-Plattformen.

## Hauptfunktionen

- **HTML5-Audio & -Video:** Abruf und Wiedergabe von Audio- und Videoinhalten über HTTPS.
- **HLS-Unterstützung:** Wiedergabe von HTTP Live Streaming (HLS) Inhalten mittels `hls.js`.
- **Echtzeit-Statusanzeige:** Visuelle Indikatoren für den Wiedergabe- und Verbindungsstatus.
- **Lokale Speicherung:** Einstellungen werden im `localStorage` gespeichert; keine persistenten Cookies für Tracking.
- **Verlauf:** Lokaler Wiedergabeverlauf, exportierbar als JSON.

## Architektur-Hinweise

Oidarwave ist eine **statische Webseite**, die keine serverseitige Installation erfordert.

*   **Kern:** `index.html` und zugehörige JS-Module.
*   **Wiedergabe:** Integration von `hls.js` für HLS-Streams.
*   **Identifikation:** Implementierung von UUIDs zur Identifikation und Datenmigration (siehe `src/js/uuid.js`).
*   **Datenschutz:** DSGVO-konformes Design ohne Tracking-Cookies.

## Weitere Informationen

Weitere Details zur Konfiguration, Entwicklung und technologischen Basis finden Sie in der [README.md](/README.md).
