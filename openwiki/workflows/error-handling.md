---
type: Workflow
title: Error Handling Workflow
description: Describes how errors are detected, logged, and recovered from during media playback and resource loading in the Oidarwave application.
tags: ["error-handling", "player", "video", "logging", "retry"]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-e3726842692e514285f87c42
    resource: repo://src/js/errors.js
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
  - id: openwiki-source-ae0af3fbadd75265cd996542
    resource: repo://src/js/video.js
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

# Error Handling Workflow

This document outlines the error handling mechanisms used throughout the Oidarwave application, covering detection, logging, recovery, and user feedback for media playback (audio and video) and resource loading operations.

## Overview

Error handling is centralized through a shared error logging module (`src/js/errors.js`) that provides:
- Structured error codes (`ErrorCode`) for categorizing failures
- Leveled logging (`logError`, `logWarn`, `logInfo`, `logDebug`) with configurable thresholds
- Automatic attachment of contextual information (timestamp, stack trace, custom properties)
- Integration with `electron-log` in Electron builds or `console` in browser environments
- Global handlers for uncaught exceptions and unhandled promise rejections

Media-specific components (`src/js/player.js` for audio, `src/js/video.js` for video) integrate with this logging system to detect playback errors, implement retry strategies, and update the user interface.

## Error Detection

Errors are detected at multiple points in the application lifecycle:

### Media Playback Errors
- **Audio player** (`player.js`): Listens for the `error` event on the HTMLAudioElement (`#audioPlayer`). When triggered, it logs `ErrorCode.PLAYER_MEDIA_ERROR` with details from `mediaError` (code, message, current source, and page path)【{"L":68,"L":83}】.
- **Video player** (`video.js`): Uses HLS.js to monitor stream health. Fatal and non-fatal errors from HLS.js are captured via `hlsPlayer.on(Hls.Events.ERROR)`【{"L":228,"L":229}】. Native HLS playback in Safari also delegates errors to `handlePlayError`【{"L":237】.

### Resource Loading Errors
- **Metadata fetch** (`video.js`): Failed `fetch` requests for metadata (JSON or text) are caught and logged as `ErrorCode.METADATA_FETCH` with context including the metadata URL, station name, and error type【{"L":264,"L":276】.
- **Storage operations** (`errors.js`): Explicit storage read/write failures are logged via `logStorageError`, which categorizes the error (e.g., `QUOTA_EXCEEDED`, `SECURITY_ERROR`)【{"L":126,"L":128】.

### Global Error Handlers
- **Browser**: `window.onerror` logs uncaught exceptions as `ErrorCode.UNHANDLED_ERROR`【{"L":133,"L":139】. `window.addEventListener('unhandledrejection')` logs promise rejections as `ErrorCode.UNHANDLED_REJECTION`【{"L":142,"L":145】.
- **Electron/Node**: `process.on('unhandledRejection')` and `process.on('uncaughtException')` perform equivalent logging for the main process【{"L":151,"L":158】.

### Autoplay Blocking
- Audio playback attempts that fail due to browser policies (e.g., missing user gesture) are handled by `handlePlayError`, which distinguishes `NotAllowedError` (logged at `debug` level) from `NotSupportedError` and other errors (logged at `error` level)【{"L":108,"L":116】.

## Logging

All detected errors funnel through the logging functions in `errors.js`:

### Log Levels and Configuration
- Log levels (`DEBUG`, `INFO`, `WARN`, `ERROR`) are defined in `LOG_LEVELS`【{"L":1】.
- The effective level is determined by (in order): `window.LOG_LEVEL`, `localStorage.getItem('logLevel')`, defaulting to `WARN`【{"L":3,"L":15】.
- `shouldLog(level)` compares the requested level against the current threshold【{"L":20,"L":21】.

### Log Entry Structure
- `formatLogEntry` creates a consistent object with `timestamp`, `code`, `message`, `name`, and any additional context (`ctx`)【{"L":24,"L":35】.
- If the error is an `Error` instance with a `stack`, it is included【{"L":32,"L":34】.

### Output Destinations
- In Electron environments, `electron-log` is used if available【{"L":77,"L":88】.
- Otherwise, the standard `console` methods (`error`, `warn`, `info`, `debug`) are used【{"L":87】.
- Functions `logError` through `logDebug` are created via `createLogger`, which prepends the error code to the log entry when a code is provided【{"L":90,"L":100】.

### Exported Interface
- The logging functions, error code map, and HLS error map are attached to `window` for debugging accessibility【{"L":161,"L":171】.
- In module environments (Electron/Node), they are exported via `module.exports`【{"L":174,"L":186】.

## Recovery Strategies

Recovery mechanisms vary by error type and media subsystem.

### Audio Player Retry Logic (`player.js`)
- Upon a media error, `hasError` is set to `true` and `isAutoRetry` is reset【{"L":68,"L":82】.
- `scheduleAudioRetry` implements exponential backoff (`RETRY_BASE_DELAY * 2^count`) up to `MAX_RETRIES` (3) attempts【{"L":144,"L":166】.
  - If the player is offline, retries are delayed until connectivity returns【{"L":146】.
  - Exceeding `MAX_RETRIES` logs `ErrorCode.AUDIO_RECONNECT_FAILED` and updates the status indicator to prompt manual retry【{"L":147,"L":152】.
- On `online` events, if the player was previously playing and has an error, an immediate retry is triggered (counting as one attempt)【{"L":104,"L":112】.
- User-initiated actions (e.g., `selectStation`, `clearAudioRetry`) reset the retry state and counter【{"L":132,"L":138】,【{"L":186】.
- Successful recovery (`canplay` or `playing` events) clears the retry state and error flags【{"L":40,"L":56】.

### Video Player HLS Recovery (`video.js`)
- **Network errors** (`Hls.ErrorTypes.NETWORK_ERROR`): Trigger `handleNetworkRetry`, which retries `hlsPlayer.startLoad()` with exponential backoff (same parameters as audio)【{"L":178,"L":193】. After `MAX_RETRIES` failures, the HLS player is destroyed and a persistent error message is shown【{"L":179,"L":183】.
- **Media errors** (`Hls.ErrorTypes.MEDIA_ERROR`): Attempt automatic recovery via `hlsPlayer.recoverMediaError()`【{"L":201,"L":203】.
- **Fatal errors**: For non-network/media fatal errors (or after exhausting retries), the HLS player is destroyed, set to `null`, and an error message is displayed via `showStatusMessage`【{"L":206,"L":209】.
- On successful manifest parsing (`Hls.Events.MANIFEST_PARSED`), the player attempts to play the video, catching any errors with `handlePlayError`【{"L":152,"L":155】.
- Visibility change events (`visibilitychange`) also trigger a play attempt with error handling when the page becomes visible【{"L":290,"L":294】.

## User Interface Feedback

Error and retry states are communicated to the user through the status indicator (`#statusIndicator`).

### Audio Player (`player.js`)
- `updateOverallStatus` determines a status string based on `navigator.onLine`, `hasError`, `currentPlayer.paused`, and `isStalled`【{"L":120,"L":124】.
- `PlayerCore.setStatusClass` applies CSS classes to reflect the status (e.g., `error`, `buffering`, `paused`, `online`)【{"L":129】.
- During retries, the status indicator shows a countdown message (e.g., `"Versuch 2/3 in 4s…"`) and gains the `text` and `buffering` classes【{"L":155,"L":161】.
- Upon permanent failure, the indicator displays a static message like `"Verbindung verloren – erneut versuchen"` with the `error` class【{"L":149,"L":151】.

### Video Player (`video.js`)
- `showStatusMessage` displays transient messages (default 5 seconds) with a specified type (`error`, etc.)【{"L":52,"L":65】.
- `clearStatusMessage` removes any active message and resets the indicator【{"L":68,"L":75】.
- HLS-specific errors result in messages such as:
  - Network failure after retries: `"Netzwerkfehler: Nach {MAX_RETRIES} Versuchen keine Verbindung. Bitte Internetverbindung prüfen und Seite neu laden."`【{"L":183】.
  - Fatal HLS error: `"Schwerwiegender Fehler: {details}. Bitte Seite neu laden."`【{"L":209】.
  - Unsupported browser: `"Ihr Browser unterstützt dieses Videoformat nicht."`【{"L":242】.

## Global Error Handling

Uncaught errors and promise rejections that escape component-specific handling are logged globally to prevent silent failures.

### Browser Environment
- `window.onerror` captures runtime errors, providing the error message, source URL, line/column numbers, and the error object【{"L":133,"L":139】.
- `window.addEventListener('unhandledrejection')` catches rejected promises that lack a `.catch()` handler【{"L":142,"L":145】.

### Electron/Node Environment
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` serve analogous roles for the main process【{"L":151,"L":158】.
- Both paths log using `ErrorCode.UNHANDLED_ERROR` or `ErrorCode.UNHANDLED_REJECTION` as appropriate.

## Configuration

Error handling behavior can be adjusted via:

### Log Level
- Set `window.LOG_LEVEL` (e.g., `"DEBUG"`) before scripts load, or modify `localStorage.logLevel` at runtime to control verbosity【{"L":3,"L":15】.

### Retry Parameters
- In `player.js`: `MAX_RETRIES` (default 3) and `RETRY_BASE_DELAY` (default 1000 ms) govern audio retry backoff【{"L":7","L":8】.
- In `video.js`: Identical constants (`MAX_RETRIES`, `RETRY_BASE_DELAY`) control HLS network retry behavior【{"L":7","L":8】.

### Storage Keys
- Audio player persists the last station URL under `lastStationAudioUrl` (used for error recovery and restoration)【{"L":6】.
- Video player uses `dataSaveMode` and `captionsEnabled` booleans, which are unrelated to error handling but affect stream selection and caption display.

## Testing Considerations

While not explicitly detailed in the source, effective testing of error handling would involve:

1. **Unit tests** for `errors.js`:
   - Verify log level selection from various sources.
   - Confirm `formatLogEntry` includes expected fields.
   - Check that `logError`/`logWarn` etc. call the appropriate logger method with correct formatting.

2. **Integration tests** for media components:
   - Simulate `error` events on audio/video elements and assert that `logError` is called with the correct `ErrorCode`.
   - Mock network failures to trigger HLS retries and verify exponential backoff timing.
   - Test that exceeding retry counts results in appropriate user messages and state updates.
   - Validate that `online` events trigger retries when warranted.
   - Ensure autoplay blocking scenarios are logged at the correct level.

3. **Global handler tests**:
   - Dispatch synthetic errors or unhandled rejections and confirm they are logged as `UNHANDLED_ERROR`/`UNHANDLED_REJECTION`.

## Extension Points

- **Logger swap**: Replace `electronLog`/`console` with a custom logger by modifying `getLogger()` in `errors.js`【{"L":86,"L":88】.
- **Error code expansion**: Add new entries to the `ErrorCode` enum for additional subsystems【{"L":38,"L":66】.
- **HLS error mapping**: Extend `HlsErrorMap` if new Hls.ErrorTypes are introduced【{"L":68,"L":75】.
- **Retry customization**: Adjust `MAX_RETRIES` or `RETRY_BASE_DELAY` constants, or replace the retry logic entirely in `scheduleAudioRetry`/`handleNetworkRetry`【{"L":144,"L":166】,【{"L":178,"L":193】.
- **UI feedback**: Alter `showStatusMessage`, `updateOverallStatus`, or direct DOM manipulation of `#statusIndicator` to change how errors are presented to the user【{"L":52,"L":65】,【{"L":120,"L":130】.

## Summary

The Oidarwave application employs a layered error handling strategy:
1. **Detection** occurs at the point of failure (media elements, network requests, storage, global events).
2. **Logging** is centralized, structured, and configurable, ensuring consistent capture of diagnostics.
3. **Recovery** is attempted automatically with exponential backoff where appropriate, distinguishing between transient and fatal conditions.
4. **Feedback** is provided via the status indicator, keeping the user informed of playback issues and recovery attempts.
5. **Global safeguards** catch any errors that escape component-specific handling, preventing silent failures.

This workflow aims to maintain playback resilience while providing clear diagnostics for developers and actionable feedback for users.
