---
type: concept
title: Media Session Concept
description: The Media Session API integration allows the web player to interact with system media controls and lock screen interfaces, providing metadata and handling play/pause/stop actions from the system.
tags: [media-session, audio-player, video-player, system-integration]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-1a9f6af1ced29c441771d294
    resource: repo://src/js/player-core.js
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
  - id: openwiki-source-ae0af3fbadd75265cd996542
    resource: repo://src/js/video.js
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

## Overview

The Media Session API enables the web application to integrate with the device's native media controls (such as lock screen, notification panel, or system media UI) by providing media metadata and handling media action events (play, pause, stop). This integration ensures a consistent user experience across platforms, particularly on mobile devices.

## Implementation

Media Session functionality is centralized in `player-core.js` to avoid duplication between the audio (`player.js`) and video (`video.js`) players.

### Core Functions (player-core.js)

- `setupMediaSession(options)`: Configures the Media Session API with metadata and action handlers.
  - Sets `navigator.mediaSession.metadata` using provided title, artist, album, and artwork (from `FAVICON_ARTWORK`).
  - Registers action handlers:
    - `play`: Calls `media.play()` with error handling.
    - `pause`: Calls `media.pause()`.
    - `pause`: Calls `media.pause()` and invokes optional `onStop` callback.
  - Gracefully degrades if `mediaSession` is not supported by the browser.
- `clearMediaSession()`: Resets `navigator.mediaSession.metadata` to `null`.

### Audio Player Usage (player.js)

- On station selection (`selectStation`):
  - Clears any existing media session.
  - Initializes metadata fetch (if available).
- On playback start (`playing` event):
  - Calls `updateMediaSession('', '')` to set baseline metadata (title/artist overridden by metadata fetch).
- On metadata update (`fetchMetadata` success):
  - Calls `updateMediaSession(title, artist)` with current track information.
  - Updates the media session with the new title and artist; album is set to the current station name.
- On station change or error:
  - Calls `clearMediaSession()` to remove media session metadata.

### Video Player Usage (video.js)

- On station selection (`selectStation`):
  - Calls `setupMediaSession` with:
    - `title`: Station name from button dataset.
    - `artist`: Hardcoded as 'Livestream'.
    - `album`: Hardcoded as 'Oidarwave Video'.
    - `media`: The video player element.
    - `onStop`: References `clearMediaSession`.
- On playback state change:
  - Logs debug messages for `pause` and `playing` events (no metadata updates).

## Action Handling

When the user interacts with system media controls:
- **Play**: Triggers the `play` action handler, which attempts to play the media element.
- **Pause**: Triggers the `pause` action handler, which pauses the media element.
- **Stop**: Triggers the `stop` action handler, which pauses the media element and calls the `onStop` callback (typically `clearMediaSession`).

## Error Handling

- If `mediaSession` is not available in `navigator`, setup is skipped.
- Errors during setup (e.g., invalid metadata) are caught and logged via `logWarn`.
- Play errors from the `play` action handler are handled by `handlePlayError` (with context 'media-session').

## Artwork

The media session uses predefined artwork icons (`FAVICON_ARTWORK`) consisting of SVG favicons at multiple sizes (128x128, 256x256, 512x512) for consistent display across devices.

## Integration Points

- Called from audio player during station selection, playback events, and metadata updates.
- Called from video player during station selection.
- Centralized cleanup via `clearMediaSession` ensures no stale metadata persists.
