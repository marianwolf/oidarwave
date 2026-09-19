---
type: workflow
title: Station Selection Workflow
description: Documents the station selection process including UI interactions, URL persistence, metadata polling setup, and media element source changes that trigger stream loading.
tags: [station-selection, workflow, playback, UI]
verified:
  - by: openwiki/0.5.1
    at: 2026-09-18T12:30:21.131Z
sources:
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
generated: { by: "openwiki/0.5.1", at: "2026-09-18T12:30:21.131Z" }
---

# Station Selection Workflow

When a user clicks a station button in the station grid, the `selectStation` function in `player.js` is invoked. This function updates the UI to reflect the selected station, persists the choice to `localStorage`, configures metadata fetching (if available), and updates the audio player's source. Media events from the player then update the UI and media session accordingly.

## Entrypoints

- **Station button click**: User clicks a station button in the station grid, triggering the click listener attached during player initialization.
- **System restoration**: On startup, the last selected station is restored from `localStorage`, which also triggers `selectStation` with the previously saved station button.

## Mechanisms & Control Flow

1. **Button click handling**:
   - The click listener (attached in `initializePlayer`, see [playback.md](/openwiki/workflows/playback.md) line 60) invokes `selectStation(button)` with the clicked button as argument.

2. **selectStation function**:
   - **Updates UI**: marks the clicked button as active, updates the current station display to show the station name.
   - **Persists selection**: stores the selected station URL in `localStorage` under the key `lastStationAudioUrl`.
   - **Clears existing metadata**: stops any running metadata polling interval and clears the Media Session to prepare for the new station.
   - **Configures metadata fetching**: if the station provides a metadata URL (from `data-metadata-url` attribute), initiates an immediate fetch via `fetchMetadata()` and sets up periodic polling every 3 seconds (`METADATA_REFRESH_INTERVAL`).
   - **Updates media source**: sets the player's `src` attribute to the station URL and calls `load()` to begin loading the stream.

3. **Media event handling**: After the source is loaded, HTML media events (`loadstart`, `canplay`, `playing`, `pause`, `waiting`, `error`) drive state transitions as documented in the [playback workflow](/openwiki/workflows/playback.md).

## Relationships

- **Depends on playback workflow**: Station selection triggers the playback state machine documented in [playback.md](/openwiki/workflows/playback.md).
<!-- openwiki: broken internal link [/openwiki/workflows/metadata-polling.md] file "/openwiki/workflows/metadata-polling.md" does not exist. Fix the href or restore the target, then delete this comment. -->
- **Integrates with metadata-polling workflow**: When a station has metadata, `selectStation` starts the metadata polling interval; stopping is part of the [metadata-polling workflow](/openwiki/workflows/metadata-polling.md).
<!-- openwiki: broken internal link [/openwiki/architecture/player.md#station-history] heading anchor "station-history" does not exist in "/openwiki/architecture/player.md". Fix the href or restore the target, then delete this comment. -->
- **Interacts with history**: Station starts are logged via the [StationHistory](/openwiki/architecture/player.md#station-history) mechanism.
<!-- openwiki: broken internal link [/openwiki/architecture/player.md##initialization] heading anchor "#initialization" does not exist in "/openwiki/architecture/player.md". Fix the href or restore the target, then delete this comment. -->
- **Provides input for player initialization**: The restored last station from `localStorage` is used during player [initialization](/openwiki/architecture/player.md##initialization).

## State & Lifecycle

- **Selection state**: The active station button reflects the currently selected station via `aria-pressed="true"` and visual styling.
- **Persisted state**: The last station URL is stored in `localStorage` and restored on application startup.
- **Metadata polling state**: When a metadata URL is available, a periodic interval (3s) is active; it is cleared when a new station is selected.
- **Media source state**: The player's `src` attribute is updated to the new station URL; `load()` initiates loading, firing `loadstart` → media event sequence.

## Invariants & Failure Handling

- **Only one station active at a time**: Clicking a new station deselects the previously active button and selects the new one.
- **URL persistence guaranteed**: The selected station URL is always written to `localStorage` before the media source changes.
- **Metadata interval cleanup**: Any existing metadata polling interval is stopped before starting a new one, preventing overlapping intervals.
<!-- openwiki: broken internal link [/openwiki/workflows/playback.md##media-event-handling] heading anchor "#media-event-handling" does not exist in "/openwiki/workflows/playback.md". Fix the href or restore the target, then delete this comment. -->
- **Error propagation**: If the station URL is invalid or the stream cannot be loaded, the error is handled by the [media event handlers](/openwiki/workflows/playback.md##media-event-handling) which set `hasError` and update the UI to the error state.

## Extension Points

- **Metadata source adaptation**: The `fetchMetadata()` function can be adapted for different metadata formats or endpoints per station.
- **Storage mechanism**: The `localStorage` wrapper functions allow substitution with alternative persistence mechanisms (e.g., IndexedDB, server sync).
- **UI styling**: Active button styling can be customized without changing the core selection logic.
- **Metadata polling interval**: The refresh interval (`METADATA_REFRESH_INTERVAL`, default 3000 ms) can be configured per station or globally.

## Configuration & Operations

- **METADATA_REFRESH_INTERVAL** (3000ms): Determines how often metadata is fetched after station selection.
- **Station button attributes**: Buttons should provide `data-url` (stream URL), `data-name` (station name), and optionally `data-metadata-url` for track information.
- **localStorage keys**: `lastStationAudioUrl` stores the last selected station URL for restoration on startup.
