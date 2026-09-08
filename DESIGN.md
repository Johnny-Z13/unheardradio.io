# Unheard Radio — phosphor receiver

The site is a listening instrument for exploring overlooked radio. The first screen is the product. Preserve its world chart, compact controls and immediate access to sound. The September 2026 direction is authorized by Johnny's request to revisit the original green-screen VDU aesthetic, with usability and clarity first. It supersedes the older ink-navy/amber palette in the July Signal Atlas specification.

## Visual direction

Soft phosphor green on a deep green-black cabinet. Use the map and a single illuminated tuning key as the signature. Avoid scanline overlays, screen flicker, fake static, ornamental control panels and marketing sections. Essential text stays crisp; glow is limited to actual signal emphasis.

Typography remains JetBrains Mono throughout: 24–30px mixed-case introductory heading, 14–16px station names, 12–14px explanatory copy and 11px utility labels. The logo uses restrained letter spacing. Maintain larger touch targets even when glyphs are small.

## Token ownership

`app/globals.css` is the canonical runtime source (HSL channels). Tailwind maps these existing semantic names; shadcn variables alias the same values. Canvas map and audio visualizer read the CSS variables at initialization. Do not copy palette literals into components.

| Role | CSS token | HSL channels |
| --- | --- | --- |
| Cabinet | `--chart-bg` | `155 28% 5%` |
| Panel | `--chart-panel` | `155 22% 8%` |
| Receiver / land | `--chart-panel-2` | `155 20% 10%` |
| Rules / controls | `--chart-line` | `150 14% 27%` |
| Secondary text | `--chart-ink-dim` | `145 13% 66%` |
| Body | `--chart-ink` | `135 20% 82%` |
| Headings | `--chart-ink-bright` | `125 32% 94%` |
| Tuning / live | `--signal` | `119 62% 72%` |
| Subdued signal | `--signal-dim` | `120 24% 47%` |
| Stream errors | `--danger` | `5 75% 62%` |

`.receiver-button` and `.receiver-control` define the primary and secondary player keys. Controls are at least 44px. Global focus outlines and scrollbars use the same tokens. Forced-colors uses system outlines. Reduced motion removes CSS animation and map sweeps; audio visualization becomes static.

## Layout and canonical owners

- `app/page.tsx`: tab navigation, receiver shell, explicit shared-link entry. Keep the player outside each view's scrolling region.
- `components/atlas/atlas-map.tsx`: pointer exploration of the map. The labelled canvas is supplemented by keyboard-accessible Stations and roulette controls.
- `components/discovery-list.tsx`: query-owned pages, loading/empty/error states and retry. Filter changes select a new query; no effect-managed accumulation of stale results.
- `components/search-sidebar.tsx`: explicit Apply/Enter search, with retained filters. No remote keystroke search. Select/listbox owner is `components/ui/select.tsx` (Radix).
- `components/now-playing-bar.tsx`: Next, Back, pause/cancel, save, shared ShareMenu and a ten-station recent history for this visit.
- `components/ui/dialog.tsx`: Radix dialog focus management, including the fullscreen station variant.
- `components/share-menu.tsx`: all sharing. Player placement opens upward; mobile uses native sharing when available.
- `lib/station-format.ts`: shared station labels and contextual text.
- `lib/playback-controller.ts`: one media element, cancellable acquisition and bounded timeouts. `lib/audio-store.ts` adapts its state for every playback surface.

## Discovery and state contract

Deep cuts have at most 5 RadioBrowser clicks in 24 hours and 50 directory votes. Both fields must be known. These thresholds indicate directory activity, never real-world audience size. Eligibility precedes ranking and country variety. Never broaden the thresholds silently to fill an empty result.

Roulette uses prefetched candidates, avoids attempted UUIDs and equivalent streams during the visit, and prefers a new country. It tries at most two stations per action, at most two HTTPS URLs per station, six seconds per URL. Stop or a newer choice cancels older work. Click tracking happens only after actual playback begins. Back and Recent explicitly allow revisiting a station. History is not persisted; bookmarks remain browser-local.

Ready, tuning, live, paused and failed states are visibly distinct. Autoplay restrictions show a ready state and a Play action. Shared links arm the station for a user tap. Last checked is a UTC directory check timestamp, not continuous uptime. Unknown saved metadata stays unknown.

## Verification

Use `npm test`, `npm run typecheck` and `npm run build`. Verify the actual local app at desktop and narrow widths: entry, roulette, rapid next/stop, Back, saved stations, station detail, filter popup and empty results. Verify keyboard focus and reduced motion. Unit tests simulate media errors and stalls; live browser checks establish real integration but do not establish every station's availability or physical-device audio behavior.
