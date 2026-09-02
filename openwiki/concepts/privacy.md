---
type: privacy
title: Privacy & Data Protection
description: Oidarwave implements a privacy‑first approach with no tracking cookies, GDPR‑compliant localStorage‑only data handling, and an explicit consent banner for external scripts.
tags: ["privacy", "data-protection", "gdpr", "localstorage", "consent"]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T21:38:00.224Z
sources:
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-f5dd57353d17e5dc5ea58a83
    resource: repo://src/js/cookie.js
  - id: openwiki-source-859a83c9cf83489fefa6211b
    resource: repo://src/js/download_history.js
  - id: openwiki-source-cd156ee2be7a00377eeb8dbd
    resource: repo://src/js/history.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T21:38:00.224Z" }
---
# Privacy & Data Protection

Oidarwave is built with a privacy‑first mindset, complying with GDPR and avoiding any form of user tracking. The application stores all user‑related data locally in the browser and only loads external analytics scripts after explicit consent.

## No Tracking Cookies
Oidarwave does not set or read any persistent cookies for tracking purposes. All consent and preference data are kept in `localStorage`.

## Local‑Only Storage
The following information is stored in `localStorage`:
- Consent flag (`ja`/`nein`)
- Consent timestamp
- Last radio station URL
- Last television station URL
- Data‑saver mode flag (`ja`/`nein`)
- Playback history (as JSON, implemented in version 0.9.8)
- The playback history can be downloaded as a JSON file via Ctrl+S (0.9.9)

## Consent Banner
On first visit (or after consent expires) a banner appears allowing the user to accept or decline the loading of external scripts. Accepting the banner stores `cookieConsent=true` and a timestamp; declining stores `cookieConsent=false`. Consent is valid for 90 days, after which it is automatically cleared.

## Conditional Loading of External Scripts
When the user accepts consent, the following scripts are dynamically inserted into the page:
- Vercel Insights (`/_vercel/insights/script.js`)
- Vercel Speed Insights (`/_vercel/speed-insights/script.js`)
- Google Tag Manager (`https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ`) with a `gtag` initialization snippet.

If consent is not given, these scripts are never added, ensuring no data is sent to third‑party analytics services.

## GDPR Statement
The project declares compliance with the EU General Data Protection Regulation (GDPR) and respects user privacy by design.

## Roadmap Features and Privacy
Implemented features from versions 0.9.10 through 0.9.15 align with the project's privacy‑first principles:
- **Enhanced video error diagnostics, PWA preparation (0.9.10)**: PWA features such as service workers and manifest files do not introduce tracking mechanisms; they only enable offline installation and performance improvements.
- **PWA, design optimization, Ctrl+S download fix (0.9.11)**: PWA implementation remains client‑side with no data transmission to external servers. Design updates and the Ctrl+S download fix are purely UI/UX improvements.
- **Playback display (0.9.12)**: Shows current media information (title, artist) obtained from the media stream; this is a UI‑only feature that does not store or transmit additional data.
- **Design system update and JavaScript error handling improvement (0.9.13)**: Refactoring of internal code and UI components does not alter data storage or transmission practices.
- **Electron build and npm (0.9.14)**: Packaging the web application as a desktop executable via Electron does not change the client‑side data handling; all data remains in `localStorage` or IndexedDB (if used) within the app's sandbox.
- **Developer documentation, Electron bug fixes, Renovate Bot (0.9.15)**: Concerns documentation and dependency management; no impact on user data or privacy.

Planned features listed in the roadmap (integration of more servers, dark/light mode toggle, favorites, user profiles) are not yet implemented. When added, each will require a dedicated privacy review to ensure they continue to meet the project’s GDPR‑compliant, localStorage‑only data handling and consent‑driven external script loading.
