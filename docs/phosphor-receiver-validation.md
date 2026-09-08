# Phosphor receiver — local validation

Reviewed 8 September 2026. This report records validation before publication; deployment status is tracked separately in Git and Vercel.

## Delivered

- A restrained green VDU palette, clearer controls and responsive receiver layout. The existing Next.js architecture and dependencies are retained.
- Explicit radio roulette with Next, Back, recent history, country preference and session repeat avoidance.
- Strict discovery eligibility: healthy HTTPS streams, known directory activity, at most 5 recent clicks and 50 votes, with stream deduplication. These are directory activity indicators, not audience measurements.
- Cancellable playback, bounded URL/station retries, accurate playback states, and click tracking only after playback starts.
- Honest station metadata, retained filters, clear empty/error states, keyboard focus restoration, and browser-local bookmarks.
- Field notes on station cards and map previews, with source-labelled "Digital dust" deeper in station details. Unknown or contradictory directory history never becomes a claim that nobody listened.
- Click-to-zoom Atlas selection, automatic location focus when tuning, and Whole world / Locate signal controls. Mobile previews temporarily hide the intro so the selected location stays visible.

The visual and interaction contract is in [DESIGN.md](../DESIGN.md).

## Validation evidence

- `npm test`: 35 passing tests covering discovery, playback cancellation/fallback/stalls, upstream retries, camera framing/interpolation and station formatting.
- `npm run check` passed: TypeScript validation and the production build. An earlier build could not resolve the existing Google font dependency inside the network sandbox; its network-enabled retry succeeded.
- `git diff --check` passed.
- Local API sample: 200 eligible stations, 92 countries, 200 unique stream URLs, all marked healthy by the directory; maximum recent clicks 0 and maximum votes 50.
- Real browser playback reached live streams. Exercised Next, automatic station fallback, Back, pause, save/remove, station details, filter selection and an empty search.
- Verified the detail dialog traps focus and returns focus to Inspect on Escape. Verified the filter popup returns focus to its trigger.
- Visually inspected desktop 1280×720, mobile 390×844 and narrow 320×640 layouts. The final desktop had no horizontal overflow. Preview was left paused.
- Canonical secondary text against the raised panel measures 7.66:1 contrast. This is a token check, not a full accessibility certification.

Desktop and narrow mobile screenshots are retained locally under `.codex-audit/2026-09-08-review/`; generated audit artifacts are excluded from the release commit.

## Limits and next check

Physical iPhone, iPad and Android audio behavior remains untested. Reduced-motion handling was implemented and inspected, but an OS-level reduced-motion session was not exercised. Individual broadcasts can still be unavailable or blocked by browser/stream policy; retries are bounded and failure remains visible.

The premium static audit reports one reviewed false positive: its case-insensitive tag check treats the shared Radix `<Select>` in `components/search-sidebar.tsx` as a native `<select>`. The component resolves to `SelectPrimitive.Root` in `components/ui/select.tsx`; its popup was exercised in the browser. The strict static audit is therefore not reported as passing.

Before publishing, perform a physical-device listening pass covering first play, rapid Next, pause, headphones/background audio and sharing.

## Run

```sh
npm test
npm run typecheck
npm run build
npm run start -- --port 3217 --hostname 127.0.0.1
```

Open `http://localhost:3217`. Stop an existing preview on that port before starting another.
