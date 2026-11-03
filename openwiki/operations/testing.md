---
type: "Reference"
title: "Testing Operations: pytest, Playwright, and CI"
openwiki_generated: true
verified:
  - by: openwiki/0.7.2
    at: 2026-11-03T19:02:34.893Z
sources:
  - id: openwiki-source-4f2678f93d3fd3835f9f2909
    resource: repo://.github/workflows/test.yml
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
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
generated: { by: "openwiki/0.7.2", at: "2026-11-03T19:02:34.893Z" }
---


# Testing Operations: pytest, Playwright, and CI

Oidarwave's test suite is a pytest suite living in `tests/`. Tests are split by two markers registered in `pytest.ini`: `unit` (fast, no browser and no network) and `integration` (Playwright driving real pages in headless Chromium). CI runs all three test files on every push and pull request to `main`, `beta`, and `gamma`. For the app that these tests exercise, see [User Interface Components](../architecture/ui.md); for packaging, see [Build and Packaging Operations](build.md).

## Test Suite Layout

| File | Marker | Covers |
| --- | --- | --- |
| `tests/conftest.py` | — | Shared session fixtures: paths, file contents, station lists, Playwright `browser`/`page` |
| `tests/test_unit.py` | `unit` | Syntax/balance checks, CSS structure, stream URL validation, Electron build config |
| `tests/test_website.py` | `integration` | Playwright rendering and element checks for `index.html`, `video/index.html`, `impressum/index.html` |
| `tests/test_design_layout.py` | `integration` | Playwright layout/CLS warning checks plus a static design regex guard |

`pytest.ini` sets `testpaths = tests`, `addopts = -v --tb=short`, and registers the `unit` and `integration` markers (repo://pytest.ini#L1-L6).

Historical note: `tests/test_syntax.py`, `tests/test_streams.py`, and `tests/test_electron_build.py` no longer exist — all of their coverage was consolidated into `tests/test_unit.py`. Any documentation still pointing at those files (e.g. the run example in `README.md`) is outdated; the commands below and `AGENTS.md` are authoritative.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt  # pins pytest==9.1.1 and playwright==1.62.0
playwright install chromium          # CI uses: python -m playwright install --with-deps chromium
```

## Running the Tests

```bash
pytest -m unit                       # fast unit tests only, no browser needed
pytest tests/test_website.py         # Playwright website integration tests
pytest tests/test_design_layout.py   # Playwright design/layout tests
pytest                               # everything
```

The `browser` fixture skips (rather than fails) when Chromium is not installed, so unit-only runs work without Playwright browsers.

## Shared Fixtures (`tests/conftest.py`)

All test files share the fixtures defined in `tests/conftest.py` (repo://tests/conftest.py#L23-L90). Per `AGENTS.md`, reuse these fixtures instead of duplicating paths, file reads, or JSON parsing in individual test files (repo://AGENTS.md#L25).

| Fixture | Scope | Provides |
| --- | --- | --- |
| `base_dir` | session | Repository root as a `Path` |
| `browser` | session | Headless Chromium via `sync_playwright`, launched with `--no-sandbox --disable-dev-shm-usage`; skips if Chromium is missing |
| `page` | function | A fresh `Page` per test, closed afterwards |
| `index_html` | session | Raw contents of `index.html` |
| `video_html` | session | Raw contents of `video/index.html` |
| `package_json` | session | Parsed `package.json` as a dict |
| `main_css_content` | session | Raw contents of `src/css/style.css` |
| `page_urls` | session | `file://` URIs for `index`, `video`, and `impressum` pages |
| `audio_stations` | session | `(name, url)` tuples parsed from `index.html` |
| `video_stations` | session | `(name, url)` tuples parsed from `video/index.html` |

`audio_stations` and `video_stations` are parsed from the `data-name`/`data-url` attribute pairs in the HTML (both attribute orders are supported, repo://tests/conftest.py#L11-L20). Those `data-url` attributes are the single source of truth for stream URLs: stream URLs are never hardcoded in tests or code (repo://AGENTS.md#L26).

## Unit Tests (`tests/test_unit.py`)

The whole module is marked `unit` via a module-level `pytestmark` (repo://tests/test_unit.py#L11). It has four groups:

1. **Syntax and balance checks** — `test_syntax_valid`, parametrized over `.html`, `.js`, `.css`, `.md`, and `.json` (repo://tests/test_unit.py#L82-L103). HTML files must have a doctype, `html`/`head`/`body`/`title`, a charset, closed `div`/`span`/`nav`/`header`/`footer`/`main`/`section` tags, and matched `script`/`style` tags; JavaScript must have balanced `[ ] { } ( )`, backticks, and block comments and no `;;`; CSS must have balanced braces and parentheses; Markdown must have an even number of code fences; JSON must parse. The scan walks the whole repo excluding `node_modules`, `.venv`, `.git`, `__pycache__`, `dist`, `build`, and `.pytest_cache` (repo://tests/test_unit.py#L14).
2. **CSS structure** — structural assertions only, never exact value regexes, so they survive redesigns (repo://AGENTS.md#L27; repo://tests/test_unit.py#L106-L134). The `@media (max-width: 768px)` block must contain exactly one `.container` rule; the `@media (max-width: 480px)` block must exist, be brace-balanced, contain at least 9 rules, include the core selectors (`.container`, `header`, `.logo`, `nav`, `.station-grid`, `.station-btn`, `.current-station`, `.audio-controls`), and must not contain `prefers-reduced-motion`.
3. **Stream URL validation** — no network access, purely structural (repo://tests/test_unit.py#L137-L165). `test_audio_streams` requires at least 5 audio stations, expects the hosts `st01.sslstream.dlf.de`, `rndfnk.com`, and `streamabc.net` to appear, and requires every URL to be `http(s)` with a netloc. `test_video_streams` requires at least 4 video stations, all `http(s)` and ending in `.m3u8`. `test_no_duplicate_station_urls` requires no URL to appear in both pages. Additionally, `test_no_secrets_in_station_urls` is marked `xfail` (non-strict) because `index.html` currently contains the session parameters `token=`, `sid=`, `cid=`, and `tvf=` (repo://tests/test_unit.py#L168-L171) — this is a deliberate product decision documented in `AGENTS.md` (repo://AGENTS.md#L28); do not "fix" it by deleting the test.
4. **Electron build config** — `test_electron_build` asserts that `electron/main.js` exists, that the `build` block in `package.json` contains `appId`, `productName`, `directories`, and `files`, that `files` includes `electron/**/*`, `src/**/*`, `index.html`, `favicon/**/*`, `manifest.json`, `video/**/*`, and `impressum/**/*`, and that `electron` and `electron-builder` are in `devDependencies` (repo://tests/test_unit.py#L177-L186; repo://package.json#L18-L32).

## Website Integration Tests (`tests/test_website.py`)

Marked `integration` (repo://tests/test_website.py#L6). Using the `page` and `page_urls` fixtures, each page is loaded directly via its `file://` URI — no server needed:

- `test_pages_load_with_elements` (parametrized over `index`, `video`, `impressum`) asserts the page title contains "Oidarwave" (or "Impressum") and that the page's key selectors are present: `.logo`, `nav`, `.station-btn` for index; `#videoPlayer`, `.station-btn` (at least 4 buttons) for video; `h1` for impressum (repo://tests/test_website.py#L8-L23).
- `test_index_elements` asserts the nav has at least 3 links including "Radio" and "Video", that `#audioPlayer` is visible and has a `controls` attribute, that `#cookieBanner`, `#acceptCookies`, and `#declineCookies` are visible, and that `#statusIndicator` and `#currentSongTitle` exist (repo://tests/test_website.py#L26-L36).

## Design/Layout Tests (`tests/test_design_layout.py`)

Also marked `integration` (repo://tests/test_design_layout.py#L9). Both test groups are `xfail(strict=False)` warning checks — they report design/layout-shift regressions as XPASS/XFAIL hints, never as hard failures:

- `test_design_layout_no_shift` runs all three pages at mobile (375×667) and desktop (1280×800) viewports (repo://tests/test_design_layout.py#L11-L98). A `PerformanceObserver` CLS counter is installed before navigation; the test then asserts that a viewport `meta` tag exists, there is no horizontal overflow (> 1 px), every design anchor (`.logo`, `nav`, `.station-btn`, `#videoPlayer`, `h1`) is visible with a bounding box no wider than the viewport, no `src`-bearing `img`/`video`/`iframe` lacks fixed dimensions (`width`+`height` attributes or a non-auto `aspect-ratio`), and the measured cumulative layout shift stays within the Web Vitals "good" budget of `CLS <= 0.1`.
- `test_design_regex_guard` performs static structural checks on the HTML and CSS of each page (repo://tests/test_design_layout.py#L101-L152): viewport meta present, every `<img>` has `width`+`height`, no inline `position: absolute`/`float` styles, an `overflow-x` guard in the CSS, size reserves (`min-height`, `contain-intrinsic-size`) for `.station-btn`, `.current-station`, and `header`, a `position: fixed` `.cookie-banner` rule, `prefers-reduced-motion` support, and `@media (max-width: 768px)` / `@media (max-width: 480px)` blocks. The video page additionally requires an `aspect-ratio` reserve in its CSS.

## Continuous Integration (`.github/workflows/test.yml`)

The `Tests` workflow (repo://.github/workflows/test.yml) runs on push and pull request to `main`, `beta`, and `gamma`, plus manual `workflow_dispatch`, with `permissions: contents: read`, a per-ref concurrency group with `cancel-in-progress: true`, and a 15-minute job timeout on `ubuntu-latest`. It:

1. Sets up Python 3.14 with the pip cache keyed on `requirements-dev.txt` (repo://.github/workflows/test.yml#L27-L32).
2. Installs dependencies: `pip install -r requirements-dev.txt` followed by `python -m playwright install --with-deps chromium` (repo://.github/workflows/test.yml#L34-L39).
3. Runs the three test steps in order: `pytest tests/test_unit.py -m unit`, `pytest tests/test_website.py`, `pytest tests/test_design_layout.py` (repo://.github/workflows/test.yml#L41-L48).

## Project Rules for Tests (`AGENTS.md`)

- Stream URLs are never hardcoded; the `data-url` attributes in `index.html` and `video/index.html` are the single source of truth, consumed by tests through the `conftest.py` fixtures (repo://AGENTS.md#L26).
- Reuse the shared fixtures from `tests/conftest.py` instead of duplicating paths or JSON parsing (repo://AGENTS.md#L25).
- CSS tests stay structural only — blocks present, braces balanced, key selectors present — with no exact value regexes (repo://AGENTS.md#L27).
- The `xfail` on secrets in station URLs is a product decision, not a test bug: keep `test_no_secrets_in_station_urls`, do not delete it (repo://AGENTS.md#L28).

## Related Pages

- [Build and Packaging Operations](build.md)
- [User Interface Components](../architecture/ui.md)
- [Quickstart](../quickstart.md)
- [Error Handling Workflow](../workflows/error-handling.md)
