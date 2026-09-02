---
type: test suite
title: Electron Build Test Suite
description: This test suite validates the Electron build configuration for Oidarwave, ensuring the main Electron file exists, package.json has correct build settings, and required dependencies are present.
tags: [testing, electron, build, configuration]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-780facd41b2c78b19fa7c115
    resource: repo://tests/test_electron_build.py
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

The Electron build test suite (`tests/test_electron_build.py`) verifies critical aspects of the Electron application build configuration to ensure successful packaging and distribution. It focuses on three key areas: existence of the Electron entry point, validity of the build configuration in `package.json`, and presence of required development dependencies.

## File Existence Verification

The test confirms that `electron/main.js` exists at the expected location relative to the project root. This file serves as the main entry point for the Electron application, responsible for creating application windows and managing system-level events. Without this file, the Electron framework cannot initialize the application interface.

## Build Configuration Validation

The test examines `package.json` for a properly structured Electron builder configuration under the `build` key. It validates:

- Presence of essential fields: `appId` (unique application identifier), `productName` (display name), `directories` (output and build paths), and `files` (list of files to include in the build)
- Specific inclusion patterns in the `files` array ensuring critical application resources are packaged:
  - Electron-specific code: `electron/**/*`
  - Source code: `src/**/*`
  - Root assets: `index.html`, `manifest.json`
  - Media content: `video/**/*`
  - Legal/documentation: `favicon/**/*`, `impressum/**/*`

These patterns guarantee that the packaged application contains all necessary components for proper functionality, including the main process, renderer process, static assets, and supporting documentation.

## Dependency Validation

The test verifies that both `electron` (the core framework) and `electron-builder` (the packaging tool) are declared in `package.json` under `devDependencies`. This ensures developers have the required tools to run, test, and build the Electron application locally, and that CI/CD pipelines can correctly execute build processes.

## Test Execution

The test suite can be executed independently via `python -m pytest tests/test_electron_build.py` or as part of the full test suite. When run directly, it provides clear success messages for each verification step, facilitating quick diagnosis of configuration issues.

## Relationship to Other Systems

This test complements:
- General syntax validation (see `tests/test_syntax.py`)
- Website functionality tests (see `tests/test_website.py`)
- Electron build workflows documented in `/openwiki/workflows/electron-build.md` (when available)

By validating build-time configuration early in the development cycle, this test prevents packaging failures that might only surface during distribution attempts, streamlining the release process.
