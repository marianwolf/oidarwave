---
type: guide
title: Development Setup
description: How to run Oidarwave locally for development, either as a static web page or using Electron.
tags: [development, electron, static, local]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-3d9e72730d09405d8d9107c1
    resource: repo://electron/main.js
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# Development Setup

Oidarwave can be run in two ways for development:
1. As a static web page in any modern browser.
2. As an Electron desktop application.

## Prerequisites

- [Node.js](https://nodejs.org/) (for the Electron version)
- Git (optional, for cloning the repository)

## Getting the Source Code

Clone the repository:

```bash
git clone https://github.com/marianwolf/oidarwave.git
cd oidarwave
```

## Installing Dependencies (Electron only)

The static version does not require any dependencies. For the Electron version, install the Node.js dependencies:

```bash
npm install
```

## Running the Static Version

Simply open the `index.html` file in your preferred web browser:

```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

Alternatively, you can drag and drop `index.html` into your browser.

## Running the Electron Version

Start the Electron application with:

```bash
npm start
```

This is equivalent to running `electron .` and will launch the Oidarwave desktop app.

## Development Workflow

- **Static changes (HTML, CSS, JavaScript, assets):** 
  Make your changes and reload the Electron window (or refresh the browser if using the static version).
- **Electron main process changes:**
  Changes to `electron/main.js` require a full restart of the Electron application.

## Debugging

- To open the developer tools in the Electron app, you can currently add a menu item or use the keyboard shortcut (if you have the devtools open). 
  Alternatively, you can modify `electron/main.js` to open the devtools by default during development:
  ```javascript
  mainWindow.webContents.openDevTools();
  ```
  Remember to remove this before committing.

## Building for Production

See the [Build Guide](./build.md) for instructions on creating distributable packages.

## Related Pages

- [Build Guide](./build.md)
- [Quickstart](../quickstart.md)
