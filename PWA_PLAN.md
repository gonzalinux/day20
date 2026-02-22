# Day20 PWA & Mobile Distribution Plan

## Overview

Convert Day20 into a Progressive Web App (PWA) and distribute it via Google Play and the Apple App Store, adding push notifications and calendar export when a session is confirmed.

All three features (PWA, notifications, calendar) are triggered by the same event: **the DM confirms a session time**. They are designed to be implemented together as a single milestone.

---

## Feature 1 — PWA Setup

### What
Make the web app installable on desktop and mobile devices via the browser's native install prompt.

### Why this approach
- `vite-plugin-pwa` integrates directly with Vite and requires minimal configuration
- The app already uses `vite-ssg` for pre-rendering, which is compatible
- Assets are served from `https://day-20.com` (already live, HTTPS)
- Offline functionality is not a goal since the app is useless without the backend — so a simple asset-caching service worker is sufficient

### What it gives us
- Install prompt on Android (Chrome) and desktop (Chrome, Edge)
- Install prompt on iOS Safari (Add to Home Screen)
- Faster repeat visits via cached static assets
- Required foundation for store distribution (Feature 2)

### Implementation steps
1. `cd frontend && bun add -D vite-plugin-pwa`
2. Add `VitePWA()` plugin to `vite.config.ts` with:
   - `registerType: 'autoUpdate'`
   - `manifest` block (name, short_name, theme_color, icons)
   - `workbox.globPatterns` to cache JS/CSS/HTML/images
3. Add 192×192 and 512×512 PNG icons to `frontend/public/`
4. The `<meta name="theme-color">` already exists in `index.html` — verify it matches the manifest

### Notes
- The existing `site.webmanifest` linked in `index.html` will be replaced/managed by the plugin
- Test with `bun run build && bun run preview`, not the dev server (service workers don't activate in dev by default)

---

## Feature 2 — Store Distribution

### Google Play — TWA (Trusted Web Activity)

#### Why TWA over Cordova
- No extra code or wrapper project to maintain
- Loads directly from `https://day-20.com` — updates deploy instantly without store review
- Google's officially recommended approach for web-to-Play distribution
- Fully native-looking (no browser chrome)

#### Why not bundle assets locally (like Cordova)
- Day20 requires the backend to function — offline asset bundling provides no real benefit
- TWA keeps the distribution pipeline simple

#### Implementation steps
1. Complete Feature 1 (PWA must pass Lighthouse PWA audit)
2. Go to [PWABuilder](https://www.pwabuilder.com) and enter `https://day-20.com`
3. Download the generated AAB (Android App Bundle)
4. Sign and upload to Google Play Console

### Apple App Store — WKWebView wrapper

#### Why not TWA on iOS
- Apple does not support TWA
- WKWebView (Safari engine wrapper) is the standard approach

#### Why PWABuilder over Capacitor
- No new codebase to maintain
- Already familiar with App Store submission from existing Cordova app
- PWABuilder generates an Xcode project automatically

#### Implementation steps
1. Go to [PWABuilder](https://www.pwabuilder.com) and enter `https://day-20.com`
2. Download the generated Xcode project
3. Open in Xcode, set bundle ID and signing certificate
4. Submit via App Store Connect (same process as existing Cordova app)

#### iOS push notification caveat
- Push notifications (Feature 3) on iOS require the PWA to be **installed to home screen**
- They do not work in Safari browser tabs
- iOS 16.4+ only

---

## Feature 3 — Push Notifications via Firebase Cloud Messaging (FCM)

### What
Notify players when the DM confirms a session time, without them needing to have the app open.

### Why FCM
- FCM is the standard for web push on Android/Chrome
- Works with the PWA service worker via the Web Push API
- Free tier is sufficient for a small group app
- Same FCM setup works for both web (PWA) and future native wrappers if needed

### Architecture
```
DM confirms session
  → Backend triggers FCM HTTP API
  → FCM delivers push to each subscribed player's device
  → Service worker receives push event
  → Notification shown to player
```

### Implementation steps

**Frontend:**
1. Add Firebase SDK (`bun add firebase`)
2. Add FCM service worker (`firebase-messaging-sw.js`) to `frontend/public/`
3. On room join: request notification permission and get FCM token
4. Send FCM token to backend via new endpoint `POST /rooms/:id/subscribe`
5. Store subscriptions per room in the existing MongoDB database

**Backend:**
1. Add new field `fcmTokens: string[]` to the Room model
2. Add `POST /rooms/:id/subscribe` endpoint to save a player's FCM token
3. When session is confirmed (new endpoint or existing update), call FCM HTTP v1 API to send push to all tokens in the room
4. Add `FIREBASE_SERVICE_ACCOUNT` to `backend/.env`

### Notes
- FCM tokens can expire — handle silently (remove stale tokens on send failure)
- Notification permission must be requested in response to a user gesture (button click), not on page load
- iOS 16.4+ only, and only when installed to home screen

---

## Feature 4 — Add to Calendar

### What
After a session is confirmed, players can add it to their personal calendar app with one tap.

### Why .ics over Google Calendar API
- Works for every calendar app (Google, Apple, Outlook, etc.) with zero OAuth setup
- No API keys or token management
- Appropriate for a small group app — the simplicity outweighs the less-seamless UX
- ~30 lines of code

### Implementation steps

**Frontend only — no backend changes needed:**
1. When session is confirmed, show an "Add to Calendar" button in the room UI
2. On click, generate a `.ics` file in memory:
   - `DTSTART` / `DTEND` from the confirmed session time
   - `SUMMARY`: room name + "D&D Session"
   - `DESCRIPTION`: link back to the room URL
3. Trigger a browser download of the `.ics` file
4. User opens it → imports into their calendar app automatically

### Notes
- Session time is already stored with timezone info — use it directly for `DTSTART`
- No external library needed, `.ics` format is simple plain text
- On iOS the file opens directly in Apple Calendar

---

## Implementation Order

1. **PWA setup** — prerequisite for everything else
2. **Add to Calendar** — lowest effort, highest immediate value
3. **Push notifications** — most backend work, do last
4. **Store submission** — after PWA is live and tested

---

## Open Questions Before Starting

- Does the DM currently have a way to "confirm" a session time, or is that a new feature to build?
- Should notification opt-in be per-player or per-room?
- What should the confirmed session event look like in the data model?
