---
type: concept
title: Stream Sources
description: Describes the external stream sources used by Oidarwave, including MP3 radio streams, HLS video streams, and metadata endpoints for song titles.
tags: [streaming, audio, video, hls, mp3, metadata]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-85af3a53f2cd35307c2af95c
    resource: repo://src/js/player.js
  - id: openwiki-source-344a605cf9b55b2039c6ed87
    resource: repo://video/index.html
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

## Overview

Oidarwave supports two types of media streams: audio (MP3) and video (HLS). Additionally, radio stations may provide metadata endpoints for real-time song title updates.

## MP3 Radio Streams

- Used for audio radio stations.
- Specified in the `data-url` attribute of station buttons in `index.html`.
- Examples: 
  - Deutschlandfunk: `https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3`
  - NDR 1 NDS: `https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3?aggregator=web&cid=01FCT9XYE3C7Y8087XEWPRC38Z&sid=30aynlfxURrCQmDeTH1p0OqVsoV&token=3Wf1JnFUByNruoizm4AdR_YPX5_CvsRtTKXV3VK-004&tvf=qhyw4VgcVxhmMTIxLnJuZGZuay5jb20`
- Handled by the HTML5 `<audio>` element in `player.js`.

## HLS Video Streams

- Used for video stations (Das Erste, ZDF, ARTE, Tagesschau24).
- Specified in the `data-url` attribute of station buttons in `video/index.html`.
- Examples:
  - Das Erste: `https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8`
  - ZDF: `https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8`
  - ARTE: `https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8`
  - Tagesschau24: `https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8`
- Handled by the HTML5 `<video>` element with the aid of hls.js (loaded via CDN in `video/index.html`).

## Metadata Endpoints

- Used for radio stations to fetch current song title and artist.
- Specified in the `data-metadata-url` attribute of station buttons in `index.html` (only for radio).
- Two formats are supported:
  - Plain text (.txt): e.g., `https://streamtext.dradio.de/dlf.txt` -> contains plain text like "Artist - Title"
  - JSON: e.g., `https://www.ndr.de/public/radioplaylists/ndr1niedersachsen.json` -> expected to have a structure that includes song information (as seen in the code, it tries to parse as JSON and then extracts from `data[0]` or similar)
- Fetched periodically (every 3 seconds) by `fetchMetadata` in `player.js` when a radio station is selected.
- The fetched metadata is displayed in `#currentSongTitle` and also used to update the Media Session API for lock screen display.

## Integration with Player

- When a station is selected, the `selectStation` function in `player.js`:
  1. Sets the current player's source to the stream URL.
  2. If a metadata URL is present, starts polling it for updates.
  3. Handles playback and status updates via media events.

## Error Handling and Status

- The player updates a status indicator (online, error, buffering, paused) based on media events and network state.
- Errors in stream loading or metadata fetching are logged to the console and reflected in the UI.

## Related Components

- [User Interface (Radio & Video)](../architecture/ui.md): Describes the HTML structure and styling.
- External Streams Integration: See [external-streams.md](../integrations/external-streams.md) for details on how stream sources are configured and extended.
