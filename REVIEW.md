# Codebase review

Reviewed and updated 30 September 2026. The static HTML/CSS/JavaScript stack fits this site cleanly. No framework, build step, or runtime dependencies are required.

## Optimization and Maintainability Loop (Low-Bandwidth & Mobile Resilience)

### 1. Low-Bandwidth Network Payload Hygiene (`index.html`)
- **Eliminated 492 KiB redundant icon requests:** Removed heavy `sizes="192x192"` (62 KiB) and `sizes="512x512"` (430 KiB) PNG `<link rel="icon">` tags from the HTML `<head>`. Mobile browsers (specifically Android Chrome) greedily fetch the largest icon specified in `<head>`, which previously wasted almost 0.5 MB of data on the first page load before any user interaction. Both icons remain preserved inside `manifest.webmanifest` for PWA installation and add-to-home-screen triggers.

### 2. Service Worker Lie-Fi Resilience (`sw.js`)
- **Network timeout with immediate cache fallback:** Added a 3-second network race condition with cache fallback for HTML navigation requests (`mode === 'navigate'`). When a user on a patchy 2G/3G cellular connection experiences packet loss ("Lie-Fi"), the browser is no longer stuck on a 30-second blank screen waiting for the TCP timeout; the Service Worker seamlessly delivers the cached offline shell in under 3 seconds.

### 3. Client-Side Weather Caching (`app.js`)
- **30-Minute `sessionStorage` cache with offline fallback:** Regional forecast data from Open-Meteo is cached with a 30-minute time-to-live (`TTL`). Subsequent page views, reloads, and tab switches display weather instantly (0 ms) with 0 network bytes transferred. If the network is unavailable, the expired cache is rendered as a graceful fallback instead of failing to an error screen.

### 4. Adaptive Metadata Polling & Zero V8 Deoptimization (`app.js`)
- **Offline & Save-Data aware polling:** `fetchLiveTrack` checks `NetworkMonitor.isOnline()` and halts requests when offline. Polling intervals adapt dynamically: 8 seconds during active playback (16s on Save-Data / 2G), 30s when playing in background tabs, 60s when paused, and completely suspended when paused in background tabs.
- **Stable callback architecture:** Replaced the creation and `delete` of random global properties on `window` with a stable handler (`window.__rsMetadataHandler`), eliminating V8 hidden class transitions, dictionary-mode deoptimizations on the global object, and heap garbage churn.

### 5. Scroll & Layout Reflow Prevention (`app.js`)
- **Throttled sticky player visibility:** Replaced raw continuous scroll/resize execution with a `requestAnimationFrame` ticking pattern. `getBoundingClientRect()` is called at most once per animation frame, completely eliminating forced synchronous reflows and scroll stutter on budget mobile devices.

### 6. Mobile Canvas GPU & Battery Optimization (`app.js`)
- **Clamped Device Pixel Ratio:** Clamped DPR to `Math.min(window.devicePixelRatio || 1, 2)`. On 3x/4x mobile displays, this cuts canvas pixel fill-rate calculations by over 55%, preventing battery drain and thermal throttling.
- **Zero DOM queries in 60fps render loop:** Subscribed `FishPond` to `ThemeManager` state changes in memory. Eliminated continuous `document.documentElement.getAttribute('data-theme')` calls from the animation loop (saving up to 120 DOM queries per second).

### 7. Save-Data Aware Third-Party Chat (`app.js`)
- **Deferred chat iframe loading:** When `navigator.connection.saveData` or a 2G connection is detected, the third-party Cbox chat iframe is not auto-loaded via `IntersectionObserver`. It loads only if the user explicitly interacts (tap, click, focus) with the chat card, saving 300+ KiB of third-party scripts and socket connections for users on metered connections.

### 8. Streaming Resilience with Multi-Stage Backoff (`app.js`)
- **Exponential retry on network blips:** Added event handling for `stalled` audio states and introduced a 3-stage backoff (2.5s, 5s, 10s) on stream connection drops, enabling the player to recover automatically from transient cellular dead zones before displaying a fatal error. Direct user click rejections continue to route immediately to fatal error status for transparent user feedback.

### 9. Modular Architecture & Design Patterns (`app.js`)
- **Deep Modules & Clear Seams (Matt Pocock Architecture Pattern):**
  - `StorageAdapter`: Deep persistent storage module built on `createStorageGateway`. Absorbs automatic JSON serialization, safe parsing, validator predicates, typed primitives (`getNumber`, `getBoolean`, `getJson`, `setJson`), and a resilient in-memory fallback store (`memoryStore`) guarding against `SecurityError` or `QuotaExceededError`.
  - `NetworkMonitor`: Centralized detector for connection speed and Save-Data mode.
  - `ThemeManager`: Observer-pattern theme state manager with subscriber dispatch and validated theme storage.
  - `AudioController`: Deep audio playback module encapsulating HTML5 Audio element, dual-player UI synchronization (hero player + sticky bottom player), internal smooth volume fading engine (`fadeEngine`), exponential backoff retries, and media keys.
  - `SleepTimer`: Countdown timer decoupled from audio internals; communicates strictly across a clean seam via `AudioController.fade()`, `restoreFade()`, and `stopPlayback()`.
  - `LiveTrackModule` (aliased as `MetadataService`): Collapsed deep module consolidating Shoutcast JSONP polling, track title sanitization, WhatsApp dedication URL formatting, automatic history storage, UI transitions, MediaSession OS metadata, and pub/sub event subscription (`subscribe(fn)`).
  - `WeatherService`: Open-Meteo client with session caching and offline resilience.
  - `ChatLoader`: Lazy-loading of third-party chat widgets with Save-Data consideration.
  - `FishPond`: HTML5 Canvas 2D simulation with delta-time physics and low-power compliance.
  - `Global Compatibility Layer`: Preserves global function exports (`recentTracks`, `addRecentTrack`, `updateNowPlaying`, `setStickyVisible`, `stopPlayback`, `playLiveStream`, `fetchLiveTrack`, `window.StorageAdapter`, `window.AudioController`, `window.LiveTrackModule`) ensuring 100% backward compatibility with test suites and external integrations.

### 10. CSS Syntax Corrections & Render Containment (`styles.css`)
- **Trailing comma syntax fixes:** Resolved two invalid trailing-comma `@media` syntax bugs in `:root[data-theme="dark"] .skip-link` and `:root[data-theme="dark"] .mascot-card::before` selectors that caused standard CSS parsers to discard the rules.
- **Hardware compositing & content visibility:** Added `will-change: transform, opacity;` to `.sticky-player` to promote it to a dedicated compositor layer, and added `content-visibility: auto; contain-intrinsic-size: auto 380px/450px;` to `.contact-section` and `.site-footer` to reduce initial DOM paint costs.

---

## Verification & Test Results

1. **Automated Test Suite (`node checks.cjs`):**
   - **PASS**: All 12 test suites passing with 0 errors:
     - Safe history & stored-data validation (malformed JSON resilience, XSS protection)
     - Bidirectional volume slider synchronization and mute button states
     - Scoped cache creation and obsolete version purging
     - Service worker offline navigation and fallback responses
     - Service worker installation failure on missing assets
     - Sticky player `inert` and `aria-hidden` attribute synchronization
     - Audio playback promise rejection routing to fatal error state
     - `stopPlayback()` state cleanup and audio pausing
     - Lean precache verification (excluding heavy redundant PNG variants)
     - Clean CSS syntax verification (no trailing comma before `@media`)
     - Low-bandwidth icon hygiene (no heavy 192x192 or 512x512 icons in `<head>`)
     - Offline metadata polling safety (no script tags injected when offline)

2. **Syntax & Formatting Checks:**
   - `node --check app.js`: Clean (0 errors)
   - `node --check sw.js`: Clean (0 errors)
   - `node --check checks.cjs`: Clean (0 errors)
   - `git diff --check`: Clean (0 whitespace, line-ending, or formatting issues)

3. **Chrome DevTools MCP Live Verification & Audits:**
   - **Lighthouse Mobile Audit:**
     - Accessibility: **100**
     - Best Practices: **100**
     - SEO: **100**
     - Agentic Browsing: **100**
     - Passed Audits: **58** / Failed: **0**
   - **Performance Trace & Core Web Vitals:**
     - LCP (Largest Contentful Paint): **457 ms** (well under 2.5s threshold)
     - CLS (Cumulative Layout Shift): **0.01** (well under 0.10 threshold)
     - TTFB (Time to First Byte): **72 ms**
     - Estimated render-blocking delay: **0 ms**
   - **Console Health:**
     - Clean: 0 errors, 0 warnings, 0 audit issues.
   - **Live Feature Verification in Headless Chrome:**
     - Natural aspect ratio (`304/145`) aligned across `<source>`, `<img>`, and CSS, eliminating lazy-load shifts.
     - Sticky bottom player scrolls in and out smoothly with proper `inert` and `aria-hidden` attributes.
     - Shoutcast metadata fetched and rendered in real-time ("DIOMEDES DIAZ - GRACIAS A DIOS") via stable callback.
     - Open-Meteo regional weather rendered (29°C, La Pacha, Magdalena) and verified to serve in 0 ms from `sessionStorage` on reload.
     - Service worker activated and successfully precaching the lean shell under scope.
