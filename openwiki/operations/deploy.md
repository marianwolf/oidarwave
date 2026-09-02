---
type: process
title: Deployment to Vercel
description: Describes how Oidarwave is hosted as a static web application on Vercel, including configuration evidence from README and package.json, and analytics integration.
tags: [deployment, vercel, static-web, hosting]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-f5dd57353d17e5dc5ea58a83
    resource: repo://src/js/cookie.js
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---
# Deployment to Vercel

Oidarwave is hosted as a static web application on Vercel, providing a live demo at https://oidarwave.vercel.app. The hosting configuration is derived from the project's package.json and the static nature of the application.

## Vercel Hosting

The project is explicitly configured for Vercel hosting, as indicated by:

- The `appId` field in package.json set to `app.oidarwave.vercel`
- The `desktopName` field set to `app.oidarwave.vercel`
- References to Vercel in the author field and live demo links in README.md

## Static Web Application

As a static web site, Oidarwave requires no server-side installation and can be served directly from any static file host. Vercel serves the files from the repository root, with `index.html` as the entry point.

## Analytics Integration

The application conditionally loads Vercel Insights (`/_vercel/insights/script.js`) and Vercel Speed Insights (`/_vercel/speed-insights/script.js`) based on user consent for analytics, ensuring GDPR compliance while providing performance metrics.

## Deployment Process

Changes to the repository are automatically built and deployed by Vercel via its Git integration. Since the application is static, no build step is required; Vercel deploys the files directly. However, the project's package.json does not define a Vercel-specific build command, relying on Vercel's static site detection.

## Environment and Configuration

Vercel provides automatic environment variables (such as `VERCEL`) and integrates with the project's analytics scripts. The deployment benefits from Vercel's global CDN, edge network, and instant rollback capabilities.
