---
type: privacy
title: Privacy & Data Protection
description: Oidarwave implements a privacy‑first approach with no tracking cookies, GDPR‑compliant localStorage‑only data handling, and an explicit consent banner for external scripts.
tags: ["privacy", "data-protection", "gdpr", "localstorage", "consent"]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-f5dd57353d17e5dc5ea58a83
    resource: repo://src/js/cookie.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
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
