---
type: "Reference"
title: "Build and Packaging Operations"
openwiki_generated: true
verified:
  - by: openwiki/0.7.2
    at: 2026-11-03T19:02:34.893Z
sources:
  - id: openwiki-source-004a80287b1b3a280a308972
    resource: repo://.github/workflows/npm-auto-update.yml
  - id: openwiki-source-4d1d392666be6dfdd7a91a2e
    resource: repo://.github/workflows/release.yml
  - id: openwiki-source-4f2678f93d3fd3835f9f2909
    resource: repo://.github/workflows/test.yml
  - id: openwiki-source-f235d856bed1fd44853c5195
    resource: repo://.prettierignore
  - id: openwiki-source-1911308755a010411fc9869e
    resource: repo://.prettierrc
  - id: openwiki-source-3d9e72730d09405d8d9107c1
    resource: repo://electron/main.js
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-cc2828785988d51226a4241e
    resource: repo://renovate.json
  - id: openwiki-source-f79bd52cf127cb7b8d36bfec
    resource: repo://tests/test_unit.py
generated: { by: "openwiki/0.7.2", at: "2026-11-03T19:02:34.893Z" }
---


# Build and Packaging Operations

This page documents how the Oidarwave Electron application is built and distributed: the npm scripts, the `electron-builder` configuration embedded in `package.json`, code formatting, dependency-update automation, and the CI workflows that produce releases. For how the packaged app behaves at runtime, see [Electron Integration](../integrations/electron.md); for the test suite, see [Testing Guide](testing.md); for a first orientation, see [Quickstart](../quickstart.md).

## Project Layout Relevant to Packaging

- `package.json` declares `"main": "electron/main.js"` (the Electron main-process entry) and `"desktopName": "app.oidarwave.vercel"` alongside the `build` block (repo://package.json#L5-L6).
- `electron/` contains the main process, `src/` the renderer web app, and the top-level `index.html`, `favicon/`, `manifest.json`, `video/`, and `impressum/` are the runtime assets shipped into the package.
- Current versions in `devDependencies`: `electron` `^45.2.1` and `electron-builder` `^26.18.0` (repo://package.json#L124-L134).

## npm Scripts

All build-related scripts are defined in `package.json` (repo://package.json#L7-L15):

| Script | Command | Purpose |
|--------|---------|---------|
| `npm start` | `electron .` | Runs the packaged app entry (`electron/main.js`) in development mode |
| `npm run pack` | `electron-builder --dir` | Builds an unpacked app directory into `dist/` for quick testing |
| `npm run dist` | `electron-builder` | Builds distributables for the host platform (no `-l`/`-w`/`-m` flag, so electron-builder targets the current OS) |
| `npm run dist:linux` | `electron-builder -l` | Builds Linux distributables only |
| `npm run dist:win` | `electron-builder -w` | Builds Windows distributables only |
| `npm run dist:mac` | `electron-builder -m` | Builds macOS distributables only |
| `npm run format` | `prettier --write .` | Formats the whole repository with Prettier (see below) |

There is no separate `electron-builder.yml`: the entire packaging configuration lives in the `build` section of `package.json` (repo://package.json#L18-L123).

## electron-builder Configuration

The `build` block in `package.json` (repo://package.json#L18-L123) contains the following settings.

### Common Settings

- **appId**: `app.oidarwave.vercel` (repo://package.json#L19)
- **productName**: `Oidarwave` (repo://package.json#L20)
- **directories.output**: `dist` — all build artifacts are written to `dist/` (repo://package.json#L21-L23)
- **files** (packaged allowlist, repo://package.json#L24-L32):
  - `electron/**/*`
  - `src/**/*`
  - `index.html`
  - `favicon/**/*`
  - `manifest.json`
  - `video/**/*`
  - `impressum/**/*`
- **compression**: `normal` (repo://package.json#L33)
- **asar**: `true` — the application source is archived into a single `app.asar` (repo://package.json#L34)

The `files` list is an allowlist: anything not matched is excluded from the package. Any new runtime asset (a new top-level HTML page directory, media folder, etc.) must be added to `build.files`, otherwise it will be missing from the packaged app. The unit test `test_electron_build` in `tests/test_unit.py` asserts that `electron/main.js` exists, that the `build` block contains the keys `appId`, `productName`, `directories`, and `files`, that every pattern above is present in `build.files`, and that `electron` and `electron-builder` are in `devDependencies` (repo://tests/test_unit.py#L177-L186). At runtime, the Electron main process additionally skips directories listed in an optional `.npmignore` file (plus built-in defaults such as `node_modules`, `.git`, `dist`, `electron`, `openwiki`, `tests`) when discovering HTML subpages; the repository currently ships no root `.npmignore`, so only the defaults apply (repo://electron/main.js#L30-L62).

### Windows (`win`, repo://package.json#L35-L54)

- **target**: `nsis` and `zip`, each for `x64` and `arm64`
- **icon**: `favicon/favicon.ico`
- **requestedExecutionLevel**: `asInvoker`

### NSIS (`nsis`, repo://package.json#L55-L60)

- **oneClick**: `false` (two-click installer, allows a custom installation directory)
- **allowToChangeInstallationDirectory**: `true`
- **createDesktopShortcut**: `true`
- **createStartMenuShortcut**: `true`

### macOS (`mac`, repo://package.json#L61-L67)

- **target**: `zip`
- **icon**: `favicon/favicon.icns`
- **category**: `public.app-category.audio`

### DMG (`dmg`, repo://package.json#L68-L74)

- **iconSize**: `80`
- **window**: width `660`, height `400` pixels

### Linux (`linux`, repo://package.json#L75-L122)

- **syncDesktopName**: `true` (keeps the desktop entry name in sync with `productName`)
- **category**: `AudioVideo`
- **icon**: `favicon/favicon.svg`
- **target**:
  - `AppImage` (x64, arm64)
  - `deb` (x64, arm64)
  - `tar.gz` (x64, arm64)
  - `rpm` (x64, arm64)
  - `freebsd` (x64, arm64)
  - `snap` (x64 only)

## Building for Specific Platforms

```bash
npm run dist:win     # NSIS installers + ZIP archives for x64 and arm64
npm run dist:mac     # macOS ZIP archive
npm run dist:linux   # AppImage, deb, tar.gz, rpm, freebsd (x64+arm64), snap (x64)
npm run dist         # host platform only
npm run pack         # unpacked directory in dist/ for quick iteration
```

All artifacts land in `dist/`, which is git-ignored (repo://.gitignore#L6-L7).

## Code Formatting

- `npm run format` runs `prettier --write .` over the whole repository (repo://package.json#L14).
- Options live in `.prettierrc`: `printWidth: 120`, `proseWrap: "never"`, `semi: false`, `singleQuote: true`, `tabWidth: 4`, `trailingComma: "es5"`, `htmlWhitespaceSensitivity: "css"`, plus an override using `tabWidth: 2` for `*.{json,md,yml,yaml}` (repo://.prettierrc).
- `.prettierignore` excludes vendored third-party files (`src/vendor/bootstrap/bootstrap.min.css`) and the `openwiki/` wiki directory from formatting, so upstream diffs stay quiet (repo://.prettierignore).

## Dependency Update Automation

Two mechanisms keep dependencies current:

- **Renovate** (`renovate.json`): extends `config:recommended`, labels PRs `dependencies`, runs at any time in `Europe/Berlin`, enables the dependency dashboard, OSV vulnerability alerts, and `minimumReleaseAge: "2 days"`. Electron and electron-builder updates are grouped into an "electron packages" group that is never auto-merged (assigned to `marianwolf` for manual review, because the desktop build must be checked manually); other npm dev tooling, Python test dependencies, and GitHub Actions minor/patch updates are grouped and auto-merged via PR; major updates are assigned for manual review; lockfile maintenance is auto-merged weekly on Mondays before 5am (repo://renovate.json).
- **Weekly npm auto-update workflow** (`.github/workflows/npm-auto-update.yml`): runs Mondays 04:00 UTC (plus manual dispatch) on the `gamma` branch, executes `npm install && npm update`, and if `package.json`/`package-lock.json` changed, opens an ephemeral PR `chore/weekly-npm-update` (base `gamma`, label `dependencies`) with squash auto-merge enabled (repo://.github/workflows/npm-auto-update.yml#L1-L101).

## CI and Release Automation

- **Tests** (`.github/workflows/test.yml`): on pushes and PRs to `main`, `beta`, `gamma` (plus manual dispatch), an `ubuntu-latest` job installs Python 3.14 with pip caching, the dev requirements, and Playwright Chromium, then runs `pytest tests/test_unit.py -m unit`, `pytest tests/test_website.py`, and `pytest tests/test_design_layout.py` (repo://.github/workflows/test.yml). The unit run includes the `test_electron_build` invariant described above (repo://tests/test_unit.py#L177-L186).
- **Release** (`.github/workflows/release.yml`): on pushes of tags matching `v*` (plus manual dispatch) with `contents: write`, an `ubuntu-latest` job collects all `*.html`, `*.js`, and `*.css` files (excluding `node_modules`, `.venv`, `.git`) plus `manifest.json` and `README.md`, and publishes them as a GitHub Release via `softprops/action-gh-release` with generated release notes; releases whose ref contains `beta` or `gamma` are marked as prerelease (repo://.github/workflows/release.yml#L1-L55). Note that this workflow publishes the static web assets — it does not run `electron-builder`; desktop distributables are produced locally via the `dist:*` scripts above.

## Prerequisites and Troubleshooting

- Node.js and npm are required; platform-specific packaging additionally needs:
  - Windows: Visual Studio Build Tools (for NSIS)
  - macOS: Xcode command-line tools (`xcode-select --install`); note `dist:mac` effectively requires a macOS host
  - Linux: `rpm`, `dpkg-dev`, `fuse`, `libarchive-zip-perl` etc. for rpm/deb/AppImage (see the [electron-builder prerequisites](https://www.electron.build/#prerequisites))
- No code-signing certificates are configured in the `build` block; production signing would require adding certificate configuration (e.g., via environment variables consumed by electron-builder) — the current configuration produces unsigned artifacts.
- If builds fail unexpectedly, clear the electron-builder cache with `npx electron-builder --clean`.
- For advanced packaging and publishing options, refer to the [electron-builder documentation](https://www.electron.build/).
