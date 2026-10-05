---
type: architecture
title: User Interface Components
description: Description of DOM structure, station selector, controls, notifications, history, and favorites UI elements.
tags: [frontend, user-interface, components]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-33fe8af39d03bafe71e83dc8
    resource: repo://src/css/style.css
  - id: openwiki-source-399a6a20fee1e90b61c555cb
    resource: repo://src/js/notification.js
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

# User Interface Components

## Overview

The Oidarwave web player features a clean, glassmorphism-inspired interface divided into distinct sections: header, main player area (station selector and player controls), footer, and cookie consent banner. The UI is built with semantic HTML5 elements and styled using CSS custom properties for theming and responsive layout.

## DOM Structure

The primary container uses a flex column layout with defined sections:

```html
<body>
    <div class="container">
        <header>...</header>
        <main id="radio">
            <section class="player-section">
                <div class="station-selector">...</div>
                <div class="player-controls">...</div>
            </section>
        </main>
        <footer>...</footer>
    </div>
    <div class="cookie-banner" id="cookieBanner">...</div>
</body>
```

### Header
- Contains the logo (🎵 Oidarwave) and primary navigation links (Radio, Video, Kontakt, Beta)
- Glassmorphism background with blur effect and border
- Responsive flex layout that wraps navigation items on smaller screens

### Station Selector
- Section heading: "📻 Sender auswählen"
- CSS grid layout (`station-grid`) with auto-fill columns (minimum 140px)
- Station buttons (`station-btn`) with:
  - `data-url`: Stream URL
  - `data-name`: Station display name
  - `data-metadata-url`: Endpoint for track metadata
  - Hover effects with gradient overlay and transform
  - Active state styling (applied via JavaScript when selected)

### Player Controls
- **Current Station Display**:
  - Status indicator dot (`#statusIndicator`) showing player state via color:
    - `#10b981` (online), `#ef4444` (error), `#f59e0b` (buffering), `#3b82f6` (paused)
  - Station name span (`#currentStation`)
  - Notification toggle button (`#notificationToggle`) with SVG bell icon
- **Audio Controls**:
  - Native HTML5 `<audio>` element with `controls` attribute
  - Current song title span (`#currentSongTitle`)
- Glassmorphism container with padding and gap spacing

### Footer
- Copyright information and imprint link
- Flex layout with centered content and profile image

### Cookie Banner
- Dialog role with polite aria-live for accessibility
- Accept/decline buttons for consent management
- Glassmorphism styling consistent with other components

## Component Responsibilities

### Station Selector
- Renders available radio stations as interactive buttons
- Handles station selection via click events (delegated to `player.js`)
- Provides visual feedback for hover and active states
- Stores station metadata (URL, name, metadata endpoint) in button data attributes

### Player Controls
- Displays current playback status and station information
- Manages audio playback via native HTMLMediaElement API
- Provides notification toggle for user preference management
- Shows real-time track updates in `#currentSongTitle`
- Coordinates with history tracking for session management

### Notification Toggle
- Integrated within player controls as a button
- Manages browser notification permissions and user preferences
- Updates UI state (label, title, active class) based on enabled/disabled state
- Persists preference in localStorage key `notificationsEnabled`

### Cookie Banner
- Handles GDPR/cookie consent compliance
- Stores user preference in localStorage
- Prevents redundant display after user decision
- Provides accessible dialog interface

## State and UI Updates

### Playback State Changes
- **Status Indicator**: Color changes via CSS custom properties:
  ```css
  --color-status-online: #10b981;
  --color-status-error: #ef4444;
  --color-status-buffering: #f59e0b;
  --color-status-paused: #3b82f6;
  ```
- **Station Name**: Updated in `#currentStation` when station changes
- **Track Title**: Updated in `#currentSongTitle` via metadata refresh
- **Audio Player**: Native controls handle play/pause/seek; custom event listeners manage state

### Notification System
- Toggle button updates:
  - Label: Switches between "Benachrichtigungen aktivieren"/"deaktivieren"
  - Title attribute and ARIA label reflect current state
  - `active` class added when enabled for visual indication
- Permission handling:
  - Denied: Shows browser-specific alert
  - Not requested: Triggers permission request flow
  - Granted: Proceeds with enabling/disabling

### History and Favorites Integration
- While not direct UI components, history and favorites influence UI state:
  - **History**: Last played station restored on load via `lastStationAudioUrl` storage key
  - **Favorites**: Favorite station stored in `user_favorites` localStorage key; UI could highlight favorite stations in selector (current implementation does not show visual indicator but data is available for extension)

## Responsive Design
- Container max-width: 1200px with horizontal padding
- Station grid uses auto-fill columns that adapt to viewport width
- Navigation wraps on smaller screens
- Glassmorphism effects maintained across breakpoints
- Touch-friendly button sizes (minimum 44x44px per accessibility guidelines)

## Accessibility Features
- Semantic HTML elements (header, main, section, nav, button)
- ARIA labels and roles:
  - Notification toggle: `aria-label` updates with state
  - Cookie banner: `role="dialog"` and `aria-live="polite"`
  - Nav: `aria-label="Hauptnavigation"`
- Color contrast compliance for text and UI elements
- Focus visible styles for keyboard navigation (inherited from button defaults)
- Reduced motion respect via CSS transitions that honor user preferences

## Implementation Details

### Initialization
- UI components initialized via DOMContentLoaded event listeners in respective JS modules:
  - `notification.js`: Sets up notification toggle event listener
  - `player.js`: Initializes player controls and station button handlers
  - `cookie.js`: Manages cookie banner acceptance/decline
  - `favorite.js`/`history.js`: Load preferences without direct UI manipulation

### Styling Approach
- CSS custom properties for theme colors, spacing, radii, shadows, and transitions
- Glassmorphism effect via:
  - `background: rgba(30, 41, 59, 0.4)`
  - `backdrop-filter: blur(24px)`
  - Subtle border and shadow
- Gradient text animation for logo
- Smooth transitions for interactive states (hover, focus, active)

### Integration Points
- **Notifications**: Toggles UI state and sends browser notifications via `NotificationManager`
- **History**: Updates station sessions on play/pause events; restores last station
- **Favorites**: Managed via localStorage; provides data for potential UI extension
- **Player Core**: Media session integration for system controls and lock screen

## Limitations and Extension Points
- No visual indicator for favorite stations in selector (data available in `favorite.js`)
- Station selector could be enhanced with search/filter functionality
- Cookie banner could accept granular consent categories
- Dark mode could be implemented via additional CSS custom property set
- Favorite management UI (add/remove) not present in current implementation
