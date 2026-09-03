---
type: integration
title: HLS.js Integration
description: Integration of hls.js for adaptive bitrate HLS video playback in the browser, with fallback to native HLS, caption support, quality selection, and error recovery.
tags: [hls, video, streaming, javascript, media-session]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-ae0af3fbadd75265cd996542
    resource: repo://src/js/video.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# HLS.js Integration

## Purpose

This integration provides robust HLS (HTTP Live Streaming) video playback using the hls.js library, with graceful fallback to native HLS support in Safari. It manages captions, quality selection based on a data‑saving mode, error recovery with exponential backoff, and integration with the Media Session API for system‑level controls.

## Responsibilities

- Create and configure an Hls.js instance when the browser supports it via Media Source Extensions (MSE).
- Fallback to the native `<video>` element’s HLS support when hls.js is unavailable but the browser can play `application/vnd.apple.mpegurl` (Safari).
- Manage subtitle/text track visibility and the hls.js `subtitleDisplay` flag.
- Automatically select an appropriate quality level: the lowest rendition when data‑saving mode is enabled, otherwise the automatic (`-1`) track.
- Implement a retry mechanism for fatal network errors with exponential backoff (up to three attempts).
- Attempt recovery from fatal media errors using `hls.js.recoverMediaError()`.
- Clear status messages and initiate playback upon successful manifest parsing.
- Integrate with the Media Session API to expose play/pause controls on lock screens and notification panels.
- Persist user preferences (caption state, data‑saving mode) in `localStorage`.
- Respond to keyboard shortcuts (left/right arrow) for seeking when no form input is focused.
- Clean up any existing Hls.js instance before loading a new stream to prevent resource leaks.

## Entrypoints

- The module is bootstrapped by a `DOMContentLoaded` event listener in `/src/js/video.js`.
- Initialization sequence:
  1. Restore cached settings (`dataSaveMode`, `captionsEnabled`) from `localStorage`.
  2. Set up UI event listeners (station buttons, toggle controls, keyboard, visibility change).
  3. Initialize the first station (if any) via `setupHlsPlayer()`.
- The `setupHlsPlayer(url)` function is the core entrypoint for loading a new HLS stream, called from:
  - Station button clicks (`stationButtons`).
  - Initial player initialization (`initializePlayer()`).
  - Internal cleanup before retrying a failed load.

## Mechanisms & Control Flow

### HLS.js Setup

When `window.Hls.isSupported()` returns true:
1. The `<video>` element is marked `crossorigin="anonymous"` to avoid sending credentials.
2. A new `Hls` instance is created with `xhrSetup` that sets `withCredentials = false`.
3. `hlsPlayer.loadSource(url)` begins fetching the manifest.
4. `hlsPlayer.attachMedia(videoPlayer)` binds the media element.

### Manifest Parsed & Playback

On `Hls.Events.MANIFEST_PARSED`:
- Any existing status indicator is cleared.
- `videoPlayer.play()` is attempted (autoplay may be blocked by the browser).
- `updateQualityLevel()` is called to set the initial rendition.
- Captions are enabled or disabled based on `settingsCache.captionsEnabled`.

### Error Handling

- **Fatal Network Errors** (`Hls.ErrorTypes.NETWORK_ERROR`):
  - If retry count < `MAX_RETRIES` (3), wait `RETRY_BASE_DELAY * 2^count` milliseconds, then call `hlsPlayer.startLoad()`.
  - On exhaustion, destroy the `Hls` instance, set `hlsPlayer = null`, and show a persistent error message.
- **Fatal Media Errors** (`Hls.ErrorTypes.MEDIA_ERROR`):
  - Attempt recovery via `hlsPlayer.recoverMediaError()`.
  - If unrecoverable or another fatal error type occurs, destroy the player and display an error.
- **Non‑fatal errors** (e.g., `bufferAppendError`) are handled automatically by hls.js and require no manual intervention.

### Native HLS Fallback

If hls.js is unsupported but `videoPlayer.canPlayType('application/vnd.apple.mpegurl')` is truthy:
- Remove the `crossorigin` attribute (required for some Safari streams).
- Set `videoPlayer.src = url`.
- Await the `loadedmetadata` event, then clear status, attempt playback, and apply caption preferences.

### Caption Management

- `hlsPlayer.subtitleDisplay` mirrors the desired subtitle visibility.
- Text tracks are iterated; their `mode` is set to `'disabled'`/`'showing'` as needed.
- The `addtrack` listener on `videoPlayer.textTracks` ensures newly added tracks are disabled unless captions are globally enabled.
- User toggles update `localStorage` and call `enableCaptions()`/`disableCaptions()`.

### Quality & Data‑Saving Mode

- `updateQualityLevel()` sets `hlsPlayer.currentLevel` to `0` (lowest) when data‑saving mode is on, otherwise `-1` (automatic).
- Toggling data‑saving mode persists the flag and immediately calls `updateQualityLevel()`.

### Media Session Integration

- `setupMediaSession(stationName)` configures `navigator.mediaSession.metadata` with title, artist, album, and artwork.
- Action handlers for `play` and `pause` delegate to `videoPlayer.play()` and `videoPlayer.pause()`.
- `clearMediaSession()` nullifies the metadata when needed.
- The session is (re)initialized whenever a station is selected.

### Keyboard & Visibility

- Left/right arrow keys seek by `SEEK_TIME` (10 seconds) when no `<input>` or `<textarea>` is focused.
- On `visibilitychange`, if the page becomes visible and the video is not paused, playback is attempted.

### Cleanup & Retry State

Before creating a new Hls.js instance:
- Any existing `hlsPlayer` is destroyed and set to `null`.
- Ongoing retry timeouts are cleared.
- `retryState` (`count` and `timerId`) is reset to zero.

## State & Lifecycle

| Variable            | Meaning                                                                 |
|---------------------|-------------------------------------------------------------------------|
| `hlsPlayer`         | Current Hls.js instance or `null` when no active stream.                |
| `retryState`        | Tracks retry attempts (`count`) and any active timeout ID (`timerId`).   |
| `settingsCache`     | Holds `dataSaveMode` and `captionsEnabled` read from/written to `localStorage`. |
| `videoPlayer`       | Cached reference to the `<video id="videoPlayer">` DOM node.            |
| Player lifecycle    | Created on first station load, destroyed on error exhaustion or before loading a new URL; may be recreated after successful recovery. |

## Invariants & Failure Handling

- If neither hls.js nor native HLS is available, an error message is shown and playback does not start.
- After three unsuccessful network‑error retries, the player is torn down and a persistent error is displayed until the user reloads the page or selects a different station.
- Fatal media errors trigger at most one automatic recovery attempt; continued failure results in player destruction.
- Non‑fatal errors are ignored by the application logic, relying on hls.js’s internal recovery.
- The `crossorigin` attribute is applied only when using hls.js; it is removed for the native fallback to avoid CORS‑related playback blocking in Safari.
- Caption state and data‑saving mode are always reflected in the UI (`aria-pressed` on toggle buttons) and persisted across page reloads.

## Extension Points

- Adjust `MAX_RETRIES` or `RETRY_BASE_DELAY` to change error‑recovery behavior.
- Modify the `xhrSetup` function to send credentials or custom headers if the stream requires them.
- Extend `CAPTION_TRACK_KINDS` to support additional track types (e.g., `descriptions`).
- Hook into the `MANIFEST_PARSED` or `ERROR` events to expose stream metadata or custom logging.
- Replace the quality‑selection logic in `updateQualityLevel()` with a custom algorithm (e.g., based on bandwidth metrics).

## Configuration & Operations

- **Data‑saving mode**: Toggled via the UI button; persists in `localStorage` as `dataSaveMode`. When active, forces the lowest rendition.
- **Captions**: Toggled via the UI button; persists in `localStorage` as `captionsEnabled`. Controls both hls.js subtitle display and text‑track visibility.
- **Persistence**: All user‑facing settings survive page reloads and browser restarts (subject to localStorage availability).
- **Debugging**: Error details are logged to the console (including HTTP status when available) to aid troubleshooting.

## Testing

While no explicit test files are present in the examined source, the following behaviors are amenable to automated testing:
- Verification that `setupHlsPlayer()` creates an Hls.js instance when supported and falls back to native src assignment otherwise.
- Confirmation that a manifest‑parsed event triggers playback and quality‑level update.
- Validation that network‑error retries respect the exponential backoff and cease after `MAX_RETRIES`.
- Ensuring that caption toggles correctly update `hlsPlayer.subtitleDisplay` and text‑track modes.
- Checking that data‑saving mode toggles force `hlsPlayer.currentLevel` to `0` (or `-1` when disabled).
- Observing that `destroy()` is called on the previous instance before a new stream is loaded.
