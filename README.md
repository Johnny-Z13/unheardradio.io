# Unheard Radio

Unheard Radio is a Next.js app for finding live radio stations that sit below the recommendation layer: low-listener, odd, local, forgotten, experimental, and otherwise overlooked broadcasts from the RadioBrowser directory.

The product is deliberately styled as a signal-intelligence listening post: dense station metadata, monochrome CRT greens, restrained cyan signal highlights, and live audio visualisation.

## What It Does

- Loads a fresh randomised feed of obscure stations on every visit.
- Lets listeners randomise the feed, filter by audience size, country, genre, and search text.
- Plays stations through a single shared browser audio element.
- Drives trace, bars, dBFS, and waterfall visualisers from a shared Web Audio analyser when stream CORS allows inspection.
- Saves stations locally in the browser with no account or backend database.
- Shares deep links like `/?station=<uuid>` through an internal station lookup API.
- Proxies RadioBrowser requests through API routes with mirror fallback.

## Stack

- Next.js 15 with App Router for pages and Pages API routes for proxy endpoints
- React 18
- TypeScript
- Tailwind CSS
- shadcn/Radix primitives
- TanStack Query
- Zustand
- RadioBrowser public API

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validate before pushing:

```bash
npm run check
```

Useful scripts:

- `npm run dev` starts the Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run typecheck` clears local TypeScript build metadata, then runs TypeScript without emitting files.
- `npm run lint` currently aliases to typecheck until ESLint is configured.
- `npm run check` runs typecheck and production build.

## Architecture

The app intentionally has no database.

Data flow:

1. Client components call helpers in `lib/radio-api.ts`.
2. Helpers call local `/api/...` routes.
3. API routes use `lib/radio-browser.ts` to retry RadioBrowser mirrors.
4. Station filtering, obscure sorting, and randomised feed shuffling happen server-side.
5. React Query caches client requests.
6. Bookmarks are persisted in `localStorage`.

Key files:

- `app/page.tsx` contains the main tabbed listening-post shell.
- `components/discovery-list.tsx` renders the SCAN feed and randomise action.
- `components/station-card.tsx` renders station rows and active signal state.
- `components/now-playing-bar.tsx` owns the fixed bottom receiver bar.
- `components/fullscreen-station.tsx` renders the station detail receiver panel.
- `components/station-map-simple.tsx` renders the Signal Atlas.
- `lib/audio-store.ts` owns the shared `HTMLAudioElement`, `AudioContext`, analyser, playback state, and visualiser data.
- `pages/api/stations/index.ts` proxies station search and creates seeded obscure random feeds.
- `pages/api/stations/[uuid]/index.ts` resolves shared station links.
- `pages/api/stations/[uuid]/click.ts` records RadioBrowser click counts.

## Product Principles

- First screen is the product, not a landing page.
- Obscure discovery should feel immediate: every visit produces a new scan.
- The UI should be dense, readable, and instrument-like.
- Bright green is reserved for active states and primary actions.
- Cyan is reserved for live signal state and visual hot spots.
- Do not introduce decorative gradients, blob backgrounds, or marketing cards.
- Keep station metadata formatting in `lib/station-format.ts`.
- Keep share behavior centralized in `components/share-menu.tsx`.

## Known Constraints

- Some radio streams cannot expose frequency data to Web Audio because of CORS. In those cases the visualiser falls back to synthetic signal motion while playback can still work.
- RadioBrowser metadata is community-maintained. Station coordinates, codecs, tags, and uptime may be incomplete or stale.
- The Signal Atlas is an abstract coordinate plot, not a full map provider integration.
- Bookmarks are browser-local only.
- There is no automated test suite yet beyond TypeScript and production build validation.

## Deployment

The site is intended for Vercel.

No environment variables are required for normal operation.

Before deploying:

```bash
npm run check
```

## Future Improvements

- Add ESLint with a non-interactive config and real `lint` rules.
- Add Playwright smoke tests for scan loading, randomise feed, playback, share menu, and detail panel.
- Add OG image assets and richer social metadata.
- Consider a proper map provider only if the Signal Atlas becomes a core feature.
- Add lightweight station health telemetry if playback failure rates become important.
