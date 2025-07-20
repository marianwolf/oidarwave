# 🎵 Oidarwave

Ein moderner, barrierefreier Webradio-Player mit österreichischem Flair. Entwickelt als Progressive Web App (PWA) für optimale Benutzerfreundlichkeit und Offline-Funktionalität.

## 🚀 Features

- **Moderne PWA**: Installierbar auf Desktop und Mobile
- **Offline-Support**: Grundfunktionen auch ohne Internet verfügbar
- **Barrierefreiheit**: WCAG 2.1 konform
- **Dark/Light Mode**: Automatische Anpassung ans System
- **Responsive Design**: Optimiert für alle Bildschirmgrößen
- **Performance**: Optimierte Ladezeiten und Caching
- **Share Target API**: Teilen von Radio-Links
- **Protocol Handler**: Unterstützung für `web+radio` Schema

## 🛠 Technologie-Stack

- Vanilla JavaScript
- CSS Custom Properties
- Service Workers
- IndexedDB
- Web Share Target API
- Media Session API

## 📡 Unterstützte Radiosender

- Radio Paradise
- BBG
- Deutschlandfunk
- NDR (verschiedene Kanäle)
- 80s80s NDS

## 🚦 Erste Schritte

1. **Repository klonen**
   ```bash
   git clone https://github.com/marianwolf/oidarwave.git
   cd oidarwave
   ```

2. **Lokalen Server starten**
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve`
   - PHP: `php -S localhost:8000`

3. **Im Browser öffnen**
   ```
   http://localhost:8000
   ```

## 💻 Entwicklung

### Verzeichnisstruktur
```
oidarwave/
├── images/         # Bilder und Icons
├── icons/          # PWA Icons
├── share-target/   # Share Target Handler
├── index.html      # Hauptseite
├── style.css       # Hauptstylesheet
├── animations.css  # Animationen
├── script.js       # Hauptskript
└── service-worker.js # PWA Service Worker
```

### Service Worker
Der Service Worker bietet:
- Offline-Funktionalität
- Cache-Management
- Push-Benachrichtigungen
- Background Sync

## 🔒 Datenschutz

- Keine Tracking-Cookies
- Keine persönlichen Daten gespeichert
- Lokale Datenspeicherung nur für Favoriten
- Transparente Datenverarbeitung

## 🌍 Internationalisierung

- Deutsch (Standard)
- Englisch (geplant)
- Österreichisches Deutsch (geplant)

## 📱 PWA Installation

1. Website besuchen
2. Auf "Installieren" klicken oder
3. Über Browser-Menü "Zum Startbildschirm hinzufügen"

## 🤝 Beitragen

1. Fork erstellen
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 👏 Danksagung

- Alle Radiosender für ihre öffentlichen Streams
- Open Source Community für Inspirationen
- Alle Mitwirkenden und Tester

---

Erstellt mit ❤️ in Österreich
