# Product Hardening Review

This document captures the current app review after the UI/audio pass and the follow-up professionalisation work.

## Fixed In This Pass

- Scroll layout now uses a fixed `h-dvh` app shell with explicit scroll panes instead of nested full-height containers fighting the browser wheel.
- Feed, saved stations, map, and about views have their own `overflow-y-auto` regions and bottom padding for the fixed player.
- Signal Atlas replaced the placeholder map copy with a usable coordinate plot and origin-density summary.
- Fullscreen station detail was simplified into a scrollable receiver panel with a clear tune/pause action and grouped metadata.
- Fonts moved from CSS `@import` to `next/font`.
- `npm run lint` no longer opens an interactive setup prompt; validation scripts are deterministic.
- README now explains product purpose, architecture, scripts, constraints, and future work.

## UX Assessment

The core concept is strong: anti-algorithm radio discovery has a clear identity and the listening-post visual system makes the app memorable. The best direction is to keep it as an instrument panel rather than turning it into a conventional streaming app.

The most important interaction is the SCAN feed. It should always feel fresh, fast, and playable. Secondary tabs should support discovery without taking attention away from immediate listening.

## Visual Style Notes

- Keep the palette austere. Green is the operating system; cyan is the signal.
- Keep typography compact. Large type should be reserved for brand and station detail.
- Avoid card nesting. Station rows are acceptable framed units; page sections should stay structural.
- Keep controls symbolic where possible, but labels are appropriate for major commands like `RANDOMISE FEED` and `APPLY`.

## Functional Risks

- Web Audio analyser data is dependent on stream CORS. Playback can work while frequency data is unavailable.
- RadioBrowser mirrors can vary in latency and data freshness.
- Randomised feeds pull a wider obscure pool, so API latency may be higher than a simple 20-station lookup.
- Browser-local bookmarks are simple and private, but not portable.

## Recommended Next Milestones

1. Add Playwright smoke coverage for the critical listening flow.
2. Add a real ESLint config and repair any rule fallout deliberately.
3. Add OG/social assets and metadata polish.
4. Add a lightweight fallback state when RadioBrowser mirrors are slow.
5. Consider analytics only if privacy posture remains clear and explicit.
