---
type: workflow
title: Notification Workflow
description: Describes the end-to-end flow of enabling and receiving desktop notifications for track changes in the Oidarwave player.
tags: [notification, workflow, user-experience, frontend]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-399a6a20fee1e90b61c555cb
    resource: repo://src/js/notification.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

## Overview

The Notification Workflow describes how users enable desktop notifications and receive alerts when the currently playing track changes in the Oidarwave web player. This workflow integrates the Notification API with the player's metadata update mechanism to provide timely updates without requiring the browser tab to be focused.

## User Intent and Triggers

The workflow begins when a user interacts with the notification toggle button in the player interface, typically to enable notifications for track changes. It continues as the player polls for metadata updates and triggers notifications when significant track changes occur on the same station.

## Step-by-Step Flow

### 1. Notification Setup and Permission

1. **User Action**: User clicks the notification toggle button (`#notificationToggle`)
2. **System Response**:
   - Checks if Notification API is supported in the browser
   - Verifies the page contains an audio player (hides toggle if not)
   - Reads saved notification preference from `localStorage`
   - If enabling notifications and permission not granted:
     - Prompts user for permission via `Notification.requestPermission()`
     - If granted, enables notifications; if denied, shows alert to enable in browser settings
   - Updates toggle UI to reflect new state (active/inactive, tooltip, ARIA label)

### 2. Metadata Polling and Change Detection

1. **Player Initialization**: On station selection, the player sets up metadata polling via `fetchMetadata()` at intervals (default 3000ms)
2. **Metadata Processing**:
   - Fetches metadata from station-specific URL
   - Parses response (text or JSON) to extract track title and artist
   - Updates UI elements (`currentSongTitleDisplay`, media session)
   - Calls `window.notificationManager.handleTrackChange(displayText, stationName)`

### 3. Track Change Handling and Notification

1. **Change Detection** (`handleTrackChange`):
   - Ignores empty titles or placeholder texts ("Keine Titelinformationen", "Metadaten nicht verfügbar")
   - If station changed: updates internal state but does not notify (station switches are silent)
   - If title changed on same station:
     - Clears existing debounce timer
     - Starts 2000ms debounce timer to prevent spam from rapid changes
2. **Notification Dispatch** (after debounce):
   - `sendNotification(title, stationName)` creates a Notification with:
     - Title: "Oidarwave - Neuer Titel"
     - Body: `${title}\nSender: ${stationName}`
     - Icon: `/favicon/favicon.svg`
     - Tag: `oidarwave-notification` (replaces existing notifications)
     - Auto-close after 10 seconds
   - Click handler focuses window and closes notification

## State Management

The NotificationManager maintains these key state variables:
- `notificationsSupported`: Boolean indicating API availability
- `notificationsEnabled`: Boolean reflecting user preference (from localStorage)
- `notificationDebounceTimer`: ID of pending debounce timeout
- `currentTrackTitle`: Last title processed for notification consideration
- `currentTrackStation`: Last station name associated with current title
- `notificationToggle`: DOM reference to the UI toggle button

## Configuration and Persistence

- User preference stored in `localStorage.notificationsEnabled` as `"true"` or `"false"`
- Defaults to `false` if not set
- Debounce delay hardcoded at 2000ms
- Notification duration hardcoded at 10000ms (10 seconds)
- UI toggle updates appearance and ARIA label based on enabled state

## Error Handling and Fallbacks

- **localStorage failures**: Warns to console but continues (defaults to disabled)
- **Permission denied**: Toggle remains off; user alerted to enable in browser settings
- **API unsupported/disabled**: Notification toggle hidden; no further action
- **Invalid metadata**: Treated as "no title" and skipped
- **Station switches**: Intentionally suppress notifications (only notify on title changes within same station)

## Integration with Metadata Updates

The workflow depends on the player's metadata update mechanism:
- Metadata polling interval: 3000ms (configurable in player.js)
- Metadata sources: Station-specific URLs returning text or JSON
- Track change detection: Compares new title against `currentTrackTitle`
- Debounce coordination: 2000ms delay prevents notification bursts during rapid metadata updates

## Extension Points

- Notification content: Title/icon/body could be made configurable via options
- Timing parameters: Debounce delay and notification duration could be exposed as constants
- Permission flow: Could integrate with a centralized permission management system
- UI customization: Toggle button appearance and position could be themed

## Related Workflows

- **Metadata Polling**: The player's metadata update workflow (see [[workflows/metadata-polling]]) provides the track data that triggers notifications
- **Station Switching**: Changing stations resets notification state but deliberately suppresses notifications to avoid alerting on every manual change
- **Media Session**: Notifications complement the Media Session API updates for lock screen and system controls

## Success Criteria

A user should be able to:
1. Enable notifications via the toggle button after granting browser permission
2. Receive a desktop notification when the track title changes on the same station
3. Not receive notifications when switching stations manually
4. Have their notification preference persist across page reloads and browser sessions
5. See the notification toggle UI accurately reflect the current enabled state
