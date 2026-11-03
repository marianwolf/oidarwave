---
type: "Reference"
title: "Quickstart: Oidarwave Development Entry Point"
openwiki_generated: true
verified:
  - by: openwiki/0.7.2
    at: 2026-11-03T19:02:34.893Z
sources:
  - id: openwiki-source-4f2678f93d3fd3835f9f2909
    resource: repo://.github/workflows/test.yml
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e44eab9a26f9187df819fc2a
    resource: repo://pytest.ini
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-042e05bb663605d09adced3b
    resource: repo://requirements-dev.txt
  - id: openwiki-source-f0a6e7dc03522b2682f88655
    resource: repo://tests/conftest.py
  - id: openwiki-source-25d0e0ee1233a47179f95e57
    resource: repo://tests/test_design_layout.py
  - id: openwiki-source-f79bd52cf127cb7b8d36bfec
    resource: repo://tests/test_unit.py
  - id: openwiki-source-4636a46c1ad9ea46ccbd30e4
    resource: repo://tests/test_website.py
  - id: openwiki-source-344a605cf9b55b2039c6ed87
    resource: repo://video/index.html
generated: { by: "openwiki/0.7.2", at: "2026-11-03T19:02:34.893Z" }
---


# Quickstart: Oidarwave Development Entry Point

Oidarwave is a minimalist, ad-free web radio that runs in three contexts from the same codebase: as a **static website**, as an installable **PWA**, and as an **Electron desktop app**. This page gets you from clone to running code, then routes each development task to the wiki page that documents it in depth. Treat it as a map, not a manual — the linked pages own the details.

## Prerequisites

- Git for cloning the repository
- A modern web browser for running the web application
- Node.js and npm for the Electron app and packaging (`npm install` once after cloning)
- Python 3 with virtual environment support for the test suite
- Playwright's Chromium (one-time browser install, see below)

## 1. Clone the Repository

```bash
git clone https://github.com/marianwolf/oidarwave.git
cd oidarwave
```

## 2. Run the Web Application

Oidarwave is a static site — no server or build step is needed. Open `index.html` directly in your browser:

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Alternatively, use the live demo at [https://oidarwave.vercel.app](https://oidarwave.vercel.app).

## 3. Run as a Desktop App (Electron)

```bash
npm install
npm start        # launches electron . (main process: electron/main.js)
```

See [Electron Integration](integrations/electron.md) for the main-process routing and security model.

## 4. Set Up the Test Environment

The test suite is Python-based (pytest + Playwright):

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt   # pytest, playwright
python -m playwright install chromium  # one-time browser download (CI uses --with-deps)
```

## 5. Run the Tests

`pytest.ini` sets `testpaths = tests` and registers two markers: `unit` (fast, no browser) and `integration` (Playwright). The suite lives in exactly three files (there is no `test_syntax.py` / `test_streams.py` — that content now lives in `test_unit.py`):

```bash
pytest tests/test_unit.py -m unit        # syntax, stream-URL, and build-config checks (no browser)
pytest tests/test_website.py             # Playwright: all pages load with their core elements
pytest tests/test_design_layout.py       # Playwright: layout/CLS checks on mobile + desktop viewports
pytest                                   # everything (testpaths = tests)
```

Shared fixtures (`base_dir`, `browser`, `page`, `index_html`, `video_html`, `package_json`, `main_css_content`, `audio_stations`, `video_stations`, `page_urls`) live in `tests/conftest.py` — reuse them instead of duplicating paths. CI (`.github/workflows/test.yml`) runs all three files on `main`, `beta`, and `gamma`. See [Testing Operations](operations/testing.md) for the full picture.

## 6. Build Desktop Packages

Packaging uses electron-builder via the npm scripts in `package.json` (`start`, `pack`, `dist`, `dist:linux`, `dist:win`, `dist:mac`, `format`):

```bash
npm run pack         # directory mode (fast iteration)
npm run dist         # distributable packages for all configured platforms
npm run dist:linux   # AppImage, deb, rpm, tar.gz, freebsd, snap
npm run dist:win     # NSIS installer + zip (x64, arm64)
npm run dist:mac     # macOS zip (requires a macOS build environment)
npm run format       # prettier --write .
```

Artifacts land in `dist/`. See [Build and Packaging Operations](operations/build.md) for the electron-builder configuration and CI/release automation.

## Two Invariants That Bite New Contributors

1. **Script load order.** Pages load their scripts with `defer` in a fixed order: `errors.js` → `player-core.js` → the page module (`player.js` on the radio page `index.html`, `video.js` on `video/index.html`). The modules expose themselves via `window.*` globals (e.g. `ErrorCode`, `PlayerCore`), so this order must be preserved when adding or reordering modules.
2. **Stream URLs are never hardcoded.** The single source of truth for every stream URL is the `data-url` attribute on each station button (`.station-btn`) in `index.html` and `video/index.html`. Player code reads the URL from the DOM at click time, and the unit tests parse and validate exactly those attributes.

## Where to Go Next: Task Routing Map

| Your task | Read |
| --- | --- |
| Understand the overall system (pages, modules, Electron shell, PWA) | [Architecture Overview](architecture/overview.md) |
| Player kernel shared by both pages, and the audio page | [Player Architecture](architecture/player.md) |
| DOM contract (element IDs) and styling layers | [UI Architecture](architecture/ui.md) |
| localStorage keys, data shapes, migration, consent | [Persistence](architecture/persistence.md) |
| Browser notifications behavior | [Notifications](architecture/notifications.md) |
| Media Session API, status display, retry/backoff concepts | [Media Session Concept](concepts/media-session.md) |
| Change the playback flow (station click → playback → metadata → reconnect) | [Playback Workflow](workflows/playback.md) |
| Error handling and logging hub | [Error Handling Workflow](workflows/error-handling.md) |
| Settings toggles and cookie consent flow | [Settings Workflow](workflows/settings.md) |
| Electron main process, routing, security hardening | [Electron Integration](integrations/electron.md) |
| PWA manifest and installability | [PWA Integration](integrations/pwa.md) |
| Running and extending the test suite | [Testing Operations](operations/testing.md) |
| Packaging, per-OS targets, release automation | [Build and Packaging Operations](operations/build.md) |

## Compact Project Layout

```
oidarwave/
├── index.html             # radio page (main entry point)
├── video/index.html       # livestream page (HLS)
├── impressum/index.html   # legal / privacy page
├── manifest.json          # PWA manifest
├── src/                   # css/, js/ modules, svg/ icons
├── electron/main.js       # Electron main process
├── tests/                 # conftest.py, test_unit.py, test_website.py, test_design_layout.py
├── package.json           # npm scripts + electron-builder config
├── requirements-dev.txt   # pytest + playwright
├── pytest.ini             # testpaths, unit/integration markers
└── README.md, AGENTS.md   # project docs and agent conventions
```

## Troubleshooting

- **Playwright installation fails**: `python -m playwright install --with-deps chromium` (the CI form, installs system libraries too).
- **Electron build fails on missing dependencies**: install the platform build tools first — Windows: Visual Studio Build Tools; macOS: Xcode Command Line Tools; Linux: libgtk-3-dev, libxss1, libnss3, etc.
- **Tests fail due to network issues**: stream-availability checks need internet access; run `pytest tests/test_unit.py -m unit` offline for the fast, network-free subset.

For questions or issues, see the [GitHub Issues page](https://github.com/marianwolf/oidarwave/issues); for contribution rules (branching, PR review, AI-assisted PR policy), see the *Mitwirken* section of `README.md`.
