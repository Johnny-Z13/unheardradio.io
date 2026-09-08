# Unheard Radio

Unheard Radio is a Next.js app for finding live radio stations that sit below the recommendation layer: low-activity, odd, local, forgotten, experimental, and otherwise overlooked broadcasts from the RadioBrowser directory.

The product is a phosphor-green radio receiver: a world chart, clear controls, and restrained audio visualization. See [DESIGN.md](DESIGN.md) for the current visual and interaction contract.

## What It Does

- Prefetches a low-activity station pool for explicit roulette: Next signal, Back, and session history.
- Lets listeners randomise the feed, filter by directory activity, country, genre, and search text.
- Plays stations through a single shared browser audio element.
- Drives trace, bars and waterfall visualisers from real analyser data; silent or unavailable data stays quiet.
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
- `components/atlas/atlas-map.tsx` renders the Signal Atlas.
- `lib/audio-store.ts` owns the shared `HTMLAudioElement`, `AudioContext`, analyser, playback state, and visualiser data.
- `pages/api/stations/index.ts` proxies station search and creates seeded obscure random feeds.
- `pages/api/stations/[uuid]/index.ts` resolves shared station links.
- `pages/api/stations/[uuid]/click.ts` records RadioBrowser click counts.
- `app/sitemap.ts` generates the XML sitemap for Google Search.

## Product Principles

- First screen is the product, not a landing page.
- Obscure discovery should feel immediate: every visit produces a new scan.
- The UI should be dense, readable, and instrument-like.
- Phosphor green is reserved for tuning and live states; secondary text remains clear and subdued.
- Do not introduce decorative gradients, blob backgrounds, or marketing cards.
- Keep station metadata formatting in `lib/station-format.ts`.
- Keep share behavior centralized in `components/share-menu.tsx`.

## Known Constraints

- Some radio streams cannot expose frequency data to Web Audio because of CORS. The visualizer does not invent audio activity; some streams also cannot play through the browser audio graph.
- RadioBrowser metadata is community-maintained. Station coordinates, codecs, tags, and health checks may be incomplete or stale.
- The Signal Atlas uses bundled geographic data. Missing station coordinates use country-level approximations.
- Bookmarks are browser-local only.
- `npm test` runs discovery, metadata and playback-controller tests. TypeScript and production build checks remain required.

## SEO

- The canonical host is `https://www.unheardradio.io` — the apex 308-redirects to www. Use the www host in any absolute URL (sitemap, metadata, share copy).
- `app/sitemap.ts` serves `https://www.unheardradio.io/sitemap.xml` for Google Search. It lists the two real routes (`/` and `/privacy`); the SCAN/FILTER/LOG/GRID/NFO tabs are in-app state, not URLs.
- `lastModified` dates are pinned by hand. Bump them when a page meaningfully changes — Google only trusts `lastmod` when it tracks real content changes, and it ignores `changeFrequency` and `priority`.
- `app/robots.ts` serves `/robots.txt`: allows all crawlers, blocks `/api/`, and points at the sitemap.

## Deployment

The site is intended for Vercel.

No environment variables are required for normal operation.

Before deploying:

```bash
npm run check
```

## Future Improvements

- Add ESLint with a non-interactive config and real `lint` rules.
- Expand repeatable browser smoke coverage for roulette, saved stations, sharing and device audio behavior.
- Add OG image assets and richer social metadata.
- Consider a proper map provider only if the Signal Atlas becomes a core feature.
- Add lightweight station health telemetry if playback failure rates become important.
