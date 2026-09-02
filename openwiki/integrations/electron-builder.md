---
type: configuration
title: Electron Builder Configuration
description: Configuration of electron-builder in package.json for building desktop installers for Windows, macOS, and Linux.
tags: [electron, builder, packaging, configuration]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# Electron Builder Configuration

The Electron Builder configuration defines how the Oidarwave desktop application is packaged and distributed across different operating systems. This configuration resides in the `build` section of `package.json` and controls everything from file inclusion to platform-specific installer options.

## Configuration Location

The Electron Builder settings are located in the `build` object within `/package.json`. This centralizes all packaging configuration alongside project metadata and dependencies.

## Key Configuration Sections

### Application Identification
- `appId`: Unique identifier for the application (`app.oidarwave.vercel`)
- `productName`: Display name of the application (`Oidarwave`)

### File Inclusion
The `files` array specifies which directories and files to include in the build:
- `electron/**/*` - Electron main and preload scripts
- `src/**/*` - Source code (likely React/Vue/Angular components)
- `index.html` - Main HTML entry point
- `favicon/**/*` - Application icons in various formats
- `manifest.json` - Web application manifest
- `video/**/*` - Video content (likely for webradio streams)
- `impressum/**/*` - Legal imprint/documentation

### Archiving and Compression
- `asar`: Set to `true` to archive the application source into an ASAR file for performance and security
- `compression`: Set to `normal` for balanced compression ratio and speed

## Platform-Specific Settings

### Windows Configuration
Under the `win` section:
- **Icons**: Uses `favicon/favicon.ico` for the application icon
- **Execution Level**: `requestedExecutionLevel: "asInvoker"` ensures the application runs with standard user privileges
- **Targets**: Generates both NSIS installer (`nsis`) and portable ZIP archives for both x64 and arm64 architectures

#### NSIS Installer Settings
Within the `nsis` subsection:
- `oneClick: false` - Allows users to customize installation options
- `allowToChangeInstallationDirectory: true` - Users can choose installation location
- `createDesktopShortcut: true` - Creates a desktop shortcut during installation
- `createStartMenuShortcut: true` - Creates a Start Menu entry

### macOS Configuration
Under the `mac` section:
- **Icon**: Uses `favicon/favicon.icns` for the application icon
- **Category**: Set to `public.app-category.audio` for proper App Store categorization
- **Target**: Produces ZIP archives (standard for macOS distribution)

#### DMG Settings
Within the `dmg` subsection:
- `iconSize: 80` - Controls the size of application icon in the DMG window
- `window`: Sets the DMG window dimensions to 660x400 pixels

### Linux Configuration
Under the `linux` section:
- `syncDesktopName: true` - Synchronizes the desktop file name with the application
- `category: AudioVideo` - Properly categorizes the application in Linux menus
- **Icon**: Uses `favicon/favicon.svg` for scalable vector graphics
- **Targets**: Generates multiple package formats for broad Linux distribution support:
  - AppImage (portable executable)
  - DEB (Debian/Ubuntu packages)
  - RPM (Red Hat/Fedora packages)
  - tar.gz (binary tarball)
  - freebsd (FreeBSD package)
  - snap (Snapcraft package)

All Linux targets are built for both x64 and arm64 architectures, except snap which is x64-only.

## Build Scripts

The `scripts` section in `package.json` provides convenient commands for triggering builds:
- `npm run dist` - Builds for all platforms (macOS, Windows, Linux)
- `npm run dist:linux` - Builds Linux targets only
- `npm run dist:win` - Builds Windows targets only
- `npm run dist:mac` - Builds macOS targets only

These scripts forward arguments directly to the `electron-builder` CLI.

## Output Location

Built artifacts are placed in the directory specified by `directories.output`, which is configured as `dist`. Within this directory, platform-specific subdirectories contain the final installers and packages.

## Important Notes

1. **Icon Files**: The referenced icon files (`favicon/favicon.ico`, `favicon/favicon.icns`, `favicon/favicon.svg`) must exist in the project; missing icons will cause build failures.
2. **ASAR Archives**: While `asar: true` improves performance and prevents tampering, it may interfere with certain Node.js modules that expect to read files directly from the filesystem.
3. **NSIS One-Click**: Setting `oneClick: false` provides users with installation options but requires more interaction during setup.
4. **Cross-Platform Considerations**: The configuration intentionally avoids platform-specific code in favor of declarative settings, making the build process consistent across development environments.

## Related Processes

This configuration is used by the Electron build workflow documented in [[/openwiki/workflows/electron-build|electron build workflow]] and invoked through the build operations detailed in [[/openwiki/operations/build|build operations]].
