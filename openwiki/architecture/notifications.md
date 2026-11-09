---
type: "Reference"
title: "Notifications: Browser Notification Manager"
openwiki_generated: true
verified:
  - by: openwiki/0.7.2
    at: 2026-11-03T19:02:34.893Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-399a6a20fee1e90b61c555cb
    resource: repo://src/js/notification.js
  - id: openwiki-source-1a9f6af1ced29c441771d294
    resource: repo://src/js/player-core.js
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
  - id: openwiki-source-344a605cf9b55b2039c6ed87
    resource: repo://video/index.html
generated: { by: "openwiki/0.7.2", at: "2026-11-03T19:02:34.893Z" }
---


# Notifications: Browser Notification Manager

## Purpose
`src/js/notification.js` implements a small singleton, `window.notificationManager`, that shows a browser notification whenever the currently playing track changes, so users learn about new songs without watching the player. It owns the Notification API permission flow, the persisted on/off toggle, and the filtering/debouncing logic that decides when a metadata update is worth a notification.

## Responsibilities
- Detect browser Notification API support (`'Notification' in window`) at construction time
- Initialize on `DOMContentLoaded` and wire the `#notificationToggle` button
- Hide the toggle when the API is unsupported or the page has no `#audioPlayer` (audio-page-only rule, e.g. `video/index.html`)
- Request Notification permission, including the denied-permission alert path
- Persist the user's on/off preference under the `notificationsEnabled` key via `PlayerCore` (localStorage `'true'`/`'false'`)
- Send notifications for track changes, debounced by 2000 ms, only for same-station title changes
- Filter out empty and placeholder titles and silently adopt station changes without notifying
- Manage notification lifetime: auto-close after 10 s, click focuses the window and closes

## Entrypoints
- `window.notificationManager.handleTrackChange(newTitle, stationName)` — called from `player.js` on every successful metadata refresh (see [Relationships](#relationships))
- `#notificationToggle` click — runs `toggleNotifications()`, which flips the persisted preference after ensuring permission
- `DOMContentLoaded` — the constructor registers a listener that runs `init()` once the DOM is ready
- Script evaluation — creates the singleton `window.notificationManager` (and exposes the class as `window.NotificationManager`; also `module.exports` for tests)

## Mechanisms & Control Flow

### Lifecycle / Initialization
1. The IIFE runs at script load (both `index.html` and `video/index.html` load `notification.js` with `defer`, before `player.js`/`video.js`). It creates `window.notificationManager = new NotificationManager()` unless one already exists.
2. The constructor sets `notificationsSupported = 'Notification' in window`, initial state (`notificationsEnabled = false`, `notificationDebounceTimer = null`, `currentTrackTitle = ''`, `currentTrackStation = ''`), and registers `document.addEventListener('DOMContentLoaded', () => this.init())`.
3. `init()`:
   - Looks up `#notificationToggle`; returns immediately if absent.
   - Computes `isAudioPlayer = !!document.getElementById('audioPlayer')`.
   - **Visibility rule:** if `!notificationsSupported || !isAudioPlayer`, sets `notificationToggle.style.display = 'none'` and returns — so on the video page (which has no `#audioPlayer`) the toggle never appears.
   - Otherwise loads the persisted preference via `window.PlayerCore?.readBoolSetting('notificationsEnabled') ?? false`, updates the toggle UI, and attaches the click handler that calls `toggleNotifications()`.

### Permission flow and toggle
`toggleNotifications()` (async):
1. If notifications are currently disabled, call `ensurePermission()`; abort if not granted.
2. Flip `notificationsEnabled`, persist via `saveNotificationPreference()` → `window.PlayerCore?.writeSetting('notificationsEnabled', String(this.notificationsEnabled))` (stores `'true'`/`'false'`), and refresh the toggle UI (`active` class, `title`, `aria-label`).

`ensurePermission()`:
- `Notification.permission === 'denied'` → shows a German `alert(...)` telling the user to allow notifications in browser settings and returns `false` (the toggle stays off; the user must change browser settings).
- `Notification.permission !== 'granted'` → `await Notification.requestPermission()`; granted only if the result is `'granted'`.
- Already `'granted'` → `true`.

### Track-change handling: `handleTrackChange(newTitle, stationName)`
1. **Early exits (no notification, no state change):**
   - `!newTitle` (empty/undefined title)
   - `newTitle === currentTrackTitle && stationName === currentTrackStation` (nothing changed)
   - Placeholder titles `'Keine Titelinformationen'` or `'Metadaten nicht verfügbar'` (the values `player.js` uses when metadata is missing or the fetch failed)
2. **Station change** (`stationName !== currentTrackStation`): clears any pending debounce timer, adopts the new station and title into state, and returns **without notifying** — switching stations must not pop a notification.
3. **Same station, new title:** clears the previous debounce timer, starts a new `setTimeout(..., 2000)` that calls `sendNotification(newTitle, stationName)`, and updates `currentTrackTitle`. The 2000 ms debounce collapses rapid metadata updates (the player polls every 3 s, but streams can deliver several updates in quick succession) into at most one notification per settled title.

### Notification sending: `sendNotification(title, stationName)`
1. Guards: returns unless `notificationsSupported && notificationsEnabled && Notification.permission === 'granted'`.
2. Creates `new Notification('Oidarwave - Neuer Titel', { body: `${title}\nSender: ${stationName}`, icon: '/favicon/favicon.svg', tag: 'oidarwave-notification', requireInteraction: false })`. The fixed `tag` makes each new notification replace the previous one instead of stacking.
3. `notification.onclick` → `window.focus()` then `notification.close()` (click-to-focus).
4. `setTimeout(() => notification.close(), 10000)` — auto-close after 10 s.

## State
- `notificationsSupported` — boolean, from API detection in the constructor
- `notificationsEnabled` — user preference; mirrored into localStorage key `notificationsEnabled` (`'true'`/`'false'`) via `PlayerCore`
- `notificationDebounceTimer` — handle of the pending 2000 ms debounce timeout (`null` when idle)
- `currentTrackTitle` / `currentTrackStation` — last adopted track/station, used for change detection and station-switch suppression

## Relationships
- **Caller — `player.js`:** on each successful metadata fetch, `fetchMetadata()` formats the track (`formatTrackDisplay`) and calls `window.notificationManager?.handleTrackChange(displayText, stationName())` (`repo://src/js/player.js#L346`). `stationName()` reads the text of `#currentStation`, so a station switch changes the station argument and is adopted silently by the manager. The metadata is polled every 3000 ms (`METADATA_REFRESH_INTERVAL`) but only while the page is visible (`document.hidden` check) and online, so `handleTrackChange` is not invoked in background tabs.
- **Persistence — `player-core.js`:** `notification.js` never touches `localStorage` directly; it uses `PlayerCore.readBoolSetting('notificationsEnabled')` (true only for the exact string `'true'`) and `PlayerCore.writeSetting('notificationsEnabled', String(...))`, which wrap the single try/catch storage helpers in `player-core.js` (`repo://src/js/player-core.js#L156-L175`). See [Persistence Layer](persistence.md).
- **DOM contract:** `#notificationToggle` (button in `index.html`, `repo://index.html#L185-L191`) and `#audioPlayer` (`repo://index.html#L209`) are the two elements the visibility rule depends on. `video/index.html` loads `notification.js` (`repo://video/index.html#L60`) but contains neither element, so `init()` exits at the missing-toggle check and the feature stays invisible there. See [UI Architecture](ui.md).
- **Workflows:** the notification fires as part of the metadata-refresh step of [playback](../workflows/playback.md); the toggle is part of the [settings surface](../workflows/settings.md).

## Failure Handling & Invariants
- **No Notification API:** `notificationsSupported` is false; the toggle is hidden and `toggleNotifications`/`sendNotification` no-op.
- **Permission denied:** `alert(...)` is shown, the preference is not persisted, and the system respects the denial until the user changes browser settings.
- **Storage errors:** `PlayerCore` helpers catch and log storage failures (`STORAGE_READ_FAILED`/`STORAGE_WRITE_FAILED`) and degrade to `null`/`false`, so a broken localStorage never breaks playback.
- **Placeholder/empty metadata:** suppressed before any state change or notification.
- **Station switches never notify**; only same-station title changes do, at most one notification per 2000 ms debounce window.
- **Duplicate suppression:** the `oidarwave-notification` tag replaces the previous notification rather than stacking.

## Configuration (hardcoded constants)
- Debounce delay: `2000` ms in `handleTrackChange`
- Notification lifetime: `10000` ms in `sendNotification`
- Storage key: `'notificationsEnabled'` (value `'true'`/`'false'` via `PlayerCore`)
- Notification title: `'Oidarwave - Neuer Titel'`; tag: `'oidarwave-notification'`; icon: `/favicon/favicon.svg`
- Toggle element: `#notificationToggle`; page marker: `#audioPlayer`

## Testing Considerations
- Toggle hidden when the Notification API is missing or `#audioPlayer` is absent (video page), visible on the radio page
- Enable flow: permission request → granted persists `'true'`; denied shows the alert and leaves the preference off
- Rapid same-station title changes collapse into a single notification after 2000 ms
- Station switch produces no notification but resets the debounce timer and state
- Placeholder titles (`'Keine Titelinformationen'`, `'Metadaten nicht verfügbar'`) and empty titles are ignored
- Notification content, 10 s auto-close, and click-to-focus behavior
- `module.exports = { NotificationManager }` allows unit-testing the class outside the browser
