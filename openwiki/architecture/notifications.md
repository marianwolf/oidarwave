---
type: architecture
title: Notifications System
description: Implementation of browser notifications for track changes and user interaction in the Oidarwave web player.
tags: [frontend, notifications, user-interface]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-399a6a20fee1e90b61c555cb
    resource: repo://src/js/notification.js
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---
# Notifications System

## Purpose
Provides browser-based notifications when the currently playing track changes, allowing users to be informed of new songs without actively viewing the player interface.

## Responsibilities
- Detect browser notification API support and permission status
- Request and manage notification permissions from the user
- Store user notification preferences in localStorage
- Send notifications for track changes with debouncing to prevent spamming
- Filter notifications to only alert on title changes within the same station (not station switches)
- Provide UI toggle for enabling/disabling notifications
- Handle notification lifecycle (auto-close after 10 seconds, click-to-focus)

## Entrypoints
- `NotificationManager.handleTrackChange(newTitle, stationName)`: Called from player.js when metadata updates
- Notification toggle click handler: Manages user preference for enabling/disabling notifications
- DOMContentLoaded event: Initializes the notification manager when the page loads

## Mechanisms & Control Flow

### Initialization
1. On DOMContentLoaded, NotificationManager constructor:
   - Checks for `Notification` in window API support
   - Initializes state variables (notification support/enabled flags, debounce timer, current track/station)
   - Sets up event listener for DOMContentLoaded to call `init()`

2. `init()` method:
   - Finds notification toggle button in DOM
   - Determines if current page is audio player page
   - Hides toggle if notifications unsupported or not on player page
   - Loads saved notification preference from localStorage
   - Updates toggle UI to reflect current state
   - Attaches click handler to toggle button for enabling/disabling notifications

### Permission Handling
When user clicks notification toggle to enable:
1. If permission is 'denied', show browser-specific alert
2. If permission is not 'granted', request permission via `Notification.requestPermission()`
3. Only proceed if permission granted
4. Update `notificationsEnabled` flag and save to localStorage
5. Update toggle UI (label, title, aria-label, active class)

### Track Change Handling
`handleTrackChange(newTitle, stationName)`:
1. Early exit if:
   - No new title provided
   - Title and station identical to current state (no change)
   - Title is placeholder text ("Keine Titelinformationen", "Metadaten nicht verfügbar")
2. If station changed:
   - Clear any existing debounce timer
   - Update current station and title state
   - Exit without sending notification (avoid alerts on station switches)
3. If same station but title changed:
   - Clear existing debounce timer
   - Set new debounce timer (2000ms) to call `sendNotification`
   - Update current track title state

### Notification Sending
`sendNotification(title, stationName)`:
1. Verify notifications are supported, enabled, and permission granted
2. Create new Notification with:
   - Title: "Oidarwave - Neuer Titel"
   - Body: `${title}\nSender: ${stationName}`
   - Icon: '/favicon/favicon.svg'
   - Tag: 'oidarwave-notification' (replaces previous notifications)
   - requireInteraction: false
3. Set onclick handler to focus window and close notification
4. Auto-close notification after 10 seconds via setTimeout

## State Management
- `notificationsSupported`: Boolean from API detection
- `notificationsEnabled`: User preference stored in localStorage
- `notificationDebounceTimer`: ID for active debounce timeout
- `currentTrackTitle`: Last notified track title
- `currentTrackStation`: Last notified station name

## Relationships
- **Player Integration**: Called from `player.js` metadata update handler (line 258) when song info refreshes
- **Storage**: Uses localStorage key 'notificationsEnabled' to persist user preference
- **DOM**: Interacts with notification toggle button (ID: 'notificationToggle') for UI state
- **Browser API**: Direct interface with Notification API for permission and display

## Lifecycle
1. **Initialization**: Creates singleton instance at page load (`window.notificationManager`)
2. **Permission State**: Persists across sessions via localStorage
3. **Active State**: Enabled/disabled toggled by user, requires granted permission
4. **Notification Lifetime**: Individual notifications auto-close after 10 seconds or on click

## Failure Handling & Invariants
- **No API Support**: Toggle hidden silently if `Notification` not in window
- **Permission Denied**: User must re-enable via browser settings; system respects denial
- **Storage Errors**: Failures to read/write localStorage logged but don't break functionality
- **Invalid Titles**: Placeholder metadata values suppress notifications
- **Debouncing**: Prevents excessive notifications during rapid metadata updates
- **Station Change Filtering**: Avoids notifying when user manually switches stations

## Configuration
- **Debounce Delay**: 2000ms (hardcoded in `handleTrackChange`)
- **Notification Duration**: 10000ms (hardcoded in `sendNotification`)
- **Storage Key**: 'notificationsEnabled' (used in `saveNotificationPreference`/`init`)
- **Notification Tag**: 'oidarwave-notification' (ensures replacement of prior notifications)

## Testing Considerations
- Verify toggle visibility based on API support and page type
- Confirm permission request flow when enabling notifications
- Test debounce behavior with rapid title changes
- Ensure no notifications fire on station switches
- Validate notification content matches current track/station
- Check localStorage persistence of user preference
- Test notification click behavior focuses window
