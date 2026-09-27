---
type: workflow
title: Settings Workflow
description: How user preferences (volume, data save mode, captions, etc.) are read, stored, and applied across sessions.
tags: [settings, persistence, localStorage, user-preferences]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-f5dd57353d17e5dc5ea58a83
    resource: repo://src/js/cookie.js
  - id: openwiki-source-1a9f6af1ced29c441771d294
    resource: repo://src/js/player-core.js
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
  - id: openwiki-source-ae0af3fbadd75265cd996542
    resource: repo://src/js/video.js
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

## Overview

The settings workflow manages user preferences across audio and video players, persisting choices in `localStorage` via the `PlayerCore` helper module. Preferences include volume (audio only), data save mode, caption enablement, and last-selected station. Initialization reads stored values; user interactions update both UI and storage; changes are immediately applied to player behavior.

## Audio Player Settings (player.js)

### Volume
- **Initialization**: Set to `1.0` (maximum) on every session start (line 29).
- **Adjustment**: Modified via `ArrowUp`/`ArrowDown` keys in increments of `0.1`, clamped to `[0, 1]` with one decimal precision (lines 224-230, `clampVolume`).
- **Persistence**: **Not stored** in `localStorage`. Volume resets to `1.0` on each page load or station change.

### Last Station
- **Storage Key**: `lastStationAudioUrl` (line 6).
- **Read**: On initialization via `readSetting(AUDIO_STORAGE_KEY)` to restore the previous station (line 289).
- **Write**: Updated when a station is selected via `writeSetting(AUDIO_STORAGE_KEY, url)` (line 195).
- **Behavior**: If a stored URL matches a station button, that station is auto-selected; otherwise, the first station is chosen (lines 289-298).

## Video Player Settings (video.js)

### Data Save Mode
- **Storage Key**: `dataSaveMode` (line 4).
- **Read**: Initialized from `readBoolSetting(DATA_SAVE_MODE_KEY)` into `settingsCache.dataSaveMode` (line 39).
- **Toggle**: User interaction via `#dataModeToggle` button calls `toggleDataSaveMode()` (lines 255-259):
  - Inverts `settingsCache.dataSaveMode`.
  - Persists new value via `saveSetting(DATA_SAVE_MODE_KEY, value, toggleElement)` (lines 44-47, using `PlayerCore.writeSetting`).
  - Calls `updateQualityLevel()` to apply immediately.
- **Application**: Adjusts HLS quality level via `updateQualityLevel()` (line 98-100):
  - `true` (data saver): Forces lowest quality (`hlsPlayer.currentLevel = 0`).
  - `false` (auto): Enables automatic quality selection (`hlsPlayer.currentLevel = -1`).

### Captions Enabled
- **Storage Key**: `captionsEnabled` (line 5).
- **Read**: Initialized from `readBoolSetting(CAPTION_ENABLED_KEY)` into `settingsCache.captionsEnabled` (line 40).
- **Toggle**: User interaction via `#captionToggle` button calls `toggleCaptions()` (lines 113-117):
  - Inverts `settingsCache.captionsEnabled`.
  - Persists new value via `saveSetting(CAPTION_ENABLED_KEY, value, toggleElement)`.
  - Calls `applyCaptions()` to apply immediately.
- **Application**: Applied by `applyCaptions()` (lines 106-111):
  - Sets `hlsPlayer.subtitleDisplay` if HLS.js is used.
  - Sets `track.mode` to `'showing'` or `'disabled'` for the first matching text track (kinds: `subtitles`, `captions`, `metadata`).
  - If no track exists and captions are enabled, disables all text tracks to prevent unwanted displays.

## Cross-Cutting Concerns

### Storage Mechanism (player-core.js)
- **Helpers**: Provides type-safe `localStorage` access with error logging (lines 69-88):
  - `readSetting(key)`: Returns string value or `null`.
  - `readBoolSetting(key)`: Returns `true` if stored string is `"true"`.
  - `writeSetting(key, value)`: Stores `String(value)`.
  - `writeBoolSetting(key, value)`: Stores `String(Boolean(value))`.
- **Error Handling**: All operations wrapped in `try/catch`; failures log via `logStorageError` without interrupting UI (lines 70-75, 80-85).

### Cookie Consent (cookie.js)
- **Purpose**: Tracks GDPR consent for analytics/scripts, not player settings.
- **Keys**: `cookieConsent` (`true`/`false`/`null`), `consentTimestamp` (line 5-6).
- **Read**: `getCookieConsent()` returns stored consent or `null` if unset/expired (lines 19-25).
- **Write**: `setCookieConsent(consent)` stores consent and current timestamp (lines 10-16).
- **Expiry**: Consent invalidated after 90 days via `checkConsentExpiry()` (lines 28-38).
- **Behavior**: Analytics scripts (Vercel, Google Tag Manager) enabled only if consent is `'true'` (lines 66-69).

## Initialization and Application Flow

1. **Page Load**:
   - Audio player: Volume set to `1.0`; last station read and selected if available.
   - Video player: `dataSaveMode` and `captionsEnabled` read into `settingsCache`; UI toggles updated to reflect stored values.
   - Cookie consent checked; banner shown if no decision exists.

2. **User Interaction**:
   - **Volume**: Keypress adjusts `currentPlayer.volume`; no storage update.
   - **Station Select**: Audio/video players store new station URL; video additionally updates HLS source and media session.
   - **Toggle Controls**: Video player toggles update `settingsCache`, persist to `localStorage`, and immediately apply to player/HLS state.

3. **State Application**:
   - Changes to data save mode or captions take effect instantly via direct player/HLS API calls.
   - Last station persists across sessions but requires manual station change to update.

## Session Persistence

- **Audio**: Only last station URL persists; volume and player state (play/pause) do not survive page reloads.
- **Video**: Data save mode and caption preferences persist across sessions and browser restarts.
- **Consent**: Cookie consent persists for 90 days with automatic expiry checking.
- **Storage Scope**: All settings use `localStorage`, isolated by domain; no synchronization across devices.

## Failure Handling

- **Storage Errors**: `localStorage` failures (quota exceeded, security errors) are caught and logged via `logStorageError`; defaults fall back to `null`/false values without blocking UI.
- **Missing Elements**: If DOM elements for toggles/stations are absent, initialization skips dependent logic but continues.
- **Unsupported Features**: HLS fallback to native Safari or error messages if neither available (video.js lines 231-243).
