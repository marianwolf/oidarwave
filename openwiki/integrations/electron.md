---
type: integration
title: Electron Integration
description: Details of how the Electron wrapper adapts the web application for desktop execution, including window management, protocol handling, page discovery, and security configuration.
tags: [electron, desktop, integration]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-3d9e72730d09405d8d9107c1
    resource: repo://electron/main.js
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

## Purpose

The Electron integration transforms the web-based Oidarwave application into a desktop application by managing the application lifecycle, creating and configuring the main window, handling custom navigation protocols, and securing the rendering process. It enables client-side routing without hashbang by dynamically discovering available HTML pages and intercepting navigation events.

## Main Process Responsibilities

The main process (`electron/main.js`) handles:

### Window Creation and Configuration

- Creates a `BrowserWindow` with specific dimensions (1200x800), hidden initially to prevent white flash, and a dark background color (`#0f172a`).
- Sets security-focused `webPreferences`:
  - `nodeIntegration: false` to prevent Node.js access in the renderer.
  - `contextIsolation: true` to isolate Electron APIs.
  - `webSandbox: true` and `sandbox: true` for additional process restrictions.
  - `webSecurity: true` to enforce same-origin policy.
- Associates a custom icon (`favicon/favicon.svg`).

### Page Discovery and Routing

- Discovers available HTML pages by scanning the application directory for `index.html` files, excluding ignored directories (node_modules, .git, dist, electron, and those listed in `.npmignore`).
- Builds a route-to-file mapping for each discovered page, enabling clean URLs (e.g., `/about` maps to `about/index.html`).
- Caches the discovered pages to avoid repeated filesystem scans.

### Custom Protocol Handling

- Overrides the standard `file` protocol to serve local assets with security checks:
  - Strips query parameters and hash fragments from URLs.
  - Resolves absolute paths relative to the application directory when the direct path doesn't exist (mimicking web server behavior).
  - Prevents directory traversal attacks by ensuring resolved paths are within the application directory.
- Handles the custom `oidarwave://` protocol for internal navigation:
  - Converts `oidarwave:///path` to a file path.
  - Attempts to match the path against discovered pages; falls back to the root `index.html` if no match is found.

### Navigation and Event Handling

- Intercepts `will-navigate` and `will-redirect` events on all windows:
  - Opens `http://` and `https://` links in the system browser via `shell.openExternal`.
  - For non-external links, attempts to load the corresponding subpage using the protocol handlers; redirects to `index.html` on failure.
- Configures `setWindowOpenHandler` to manage `window.open()` calls:
  - External links and `mailto:` URLs are opened externally.
  - `file://` and `oidarwave://` URLs open in new windows with the same setup.
  - Returns `{ action: 'deny' }` to prevent Electron from creating the window manually, as the handler creates it explicitly.

### Application Lifecycle and Error Handling

- Initializes error handling via `initMainProcessErrorHandlers()` from `src/js/errors.js`.
- Creates the main window when Electron is ready (`app.whenReady()`).
- Recreates the window on activate (macOS) when no windows exist.
- Quits the application when all windows are closed, except on macOS.

## Security Configuration

The renderer process is hardened through multiple layers:
- **Context Isolation**: Prevents the renderer from accessing Electron or Node.js directly.
- **Sandboxing**: Enables Chromium's sandbox for the renderer process (`sandbox: true` in `webPreferences`).
- **Web Security**: Maintains same-origin policy (`webSecurity: true`).
- **Protocol Safety**: Custom `file` protocol includes path resolution and traversal checks.
- **Navigation Control**: All navigation is vetted through event handlers, blocking unintended resource loads.

## Build Integration

Defined in `package.json`:
- **Main Entry**: `"main": "electron/main.js"` points to the Electron startup script.
- **Build Scripts**:
  - `start`: Runs `electron .` for development.
  - `pack`: Creates a directory build with `electron-builder --dir`.
  - `dist`: Creates distributable packages via `electron-builder`.
  - Platform-specific: `dist:linux`, `dist:win`, `dist:mac`.
- **Electron Builder Configuration**:
  - **Application ID**: `app.oidarwave.vercel`.
  - **Product Name**: `Oidarwave`.
  - **Output Directory**: `dist`.
  - **Included Files**: Electron source, application source (`src/`), root assets (`index.html`, `manifest.json`), favicons, video, and impressum directories.
  - **Compression**: Normal.
  - **Archive Format**: ASAR enabled for security and performance.
  - **Platform-Specific**:
    - **Windows**: NSIS installer and ZIP archives for x64 and arm64, with icon and execution level set to `asInvoker`.
    - **macOS**: ZIP archive with `.icns` icon and audio category.
    - **Linux**: AppImage, deb, and tar.gz targets for x64 and arm64, with SVG icon and AudioVideo category.

## Relationship to Web Application

- The Electron wrapper loads the root `index.html` file (located in the project root) as the entry point.
- The web application source (`src/`) is included in the build and executed within the renderer process.
- Client-side navigation in the web app uses the `oidarwave://` protocol (e.g., `<a href="oidarwave:///about">About</a>`), which the main process translates to file paths and maps to discovered pages.
- Assets referenced in the web app (CSS, JS, images) are served via the customized `file` protocol, ensuring correct resolution whether bundled or loaded from disk.

## Initialization Sequence

1. Electron starts and executes `electron/main.js`.
2. Main process error handlers are initialized.
3. Window creation options are defined.
4. On `app.ready()`:
   - Discovers available HTML pages in the application directory.
   - Creates and configures the main `BrowserWindow`.
   - Sets up navigation event handlers on the window's `webContents`.
   - Loads `index.html` into the main window.
5. When a navigation event occurs:
   - External URLs are delegated to the system browser.
   - Internal URLs (`oidarwave://` or file paths) are resolved to discovered pages.
   - If a matching page is found, its HTML file is loaded; otherwise, falls back to `index.html`.
6. New windows (from `window.open()`) inherit the same setup and navigation handling.
