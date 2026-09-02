---
type: architecture
title: System Architecture Overview
description: A high-level description of Oidarwave's components including the user interface, media player, persistence mechanisms, Electron desktop wrapper, and build system, along with their interactions and responsibilities.
tags: [architecture, overview, components, electron, ui, player, persistence, build]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-3d9e72730d09405d8d9107c1
    resource: repo://electron/main.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# System Architecture Overview

Oidarwave is a desktop application for listening to web radio streams, built with web technologies (HTML, CSS, JavaScript) and wrapped in Electron for cross-platform desktop distribution. The application is structured around several key components that work together to provide a seamless user experience.

## User Interface (UI)

The UI is the visual and interactive part of the application that users interact with. It is defined in `index.html` and styled by `src/css/style.css`. The UI components include:
- A header with logo and navigation links (Radio, Video, Contact, Beta)
- A main section for the radio player, featuring:
  * A station selector grid with buttons for each available radio stream
  * Player controls displaying the current station, song title, and audio controls
  * Status indicators for playback state (online, error, buffering, paused)
- A footer with copyright and links to imprint and privacy policy
- A cookie consent banner that appears until the user makes a choice

The UI is responsible for:
- Presenting information to the user in a clear and accessible manner
- Handling user interactions (clicks, keyboard events) and translating them into actions
- Updating the display based on the application state (e.g., current station, playback status)

Entrypoints: The UI is initialized when the Electron window loads `index.html`. All UI-related JavaScript modules are loaded via `<script>` tags in the HTML head.

## Media Player

The media player component handles the playback of audio and video streams. It is implemented in `src/js/player.js` and is responsible for:
- Managing an HTML5 `<audio>` or `<video>` element (depending on the stream type)
- Loading and playing streams from URLs provided by the station selector
- Handling media events (play, pause, error, waiting, etc.) to update the UI and track state
- Fetching and displaying metadata (e.g., current song title) from station-provided metadata URLs
- Integrating with the browser's Media Session API for lock screen and system controls (on supported platforms)
- Persisting the last selected station in `localStorage` so it can be restored on next launch

The player component is initialized by calling `initializePlayer()` from the UI scripts. It sets up event listeners on the media element and the station buttons.

## Persistence Layer

Oidarwave uses the browser's `localStorage` (available in the Electron renderer process) to persist data across sessions. The persistence layer is split into two main concerns:

1. **Cookie Consent** (`src/js/cookie.js`):
   - Tracks whether the user has accepted or declined cookie consent for analytics scripts
   - Stores a timestamp to enforce expiration (90 days)
   - Enables or disables the loading of third-party analytics scripts (Vercel, Google Tag Manager) based on consent

2. **Station History** (`src/js/history.js`):
   - Maintains a history of listened-to stations, including timestamps and duration of listening sessions
   - Migrates old data formats to a newer structure that uses UUIDs for station identification
   - Tracks the currently active station and updates session data when playback starts or stops

Both modules use `localStorage` directly and handle errors gracefully by logging warnings to the console.

## Electron Wrapper

The Electron wrapper provides the desktop application shell and integrates web technologies with the operating system. It is implemented in `electron/main.js` and is responsible for:
- Creating the main `BrowserWindow` with specific dimensions, security settings, and visual properties (hidden initially to avoid white flash)
- Implementing secure navigation handling:
  * Blocking navigation to external protocols unless explicitly allowed
  * Opening external HTTP/HTTPS links in the system default browser
  * Handling custom `oidarwave://` protocol URLs by mapping them to local files
  * Preventing navigation bypasses by intercepting `will-navigate` and `will-redirect` events
- Overriding the default `file:` protocol to prevent directory traversal attacks (only allowing files within the application directory)
- Managing the application lifecycle (window creation, activation, and quit behavior per platform)
- Working with electron-builder for cross-platform packaging (as configured in `package.json`)

The main process is the entrypoint of the application when launched via `electron .` or the packaged binary.

## Build and Packaging System

The build system transforms the source code into distributable desktop applications for Windows, macOS, and Linux. It is configured in `package.json` under the `build` field and uses electron-builder. Key responsibilities include:
- Defining the application identifier (`appId`), product name, and output directory
- Specifying which files and directories to include in the build (e.g., `electron/`, `src/`, `index.html`, etc.)
- Enabling ASAR archiving to secure and compress the application resources
- Setting compression level to normal
- Configuring platform-specific options:
  * Windows: NSIS and ZIP installers, setting the application icon and execution level
  * macOS: DMG and ZIP archives, setting the icon and application category
  * Linux: AppImage, deb, tar.gz, and RPM packages, setting the icon and desktop category

The build system is invoked via npm scripts:
- `npm start`: Runs the unpackaged Electron application for development
- `npm dist`: Builds for all platforms (macOS, Windows, Linux)
- Platform-specific scripts: `dist:mac`, `dist:win`, `dist:linux`

## Data and Control Flow

The application follows a unidirectional data flow pattern where possible, though some components interact directly due to the simplicity of the app.

1. **Startup**:
   - The Electron main process (`electron/main.js`) creates the BrowserWindow and loads `index.html`.
   - The HTML loads the CSS and JavaScript modules.
   - The UI modules (cookie, history, player) initialize and set up event listeners.
   - The cookie module checks for existing consent and shows the banner if needed.
   - The history module loads past listening history from `localStorage`.
   - The player module initializes the media element and restores the last played station if available.

2. **User Interaction (e.g., selecting a station)**:
   - The user clicks a station button in the UI.
   - The button's click handler (set up in `player.js`) calls `selectStation(button)`.
   - `selectStation` updates the UI (active button, current station display), stores the URL in `localStorage`, clears any existing metadata interval, and sets the media element's source to the new URL.
   - The media element begins loading and fires events that are handled by the player module to update the UI (status indicator, song title) and manage the media session.

3. **Playback Events**:
   - As the media element emits events (play, pause, error, etc.), the player module updates the UI status indicator and communicates with the history module to start or stop tracking a listening session.
   - The history module updates the session data in `localStorage` when playback starts or stops.

4. **Cookie Consent**:
   - When the user clicks "Accept" or "Decline" on the cookie banner, the cookie module updates `localStorage` and either enables or disables the loading of analytics scripts.
   - If accepted, the cookie module injects the necessary script tags for Vercel and Google Tag Manager analytics.

5. **Navigation (Electron)**:
   - When a link is clicked in the renderer process, Electron's `will-navigate` event is intercepted by the main process.
   - The main process checks the URL: if it's an external http/https link, it opens it in the system browser; if it's a custom `oidarwave://` link, it converts it to a file path and loads the corresponding local HTML file; otherwise, it defaults to `index.html`.
   - The main process also ensures that all file protocol requests are checked against the application directory to prevent directory traversal.

## Lifecycle and State Management

- **Application Lifecycle**:
  - Started by the Electron main process when the `app` module emits `ready`.
  - The main window is created and shown once ready.
  - On macOS, the application stays active when all windows are closed until explicit quit; on Windows and Linux, quitting when the last window closes.
  - When activated (e.g., clicking the dock icon while no windows are open), a new window is created if none exist.

- **Component State**:
  - UI state (e.g., which station is selected, playback status) is managed by the player module and reflected in the DOM.
  - Persistence state (cookie consent, history) is stored in `localStorage` and read on startup.
  - The Electron main process does not maintain application state beyond window management; state is maintained in the renderer process via `localStorage` and the DOM.

## Extension Points and Configuration

- **Adding New Radio Stations**: New stations can be added by inserting a new button in the station grid in `index.html` with the appropriate `data-url`, `data-name`, and `data-metadata-url` attributes.
- **Changing Appearance**: The UI can be styled by modifying `src/css/style.css`.
- **Modifying Build Configuration**: The `package.json` file controls the build process; changing the `build` field or npm scripts alters how the application is packaged.
- **Electron Security**: The main process in `electron/main.js` can be modified to change window properties, navigation handling, or protocol overrides.

## Important Invariants and Failure Modes

- **Security**:
  - The Electron wrapper uses `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, and `sandbox: true` to isolate the renderer process and prevent privilege escalation.
  - Custom protocol and file protocol overrides are designed to prevent directory traversal and unauthorized file access.

- **Resource Loading**:
  - If the user declines cookie consent, analytics scripts are not loaded, preserving privacy.
  - The application gracefully handles missing metadata URLs by displaying a placeholder message.

- **Playback Reliability**:
  - The player module detects and reports errors (e.g., network issues, invalid streams) via the UI status indicator.
  - Stalled playback (buffering) is detected and reflected in the status indicator.

- **Persistence Limits**:
  - The cookie consent and history data are subject to `localStorage` storage limits and may be cleared by the user or browser mechanisms.
  - The history module includes a mechanism to expire entries after 90 days.

- **Cross-Platform Consistency**:
  - The application aims to provide a consistent experience across Windows, macOS, and Linux, with platform-specific adjustments only in the build configuration and Electron lifecycle handling (e.g., dock behavior on macOS).
