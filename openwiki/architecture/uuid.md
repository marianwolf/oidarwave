---
type: "Technical Guide"
title: "UUID-based Identification"
description: "Implementation of UUID generation for user identification and data migration."
tags: ["core", "uuid", "security", "data"]
---

# UUID-based Identification

Die Implementierung von UUIDs ermöglicht eine eindeutige Identifikation des Clients und unterstützt die Datenmigration zwischen verschiedenen Sitzungen oder Versionen.

## Funktionsweise

Die Datei `src/js/uuid.js` stellt die Funktion `generateUUID()` bereit, welche:

1.  **Browser-Kryptografie nutzt:** Versucht `crypto.getRandomValues` zu verwenden, falls verfügbar, für eine kryptografisch sichere UUID-Generierung (Version 4).
2.  **Fallback-Mechanismus:** Nutzt `Math.random()` als Rückfall, falls `crypto` nicht verfügbar ist, um eine Pseudo-UUID zu generieren.
3.  **Formatierung:** Stellt das standardmäßige UUID-Format (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`) sicher.

Diese Identifikatoren werden für die Konsistenz der lokalen Sitzungsdaten (z. B. `localStorage`) verwendet.
