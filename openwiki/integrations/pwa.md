---
type: "Reference"
title: "Pwa"
openwiki_generated: true
verified:
  - by: openwiki/0.7.2
    at: 2026-11-03T19:02:34.893Z
sources:
  - id: openwiki-source-861dc5527e104968899d50ae
    resource: repo://impressum/index.html
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-b25e71362ad2d0521bb4e04c
    resource: repo://manifest.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-344a605cf9b55b2039c6ed87
    resource: repo://video/index.html
generated: { by: "openwiki/0.7.2", at: "2026-11-03T19:02:34.893Z" }
---


## Overview

Oidarwave is a static site (plain HTML plus `src/` assets) that is made installable as a Progressive Web App through a single web app manifest, `manifest.json`, linked from the document head of every HTML page. The manifest declares the app identity, launch URL, standalone display mode, dark theme/background colors, an SVG icon set (including maskable variants), and two home-screen shortcuts for the Radio and Livestream views. There is **no service worker** anywhere in the project, so the site has no programmable offline fallback; installability comes from the manifest alone, and offline behavior is limited to ordinary HTTP caching.

Related pages: [System Architecture Overview](../architecture/overview.md), [Electron Integration](electron.md), [Build Guide](../operations/build.md).

## Head wiring in `index.html`

The PWA entry point is the manifest link in the `<head>` of `index.html` (`repo://index.html#L21`):

```html
<link rel="manifest" href="/manifest.json">
```

The same link is present in `video/index.html` (`repo://video/index.html#L21`) and `impressum/index.html` (`repo://impressum/index.html#L24`), so every page shares one manifest.

The rest of the head contract around it:

- **Canonical and favicon** (`repo://index.html#L19-L20`): `<link rel="canonical" href="/">` and `<link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml">`.
- **Color scheme** (`repo://index.html#L18`): `<meta name="color-scheme" content="dark">` declares a dark-only UI, matching the manifest colors.
- **Open Graph tags** (`repo://index.html#L10-L15`): `og:title`, `og:description`, `og:image` (`/favicon/favicon.svg`), `og:url` (`/`), `og:type` (`website`), `og:locale` (`de_DE`) — the same SVG icon doubles as the social share image. `video/index.html` overrides `og:title`/`og:url` for the `/video/` page.
- **Font loading strategy** (`repo://index.html#L23-L41`): `dns-prefetch` for `https://profilbild.vercel.app`, `preconnect` for `fonts.googleapis.com` and `fonts.gstatic.com` (crossorigin), then a non-blocking pattern for the Google Fonts CSS — `<link rel="preload" ... as="style">` plus a `<link rel="stylesheet" media="print" onload="this.media = 'all'">` swap, with a `<noscript>` fallback that loads the stylesheet directly. A second emoji font (`Noto Color Emoji`) uses the same print-media swap (`repo://index.html#L45-L50`).
- **Scripts** (`repo://index.html#L52-L60`): nine deferred application scripts — `errors.js`, `player-core.js`, `uuid.js`, `mouse.js`, `cookie.js`, `notification.js`, `player.js`, `history.js`, `download_history.js`. None of them registers a service worker.

## Manifest field reference

`manifest.json` (`repo://manifest.json`) is 70 lines of JSON. Every field, with its current value and meaning:

| Field | Value | Lines | Meaning |
|---|---|---|---|
| `name` | `"Oidarwave - Dein Webradio"` | `repo://manifest.json#L2` | Full app name shown in install prompts and the installed app. |
| `short_name` | `"Oidarwave"` | `repo://manifest.json#L3` | Name used where space is tight (home screen, taskbar). |
| `description` | `"Oidarwave ist dein Webradio für jeden Geschmack."` | `repo://manifest.json#L4` | Matches the `meta name="description"` in `index.html`. |
| `id` | `"/"` | `repo://manifest.json#L5` | Stable identity of the installed app; equal to the start URL. |
| `start_url` | `"/"` | `repo://manifest.json#L6` | URL opened when the installed app launches. |
| `scope` | `"/"` | `repo://manifest.json#L7` | Navigation scope of the installed app; everything under the site root stays in the app window. |
| `display` | `"standalone"` | `repo://manifest.json#L8` | Launches without browser chrome (no address bar), app-like. |
| `background_color` | `"#0f172a"` | `repo://manifest.json#L9` | Splash-screen background while the app starts. |
| `theme_color` | `"#0f172a"` | `repo://manifest.json#L10` | Dark slate color applied to the window frame/taskbar; matches the Electron window background and CSS. |
| `categories` | `["entertainment", "music"]` | `repo://manifest.json#L11` | Store-style categorization. |
| `lang` | `"de"` | `repo://manifest.json#L12` | Manifest language, matching `<html lang="de">`. |

**Not present (deliberately):** `orientation`, `dir`, `version`, `share_target`, `screenshots`, and `prefer_related_applications` are all absent from the current manifest. The app version is **not** tracked in `manifest.json`; it lives in `package.json` as `"version": "0.9.16"` (`repo://package.json#L3`).

## Icons

All icon entries point at the same vector asset, `favicon/favicon.svg` (`repo://manifest.json#L13-L41`):

| Entry | `sizes` | `type` | `purpose` | Lines |
|---|---|---|---|---|
| 1 | `any` | `image/svg+xml` | (omitted → defaults to `any`) | `repo://manifest.json#L13-L18` |
| 2 | `192x192` | `image/svg+xml` | (omitted → `any`) | `repo://manifest.json#L19-L23` |
| 3 | `512x512` | `image/svg+xml` | (omitted → `any`) | `repo://manifest.json#L24-L28` |
| 4 | `192x192` | `image/svg+xml` | `maskable` | `repo://manifest.json#L29-L34` |
| 5 | `512x512` | `image/svg+xml` | `maskable` | `repo://manifest.json#L35-L40` |

The `192x192` and `512x512` entries satisfy the size requirements browsers use for installability; the `maskable` duplicates let Android adaptive-icon masks crop the SVG safely. Because a single scalable SVG serves every entry, the `favicon/` directory also ships raster fallbacks (`favicon.png`, `favicon.ico`, `favicon.icns`) for contexts that cannot render SVG — those are used by the OS/Electron packaging, not referenced by the manifest.

## Shortcuts

Two home-screen / context-menu shortcuts are declared (`repo://manifest.json#L42-L69`), each with its own icon entry (`favicon/favicon.svg`, `sizes: "any"`):

- **Radio starten** (`short_name`: `Start`, description `"Starte das Radio"`) → `url: "/"` (`repo://manifest.json#L42-L55`) — launches directly into the radio player.
- **Livestream starten** (`short_name`: `Livestream`, description `"Starte den Livestream"`) → `url: "/video"` (absolute path) (`repo://manifest.json#L56-L69`) — launches directly into the video livestream page (`video/index.html`).

## Offline behavior

`index.html` registers no service worker — its only scripts are the nine application modules listed above (`repo://index.html#L52-L60`), and no `service-worker.js` or `navigator.serviceWorker` registration exists anywhere in the project's own code. Consequently there is no offline fallback page, no cache-first strategy, and no background sync/push (push would also need a service worker and VAPID keys). Offline resilience is limited to the browser's standard HTTP cache of previously fetched assets.

## Operational notes

- The manifest is a static file shipped as-is: it is included in the Electron build allowlist (`package.json` `build.files`, see [Build Guide](../operations/build.md)) and in the release workflow, so the desktop app and the hosted site share the same install metadata.
- Changing any manifest field (name, icons, `start_url`, `display`, shortcuts, colors) takes effect in the browser after the manifest is re-fetched and, for installed apps, on next update/reinstall.
- Verification: load the page, confirm `<link rel="manifest" href="/manifest.json">` in the head, then inspect Chrome DevTools → Application → Manifest to see the parsed fields, icons (including maskable), and shortcuts; Application → Service Workers should remain empty.
