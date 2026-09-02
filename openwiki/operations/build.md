---
type: process
title: Build Process
description: Describes how to build distribution packages for Oidarwave using npm run dist and platform-specific scripts, powered by electron-builder.
tags: [build, electron, packaging, distribution]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# Build Process

Oidarwave uses [electron-builder](https://www.electron.build/) to create distributable packages for macOS, Windows, and Linux. The build process is invoked via npm scripts defined in the project's `package.json`.

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dist` | Builds packages for all three platforms (macOS, Windows, Linux). |
| `npm run dist:linux` | Builds Linux-specific packages only. |
| `npm run dist:win` | Builds Windows-specific packages only. |
| `npm run dist:mac` | Builds macOS-specific packages only. |

These scripts directly call `electron-builder` with the appropriate platform flags (`-mwl`, `-l`, `-w`, `-m`).

## Build Configuration

All build options are defined under the `build` key in `package.json`. Key aspects include:

- **Application Identity**: `appId` is set to `app.oidarwave.vercel` and `productName` to `Oidarwave`.
- **Output Location**: Compiled artifacts are placed in the `dist` directory (`directories.output`).
- **Included Files**: The build packs the `electron/` and `src/` source trees, plus `index.html`, `favicon/`, `manifest.json`, `video/`, and `impressum/` directories.
- **Archiving**: By default, the app is packaged as an ASAR archive with normal compression to improve startup performance and reduce file size.

### Platform-Specific Settings

#### Windows (`win`)
- Produces both an NSIS installer and a ZIP archive for x64 and arm64 architectures.
- NSIS is configured to:
  - Not use a one-click installer (`oneClick: false`).
  - Allow users to change the installation directory.
  - Create desktop and start menu shortcuts.
  - Run with standard user privileges (`requestedExecutionLevel: asInvoker`).

#### macOS (`mac`)
- Generates a ZIP archive.
- Uses the `favicon/favicon.icns` file as the application icon.
- Assigns the `public.app-category.audio` category.

#### DMG (`dmg`)
- Although not the primary output, DMG settings are defined:
  - Icon size of 80 pixels.
  - Window size of 660×400 pixels.

#### Linux (`linux`)
- Supports multiple package formats for x64 and arm64 (snap is x64-only):
  - AppImage
  - Debian (.deb)
  - Compressed tarball (.tar.gz)
  - RPM (.rpm)
  - FreeBSD
  - Snapcraft (.snap)
- Additional options:
  - `syncDesktopName: true` aligns the desktop entry with the `desktopName` field.
  - Menu category set to `AudioVideo`.
  - Icon sourced from `favicon/favicon.svg`.

## Build Output

Running any of the build scripts produces one or more files inside the `dist` directory, such as:
- `Oidarwave Setup x.y.z.exe` (NSIS installer)
- `Oidarwave x.y.z.zip` (portable Windows archive)
- `Oidarwave-x.y.z.dmg` (macOS disk image)
- `Oidarwave-x.y.z.AppImage` (Linux AppImage)
- `Oidarwave_x.y.z_amd64.deb` (Debian package)
- etc.

These artifacts can be distributed to users or uploaded to release channels.

## Relationships to Other Processes

- The build output feeds directly into the [deployment process](/openwiki/operations/deploy.md).
- Development workflows (e.g., `npm start`) are documented separately in [development](/openwiki/operations/development.md).
- Platform‑specific build details are also referenced in the [electron‑build workflow](/openwiki/workflows/electron-build.md).
