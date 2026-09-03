---
type: overview
title: Testing Overview
description: Overview of the test suites for syntax checking, website validation, and Electron build validation in the Oidarwave project.
tags: [testing, syntax, website, electron]
sources:
  - id: openwiki-source-f99a7ec1ea05bc870c213f40
    resource: repo://tests/test_syntax.py
  - id: openwiki-source-4636a46c1ad9ea46ccbd30e4
    resource: repo://tests/test_website.py
generated: { by: "openwiki/0.5.0", at: "2026-09-03T14:41:27.574Z" }
verified:
  - by: openwiki/0.5.0
    at: 2026-09-03T14:41:27.574Z
---

# Testing Overview

This document provides an overview of the three main test suites in the Oidarwave project: syntax checking, website validation, and Electron build validation. Each suite serves a distinct purpose in ensuring code quality, functional correctness, and build reliability.

## Syntax Checking

The syntax test suite (`tests/test_syntax.py`) validates the structural and syntactic correctness of source files, focusing on HTML, JavaScript, Markdown, and CSS. It does not require a browser or external dependencies beyond Python and pytest.

### Responsibilities
- Verify balanced brackets (`[]`, `{}`, `()`) in JavaScript and other files.
- Ensure HTML files contain a valid doctype, required tags (`html`, `head`, `body`, `title`), and a charset declaration.
- Detect unclosed HTML tags (e.g., `div`, `span`, `nav`, etc.) and mismatched script/style tags.
- Check JavaScript for balanced backticks, balanced block comments (`/* ... */`), and absence of double semicolons (`;;`).

### Entrypoints and Mechanisms
- The suite is implemented as a collection of pytest test functions that traverse the project directory (excluding `node_modules`, `.venv`, `__pycache__`, etc.).
- Key helper functions include `check_balanced` for bracket matching and `check_html` for HTML-specific validation.
- Tests are parametrized to run against all relevant files in the source tree.

### Important Invariants
- If a file fails any syntax check, the test fails with a descriptive message indicating the nature and location of the issue.
- The suite is designed to be fast and runnable in any Python environment without additional setup.

## Website Validation

The website test suite (`tests/test_website.py`) uses Playwright to automate Chromium and validate the rendered behavior of the Oidarwave web application. It checks that pages load correctly and essential UI elements are present.

### Responsibilities
- Confirm that the index, video, and impressum pages load without critical errors and contain expected text in the title.
- Verify the presence of key UI elements on the index page (logo, navigation, station buttons).
- Verify the presence of key UI elements on the video page (video player, station buttons).
- Verify the presence of key UI elements on the impressum page (heading).
- Additionally, on the index page: verify navigation links, audio player with controls, cookie banner, and status display.

### Entrypoints and Mechanisms
- The suite uses Playwright fixtures: a session-scoped browser instance, a fresh page per test, and parametrized fixtures for pages.
- Tests are organized into classes:
  - `TestPages`: checks basic page load and title.
  - `TestPageElements`: validates DOM elements on each page.
  - `TestIndexSpecific`: additional tests for the index page (navigation, player, cookie banner, status display).

### Configuration and Operation
- Requires `pytest` and `playwright` to be installed, with Chromium browsers available via `playwright install chromium`.
- Tests run in headless mode by default but can be adjusted for debugging.
- The suite runs against local files and does not require network access.

### Important Invariants
- A test failure indicates a regression in the web application (missing element, incorrect title).

## Electron Build Validation

The Electron test suite (`tests/test_electron_build.py`) ensures that the Electron application can be built correctly by validating critical configuration files and dependencies.

### Responsibilities
- Confirm the existence of the Electron main script (`electron/main.js`).
- Validate that `package.json` contains a properly configured `build` section with required fields (`appId`, `productName`, `directories`, `files`) and that the `files` array includes specific patterns (e.g., `electron/**/*`, `src/**/*`, `index.html`).
- Ensure that `devDependencies` includes both `electron` and `electron-builder`.

### Entrypoints and Mechanisms
- The suite consists of three simple test functions that can be run independently via pytest or executed directly as a script.
- It reads `package.json` and performs assertions against its structure.
- No external services or browsers are required; only file system access.

### Important Invariants
- A test failure indicates a misconfiguration that would prevent the Electron builder from producing a valid application package (e.g., missing main file, incorrect build settings, or absent build dependencies).
- The suite is fast and deterministic, suitable for running in any CI environment after a checkout.

## Running the Tests

- **Syntax checks**: Execute `pytest tests/test_syntax.py` (or simply `pytest` to run all suites).
- **Website validation**: Ensure Playwright dependencies are installed, then run `pytest tests/test_website.py`.
- **Electron build validation**: Run `pytest tests/test_electron_build.py` or execute the file directly with `python tests/test_electron_build.py`.

All three suites are designed to be integrated into a continuous integration pipeline to catch issues early in the development process.
