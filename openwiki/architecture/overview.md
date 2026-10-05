---
type: architecture
title: System Architecture Overview
description: A high-level overview of the Oidarwave system, describing the web application, Electron desktop wrapper, and PWA components, their responsibilities, and how they interact.
tags: [architecture, system, electron, pwa]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-3d9e72730d09405d8d9107c1
    resource: repo://electron/main.js
  - id: openwiki-source-f1bff8690b5228413c107c8d
    resource: repo://favicon/favicon.svg
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-b25e71362ad2d0521bb4e04c
    resource: repo://manifest.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-f5dd57353d17e5dc5ea58a83
    resource: repo://src/js/cookie.js
  - id: openwiki-source-cd156ee2be7a00377eeb8dbd
    resource: repo://src/js/history.js
  - id: openwiki-source-399a6a20fee1e90b61c555cb
    resource: repo://src/js/notification.js
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---
# System Architecture Overview

## Purpose

Oidarwave is a web radio player that provides access to various radio stations and video livestreams. The system is designed to run in three contexts: as a standard web application, as a Progressive Web App (PWA) installable via the browser, and as a desktop application using Electron. This document describes the high-level architecture, responsibilities of each component, and their interactions.

## Components

### Web Application (PWA)

The core user interface and functionality are implemented as a web application located in the repository root. Key files include:
- `index.html`: The main entry point, structuring the UI with headers, navigation, and sections for radio and video.
- `/src/js/`: Contains JavaScript modules responsible for player logic, notifications, history, cookies, and metadata handling.
- `manifest.json`: Defines PWA metadata such as name, icons, start URL, display mode, and share target, enabling installation and offline-capable behavior in compatible browsers.
- `favicon/`: Provides icons used by both the web and Electron versions.

The web application is responsible for:
- Rendering the user interface (station selection, player controls, now-playing information).
- Managing audio playback via the HTML5 `<audio>` element.
- Fetching and parsing station metadata to display current track information.
- Handling user interactions (station selection, volume control, notification preferences).
- Persisting user preferences (last station, volume, notification settings) using `localStorage` and cookies.
- Implementing browser notifications for track changes (see `/openwiki/architecture/notifications.md` for details).
- Providing a video section (`/video`) for livestreams.

### Electron Wrapper

The Electron wrapper, located in `electron/main.js`, provides a desktop-native experience by embedding the web application in a Chromium BrowserWindow. Its responsibilities include:
- Creating and managing the application window with specific dimensions, background color, and security settings (context isolation, sandboxing).
- Implementing custom navigation handling:
  - Intercepting navigation attempts to external URLs and opening them in the system browser.
  - Supporting a custom protocol `oidarwave://` for internal navigation to dynamically discovered local pages.
  - Preventing navigation to `mailto:` links (handled by the system).
- Dynamically discovering available HTML subpages at startup by scanning the application directory for `index.html` files (excluding ignored directories like `node_modules`, `.git`, etc.) and building a route map.
- Overriding the `file` protocol to securely serve local assets, preventing directory traversal attacks while allowing the web app to request resources via absolute paths (e.g., `/src/css/style.css`).
- Managing the application lifecycle (window activation, quit on window-all-closed except on macOS).

The Electron wrapper does not modify the web application's logic; it simply provides a secure container and enhanced integration with the desktop environment (e.g., taskbar integration, menu bar).

## Interactions

### Navigation and Routing

- In the web/PWA context, navigation is handled by standard HTML links and browser history. The application uses client-side routing implicitly: links to `/` (radio) and `/video` (video section) are handled by the same `index.html` which conditionally renders sections based on the current path (via CSS/JS not shown in the provided files but implied by the structure).
- In Electron, the main process intercepts all navigation events (`will-navigate`, `will-redirect`, `setWindowOpenHandler`). For `oidarwave://` URLs, it maps the route to a local file path using the pre-discovered page map and loads the corresponding `index.html` file. For external http/https URLs, it delegates to the shell to open in the system browser. All other navigations fall back to loading the root `index.html`.

### Main-Renderer Communication

The provided Electron main process does not establish explicit IPC channels with the renderer process. Communication between the main and renderer processes occurs indirectly:
- The renderer process (web app) makes standard web requests for assets (CSS, JS, images, metadata) which are served via the overridden `file` protocol in the main process.
- The main process influences the renderer's environment by setting `webPreferences` (e.g., `sandbox: true`, `contextIsolation: true`) and handling protocol schemes.

## Data Flow

1. **Startup**:
   - Electron main process reads configuration, sets up logging, and initializes error handlers.
   - It discovers available pages by scanning the file system for `index.html` files.
   - It creates a BrowserWindow with predefined options and loads `root/index.html`.

2. **Runtime (Web App)**:
   - The web application initializes modules (player, notifications, history, etc.) on DOMContentLoaded.
   - The player module sets up event listeners on the `<audio>` element to handle playback, stalls, errors, and metadata updates.
   - Metadata is fetched periodically (every 3 seconds) from station-specific URLs; when updated, it triggers UI updates and, if notifications are enabled, a notification via the NotificationManager.
   - User interactions (station clicks, volume changes) update the UI and persist settings to `localStorage`/`cookies`.
   - Notification permissions are managed via the NotificationManager, which stores the enabled state in `localStorage` and requests permissions from the browser as needed.

3. **Electron-Specific**:
   - The main process validates all file requests through the custom `file` protocol, ensuring they originate from within the application directory.
   - Navigation attempts are filtered: external links open in the system browser, internal `oidarwave://` routes are mapped to local files, and invalid navigations default to the home page.

## Lifecycle

- **Web Application**:
  - Begins when `index.html` is loaded (either directly, via PWA launch, or through Electron).
  - Initializes singleton managers (e.g., `window.notificationManager`) and sets up event listeners.
  - Continues as long as the page is open; state is preserved in `localStorage` and session storage.
  - Terminates when the page is closed or navigated away from.

- **Electron Wrapper**:
  - Begins when the `electron` command is executed (via `npm start` or built executable).
  - The main process creates the BrowserWindow and loads the web application.
  - The application remains active until all windows are closed (with platform-specific quit behavior).
  - On window activate (e.g., clicking the dock icon when no windows are open), a new window is created if none exist.

## Extension Points

- **Adding New Stations**: Modify the station buttons in `index.html` (or dynamically generate them from a configuration file) with appropriate `data-url`, `data-name`, and `data-metadata-url` attributes.
- **New Pages**: Add a new directory containing an `index.html` file anywhere in the project root (outside ignored directories). The Electron wrapper will automatically discover it and make it available via the `oidarwave://` protocol (e.g., `oidarwave:///newpage`).
- **Protocol Handling**: Extend the navigation logic in `electron/main.js` to handle additional custom protocols or modify the fallback behavior for unknown routes.
- **PWA Features**: Enhance `manifest.json` with additional icons, share target parameters, or background sync capabilities. Implement a service worker for offline caching (not present in the current codebase but supported by the manifest foundation).
