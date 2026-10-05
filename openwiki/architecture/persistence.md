---
type: concept
title: Persistence Layer
description: How user settings, station history, download history, and favorites are stored using cookies and localStorage.
tags: [persistence, localStorage, storage, architecture]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-f5dd57353d17e5dc5ea58a83
    resource: repo://src/js/cookie.js
  - id: openwiki-source-859a83c9cf83489fefa6211b
    resource: repo://src/js/download_history.js
  - id: openwiki-source-a80062abdd97e46786956059
    resource: repo://src/js/favorite.js
  - id: openwiki-source-cd156ee2be7a00377eeb8dbd
    resource: repo://src/js/history.js
  - id: openwiki-source-5075466bdfaa02292418b17e
    resource: repo://src/js/uuid.js
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

# Persistence Layer

This document describes how user data is persisted in the browser using `localStorage` and cookies. The system stores:
- Cookie consent preferences
- Station playback history
- User favorites and preferences
- Download history functionality

## Overview

All persistent user data is stored in `localStorage` with specific keys for each data type. Cookie consent is managed via a banner but the actual consent value is stored in `localStorage`. No user data is stored in cookies.

## Cookie Consent

**File:** `src/js/cookie.js`

Cookie consent is stored in `localStorage` using two keys:
- `cookieConsent`: Stores the consent value (`'true'` or `'false'`)
- `consentTimestamp`: Timestamp when consent was given

Consent expires after 90 days. When expired, both values are removed from `localStorage`, causing the consent banner to reappear.

### Responsibilities
- Store user's cookie consent decision
- Automatically expire consent after 90 days
- Control loading of tracking scripts based on consent

### Mechanism
```javascript
// Setting consent
localStorage.setItem('cookieConsent', consentValue);
localStorage.setItem('consentTimestamp', Date.now());

// Checking expiration
const timestamp = localStorage.getItem('consentTimestamp');
if (timestamp && Date.now() - timestamp > (90 * 24 * 60 * 60 * 1000)) {
    localStorage.removeItem('cookieConsent');
    localStorage.removeItem('consentTimestamp');
}
```

## Station History

**File:** `src/js/history.js`

Station playback history is stored under the key `station_history`. The data structure has evolved from an old format (URL-as-key) to a new format (UUID-as-key) with migration handled on load.

### Data Structure
```javascript
{
    stations: {
        [uuid]: {
            url: string,
            name: string,
            sessions: [{ start: number, end: number | null }],
            favicon: string | undefined
        }
    },
    activeStationUrl: string | null
}
```

### Responsibilities
- Track when stations are played and for how long
- Maintain playback sessions (start/end timestamps)
- Automatically prune entries older than 90 days
- Provide access to recently played stations
- Migrate legacy data formats

### Mechanism
- History is loaded into memory cache on initialization
- New sessions are added when a station starts playing
- Sessions are finalized when switching stations or stopping playback
- Pruning removes expired sessions and stations with no recent activity
- Changes are persisted to `localStorage` via `JSON.stringify`

## Download History

**File:** `src/js/download_history.js`

Provides functionality to download the station history as a JSON file. Activated via Ctrl+S keyboard shortcut.

### Responsibilities
- Export station history data for user backup
- Generate filename with timestamp
- Handle binary data via Blob API

### Mechanism
```javascript
const rawData = localStorage.getItem('station_history');
const blob = new Blob([rawData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Create and trigger download link
```

## Favorites and Preferences

**File:** `src/js/favorite.js`

User favorites and preferences are stored under the key `user_favorites`. The system separates favorites (bookmarked stations) from preferences (derived settings).

### Data Structure
```javascript
{
    version: number,
    favorites: [
        {
            id: string (UUID),
            name: string,
            data: object,
            addedAt: number (timestamp),
            url: string | undefined
        }
    ],
    preferences: {
        favoriteStation: string | null,
        favoriteStationName: string | null,
        lastPlayedStation: string | null,
        lastPlayedStationName: string | null,
        totalPlayCount: number,
        totalStations: number,
        lastUpdated: number
    }
}
```

### Responsibilities
- Store user-bookmarked stations with metadata
- Derive preferences from playback history (favorite station, last played, totals)
- Provide CRUD operations for favorites
- Allow arbitrary preference key-value storage
- Migrate old favorite formats (URL-as-ID to UUID)

### Mechanism
- Favorites array stores individual bookmarked stations
- Preferences object caches computed values from history
- Lookup maps (ID set and URL map) optimize favorite checks
- Changes trigger immediate `localStorage` update
- Preferences are refreshed from history on demand

## UUID Generation

**File:** `src/js/uuid.js`

Provides universally unique identifiers for history entries and favorites. Uses native `crypto.randomUUID` when available, falls back to implementation using `crypto.getRandomValues`, and finally to a Math.random-based fallback.

## Error Handling

Storage operations are wrapped in try/catch blocks. Errors are logged via:
- `logError()` for general errors
- `logStorageError()` for storage-specific errors

Errors include context such as the storage key and operation type.

## Relationships with Other Systems

- **UI Layer** (`/openwiki/architecture/ui.md`): Consents banner, history display, favorites UI
- **Settings Workflow** (`/openwiki/workflows/settings.md`: Preferences page interacts with favorite manager
- **Playback System**: History module is invoked when stations start/stop

## Extension Points

To add new persistent data types:
1. Choose a unique `localStorage` key
2. Define data structure and versioning strategy
3. Implement load/save functions with error handling
4. Consider migration strategy for format changes
5. Provide API for other modules to interact with the data

## Configuration

- **Expiry Duration**: 90 days for both consent and history (configured via `EXPIRY_DAYS` constants)
- **Storage Keys**: 
  - `cookieConsent`, `consentTimestamp` (cookie.js)
  - `station_history` (history.js, download_history.js)
  - `user_favorites` (favorite.js)

## Implementation Details

- All storage operations use `JSON.parse`/`JSON.stringify`
- Data is loaded asynchronously where appropriate (history module uses promises)
- Synchronous fallbacks exist for older browsers
- Cache invalidation ensures consistency between memory and storage
- Migration functions handle format upgrades transparently
