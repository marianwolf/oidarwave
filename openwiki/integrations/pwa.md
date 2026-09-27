---
type: integration
title: PWA Integration
description: Documentation of the Progressive Web App implementation using manifest.json for installability and shortcuts, noting the absence of a service worker for offline caching.
tags: [PWA, manifest, offline, web-app, shortcuts]
verified:
  - by: openwiki/0.5.2
    at: 2026-09-27T19:48:35.317Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-b25e71362ad2d0521bb4e04c
    resource: repo://manifest.json
generated: { by: "openwiki/0.5.2", at: "2026-09-27T19:48:35.317Z" }
---

## Overview
The Oidarwave web application is configured as a Progressive Web App (PWA) primarily through a web app manifest (`manifest.json`) linked from the base HTML. This manifest enables installation to the home screen, defines the app’s appearance and launch behavior, and provides shortcuts for quick access to core features. The current implementation does not include a service worker, so offline capabilities rely on standard HTTP caching rather than programmable offline fallback.

## Manifest Integration
The manifest is declared in the document head of `index.html`:
```html
<link rel="manifest" href="/manifest.json">
```
This link (`repo://index.html#L21`) instructs the browser to fetch and apply the PWA metadata.

## Manifest Contents
The manifest file (`repo://manifest.json`) defines the following key sections:

### App Metadata
- **Name** and **short name**: “Oidarwave - Dein Webradio” and “Oidarwave” (`repo://manifest.json#L2-L4`)
- **Description**: “Oidarwave ist dein Webradio für jeden Geschmack.” (`repo://manifest.json#L4`)
- **Start URL** and **scope**: Both set to `/` (`repo://manifest.json#L5-L6`)
- **Display mode**: `standalone` for app‑like window (`repo://manifest.json#L7`)
- **Orientation**: `any` to allow both portrait and landscape (`repo://manifest.json#L8`)
- **Version**: `0.9.12` (`repo://manifest.json#L9`)
- **Categories**: `entertainment` and `music` (`repo://manifest.json#L10-L13`)
- **Language** and **direction**: `de` and `ltr` (`repo://manifest.json#L14-L15`)

### Icon Resources
Multiple icon entries reference the same SVG favicon at various sizes and with different purposes (`any` and `maskable`) to support adaptive icons across platforms (`repo://manifest.json#L17-L53`).

## Shortcuts
The manifest defines two home‑screen shortcuts that launch the app directly to specific views:
- **Radio starten** (short_name: “Start”) – opens the radio player at `/` (`repo://manifest.json#L56-L68`)
- **Livestream starten** (short_name: “Livestream”) – opens the video livestream at `/video` (`repo://manifest.json#L70-L82`)

Each shortcut uses the same SVG favicon as its icon.

## Share Target
A share target is declared to allow users to share content to the app via a GET request to the root URL with no additional parameters (`repo://manifest.json#L84-L88`). This enables the app to receive shared URLs or text from other applications.

## Offline Capabilities
No service worker registration is present in the HTML (`repo://index.html#L30-L38` shows only application scripts), and a repository search for `service-worker.js` returns no files. Consequently, offline functionality depends on the browser’s HTTP cache of previously visited resources rather than a programmable cache‑first strategy.

## Integration Points
- **HTML**: The manifest link in `index.html` is the primary entry point for PWA detection.
- **Manifest**: Drives installation behavior, iconography, shortcuts, and share target.
- **Application Logic**: No additional JavaScript is required for basic PWA installation; shortcuts and share target are handled by the browser.

## Configuration
The PWA behavior is adjusted by editing `manifest.json`. Changes to the name, icons, start URL, display mode, or shortcuts take effect upon reinstallation or manifest update.

## Testing
Manual verification steps include:
1. Confirming the manifest link appears in the page head.
2. Using browser devtools to inspect the manifest application (e.g., Chrome → Application → Manifest).
3. Testing installation flow (“Install Oidarwave”) and verifying standalone launch.
4. Checking that shortcuts appear in the installed app’s context menu and launch the correct URLs.
5. Verifying the share target receives shared content.
6. Observing that no service worker is registered under Application → Service Workers.
