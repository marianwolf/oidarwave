---
type: concept
title: User Interface (Radio & Video)
description: Describes the static HTML pages for radio and video, layout, station selection, and controls.
tags: [ui, frontend, html, css, radio, video]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-33fe8af39d03bafe71e83dc8
    resource: repo://src/css/style.css
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
  - id: openwiki-source-344a605cf9b55b2039c6ed87
    resource: repo://video/index.html
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

## Overview

The Oidarwave user interface consists of two primary static HTML pages:
- **Radio** (`index.html`): Audio streaming interface with station selector and playback controls.
- **Video** (`video/index.html`): Video streaming interface with additional controls for data mode and captions.

Both pages share a common structural foundation defined in `src/css/style.css` and utilize the same player logic in `src/js/player.js` to handle media playback, metadata updates, and user interactions.

## Common Layout Structure

### Container and Header
Both pages use a centered container (`max-width: 1200px`) with vertical spacing. The header includes:
- Logo: Animated gradient text ("🎵 Oidarwave") using CSS variables for brand colors.
- Navigation: Links to Radio, Video, Kontakt, and Beta, styled with hover effects and rounded-pill borders.

### Glassmorphism Design
Key UI sections (header, station selector, player controls, cookie banner) share a glassmorphism aesthetic:
- Background: `rgba(30, 41, 59, 0.4)` with backdrop-filter blur(24px)
- Border: 1px solid `rgba(255, 255, 255, 0.1)`
- Border-radius: `var(--radius-lg)` (1.5rem)
- Shadow: `var(--shadow-glass)` (0 8px 32px 0 rgba(0, 0, 0, 0.37))

## Radio Interface (`index.html`)

### Station Selector
- Section heading: "📻 Sender auswählen"
- Grid layout: `repeat(auto-fill, minmax(140px, 1fr))` for responsive station buttons
- Station buttons:
  - Display station name (e.g., "Deutschlandfunk", "NDR 1 NDS")
  - Store stream URL in `data-url` attribute
  - Store metadata URL (for song titles) in `data-metadata-url` attribute (where applicable)
  - Hover effects: slight lift, border highlight, and gradient overlay
  - Active state: visual indication of selected station

### Player Controls
- Current station display:
  - Status indicator (dot) showing online/error/buffering/paused states via CSS classes
  - Station name text (initially "Sender auswählen")
  - Notification toggle button (bell icon) for title-change alerts
- Current song title display (`#currentSongTitle`)
- Audio player element (`#audioPlayer`) with custom controls hidden (custom UI overrides native controls)

## Video Interface (`video/index.html`)

### Station Selector
- Section heading: "🎥 Sender auswählen"
- Video station buttons (Das Erste, ZDF, ARTE, Tagesschau24) with HLS stream URLs in `data-url`
- Additional toggle buttons:
  - **Datensparmodus** (`#dataModeToggle`): Toggles low-data mode (reduces video quality)
  - **CC Untertitel** (`#captionToggle`): Toggles closed captions

### Video Player
- Video container with responsive width (100% max, 95% on narrow screens)
- Video element (`#videoPlayer`):
  - Preload: none
  - Poster: `/video-placeholder.png`
  - Playsinline and crossorigin attributes for mobile compatibility
  - Fallback message for unsupported browsers

## Styling and Responsiveness

### CSS Variables
Defined in `:root` of `style.css`:
- Colors: `--color-bg-base` (dark blue-gray), `--color-text-main` (off-white), brand colors (purple/pink gradients)
- Status colors: `--color-status-online` (green), `--color-status-error` (red), etc.
- Spacing: `--space-xs` to `--space-2xl` (0.25rem to 3rem)
- Radius: `--radius-sm` to `--radius-full` (0.5rem to 9999px)
- Fonts: `--font-heading` (Outfit), `--font-body` (Inter)
- Transitions: `--transition-snappy` (0.2s), `--transition-smooth` (0.4s)

### Video-Specific Styles (`style-video.css`)
- Video player and container: width 100%, height auto, border-radius applied
- Toggle buttons (data mode, caption):
  - Background: `rgba(255, 255, 255, 0.15)` with backdrop-filter blur(10px)
  - Active states: increased opacity, border changes, and accent color background
  - Hover effects: enhanced visibility

## Interaction and Controls

### Station Selection
Implemented in `src/js/player.js`:
- All `.station-btn` elements receive click listeners
- On selection:
  - Remove `active` class from all buttons, add to clicked button
  - Update `#currentStation` with station name from `data-name`
  - Store selected URL in `localStorage` (`lastStationAudioUrl` or `lastStationVideoUrl`)
  - Set player source and attempt playback

### Playback and Status
- Media events (`loadstart`, `canplay`, `playing`, `pause`, `waiting`, `error`) trigger `updateOverallStatus()`
- Status indicator (`#statusIndicator`) updates CSS class:
  - `online`: playing normally
  - `error`: offline or media error
  - `buffering`: waiting for data
  - `paused`: user paused playback
- Keyboard shortcuts (via `handleKeyDown`):
  - Space: play/pause
  - ArrowUp/ArrowDown: volume control
  - ArrowLeft/ArrowRight: seek backward/forward 10 seconds
  - M: mute toggle
  - Escape: stop playback and clear session

### Media Session API
- Lock screen controls (play/pause/stop) integrated via `navigator.mediaSession`
- Metadata includes station name, title, artist, and album art (favicon)

## Integration with Player Logic

The `initializePlayer()` function in `player.js` dynamically adapts to either audio or video context:
- Detects presence of `#audioPlayer = audioPlayer || videoPlayer
- Sets appropriate event listeners and storage keys
- Handles media session setup based on current station name
- Manages playback state, error recovery, and history tracking via `StationHistory`

Both radio and video interfaces rely on this shared logic, ensuring consistent behavior across media types while accommodating their respective DOM elements and attributes.
