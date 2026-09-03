---
type: API Integration
title: Media Session API for Lock Screen and System Controls
description: Implementation of the Media Session API to enable media controls (play, pause, stop) and display metadata on device lock screens and system UIs for audio/video playback.
tags: [media-session, lock-screen, system-controls, playback, web-apis]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# Media Session API

## Purpose
The Media Session API is used to provide a consistent media control experience across device lock screens and system UIs, allowing users to control playback without opening the web application.

## Responsibilities
- Setting media metadata (title, artist, album, artwork) for display in system UIs.
- Handling media action events (play, pause, stop) triggered from lock screen or system controls.
- Clearing media session state when media changes or playback stops.

## Entrypoints
The Media Session API is initialized through the `setupMediaSession` function, which is called:
- When media begins playing (in the `playing` event handler of the audio/video player).
- When station metadata is updated (though note: in the current code, it is called with empty title/artist and only station name in the `playing` event).

The `clearMediaSession` function is called:
- When changing stations (in `selectStation` before loading a new URL).
- When handling the 'stop' action from the Media Session.

## Mechanism/Control Flow
1. On media play (`playing` event):
   - Extract the current station name from the UI.
   - Call `setupMediaSession('', '', stationName)` to set metadata and action handlers.
2. The `setupMediaSession` function:
   - Checks for `mediaSession` in `navigator`.
   - Creates a `MediaMetadata` object with the provided title, artist, station name as album, and artwork from favicon.
   - Sets action handlers for:
     - `play`: calls `playMedia()` to resume playback.
     - `pause`: pauses the current player.
     - `stop`: pauses the player and clears the media session.
3. On media change (station change) or stop:
   - `clearMediaSession` is called to remove the metadata.

## State/Lifecycle
- The media session state is tied to the playback state of the underlying audio/video element.
- When playback starts, the session is activated with metadata.
- When playback is paused or stopped via system controls, the corresponding event handler is invoked.
- When the media source changes (station change), the session is cleared and then re-setup upon next play.

## Relationships
- Depends on the audio/video player element (`currentPlayer`) for playback control.
- Interacts with the UI to get the current station name for metadata.
- Works alongside the StationHistory module (as seen in event handlers) for tracking.

## Invariant/Failures
- If the Media Session API is not supported (`'mediaSession' not in navigator`), setup is skipped with a warning.
- Errors during setup are caught and logged to the console but do not break playback.
- The artwork uses the favicon URLs; if these are unavailable, the artwork may not display.

## Extension Points
- Additional media actions (e.g., 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack') can be added by setting more action handlers.
- The metadata can be enriched with more detailed information (e.g., actual song title and artist) if available from the metadata stream.

## Configuration/Operations
- The artwork URLs and sizes are hardcoded to use the favicon at multiple sizes.
- The metadata refresh interval for fetching station metadata is defined by `METADATA_REFRESH_INTERVAL` (3000ms) but note: the Media Session setup itself does not refresh; it is set once per playback. The metadata for the station (song title) is updated separately via `fetchMetadata` and UI update, but the Media Session metadata is not updated with that information in the current code.

## Focused Tests
- Verify that `setupMediaSession` correctly sets the media metadata and action handlers when called.
- Verify that `clearMediaSession` clears the metadata.
- Verify that the action handlers (play, pause, stop) trigger the expected player actions.
- Verify that the Media Session is set up on play and cleared on station change and stop.
