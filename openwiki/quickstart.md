---
type: guide
title: Quickstart
description: Learn how to run Oidarwave locally, understand the project structure, and build desktop or web versions.
tags: [getting-started, installation, build, development]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-03T14:41:27.574Z
sources:
  - id: openwiki-source-3d9e72730d09405d8d9107c1
    resource: repo://electron/main.js
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "openwiki/0.5.0", at: "2026-09-03T14:41:27.574Z" }
---

# Quickstart

Oidarwave is a minimalist, ad-free webradio that runs both as a static web application and as a desktop application via Electron. This guide covers running the project locally for development, understanding the core file structure, and building distribution packages.

## Running Locally

### As a Static Web App

The simplest way to run Oidarwave is to open the `index.html` file directly in a web browser. No build step or dependencies are required.

1. Clone the repository:
   ```bash
   git clone https://github.com/marianwolf/oidarwave.git
   ```
2. Navigate to the project directory and open `index.html` in your preferred browser:
   ```bash
   cd oidarwave
   open index.html  # macOS
   start index.html # Windows
   xdg-open index.html # Linux
   ```

Alternatively, use the live demo at [https://oidarwave.vercel.app](https://oidarwave.vercel.app) {repo://README.md#L13,L43}.

### Using Electron

For a desktop-like experience with additional capabilities (e.g., file system access for history export), run the Electron wrapper.

1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Electron application:
   ```bash
   npm start
   ```
   This executes `electron .`, launching the main process defined in `electron/main.js` {repo://package.json#L8,L9} {repo://electron/main.js#L1-L5}.

## Project Structure

Understanding the layout helps navigate the codebase:

- `index.html`: The primary entry point for both web and Electron versions. Loads all CSS and JavaScript modules.
- `electron/main.js`: Electron main process responsible for window creation, menu setup, and protocol handling {repo://electron/main.js#L1-L5}.
- `src/`: Contains application logic split into modules:
  - `css/style.css`: Styling
  - `js/`: Feature-specific scripts (player, cookie consent, notifications, history, etc.)
- `favicon/`: Application icons
- `video/`: Static video-related assets (if any)
- `impressum/`: Legal imprint content
- `manifest.json`: Web app manifest for PWA capabilities
- `.npmignore`: Specifies directories to exclude when discovering pages in Electron {repo://electron/main.js#L12-L13,L20}.

The project follows a modular approach where each JavaScript file in `src/js/` handles a distinct concern (e.g., `player.js` manages audio/video playback, `history.js` manages playback history) {repo://index.html#L30-L37}.

## Building for Desktop

Oidarwave uses [Electron Builder](https://www.electron.build/) to create distributable packages for Windows, macOS, and Linux.

### Build All Platforms

```bash
npm run dist
```
This runs `electron-builder -mwl`, generating installers in the `dist/` directory {repo://package.json#L9}.

### Platform-Specific Builds

- **Windows**: `npm run dist:win` (creates NSIS installer and ZIP) {repo://package.json#L11}
- **macOS**: `npm run dist:mac` (creates ZIP archive) {repo://package.json#L12}
- **Linux**: `npm run dist:linux` (creates AppImage, deb, tar.gz, and RPM) {repo://package.json#L10}

Build artifacts include:
- `electron/**/*`: Main process code
- `src/**/*`: Renderer process assets
- `index.html`, `favicon/**/*`, `manifest.json`: Core web assets
- `video/**/*`, `impressum/**/*`: Additional static content {repo://package.json#L22-L30}.

## Building for Web

The web version is optimized for static hosting and is already configured for deployment on Vercel. To build locally for preview:

1. Ensure the `dist` directory from Electron Builder is clean (the web build uses the same source files).
2. Since no transpilation or bundling is required, the contents of the project directory (excluding `electron/` and `node_modules/`) constitute the deployable web artifact.
3. Push to a Git repository connected to Vercel for automatic deployments, or use the Vercel CLI manually.

The live demo at [https://oidarwave.vercel.app](https://oidarwave.vercel.app) reflects the latest static build {repo://README.md#L13,L43}.

## Next Steps

- Explore the [System Architecture Overview](/openwiki/architecture/overview.md) to understand how components interact.
- Learn about [Desktop-specific features](/openwiki/architecture/electron.md) like menu integration and protocol handling.
- Refer to the [Build Process](/openwiki/operations/build.md) for detailed packaging options and customization.
