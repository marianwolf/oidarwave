---
type: guide
title: Build Guide
description: Instructions for building the Electron application for different platforms and creating distributable packages.
tags: [electron, build, packaging, distribution]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

# Build Guide

This document explains how to build the Oidarwave Electron application for different platforms and create distributable packages using electron-builder.

## Prerequisites

- Node.js (version specified in project requirements)
- npm or yarn
- Platform-specific build tools:
  - Windows: Visual Studio Build Tools
  - macOS: Xcode command-line tools
  - Linux: Dependencies for rpmdeb and AppImage (see [electron-builder docs](https://www.electron.build/#prerequisites))

## npm Scripts

The project includes the following npm scripts for building:

| Script | Description |
|--------|-------------|
| `npm start` | Runs the application in development mode |
| `npm run pack` | Builds the application as a directory (not packaged) for testing |
| `npm run dist` | Builds distributable packages for all platforms |
| `npm run dist:linux` | Builds Linux distributables only |
| `npm run dist:win` | Builds Windows distributables only |
| `npm run dist:mac` | Builds macOS distributables only |

## Build Configuration

The build configuration is defined in the `build` section of `package.json`:

### Common Settings

- **appId**: `app.oidarwave.vercel`
- **productName**: `Oidarwave`
- **output directory**: `dist`
- **files included**:
  - `electron/**/*`
  - `src/**/*`
  - `index.html`
  - `favicon/**/*`
  - `manifest.json`
  - `video/**/*`
  - `impressum/**/*`
- **compression**: `normal`
- **asar**: `true` (archives the application source for security and performance)

### Platform-Specific Settings

#### Windows (`win`)

- **targets**: NSIS installer and ZIP archive
- **architectures**: x64 and arm64
- **icon**: `favicon/favicon.ico`
- **requestedExecutionLevel**: `asInvoker`

#### NSIS Configuration

- **oneClick**: `false` (allows custom installation directory)
- **allowToChangeInstallationDirectory**: `true`
- **createDesktopShortcut**: `true`
- **createStartMenuShortcut**: `true`

#### macOS (`mac`)

- **target**: ZIP archive
- **icon**: `favicon/favicon.icns`
- **category**: `public.app-category.audio`

#### DMG Settings (when applicable)

- **iconSize**: `80`
- **window dimensions**: 660x400 pixels

#### Linux (`linux`)

- **syncDesktopName**: `true` (matches desktop entry name to productName)
- **category**: `AudioVideo`
- **icon**: `favicon/favicon.svg`
- **targets**:
  - AppImage (x64 and arm64)
  - deb package (x64 and arm64)
  - tar.gz archive (x64 and arm64)
  - rpm package (x64 and arm64)
  - freebsd (x64 and arm64)
  - snap (x64 only)

## Building for Specific Platforms

### Windows

```bash
npm run dist:win
```

Produces:
- `Oidarwave Setup x64.exe`
- `Oidarwave Setup arm64.exe`
- `Oidarwave x64.zip`
- `Oidarwave arm64.zip`

### macOS

```bash
npm run dist:mac
```

Produces:
- `Oidarwave-*.zip` (ZIP archive)

### Linux

```bash
npm run dist:linux
```

Produces:
- `Oidarwave_*.AppImage`
- `Oidarwave_*.deb`
- `Oidarwave_*.tar.gz`
- `Oidarwave_*.rpm`
- `Oidarwave_*.freebsd`
- `Oidarwave_*.snap`

## Development Build

For quick testing during development:

```bash
npm run pack
```

This creates an unpacked build in the `dist` directory that can be run directly with Electron.

## Troubleshooting

### Missing Platform Dependencies

If you encounter errors about missing build tools:
- On Windows, install [Visual Studio Build Tools](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools&rel=16)
- On macOS, run `xcode-select --install`
- On Linux, install required packages (e.g., `rpm`, `dpkg-dev`, `fuse`, `libarchive-zip-perl` on Debian-based systems)

### Code Signing

For production builds, code signing requires:
- Windows: Authenticode certificate
- macOS: Apple Developer ID certificate
- Linux: Optional (but recommended for distribution)

Set the appropriate environment variables or configure in `electron-builder.yml` if needed.

### Cache Issues

If builds fail unexpectedly, try clearing the electron-builder cache:

```bash
npx electron-builder --clean
```

## Publishing

The build artifacts are ready for distribution:
- Windows installers can be published to website or store
- macOS apps can be notarized and distributed
- Linux packages can be pushed to repositories or shared as AppImages

Refer to the [electron-builder documentation](https://www.electron.build/) for advanced configuration and publishing options.
