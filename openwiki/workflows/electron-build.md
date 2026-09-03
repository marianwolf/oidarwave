---
type: workflow
title: Electron Build Workflow
description: Workflow for building Oidarwave desktop applications using electron-builder for Windows, macOS, and Linux distributions.
tags: [electron, build, packaging, electron-builder, ci]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# Electron Build Workflow

This document describes the workflow for building the Oidarwave desktop application using Electron Builder. The workflow is driven by npm scripts defined in `package.json` and configured via the `build` section of the same file.

## Build Scripts

The following npm scripts are available for triggering builds:

- `npm run dist` – Builds for all platforms (macOS, Windows, Linux)
- `npm run dist:linux` – Builds Linux targets only
- `npm run dist:win` – Builds Windows targets only
- `npm run dist:mac` – Builds macOS targets only

These scripts directly forward arguments to the `electron-builder` CLI.

## Configuration

All build configuration resides in the `build` object of `package.json`. Key aspects include:

### Application Identification
- `appId`: `app.oidarwave.vercel`
- `productName`: `Oidarwave`

### File Inclusion
The `files` array specifies which directories and files are packaged:
- `electron/**/*` – Electron main and preload scripts
- `src/**/*` – Source code (renderer process)
- `index.html` – Main HTML entry point
- `favicon/**/*` – Application icons
- `manifest.json` – Web application manifest
- `video/**/*` – Video content
- `impressum/**/*` – Legal imprint/documentation

### Archiving and Compression
- `asar: true` – Archives the application source into an ASAR file for performance and security
- `compression: normal` – Balances compression ratio and speed

## Platform: false

## Platform-Specific Settings

### Windows
- **Targets**: NSIS installer and ZIP archive for both x64 and arm64 architectures
- **Icon**: `favicon/favicon.ico`
- **Execution Level**: `asInvoker` (standard user privileges)
- **NSIS Options**:
  - `oneClick: false` – Allows custom installation options
  - `allowToChangeInstallationDirectory: true` – User can choose install location
  - `createDesktopShortcut: true` – Creates desktop shortcut
  - `createStartMenuShortcut: true` – Creates Start Menu entry

### macOS
- **Target**: ZIP archive
- **Icon**: `favicon/favicon.icns`
- **Category**: `public.app-category.audio`
- **DMG Settings**:
  - `iconSize: 80`
  - Window dimensions: 660x400 pixels

### Linux
- **Targets**: AppImage, deb, rpm, tar.gz, freebsd, snap (x64 and arm64, except snap x64-only)
- **Icon**: `favicon/favicon.svg`
- **Options**:
  - `syncDesktopName: true` – Synchronizes desktop file name with application
  - `category: AudioVideo` – Proper categorization in Linux menus

## Output Location

Built artifacts are placed in the `dist` directory (configured via `directories.output`). Within `dist`, platform-specific subdirectories contain the final installers and packages.

## Workflow Steps

1. **Development**: Run `npm start` to launch the application in development mode (`electron .`).
2. **Packaging**: Execute the desired distribution script (e.g., `npm run dist`).
3. **Electron Builder**: The CLI reads the `build` configuration, gathers specified files, applies ASAR archiving, and generates platform-specific artifacts.
4. **Output**: Installers and packages appear in `dist/` ready for distribution or further processing (e.g., code signing, publishing).

## Notes

- Icon files must exist at the specified paths; missing icons cause build failures.
- ASAR improves security and performance but may interfere with Node.js modules that expect direct filesystem access.
- The workflow avoids platform-specific code, relying on declarative configuration for consistency across environments.
