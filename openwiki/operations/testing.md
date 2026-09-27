---
type: operations guide
title: Testing Guide
description: Guide to running the test suite, including stream tests, syntax checks, website tests, and Electron build verification.
tags: [testing, pytest, streams, syntax, website, electron]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-e44eab9a26f9187df819fc2a
    resource: repo://pytest.ini
  - id: openwiki-source-780facd41b2c78b19fa7c115
    resource: repo://tests/test_electron_build.py
  - id: openwiki-source-7cd29be59251951f00566a1f
    resource: repo://tests/test_streams.py
  - id: openwiki-source-f99a7ec1ea05bc870c213f40
    resource: repo://tests/test_syntax.py
  - id: openwiki-source-4636a46c1ad9ea46ccbd30e4
    resource: repo://tests/test_website.py
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

# Testing Guide

This document explains how to run the test suite for Oidarwave, covering unit tests for stream validation, syntax checks, website integration tests, and Electron build verification.

## Running the Test Suite

The project uses `pytest` as the test runner. Execute all tests with:

```bash
pytest
```

To run tests with verbose output and short tracebacks (as configured in `pytest.ini`):

```bash
pytest -v
```

## Test Categories

Tests are organized into categories using pytest markers:

- `unit`: Fast unit tests with no external dependencies (stream validation, syntax checks, Electron build config)
- `integration`: Integration tests requiring browser, network, or file I/O (website tests with Playwright)

Run only unit tests:

```bash
pytest -m unit
```

Run only integration tests:

```bash
pytest -m integration
```

## Stream Validation Tests

Located in `tests/test_streams.py`, these tests validate the structure of stream URLs found in `index.html` and `video/index.html`. They ensure:

- Stream URLs are properly formatted
- Required `data-name` and `data-url` attributes are present
- URLs use supported protocols (http, https, rtmp, etc.)

These tests are unit tests and run instantly without network access.

## Syntax Check Tests

Located in `tests/test_syntax.py`, these tests validate the syntax of HTML, JavaScript, Markdown, and CSS files throughout the project. They check for:

- Properly balanced tags (div, span, nav, header, footer, main, section)
- Balanced script and style tags
- Valid Markdown code fences
- Presence of DOCTYPE in HTML files

Excluded directories: `.venv`, `node_modules`, `__pycache__`, `.git`, `dist`, `build`, `.pytest_cache`

These tests are unit tests and run quickly.

## Website Integration Tests

Located in `tests/test_website.py`, these integration tests use Playwright to verify the website renders correctly. They test:

- `index.html` (main player interface)
- `video/index.html` (video page)
- `impressum/index.html` (legal notice)

Tests verify page titles, visible elements, and basic functionality without requiring a server.

### Prerequisites

Install Playwright dependencies:

```bash
pip install pytest playwright
playwright install chromium
```

Run website tests:

```bash
pytest -m integration
```

## Electron Build Verification Tests

Located in `tests/test_electron_build.py`, these unit tests validate the Electron build configuration in `package.json`. They ensure:

- Electron main file (`electron/main.js`) exists
- `package.json` contains required build configuration (`appId`, `productName`, `directories`, `files`)
- Build file patterns include all necessary directories and assets
- `electron` and `electron-builder` are present in `devDependencies`

These tests run instantly and catch configuration errors before building.

## Continuous Integration

All tests run automatically in CI on every push and pull request. The CI configuration ensures:

- Unit tests run on every commit
- Integration tests run on push to main branch
- Build verification prevents broken Electron configurations

## Troubleshooting

### "playwright not found" error

Install Playwright browsers:

```bash
playwright install
```

### Test data directory missing

Ensure you're running tests from the project root directory where `tests/` is located.

### Syntax test exclusions

Syntax tests automatically exclude common dependency and build directories. To customize exclusions, modify `EXCLUDE_DIRS` in `tests/test_syntax.py`.

## Adding New Tests

- Add stream validation tests to `tests/test_streams.py`
- Add syntax checks to `tests/test_syntax.py` (update exclusion lists if needed)
- Add website tests to `tests/test_website.py` (follow existing Playwright patterns)
- Add Electron build tests to `tests/test_electron_build.py`

All new test files should be placed in the `tests/` directory and will be automatically discovered by pytest.
