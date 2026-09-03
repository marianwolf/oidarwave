---
type: integration
title: Notification API Integration
description: Implementation of browser Notification API for now-playing track alerts in the Oidarwave web player.
tags: [notification, browser-api, frontend, integration]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-399a6a20fee1e90b61c555cb
    resource: repo://src/js/notification.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

## Overview

The Notification API integration provides desktop notifications when the currently playing track changes, allowing users to stay informed even when the browser tab is not focused.

## Responsibilities

- Detect browser support for the Notification API.
- Manage user preference for enabling/disabling notifications via a UI toggle.
- Persist notification preference across sessions using localStorage.
- Request notification permission from the user when needed.
- Send a notification with track title and station name on track changes.
- Debounce rapid track changes to avoid notification spam.
- Suppress notifications when switching stations (only notify on title changes within the same station).

## Entrypoints

- Global instance: `window.notificationManager` (instantiated on DOMContentLoaded).
- Method `sendNotification(title, stationName)`: called internally after debounce to show a notification.
- Method `handleTrackChange(newTitle, stationName)`: called by the player metadata update logic to track changes and trigger notifications.

## Mechanisms / Control Flow

1. **Initialization** (`NotificationManager.init`):
   - Finds the notification toggle button (`#notificationToggle`).
   - Hides the toggle if notifications are unsupported or the page lacks an audio player.
   - Restores the saved notification enabled state from localStorage.
   - Sets up a click listener on the toggle to request permission and toggle state.

2. **Permission Handling**:
   - On toggle click, if permission is not granted, calls `Notification.requestPermission()`.
   - If permission granted, enables notifications; otherwise leaves disabled.

3. **Sending a Notification** (`sendNotification`):
   - Creates a new `Notification` with:
     - Title: `"Oidarwave - Neuer Titel"`
     - Body: `${title}\nSender: ${stationName}`
     - Icon: `/favicon/favicon.svg`
     - Tag: `'oidarwave-notification'` (to replace existing notifications)
     - `requireInteraction: false`
   - Sets an `onclick` handler to focus the window and close the notification.
   - Automatically closes the notification after 10 seconds via `setTimeout`.

4. **Track Change Handling** (`handleTrackChange`):
   - Ignores empty titles or placeholder texts like `"Keine Titelinformationen"`.
   - If the station changed, updates internal state but does not notify.
   - If the title changed on the same station:
     - Clears any existing debounce timer.
     - Starts a 2000ms debounce timer.
     - On timer expiry, calls `sendNotification` with the latest title and station.
   - Updates internal `currentTrackTitle` and `currentTrackStation` accordingly.

## State

- `notificationsSupported`: boolean indicating API availability.
- `notificationsEnabled`: boolean reflecting user preference.
- `notificationDebounceTimer`: ID of the pending debounce timeout.
- `currentTrackTitle`: last title for which a notification was considered.
- `currentTrackStation`: last station name associated with the current title.
- DOM reference: `notificationToggle` button.

## Configuration / Operations

- User preference stored in `localStorage.notificationsEnabled` as `"true"` or `"false"`.
- Defaults to `false` if not set.
- Toggle UI updates its appearance and ARIA label based on enabled state.

## Failure Handling

- If `localStorage` access fails, logs a warning to console but continues (defaults to false).
- If notification permission is denied, the toggle remains off and the user is alerted to enable notifications in browser settings.
- Notifications are silently skipped if the API is not supported, disabled, or permission not granted.

## Extension Points

- The notification text and icon could be made configurable via data attributes or options.
- The debounce delay and notification duration are hardcoded but could be exposed as constants.

## Related Workflows

- See [[workflows/notifications]] for the broader user flow of enabling and receiving notifications.
