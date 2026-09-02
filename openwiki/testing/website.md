---
type: test suite
title: Website Testing
description: Test suite for validating the Oidarwave website functionality, including page loads, element presence, and stream URL formats.
tags: [testing, website, Playwright]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-4636a46c1ad9ea46ccbd30e4
    resource: repo://tests/test_website.py
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# Website Testing

This test suite validates the functionality of the Oidarwave website using Playwright and pytest. It ensures that the website pages load correctly, essential UI elements are present, and media stream URLs are properly formatted.

## Test Organization

The tests are structured with session-scoped fixtures for efficiency and parametrized test classes to cover multiple pages and streams.

### Fixtures

- `browser`: Launches a Chromium browser instance once per test session.
- `page`: Provides a new page for each test, closing it afterward.
- `pages`: Supplies the tuple of page names and file:// URLs for index, video, and impressum pages.
- `audio_streams`: Provides the tuple of audio stream names and URLs.
- `video_streams`: Provides the tuple of video stream names and URLs.

### Test Classes

- `TestPages`: Verifies that each page loads and contains the expected title (either "Oidarwave" or "Impressum").
- `TestPageElements`: Checks for the presence of required elements on each page:
  - Index page: logo (`.logo`), navigation (`nav`), and station buttons (`.station-btn`).
  - Video page: video player (`#videoPlayer`) and at least four station buttons.
  - Impressum page: at least one visible heading (`h1`).
- `TestAudioStreams`: Validates that each audio stream URL starts with `http://` or `https://` and has a length greater than 10 characters.
- `TestVideoStreams`: Ensures each video stream URL starts with `https://` and ends with `.m3u8`.
- `TestIndexSpecific`: Contains additional tests specific to the index page:
  - Navigation: confirms the presence of at least three links in the navigation, including "Radio" and "Video".
  - Audio player: checks that the audio player element (`#audioPlayer`) is visible and has the `controls` attribute.
  - Cookie banner: verifies the cookie banner (`#cookieBanner`) and its accept/decline buttons are visible.
  - Status display: ensures the status indicator (`#statusIndicator`) and current song title (`#currentSongTitle`) elements exist.

## Execution

The test suite requires `pytest` and `playwright` with the Chromium browser installed. Tests can be run with `pytest tests/test_website.py`.

## Purpose

This suite provides confidence that the website's core functionality and media streams are operational, preventing regressions in page loads, UI elements, and stream accessibility.
