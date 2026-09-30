# Codebase review

Reviewed and updated 30 September 2026. The static HTML/CSS/JavaScript stack fits this site cleanly. No framework, build step, or runtime dependencies are required.

## Changes applied

- **Safe song history (`app.js`):** external song titles and stored timestamps enter the DOM through `textContent`, avoiding raw HTML interpolation. Stored history is validated as an array of valid records capped at five. Non-string live titles are safely ignored. Fixed TDZ reference issue in metadata timer cleanup.
- **Shared volume controls (`app.js`, `index.html`):** unified duplicate input handlers into a single loop. Both sliders follow native `volumechange` events, including native browser controls and sleep timer fading. Sliders use standard range values with accessible percentages; both mute buttons expose `aria-pressed` states.
- **Reliable scoped caches (`sw.js`):** cache names include the worker registration scope (`CACHE_PREFIX`), and activation deletes only older caches belonging to that specific scope. Precaching rejects installation if essential shell assets fail to fetch. Offline navigation awaits each fallback, cache refreshes extend worker lifetime, and cache-write failures preserve successful network responses.
- **Lean precache shell (`sw.js`):** `PRECACHE_ASSETS` contains only the critical app shell and primary AVIF images, preventing redundant downloads of 418 KiB PNG and WebP variants during installation. Uncached formats needed by older browsers are cached on demand via Strategy 3.
- **Playback error handling (`app.js`):** routed non-abort `playLiveStream()` promise rejections in play button, online resume, and MediaSession actions to `showFatalError()`, preventing the UI from remaining stuck in “Conectando…”.
- **Unified stop & sleep timer sync (`app.js`):** created `stopPlayback()` which clears active retry timers, cancels auto-retry flags, resets offline recovery state, and pauses the audio. Sleep timer expiry and manual user pauses now consistently use this unified cleanup.
- **Sticky player visibility & scroll (`app.js`, `styles.css`, `index.html`):** restored continuous scroll and resize listeners so the player appears immediately once controls scroll past 240px; removed conflicting `visibility: hidden` transition delays and static HTML `inert`; unified dynamic toggling of `.is-visible`, `aria-hidden`, and `inert`; and preserved smooth scroll with 80px visual headroom and delayed focus in return-to-player button.
- **Canvas pond frame-rate independence & tab suspension (`app.js`):** normalized simulation speeds via delta-time (`dt`) for consistent animation across 60 Hz and high-refresh-rate displays (120 Hz+). Pauses simulation when `document.hidden` is true to save CPU/battery, triggers immediate canvas render on pointerdown under `prefers-reduced-motion: reduce`, and removed redundant idle callback canvas allocation.
- **Bounded weather requests with numeric validation (`app.js`):** Open-Meteo weather fetch includes an 8-second `AbortController` timeout and validates all current weather fields as finite numbers (`Number.isFinite`) before rendering, preventing malformed external data from corrupting the UI.
- **CSS dark theme syntax fix (`404.html`):** separated explicit `:root[data-theme="dark"]` selectors from `@media (prefers-color-scheme: dark)` at-rules to eliminate trailing-comma syntax errors.

## Verification

- `node checks.cjs` passed with 0 errors. Covers:
  - Stored history sanitization and malformed JSON resilience
  - XSS protection in song title rendering
  - Bidirectional volume slider synchronization and mute button states
  - Sticky player `inert` and `aria-hidden` attribute synchronization
  - Audio playback promise rejection routing to fatal error state
  - `stopPlayback()` state cleanup and audio pausing
  - Scoped cache creation and obsolete version purging
  - Service worker offline navigation and fallback responses
  - Service worker installation failure on missing assets
  - Dynamic on-demand caching of local assets
  - Lean precache verification (excluding heavy redundant PNG variants)
- Live Chrome verification via DevTools:
  - Scroll lifecycle: hides at top, reveals smoothly when scrolled past player card, hides when scrolled back up
  - Direct interaction: play/pause toggles stream, mute button toggles audio state and icon, return-to-player button smoothly scrolls to card and focuses main play button
- `node --check app.js`, `node --check sw.js`, and `node --check checks.cjs` passed with 0 syntax errors.
- `git diff --check` passed with 0 whitespace or formatting issues.
