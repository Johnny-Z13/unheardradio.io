# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (default port 3000)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — Next.js ESLint

No test runner is configured. Hosted on Vercel at https://unheardradio.io.

## Architecture

Unheard Radio is a Next.js 15 app (mixed App Router + Pages Router) that surfaces obscure radio stations by reverse-sorting RadioBrowser API results by `clickcount`. There is no backend database — all "server" logic is a thin proxy to RadioBrowser, and bookmarks are localStorage only.

### Routing layout (intentionally split)
- `app/` — App Router: `/` (the entire SPA in `app/page.tsx`), `/privacy`, plus `layout.tsx`, `globals.css`, `sitemap.ts`. The "About" view is an inline tab inside `app/page.tsx`, not a separate route.
- `pages/api/` — Pages Router API routes:
  - `stations/index.ts` — proxies `/json/stations/search` with listener-count filtering & sorting
  - `stations/[uuid]/click.ts` — proxies `/json/url/{uuid}` so RadioBrowser increments its play count (powers the obscurity ranking)
  - `countries.ts`, `genres.ts` — top-N lookups
  - `stats.ts` — global station/country/language counts (drives the live header count)
- All API routes go through `lib/radio-browser.ts:radioBrowserFetch`, which retries across `nl1`, `de1`, `at1` mirrors.

### Data flow
1. Client calls `/api/...` via helpers in `lib/radio-api.ts`.
2. API route fans out to RadioBrowser mirrors; returns the first that responds.
3. Listener-count filtering/sorting (`zero`, `hide-zero`, `low-to-high`, `high-to-low`) is applied server-side after fetch — `order=clickcount` is only set for ascending modes.
4. React Query (configured in `lib/query-provider.tsx`) caches results: 5-min stale, 10-min GC. Most API routes also set `Cache-Control: s-maxage` so Vercel's edge caches them.
5. Audio playback is centralized in a Zustand store at `lib/audio-store.ts`. The store owns a single `HTMLAudioElement` plus an `AudioContext` for the visualizer. `playStation` tries `url_resolved` first then falls back to `url`. Same-station re-click pauses.
6. Bookmarks live entirely in `localStorage` under key `unheard-radio-bookmarks` and sync across components via a manually-dispatched `StorageEvent` (see `hooks/use-bookmarks.ts`).
7. Deep link `?station=<uuid>` on `/` auto-fetches that station from RadioBrowser and starts playback (handled in `app/page.tsx`).

### Sharing
`components/share-menu.tsx` is the single source of truth for sharing. On mobile it triggers `navigator.share` (native share sheet → WhatsApp/Telegram/etc); on desktop or when native share is unavailable, it opens a popover with Copy link / WhatsApp / Telegram / X / Email. Used by `station-card`, `now-playing-bar`, and `fullscreen-station`. Don't reimplement share logic in components — pass the `RadioStation` to `<ShareMenu>` and optionally style via `iconClassName` + `trigger`.

### Styling — Listening Post design system
Tailwind + shadcn/ui (style: `new-york`). The app uses a deliberate "SIGINT listening post" treatment defined in `docs/superpowers/specs/2026-04-29-listening-post-ui-design.md`.

Color discipline: `--vdu-green-bright` and `--accent-cyan` are scarce. Bright is reserved for the **active station + primary actions + brand wordmark only**. Cyan is reserved for **live RX pulse, visualizer trace cursor, and waterfall hot-end** — no other use. Most chrome should sit between `--vdu-green-dim` and `--vdu-green`. The fonts are JetBrains Mono (body/data) and VT323 (`.font-display`, used for brand and section headers).

**Iconography:** all icons live in `components/icons.tsx` as 14×14 SVG components with 1.5px stroke and square caps. Do not introduce Lucide icons (the lone exception is `Loader2` as a spinner). If a new glyph is needed, draft it into that file matching the existing style.

**Station data formatting:** all "BAND / ID / COORDS / ORIGIN / RX / RATE / UPTIME" derivations live in `lib/station-format.ts`. Use those helpers from any surface that displays station metadata so the language stays consistent.

The whole app is mobile-first: header, tabs, cards, sidebar all scale via `sm:`/`md:`/`lg:` breakpoints — match that pattern. Channel numbers in nav, coords in card metadata, and the strip visualizer all hide below `sm`.

### Path aliases
`@/*` maps to repo root; explicit aliases for `@/components`, `@/lib`, `@/hooks`, `@/types` (see `tsconfig.json`).

## Things to know

- `compiler.removeConsole` is enabled in production (`next.config.js`), so `console.log` calls won't appear in prod builds. Don't rely on them for prod debugging.
- The map (`components/station-map-simple.tsx`) is a placeholder — Leaflet was removed from deps. If you re-add a map, re-add `leaflet`/`react-leaflet` and dynamic-import to keep it out of SSR.
- `app/layout.tsx` no longer references `og-image.png` (the file doesn't exist). Add one in `public/` before re-enabling OG metadata.
