---
type: integration
title: Electron Integration
description: The Electron main process handles window creation, secure file protocol handling, dynamic page discovery, and application lifecycle management for the Oidarwave desktop app.
tags: [electron, main-process, window-management, protocol-handling, packaging]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-03T14:41:27.574Z
sources:
  - id: openwiki-source-3d9e72730d09405d8d9107c1
    resource: repo://electron/main.js
generated: { by: "openwiki/0.5.0", at: "2026-09-03T14:41:27.574Z" }
---

## Overview

The Electron integration in Oidarwave centers around `electron/main.js`, which manages the application's main process. It is responsible for creating the application window, handling navigation and routing, securing file access, managing the application lifecycle, and working with electron-builder for cross-platform packaging.

## Window Creation

The `createWindow()` function initializes the main `BrowserWindow` with specific characteristics:

- Dimensions: 1200x800 pixels
- Initial state: hidden (`show: false`) to prevent white flash, then shown when `ready-to-show` event fires
- Background color: `#0f172a` (matches CSS variable `--color-bg-base`)
- Icon: `favicon/favicon.svg`
- Web preferences focused on security:
  - `nodeIntegration: false` - prevents Node.js integration in renderer
  - `contextIsolation: true` - isolates Electron APIs from renderer
  - `webSecurity: true` - enables same-origin policy
  - `sandbox: true` - enables Chromium sandboxing for renderer processes

The function also sets up navigation handlers to:
- Open external HTTP/HTTPS links in the system default browser
- Handle custom `oidarwave://` routes by converting them to file paths
- Fallback to `index.html` for unmatched routes
- Prevent navigation bypasses by handling both `will-navigate` and `will-redirect` events
- Manage new window creation for file:// and oidarwave:// links with identical security settings

## Page Discovery and Routing

Oidarwave uses dynamic page discovery to map URL routes to local HTML files without a development server:

1. **Discovery Process**: 
   - `discoverPages()` recursively scans the application directory for `index.html` files
   - Ignores directories listed in `.npmignore` (defaults: `node_modules`, `.git`, `dist`, `electron`)
   - Builds a route map containing:
     - `route`: URL path (e.g., `/settings`)
     - `file`: absolute path to the HTML file
     - Normalized versions for matching

2. **Route Matching**:
   - `matchesRoute()` compares the requested path against discovered pages
   - Supports exact matches, path variations with/without trailing slashes, and index.html suffixes
   - Uses decoded pathnames to handle URL encoding properly

3. **Caching**:
   - `getAvailablePages()` memoizes the discovery result to avoid repeated filesystem scans
   - Root page (`/`) is manually added to the discovered pages list

## Protocol Handling

Two custom protocols are implemented for secure resource loading:

### File Protocol Override
- Intercepts standard `file:` requests to prevent directory traversal attacks
- Strips query parameters and hash fragments before path resolution
- Validates that resolved paths are within the application directory
- Returns a `net.fetch()` response for allowed paths or error responses for violations

### Custom Oidarwave Protocol
- Handles `oidarwave://` URLs in navigation handlers
- Converts to standard file paths by removing the protocol prefix and leading slashes
- Leverages the same page discovery and matching logic as standard navigation

## Application Lifecycle

- `app.whenReady()`: Initializes the application by creating the window
- `app.on('activate')`: Recreates a window when the app is activated (macOS) and no windows exist
- `app.on('window-all-closed')`: Quits the application when all windows close (except on macOS, where menus remain until explicit quit)

## Packaging Configuration

Packaging is managed via electron-builder with configuration in `package.json`:

### Scripts
- `npm start`: Runs `electron .` for development
- `npm dist`: Builds for all platforms (`-mwl`)
- Platform-specific scripts: `dist:linux`, `dist:win`, `dist:mac`

### Build Options
- **Common**:
  - `appId`: `app.oidarwave.vercel`
  - `productName`: `Oidarwave`
  - Output directory: `dist`
  - Files included: electron/, src/, index.html, favicon/, manifest.json, video/, impressum/
  - ASAR archiving: enabled
  - Normal compression

- **Windows**:
  - Targets: NSIS (x64/arm64) and ZIP (x64/arm64)
  - Icon: `favicon/favicon.ico`
  - Requested execution level: `asInvoker`
  - NSIS options: allows changing install directory, creates desktop and start menu shortcuts (not one-click)

- **macOS**:
  - Target: ZIP
  - Icon: `favicon/favicon.icns`
  - Category: `public.app-category.audio`

- **Linux**:
  - Targets: AppImage, deb, tar.gz, rpm (x64/arm64)
  - Icon: `favicon/favicon.svg`
  - Category: `AudioVideo`
  - Syncs desktop name with `desktopName` field

## Security Considerations

- **Renderer Process Isolation**: Strict `webPreferences` prevent direct access to Node.js and Electron APIs
- **Sandboxing**: Explicit `sandbox: true` enables Chromium's renderer sandbox
- **Navigation Security**: 
  - External links open in system browser, not within the app
  - Protocol handlers validate all file access
  - New windows inherit the same security settings
- **Path Traversal Prevention**: File protocol handler resolves and validates paths against the application directory boundary

## Integration Points

- Works with the frontend codebase by serving static HTML/CSS/JS files from the project root
- Relies on electron-builder for cross-platform distribution (see `/openwiki/integrations/electron-builder.md`)
- Build workflows are documented in `/openwiki/workflows/electron-build.md`
