---
type: architecture
title: Persistence Layer
description: LocalStorage schema and usage for cookie consent, station history, favorites, preferences, data-save mode, and caption settings.
tags: [localStorage, persistence, storage, cookie, history, favorites, preferences]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-f5dd57353d17e5dc5ea58a83
    resource: repo://src/js/cookie.js
  - id: openwiki-source-a80062abdd97e46786956059
    resource: repo://src/js/favorite.js
  - id: openwiki-source-cd156ee2be7a00377eeb8dbd
    resource: repo://src/js/history.js
  - id: openwiki-source-ae0af3fbadd75265cd996542
    resource: repo://src/js/video.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---
# Persistence Layer

This document describes the client-side persistence mechanism using the browser's `localStorage` API. The application stores various user-related data including consent preferences, station history, favorites, user preferences, and media playback settings.

## Overview

The persistence layer centralizes all `localStorage` interactions through dedicated modules:
- `cookie.js`: Manages cookie consent storage and expiration
- `history.js`: Tracks station playback history and sessions
- `favorite.js`: Manages user favorites and derived preferences
- `video.js`: Stores media-related settings (data-save mode, captions)

All modules use explicit keys to avoid collisions and implement error handling for `localStorage` quota exceeded or security errors.

## Storage Keys

| Key | Purpose | Module |
|-----|---------|--------|
| `cookieConsent` | User consent status ('true'/'false') | cookie.js |
| `consentTimestamp` | Timestamp of consent decision | cookie.js |
| `station_history` | Complete station playback history | history.js |
| `user_favorites` | User favorites and preferences | favorite.js |
| `dataSaveMode` | Bandwidth-saving mode toggle | video.js |
| `captionsEnabled` | Caption/subtitle display preference | video.js |

## Cookie Consent

The cookie consent mechanism stores user preferences for tracking scripts and implements automatic expiration after 90 days.

**Storage Structure:**
- `cookieConsent`: String value `'true'` or `'false'`
- `consentTimestamp`: Milliseconds since epoch when consent was recorded

**Key Functions:**
- `setCookieConsent(consent)`: Stores consent value and current timestamp
- `getCookieConsent()`: Retrieves current consent value
- `checkConsentExpiry()`: Removes consent data if older than 90 days
- `showCookieBanner()`: Displays/hides consent banner based on stored value

**Evidence:**
- Cookie keys: `CONSENT_KEY`, `TIMESTAMP_KEY`, `EXPIRY_DAYS` {repo://src/js/cookie.js#L5-L8}
- Consent storage: `setCookieConsent` function {repo://src/js/cookie.js#L10-L17}
- Expiry check: `checkConsentExpiry` function {repo://src/js/cookie.js#L28-L38}
- Banner display logic: `showCookieBanner` function {repo://src/js/cookie.js#L63-L68}

## Station History

The station history module tracks playback sessions for each radio station, including session timestamps and automatic cleanup of old data.

**Storage Structure:**
```javascript
{
  stations: {
    [stationId]: {
      url: string,
      name: string,
      sessions: [{ start: number, end: number|null }],
      favicon: string|null
    }
  },
  activeStationUrl: string|null,
  version: number
}
```

**Key Features:**
- Automatic migration from legacy format (URL-as-key) to UUID-based station IDs
- Session tracking with start/end timestamps
- Automatic pruning of sessions older than 90 days
- Detection of currently active station
- Play count and total duration calculation

**Key Functions:**
- `startStation(url, name, options)`: Begins tracking a station session
- `stopStation(url)`: Ends the current station session
- `getLastStations()`: Returns stations sorted by last played
- `pruneHistory()`: Removes expired sessions and stations

**Evidence:**
- History key: `HISTORY_KEY` {repo://src/js/history.js#L2}
- Station object structure: `historyCache.stations` initialization {repo://src/js/history.js#L6}
- Legacy format detection: `isOldFormat` function {repo://src/js/history.js#L13-L16}
- Migration function: `migrateOldHistory` {repo://src/js/history.js#L18-L33}
- Session management: `startStation` and `stopStation` functions {repo://src/js/history.js#L97-L148}
- History pruning: `pruneHistory` function {repo://src/js/history.js#L150-L209}
- Last stations calculation: `computeLastStations` and `getLastStations` {repo://src/js/history.js#L215-L258}

## Favorites and Preferences

The favorites module manages user bookmarked stations and derives preferences from playback history.

**Storage Structure (user_favorites):**
```javascript
{
  version: number,
  favorites: [{
    id: string (UUID),
    name: string,
    url: string|null,
    data: object,
    addedAt: number
  }],
  preferences: {
    favoriteStation: string|null,
    favoriteStationName: string|null,
    lastPlayedStation: string|null,
    lastPlayedStationName: string|null,
    totalPlayCount: number,
    totalStations: number,
    lastUpdated: number
  }
}
```

**Key Features:**
- UUID-based favorite identification (migrated from URL-based favorites)
- URL deduplication to prevent duplicate favorites
- Preferences automatically derived from station history
- Direct preference setting via API
- Cache invalidation when underlying history changes

**Key Functions:**
- `addFavorite(name, data, url)`: Adds a new favorite
- `removeFavorite(urlOrId)`: Removes a favorite by URL or ID
- `isFavorite(urlOrId)`: Checks if a station is favorited
- `getPreference(key, defaultValue)`: Retrieves a preference value
- `setPreference(key, value)`: Stores a preference value
- `refreshPreferences()`: Recalculates preferences from history

**Evidence:**
- Favorites key: `FAVORITES_KEY` {repo://src/js/favorite.js#L6}
- Preferences derivation: `loadPreferencesFromHistory` function {repo://src/js/favorite.js#L98-L145}
- Favorite structure: `addFavorite` function {repo://src/js/favorite.js#L147-L169}
- Preference caching: `preferencesCache` and refresh mechanism {repo://src/js/favorite.js#L21-L22, #L201-L205}
- Preference get/set: `getPreference` and `setPreference` functions {repo://src/js/favorite.js#L211-L#225}

## Video Settings

The video module stores user preferences for data-saving mode and caption display.

**Storage Structure:**
- `dataSaveMode`: String `'true'` or `'false'`
- `captionsEnabled`: String `'true'` or `'false'`

**Key Features:**
- Boolean settings stored as strings in localStorage
- Automatic application of settings to media elements
- Synchronization with UI toggle elements via ARIA attributes
- Automatic disabling of new text tracks when captions are disabled

**Key Functions:**
- `getSetting(key)`: Retrieves and parses a boolean setting
- `saveSetting(key, value, toggleElement)`: Stores setting and updates UI
- Settings are applied during HLS initialization and track changes

**Evidence:**
- Data-save mode key: `DATA_SAVE_MODE_KEY` {repo://src/js/video.js#L4}
- Caption enabled key: `CAPTION_ENABLED_KEY` {repo://src/js/video.js#L5}
- Settings retrieval: `getSetting` function {repo://src/js/video.js#L66-L69}
- Settings storage: `saveSetting` function {repo://src/js/video.js#L76-L80}
- Caption toggle: `toggleCaptions` function {repo://src/js/video.js#L150-L154}
- Initialization: `initializeCaptions` function {repo://src/js/video.js#L156-L159}

## Data Schema and Migration

### Legacy Format Handling
Both favorites and history modules include automatic migration from legacy formats:
- **Favorites**: Migrated from array of objects with `id` as URL to UUID-based objects
- **History**: Migrated from URL-keyed stations object to UUID-keyed stations object

**Evidence:**
- Favorite migration: `migrateOldFavorites` function {repo://src/js/favorite.js#L29-L44}
- History migration: `isOldFormat` and `migrateOldHistory` functions {repo://src/js/history.js#L13-L33}

### Expiration Policies
- Cookie consent: Expires after 90 days
- Station history: Sessions older than 90 days are pruned
- Favorites and preferences: No automatic expiration (user-controlled)

**Evidence:**
- Cookie expiry: `EXPIRY_DAYS` and `checkConsentExpiry` {repo://src/js/cookie.js#L8, #L28-L38}
- History expiry: `EXPIRY_DAYS` and `pruneHistory` {repo://src/js/history.js#L3-L4, #L150-L209}

## Access Patterns and Lifecycle

### Initialization
All persistence modules initialize on page load:
- Cookie consent is checked immediately to show/hide banner
- Station history loads and prunes expired data on initialization
- Favorites cache is loaded and preference caches are populated
- Video settings are read and applied to media elements

**Evidence:**
- Cookie banner: `showCookieBanner()` call {repo://src/js/cookie.js#L87}
- History init: `initPromise` and `init()` function {repo://src/js/history.js#L260-L266}
- Favorites cache: `favoritesCache = loadFavorites()` {repo://src/js/favorite.js#L237}
- Video settings: `settingsCache` initialization {repo://src/js/video.js#L71-L74}

### Error Handling
All modules wrap `localStorage` operations in try/catch blocks to handle:
- Quota exceeded errors
- Security errors (disabled localStorage)
- JSON parsing errors from corrupted data

**Evidence:**
- Cookie error handling: try/catch in all storage functions {repo://src/js/cookie.js#L10-L16, #L19-L26, #L29-L37}
- Favorite error handling: try/catch in load/save functions {repo://src/js/favorite.js#L47-L66, #L79-L85}
- History error handling: try/catch in load/save functions {repo://src/js/history.js#L44-L62, #L64-L70, #L72-L82}
- Video error handling: try/catch in getSetting/saveSetting {repo://src/js/video.js#L66-L69, #L76-L80}

## Integration with Related Systems

The persistence layer interacts with several other systems:
- **History Export**: Exported station history uses the same format as stored in `station_history`
- **Overview Architecture**: Persistence is a core client-side storage mechanism
- **LocalStorage Model**: Defines the conceptual model for client-side storage

**Related Pages:**
- /openwiki/architecture/overview.md
- /openwiki/concepts/localstorage-model.md
- /openwiki/workflows/history-export.md

## Implementation Details

### UUID Generation
All modules rely on a global `generateUUID()` function (not shown in persistence files) for creating unique identifiers.

**Evidence:**
- UUID usage in favorites: `generateUUID()` call {repo://src/js/favorite.js#L34, #L148}
- UUID usage in history: `generateUUID()` call {repo://src/js/history.js#L21, #L110}

### Storage Updates
Changes to persisted data trigger immediate writes to localStorage to ensure durability:
- Favorite additions/removals save immediately
- History updates save after session changes
- Setting changes save immediately
- Consent changes save immediately

### Cache Consistency
Modules use internal caches to minimize localStorage reads:
- Favorite module caches favorites and preferences
- History module caches station data and computed last stations
- Video module caches settings in memory

Caches are invalidated when underlying data changes or explicitly refreshed.

## Testing Considerations

Unit tests for persistence modules should verify:
- Correct data structure serialization/deserialization
- Migration from legacy formats
- Expiration and pruning behavior
- Cache consistency after updates
- Error handling when localStorage is unavailable
- Integration with UI elements (for video settings)

End-to-end tests should validate:
- Persistence across page reloads
- Correct application of stored settings
- Consent banner behavior based on stored value
- History tracking across sessions
