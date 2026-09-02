---
type: workflow
title: History Export Workflow
description: Exporting the station playback history as a JSON file via the download button or Ctrl+S keyboard shortcut.
tags: [history, export, download, localStorage, workflow]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-859a83c9cf83489fefa6211b
    resource: repo://src/js/download_history.js
  - id: openwiki-source-cd156ee2be7a00377eeb8dbd
    resource: repo://src/js/history.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---
# History Export Workflow

This workflow enables users to export their station playback history as a JSON file for backup or analysis. The export is triggered either by a download button in the UI or by pressing Ctrl+S (when not focused on an input or textarea).

## Mechanism

The workflow is implemented in `src/js/download_history.js` and operates as follows:

1. **Trigger**: The export can be initiated by:
   - Clicking a download button in the UI (button wiring not shown in seed file)
   - Pressing Ctrl+S (keydown event listener with Ctrl key and 's' key)

2. **Data Retrieval**: Upon trigger, the workflow retrieves the raw station history data from `localStorage` using the key `station_history` (defined in the persistence layer as the complete station playback history).

3. **File Preparation**: 
   - A filename is generated using the format `station_history_YYYY-MM-DD-HH-MM-SS.json` (timestamp in ISO format with colons and T replaced by hyphens, truncated to 19 characters).
   - A Blob object is created from the raw history data with MIME type `application/json`.
   - An object URL is created for the Blob.

4. **Download Initiation**:
   - An anchor (`<a>`) element is dynamically created, assigned the object URL and the generated filename.
   - The anchor is appended to the document body, programmatically clicked, then removed.
   - The object URL is revoked to free memory.

5. **Error Handling**: Any errors during the process are caught and logged to the console with the message "Download fehlgeschlagen:" (German for "Download failed:").

## Relationships

- **Persistence Layer**: Depends on the `station_history` key managed by the history.js module (see [Persistence Layer](/openwiki/architecture/persistence.md#station-history) for the data structure).
- **UI Integration**: Assumes the existence of a download button in the UI that triggers the `downloadHistory()` function (button wiring is outside the scope of this workflow file).
- **Keyboard Shortcut**: Shares the Ctrl+S shortcut with the browser's default save page action, but overrides it when not in an input or textarea.

## State and Lifecycle

- The workflow is stateless and operates on-demand; it does not modify the stored history.
- It reads the current state of `station_history` from localStorage at the moment of export.
- The exported file is a static snapshot of the history at export time; subsequent history changes do not affect the exported file.
- No persistent changes are made to the application state during export.

## Extension Points

- The filename timestamp format can be adjusted by modifying the date formatting in line 11.
- The MIME type is fixed as `application/json` but could be made configurable.
- Error handling currently only logs to console; could be extended to show user notifications.

## Related Components

- **History Module**: Provides the `station_history` data structure ([history.js](/openwiki/architecture/persistence.md#station-history)).
- **Persistence Layer**: Defines the `station_history` key and its usage patterns.
- **UI Layer**: Responsible for rendering the download button and handling focus states for the keyboard shortcut.
