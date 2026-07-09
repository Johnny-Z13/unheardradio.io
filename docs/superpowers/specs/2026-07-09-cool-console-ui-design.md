# Cool Console UI Overhaul

**Date:** 2026-07-09
**Project:** Unheardradio.io
**Status:** Design approved — ready for implementation plan
**Supersedes (visual layer):** `2026-04-29-listening-post-ui-design.md` for color, type, texture, and UX polish. Product IA, station-format helpers, share menu ownership, and audio-store architecture remain.

## Goal

Evolve Unheard Radio from CRT / phosphor pastiche into a **cool radio console**: near-black studio desk, soft mint chrome, teal reserved for live signal. Keep the Listening Post information architecture and obscurity-first product loop. Improve first-run clarity, mobile listening, and playback confidence without adding features.

## Design language (one sentence)

> A modern studio receiver desk — charcoal panels, soft mint instrument chrome, and a single teal live-signal accent — dense enough to feel operational, quiet enough to feel refined.

## Approach

**Token-first console (chosen):** re-skin tokens, type, chrome, cards, and player bar; tighten UX on the same surfaces. Rejected alternatives: receiver-first layout rewrite (too much IA risk) and editorial/friendlier label rewrite (loses product personality).

## Visual system

### Color tokens

Replace the current VDU green ramp in `app/globals.css` / Tailwind. Prefer new semantic names; keep temporary aliases from `--vdu-green*` → new values during the sweep so mid-pass builds stay green.

| Token | Role | Use |
| --- | --- | --- |
| `--bg` | near-black charcoal | App ground |
| `--panel` | lifted charcoal | Station card surface |
| `--panel-2` | slightly higher charcoal | Now-playing strip |
| `--ink-faint` | very muted mint | Grid lines, channel numbers |
| `--ink-dim` | muted sage-mint | Labels, secondary meta, hairlines |
| `--ink` | soft mint | Default text and chrome |
| `--ink-bright` | brighter mint | Brand wordmark, active callsign, primary actions |
| `--signal` | cool teal | **Restricted:** live pulse, visualizer hot spots only |
| `--hairline` | low-contrast mint edge | Borders / dividers |
| `--danger` | soft coral (`~0 70% 62%`) | Stream error / SIGNAL LOST only (not teal) |

Discipline: bright mint and teal stay scarce. If everything glows, nothing glows. Drop app-wide phosphor bloom; soft glow only on live/active and primary play.

### Typography

- **Display / brand / section headers:** **Departure Mono** (self-hosted woff2, same family used on proofslip). Used for wordmark and rare section titles (e.g. `// FILTERS`, fullscreen callsign).
- **Body / data:** keep **JetBrains Mono** for dense station metadata so log rows stay readable.
- Letter-spacing 0.04–0.15em on uppercase labels remains.
- Remove VT323 from `app/layout.tsx`.

### Texture and effect

- Remove the heavy global scanline overlay on `body`.
- Optional: ultra-subtle noise or soft panel lift only — no rolling CRT, flicker, or color fringing.
- Active station: left edge bar in `--ink-bright` + faint mint wash (same structure as today, cooler palette).
- Live badge: `--signal` pulse only.

### Iconography

Keep `components/icons.tsx` (14×14, 1.5px stroke, square caps). Recolor to new tokens. Do not reintroduce Lucide except the existing `Loader2` spinner exception.

## UX polish (equal priority)

### First-run clarity

- SCAN list header: primary **Randomise** control in `--ink-bright`, plus a short cue that every visit yields a fresh obscure pool (e.g. “Fresh obscure signals”).
- Loading copy can stay instrument-toned (“Scanning airwaves…”) but must sit on the new tokens and be centered/readable.

### Mobile listening

- Station cards: tighter vertical rhythm; play + callsign dominant.
- Hide or collapse lower-priority meta (RATE / UPTIME, coords) below `sm` where needed to reduce chrome fighting content.
- Now-playing bar: **one** visualizer mode on small screens (prefer bars or trace — not both stacked); larger hit targets (≥40px); error line always visible when stream fails.

### Playback confidence

Explicit states on card and now-playing bar:

| State | Presentation |
| --- | --- |
| LIVE | Teal pulse badge |
| BUFFERING | Dim mint label (no fake LIVE) |
| PAUSED | Dim label, no pulse |
| SIGNAL LOST | `--danger` error line with store `error` text |

Soften the dual visualizer stack in the bar: one primary visualizer + optional dBFS on `md+`.

## Components / files in scope

| File | Change |
| --- | --- |
| `app/globals.css` | Cool-console tokens; remove heavy scanlines; update utilities |
| `tailwind.config.ts` | Map new color tokens (and temporary aliases) |
| `app/layout.tsx` | Departure Mono as `--font-display`; drop VT323 |
| `public/fonts/` (or equivalent) | Add `DepartureMono-Regular.woff2` (from proofslip asset / licensed source) |
| `app/page.tsx` | Header/nav restyle; first-run cue if owned here |
| `components/station-card.tsx` | Density + state badges |
| `components/now-playing-bar.tsx` | Single visualizer on small screens; stronger states/errors |
| `components/discovery-list.tsx` | Randomise CTA prominence; loading/empty polish |
| `components/bookmark-list.tsx` | Token/chrome pass; empty state polish |
| `components/search-sidebar.tsx` | Recolor; Departure Mono section header |
| `components/fullscreen-station.tsx` | Recolor; Departure Mono callsign |
| `components/share-menu.tsx` | Recolor to panel/hairline |
| `components/audio-visualizer.tsx` | Trace/bars/waterfall/dbfs colors → mint/teal ramp |
| `components/station-map-simple.tsx` | Light token pass only (still placeholder atlas) |
| `README.md` / `CLAUDE.md` | Update product principles to cool-console language |

## Layout grammar (unchanged structure)

Stations remain **log entries**, not marketing tiles:

- Callsign = uppercase station name
- Top meta = `BAND · ID · COORDS`
- Data block = `ORIGIN / RX / RATE / UPTIME` via `lib/station-format.ts`
- Active row = bright left edge + faint wash + live badge when playing
- Operational tab labels stay: `01 SCAN · 02 FILTER · 03 LOG · 04 GRID · 05 NFO`

Header stamp becomes Departure Mono wordmark with mint-bright border; right meta stays stats + the existing “Listening Post” tagline (do not rename the product metaphor in this pass).

## Out of scope

- New product features
- Map rebuild / Leaflet reintroduction
- OG image assets
- ESLint setup / Playwright suite
- API / RadioBrowser proxy changes
- Full IA rewrite or friendlier label rewrite (BAND/RX/RATE stay)
- Sound design / audio cues
- Tab-switch animation choreography

## Acceptance criteria

1. `npm run check` passes (typecheck + production build).
2. All existing behavior intact: play/pause, bookmark, share, deep-link `?station=`, filter, randomise, fullscreen, tabs.
3. Mobile (≤640px): no horizontal scroll; touch targets ≥40px; now-playing shows one visualizer; stream errors visible.
4. No new Lucide usage beyond `Loader2`.
5. Teal (`--signal`) appears only on live pulse / visualizer hot spots.
6. VT323 fully removed; Departure Mono loads for display; JetBrains Mono remains for body/data.
7. Heavy global scanlines removed.
8. Active/live station remains the brightest focal point when playing.

## Risks and rollback

- **Token rename leftovers:** sweep `vdu-green*` classes; keep aliases until grep is clean.
- **Font licensing / hosting:** self-host woff2; if Departure Mono cannot be vendored cleanly, fall back to JetBrains Mono for display only (document in PR).
- **Rollback:** revert the UI commit(s); no schema or API migrations involved.
