---
type: concept
title: External Streams Catalog
description: Catalog of external radio and TV streams used by Oidarwave, including their stream URLs and metadata sources for track information.
tags: [streams, radio, TV, metadata, integration]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-344a605cf9b55b2039c6ed87
    resource: repo://video/index.html
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---

# External Streams Catalog

This page documents the external radio and television streams integrated into the Oidarwave application. Each entry includes the stream URL for playback and, where available, the metadata URL used to retrieve current track or program information.

## Radio Streams

The following radio streams are available in the radio section of the application.

| Name | Stream URL | Metadata URL | Notes |
|------|------------|--------------|-------|
| Deutschlandfunk | `https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3` | `https://streamtext.dradio.de/dlf.txt` | Plain text metadata |
| Deutschlandfunk Nova | `https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3` | `https://static.deutschlandfunknova.de/actions/dradio/playlist/onair` | JSON metadata |
| NDR 1 NDS (Hannover) | `https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3?aggregator=web&cid=01FCT9XYE3C7Y8087XEWPRC38Z&sid=30aynlfxURrCQmDeTH1p0OqVsoV&token=3Wf1JnFUByNruoizm4AdR_YPX5_CvsRtTKXV3VK-004&tvf=qhyw4VgcVxhmMTIxLnJuZGZuay5jb20` | `https://www.ndr.de/public/radioplaylists/ndr1niedersachsen.json` | JSON metadata |
| NDR 2 (Niedersachsen) | `https://f131.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2CWDYWJHGF4QAJ0SVV730&sid=30ayvsXjJydzMH4MNiWpLV4nURH&token=FMhlmkJlc2prmQ6CBBjpYxFSaNHq6IDWPQKR9jRDjMA&tvf=0axLwWccVxhmMTMxLnJuZGZuay5jb20` | `https://www.ndr.de/public/radioplaylists/ndr2.json` | JSON metadata |
| NDR Info (Niedersachsen) | `https://f131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBRKHKTB73QDVNX7A9RT082R&sid=30az5c4cyuUHsy4tHS3YkD5oDcc&token=Z-H6aIgEFsx5kBPmtfq5x2UNGGmMOtyjcoYox9RHg2E&tvf=np8tvHkcVxhmMTMxLnJuZGZuay5jb20` | `https://www.ndr.de/epg/current/station-ndrinfo` | HTML/EPG metadata |
| NDR Kultur (Niedersachsen) | `https://d141.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2EJ6T7QK3WENQ5KT9S2FB&sid=30azBxZOH15ri7EofrRpS1t3RXT&token=T_eVqj_rP6Bkb57di3056sjieytJKHDUnaT86DKLi-o&tvf=P4FiYIUcVxhkMTQxLnJuZGZuay5jb20` | `https://www.ndr.de/public/radioplaylists/ndrkultur.json` | JSON metadata |
| N-JOY (Niedersachsen) | `https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3?aggregator=web&cid=01FBRKKTM6TVGA3B3W6Y8NMXK8&sid=30azMobKXI3x91RNnGaf7v0Jpbl&token=VvAbuddXUjbU602noIVp6b7CQBEikUS280qPiNmxABM&tvf=i4pneZkcVxhmMTIxLnJuZGZuay5jb20` | `https://www.ndr.de/public/radioplaylists/njoy.json` | JSON metadata |
| 80s80s Digital | `https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667` | `https://iris-80s80s.loverad.io/flow.json?station=62` | JSON metadata |
| 90s90s | `https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761` | *(none)* | No metadata URL provided in source |
| BBG Radio | `https://radio.bbg-bew.de` | *(none)* | No metadata URL provided in source |

## Video Streams

The following television streams are available in the video section of the application. These are HLS (HTTP Live Streaming) URLs.

| Name | Stream URL | Notes |
|------|------------|-------|
| Das Erste | `https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8` | ARD Das Erste live stream |
| ZDF | `https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8` | ZDF live stream |
| ARTE | `https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8` | ARTE live stream (German) |
| Tagesschau24 | `https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8` | Tagesschau24 live news stream |

## Stream Integration Notes

- Radio stream buttons in `index.html` include `data-url` for the stream and optionally `data-metadata-url` for track information.
- Video stream buttons in `video/index.html` include `data-url` for the HLS manifest.
- The application uses the `player.js` and `video.js` modules to handle playback and metadata retrieval.
- Metadata URLs that return JSON are parsed to extract current song or program information.
- Some streams (like NDR Info) use EPG URLs that may require different parsing.
- Streams without a metadata URL do not display current track information in the UI.

## Related Components

- [Player UI](/openwiki/architecture/ui.md) - Defines how streams are presented in the interface.
- [Streaming Concepts](/openwiki/concepts/streaming.md) - Details the underlying streaming technologies used.
<!-- openwiki: broken internal link [/openwiki/workflows/metadata-polling.md] file "/openwiki/workflows/metadata-polling.md" does not exist. Fix the href or restore the target, then delete this comment. -->
- [Metadata Polling Workflow](/openwiki/workflows/metadata-polling.md) - Describes how metadata is periodically fetched and updated.
