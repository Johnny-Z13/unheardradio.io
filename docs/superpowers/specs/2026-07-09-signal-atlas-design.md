# Signal Atlas — Design

**Date:** 2026-07-09
**Project:** unheardradio.io
**Status:** Approved (user: "go for it")
**Supersedes (visual layer):** `2026-04-29-listening-post-ui-design.md` and `2026-07-09-cool-console-ui-design.md`. Product IA (tabs, station-format helpers, ShareMenu ownership) and the audio-store architecture are retained. The unmerged `feat/cool-console-ui` branch is abandoned — nothing is merged from it; two of its UX ideas are re-implemented fresh (playback-state badges, mobile hit targets).

## Goal

Turn Unheard Radio from a green-CRT pastiche into a **Signal Atlas**: a dark night-chart of the planet where obscure transmitters glow as amber signals. Three workstreams, one identity:

1. Full reskin to the atlas visual system.
2. A real, dynamic map (the Atlas) as the app's hero and landing view.
3. A weird-first discovery algorithm: maximum obscurity **and** maximum geographic diversity, locale-aware.

## Design language (one sentence)

> A nautical chart at night — ink-navy ground, faint slate coastlines and graticule, chart-ink text, and scarce amber marking only live signal.

## Visual system

### Color tokens (replace VDU green ramp in `app/globals.css` + `tailwind.config.ts`)

| Token | Role | Use |
| --- | --- | --- |
| `--chart-bg` | near-black ink navy | App ground / ocean |
| `--chart-panel` | lifted ink navy | Card / bar surfaces |
| `--chart-line` | faint slate blue | Coastlines, graticule, hairlines, borders |
| `--chart-ink-dim` | muted slate | Labels, secondary metadata |
| `--chart-ink` | chart off-white | Default text |
| `--chart-ink-bright` | bright chart white | Brand, active callsign, headings |
| `--signal` | warm amber | **Restricted:** live/playing signal, pulses, primary play action |
| `--signal-dim` | desaturated amber | Hover/pre-active hints only |
| `--danger` | soft coral | SIGNAL LOST / stream errors only |

Discipline: amber is the only warm hue and stays scarce — if everything glows, nothing glows. No scanlines, no phosphor bloom, no CRT flicker. Mood comes from darkness, linework, and pulsing signals. A subtle graticule (lat/long grid) motif sits behind surfaces app-wide.

### Typography

- **Single family: JetBrains Mono** (already loaded). Display moments = wide letter-spaced uppercase at larger sizes/weights; no second font, no VT323, no Departure Mono.
- Letter-spacing 0.04–0.15em on uppercase labels remains.

### Iconography

Keep `components/icons.tsx` (14×14, 1.5px stroke, square caps); recolor via tokens. New glyphs needed (atlas/globe, signal rings, locator) are drafted in that file in the same style. No Lucide (existing `Loader2` spinner exception stands).

## The Atlas (hero surface)

Replaces the placeholder `station-map-simple.tsx`. **Landing view on all breakpoints**; tab renamed GRID → ATLAS and moved to position 01 (order: ATLAS, SCAN, FILTER, LOG, NFO).

### Rendering

- **No Leaflet, no tile servers, no API keys.** Bundled simplified world TopoJSON (~50–100 KB) rendered with `d3-geo` (natural-earth or equirectangular projection) + `topojson-client`.
- Coastlines + graticule drawn once to a base canvas; station dots on an animated overlay canvas.
- Animation state (pulses, sweeps, hover) is **module-level, read in rAF — never per-frame React state** (per z13 conventions).
- Dynamic-import the map component (`ssr: false`) to keep it out of SSR, as CLAUDE.md prescribes.

### Data

- Pulls 400–500 stations from the wide obscure pool via the existing `/api/stations` (large `limit`, dedicated `randomSeed`).
- Stations with `geo_lat`/`geo_long` plot exactly. Stations without fall back to **country centroid + small deterministic scatter** (seeded by stationuuid so positions are stable); callout marks these `POSN APPROX`. Bundled compact ISO-3166 → centroid table.
- Stations with no coords and no country are omitted from the map (still in list feeds).

### Interactions

- Pan / pinch / scroll-zoom.
- Hover (desktop) or tap (mobile) a signal → callout card: callsign, origin, listeners, rate, `POSN APPROX` flag. Tap/click again (or a Tune In button in the callout) → `playStation`.
- The playing station pulses with expanding amber rings — you always see where you're listening. Callout offers the existing ShareMenu + bookmark.
- New batches sweep in with a brief radar-arc animation. "RESWEEP" button = new random seed.
- Mobile: callout docks to the bottom edge above the now-playing bar.

## Discovery algorithm (server-side, `pages/api/stations/index.ts`)

Obscurity core unchanged: lowest-clickcount pool (limit 1000), `hidebroken=true`, `is_https=true`, seeded shuffle.

Two new passes after the shuffle, before pagination — both deterministic for a given seed so React Query / edge caching still work:

1. **Country interleave:** a page of 20 carries at most **2 stations per country**. Round-robin fill from the shuffled pool; overflow stations stay in pool order for later pages.
2. **Home-country downrank:** listener country read from Vercel's `x-vercel-ip-country` header (absent locally → pass is a no-op). Home-country stations are capped at **1 per page** and placed last on the page. A US listener's scan leads with Kathmandu and Bunia, not Ohio.

Applies to seeded (SCAN/ATLAS) requests. Explicit FILTER searches (name/country/genre) bypass diversity passes — if you ask for Colombia, you get Colombia.

## Reskin scope (all surfaces)

`app/page.tsx` (header/nav/NFO), `station-card.tsx`, `now-playing-bar.tsx`, `discovery-list.tsx`, `bookmark-list.tsx`, `search-sidebar.tsx`, `fullscreen-station.tsx`, `share-menu.tsx`, `audio-visualizer.tsx` (recolor: amber trace on ink, no green), `app/privacy/page.tsx`, `app/globals.css`, `tailwind.config.ts`.

Re-implemented fresh (not merged from the dead branch):

- Explicit playback states on card + bar: **LIVE** (amber pulse) / **BUFFERING** (dim, no fake LIVE) / **PAUSED** (dim) / **SIGNAL LOST** (coral + store error text).
- Touch targets ≥ 40px; single visualizer mode on small screens.
- Station cards gain a small inline **locator glyph** (region indicator derived from country/coords) reinforcing the cartographic identity.

`lib/station-format.ts` language (BAND/ID/COORDS/ORIGIN/RX/RATE/UPTIME) is retained.

## Out of scope

Accounts, station submission, genre ML, chain/network-detection heuristics, any change to `lib/audio-store.ts` (verified working today), Leaflet or any tile-based map.

## New dependencies

`d3-geo`, `topojson-client` (+ types), bundled world TopoJSON + centroid JSON as static assets. Nothing else.

## Verification

- `npm run check` (typecheck + build) clean.
- Playwright click-through: every tab renders; atlas pan/zoom/tap→callout→play; card play/pause; error state (bad stream) shows SIGNAL LOST; bookmarks persist.
- Diversity: automated assertion on `/api/stations` output — ≤2 per country per page; with a spoofed `x-vercel-ip-country`, ≤1 home-country station placed last.
- Screenshot review of atlas + cards + bar against this spec on desktop and mobile widths.
- Production verified after deploy.
