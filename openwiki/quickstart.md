---
type: guide
title: Quickstart
description: Introduction to Oidarwave project structure and how to get started with development, including cloning, running, testing, and building the application.
tags: [getting-started, development, installation, testing, build]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-042e05bb663605d09adced3b
    resource: repo://requirements-dev.txt
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

# Oidarwave Quickstart Guide

This guide provides instructions for getting started with Oidarwave development, from cloning the repository to running tests and building distributable packages.

## Project Overview

Oidarwave is a minimalist, ad-free webradio application that runs in the browser and as a desktop application via Electron. The project consists of:

- A static web application (`index.html`, `src/` directory)
- An Electron wrapper (`electron/` directory) for desktop execution
- Test suite using pytest and Playwright
- Build configurations for creating platform-specific distributables

## Prerequisites

- Git for cloning the repository
- A modern web browser for running the web application
- Node.js and npm for Electron development
- Python 3.x with virtual environment support for running tests
- Playwright browser dependencies (installed automatically during setup)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/marianwolf/oidarwave.git
cd oidarwave
```

### 2. Running the Web Application

As a static web site, Oidarwave requires no server-side installation:

```bash
# Open index.html in your preferred browser
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

Alternatively, visit the live demo at [https://oidarwave.vercel.app](https://oidarwave.vercel.app).

### 3. Development Setup for Testing

To run the test suite, set up a Python virtual environment:

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install test dependencies
pip install -r requirements-dev.txt

# Install Playwright browsers
playwright install chromium
```

### 4. Running Tests

Execute the test suite using pytest:

```bash
# Run all unit tests
pytest -m unit

# Run syntax validation tests
pytest tests/test_syntax.py

# Run all tests
pytest
```

Test files are located in the `tests/` directory and cover:
- Syntax validation of JavaScript and HTML
- Unit tests for core functionality
- End-to-end tests with Playwright

### 5. Building Electron Applications

Oidarwave can be packaged as a desktop application using Electron Builder:

```bash
# Build for all platforms in directory mode (quick test)
npm run pack

# Create distributable packages
npm run dist

# Platform-specific builds
npm run dist:linux   # Creates AppImage, deb, rpm, etc.
npm run dist:win     # Creates Windows installer and portable versions
npm run dist:mac     # Creates macOS app (requires macOS build environment)
```

Build artifacts are placed in the `dist/` directory.

### 6. Project Structure

```
oidarwave/
├── index.html              # Main HTML entry point
├── manifest.json           # PWA manifest
├── favicon/                # Application icons
├── impressum/              # Legal information
├── video/                  # Video content
├── src/                    # Source code for web application
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript modules
│   │   ├── player.js       # Audio/video player logic
│   │   ├── player-core.js  # Core player functionality
│   │   ├── history.js      # Playback history management
│   │   ├── notification.js # Browser notifications
│   │   ├── cookie.js       # Cookie/localStorage utilities
│   │   ├── errors.js       # Error handling
│   │   ├── download_history.js # Download history
│   │   ├── favorite.js     # Favorites management
│   │   ├── mouse.js        # Mouse interaction utilities
│   │   └── uuid.js         # UUID generation
│   └── svg/                # SVG icons and graphics
├── electron/               # Electron wrapper
│   └── main.js             # Electron main process
├── tests/                  # Test suite
│   ├── test_syntax.py      # Syntax validation
│   └── ...                 # Additional test files
├── requirements-dev.txt    # Python test dependencies
├── package.json            # npm dependencies and scripts
└── README.md               # Project overview
```

### 7. Available npm Scripts

Refer to `package.json` for the complete list, but key scripts include:

- `npm start` - Run Electron application in development mode
- `npm run pack` - Build Electron app in directory mode (fast iteration)
- `npm run dist` - Create full distributable packages for all platforms
- `npm run dist:linux` - Build Linux packages
- `npm run dist:win` - Build Windows packages
- `npm run dist:mac` - Build macOS packages

### 8. Contributing

See the [Contributing Guide](/openwiki/architecture/ui.md) for detailed information on:
- Code style and conventions
- Submitting issues and pull requests
- Development workflow
- Testing best practices

## Troubleshooting

### Common Issues

**Playwright installation fails**
```bash
# Try installing with explicit Chromium
playwright install --with-deps chromium
```

**Electron build fails on missing dependencies**
Ensure you have the required build tools for your platform:
- Windows: Visual Studio Build Tools
- macOS: Xcode Command Line Tools
- Linux: libgtk-3-dev, libxss1, libnss3, etc.

**Tests fail due to network issues**
Some tests may require internet access to verify stream availability. Consider running with network mocking if working offline.

## Next Steps

After setting up your development environment:
1. Explore the [Architecture Overview](/openwiki/architecture/overview.md)
2. Learn about specific components like the [Player Core](/openwiki/architecture/player.md)
3. Review the [Testing Guide](/openwiki/operations/testing.md) for detailed test information
4. Check the [Build Guide](/openwiki/operations/build.md) for advanced packaging options

For questions or issues, please refer to the [Issues page](https://github.com/marianwolf/oidarwave/issues) or join the community discussions.
