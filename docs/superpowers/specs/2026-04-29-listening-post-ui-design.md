# Listening Post UI Revamp

**Date:** 2026-04-29
**Project:** Unheardradio.io
**Status:** Design approved — ready for implementation plan

## Goal

Revamp the Unheard Radio UI from a generic "VDU green retro" treatment into a focused **listening post** design language that visually reinforces the product's anti-algorithm, obscurity-first thesis. Every station should feel like a logged contact, every play like a tuned-in transmission. Keep the existing structure and information architecture; change the surface, typography, iconography, and the visualizer.

## Design language (one sentence)

> A long-running listening post — clinical data density, coordinate-stamped, dimly phosphor-lit, with the radio you're tuned into glowing slightly hotter than everything around it.

## Visual system

### Color tokens (replace existing in `app/globals.css`)

| Token | HSL | Use |
| --- | --- | --- |
| `--bg` | `0 0% 2%` (#050807) | App background |
| `--panel` | `0 0% 4%` | Station card surface |
| `--panel-2` | `0 0% 5%` | Now-playing strip surface |
| `--green-faint` | `120 40% 14%` | Grid lines, dividers behind dim text |
| `--green-dim` | `120 65% 28%` | Inactive labels, hairlines, secondary text |
| `--green` | `120 80% 42%` | Default text and chrome |
| `--green-bright` | `120 100% 58%` | **Reserved**: active station, primary actions, brand wordmark |
| `--cyan` | `180 100% 70%` | **Restricted**: live RX pulse, visualizer trace cursor, waterfall hot-end (top 20% intensity). No other use. |
| `--hairline` | `hsla(120, 60%, 30%, 0.35)` | Card borders, dividers |

Discipline: bright green and cyan are scarce. If everything glows, nothing glows.

### Typography

- **Body / data:** JetBrains Mono (already loaded). Default weight 400, headings/values 700.
- **Display (wordmark, page-title vibes):** **VT323** — single new Google Font import in `globals.css`. Used for the brand stamp and the rare big-number readout.
- **Letter-spacing:** 0.04–0.15em on uppercase labels for the "filed document" feel.
- **Active-state text shadow:** `0 0 5–6px hsla(120, 100%, 55%, 0.4)` — only on the active station callsign and the brand stamp. No global glow.

### Texture and effect

- **Scanlines** — global 2px-cycle scanline overlay at low opacity (≈18% alpha on every other row). Applied via a `body` background-image gradient. No animation.
- **Phosphor bloom** — selective `text-shadow` on active states and brand only. Not applied app-wide.
- **No "rolling CRT," no flicker, no color fringing.** Those read as gimmick.

### Iconography (new SVG kit, 14×14, 1.5px stroke, square caps, no rounded corners)

A single new file `components/icons.tsx` exports 16 glyphs as React components:

`Play`, `Pause`, `Stop`, `Log`, `LogOn`, `Send`, `Inspect`, `Scan`, `Discover`, `Filter`, `Map`, `Info`, `Vol`, `Close`, `Search`, `Rescan`.

All Lucide imports across the app are replaced with these. The set is deliberately limited; if a future feature needs an icon, draft it into this file rather than reaching for Lucide.

### Layout grammar

Stations are framed as **log entries**, not tiles:
- **Callsign** = uppercase station name (no marketing styling)
- **Top-right metadata strip** = `BAND · ID · COORDS` (e.g. `FM · ID 9C8E · 59.3°N 18.0°E`)
- **4-column data block** under the play button = `ORIGIN / RX / RATE / UPTIME`
- **Active row** = bright left edge bar (2px) + faint diagonal phosphor wash + cyan `RX ACTIVE` pulse badge
- **Hover row** = single hairline border lift, no background change

## Components to update

### 1. `components/station-card.tsx`

Replace the current rounded-card layout with a left-bordered log entry.

**Structure:**
```
┌─ row 1 ───────────────────────────────────────────────────────┐
│ CALLSIGN   [RX ACTIVE]              BAND · ID · COORDS        │
├─ row 2 ───────────────────────────────────────────────────────┤
│ [▶]  ORIGIN  RX  RATE  UPTIME                  [Log] [Send] [Inspect]
│      val     val val   val                                    │
└──────────────────────────────────────────────────────────────┘
```

- Active state: left border `--green-bright` (2px), background gradient `linear-gradient(90deg, hsla(120,80%,35%,0.08), transparent 60%)`, inset shadow.
- Play button: 38×38 square, 1px green-dim border. Active-station play button = bright green fill, black icon, soft phosphor glow.
- Action buttons: 28×28 square, hairline border, dim by default. The `Log`/`LogOn` glyph swap encodes bookmark state.

### 2. `components/now-playing-bar.tsx`

Three-column grid: `[ info ] [ trace + readout ] [ controls ]`.

- Line 1: `► RX · ID · COORDS` in dim mono, plus `RX LIVE` cyan pulse badge.
- Line 2: callsign, bright, with phosphor shadow.
- Trace block (centre): 280×28 panel, see Visualizer below.
- Controls (right): Stop / Log / Send / Inspect — all 32×32 squared.
- Border: top hairline only, plus subtle `box-shadow: 0 -4px 20px hsla(120,100%,40%,0.08)` for ambient lift.

### 3. `components/audio-visualizer.tsx` — full rewrite

Two render modes selected by prop:

**`mode="trace"`** (default, used in now-playing strip):
- Single-pixel SVG path, 1px stroke `--green-bright`, drop-shadow `0 0 2px hsla(120,100%,60%,0.7)`.
- Built from FFT data: 50 sample points across the width, mapped to y by `(byte/255 - 0.5) * height * 0.6`.
- Two paths rendered each frame: current trace (bright) + previous trace (faint, 25% opacity) for afterglow trail.
- Vertical cursor on right edge: 0.8px stroke `--cyan`, 70% opacity.
- Background: 3 horizontal grid lines at 0.5px stroke `--green-faint` (16/14, 32, 48 of 64; or 7/14/21 of 28 in compact).
- Idle (no audio): hold center-line with faint scrolling sine; never blank.

**`mode="waterfall"`** (used in fullscreen station view):
- Canvas-rendered scrolling spectrogram. Each frame renders a 1px-tall row of 256 frequency bins from the FFT, mapped through a green/cyan luminance ramp:
  - 0–0.2 → `var(--green-faint)` blend
  - 0.2–0.5 → `var(--green-dim)` to `var(--green)`
  - 0.5–0.8 → `var(--green)` to `var(--green-bright)`
  - 0.8–1.0 → `var(--green-bright)` to `var(--cyan)`
- Existing rows shift down 1px per frame; oldest row clipped. Top edge gets a 30% black gradient mask so new rows fade in cleanly.
- ~30fps target (request animation throttled).

**`mode="dbfs"`** (small readout next to trace in strip):
- Computes peak and average dBFS from the FFT byte array each frame.
- Renders as: `PEAK −6.2 dBFS · AVG −14.0` in 11px mono, `--green-dim` labels and `--green-bright` values.

The component continues to own the `MediaElementAudioSourceNode` lifecycle. The current cleanup logic stays.

### 4. `app/page.tsx` — header + nav

**Header (replaces current):**
```
┌──────────────────────────────────────────────────────────────┐
│ [ UNHEARD // RADIO ]      // LISTENING POST                  │
│                           55,092 stations · 238 countries    │
└──────────────────────────────────────────────────────────────┘
```
- Stamped wordmark in VT323 24px, 1px green border, 4px×10px padding, bright green text with phosphor shadow.
- Right-aligned meta line, 10px mono, dim labels with bright values.
- Bottom hairline border. No vertical-real-estate inflation vs current.

**Nav tabs:**
Tab labels become operational verbs with channel numbers prefixed in a smaller, dimmer style:

`01 SCAN  ·  02 FILTER  ·  03 LOG  ·  04 GRID  ·  05 NFO`

(Mapping: `discover→SCAN`, `search→FILTER`, `saved→LOG`, `map→GRID`, `about→NFO`. Internal route IDs stay unchanged.)

- Each tab: padding 10×16, hairline right divider, 11px uppercase 0.12em letter-spacing.
- Active tab: bright green text, phosphor shadow, faint green wash background, 2px bright bottom border (replaces current background-only highlight).
- Channel numbers are rendered in `--green-faint` 9px before the verb, locking the "channel listing" feel.
- Mobile: number prefixes hide below `sm:` breakpoint to conserve width; verbs stay.

### 5. `components/search-sidebar.tsx`

Light touch — keep current structure, restyle to match the new chrome:
- Section headers in 10px uppercase 0.15em letter-spacing, `--green-dim`.
- Replace `RotateCcw` with the new `Rescan` glyph, label `// APPLY`.
- Add `// FILTERS` section header in VT323 18px at top.
- Inputs and selects keep existing shadcn primitives, but border defaults to `--hairline`, focus state to `--green-dim`.
- Quick-action chips for `RX = 0` and `RX < 5` filters, styled like the icon-buttons in the card.

### 6. `components/fullscreen-station.tsx`

The fullscreen view becomes the **station detail console**. Major moves:
- Top of view: full callsign in VT323 48px + the `BAND · ID · COORDS` line below.
- Replace decorative grid background with the waterfall visualizer at full width × 240px height.
- Existing 8 metadata cards restyled to match the new card chrome (no rounded corners, hairline borders, 11px labels).
- All icons swapped to the new kit. Buttons restyled to match station card actions.

### 7. `components/share-menu.tsx`

Already structurally fine. Restyle:
- Popover background `var(--panel)` with `--green-dim` border (no backdrop blur).
- Menu items: dim by default, brighten on hover, hairline divider above first item.
- Replace Lucide icons with the new kit (`Send`, `Close`, custom WhatsApp/Telegram/X glyphs added to `icons.tsx`).

### 8. `app/globals.css`

- Add `VT323` to the existing Google Fonts import.
- Replace the color CSS-vars with the new tokens (preserving the `--vdu-green` family names so existing Tailwind tokens still resolve, but mapping them to the new HSL values).
- Add the global scanline `body` background gradient.
- Keep the existing scrollbar styling but darken the thumb to `--green-dim` and remove the rounded corners (square scrollbar fits the aesthetic).
- Add a single utility class `.phosphor` = `text-shadow: 0 0 5px hsla(120,100%,55%,0.4)` for selective use.

## Data additions (none required)

All visual changes are derivable from existing `RadioStation` fields:

- `BAND` (best-effort, RadioBrowser doesn't expose true band): case-insensitive search of `name` and `tags`. `SW` if matches "shortwave" or stand-alone "sw"; `AM` if matches stand-alone "am" + 3–4 digits; `FM` if matches stand-alone "fm" or "f.m."; otherwise `WEB`.
- `ID` = first 4 hex chars of `stationuuid`, uppercased.
- `COORDS` = `geo_lat.toFixed(1)°N · geo_long.toFixed(1)°E` if present; else `COORDS UNKNOWN`.
- `ORIGIN` = `countrycode / country` if both present; else `country`; else `—`.
- `RX` = `clickcount`.
- `RATE` = `bitrate ? \`${bitrate}k ${codec || 'MP3'}\` : '—'`.
- `UPTIME` = humanized days-since-`lastchangetime` (e.g. `2y 41d`, `147d`, `<1d`).

A new module `lib/station-format.ts` will own these derivations so the card, strip, and fullscreen views all speak the same language.

## Mobile responsiveness

The whole revamp must hold up on phones. Specific guards:
- Card top-right metadata strip wraps to a 2nd line under the callsign on `sm` and below.
- Card data block becomes 2×2 instead of 1×4 on `sm`.
- Nav tab channel numbers (`01`, `02`…) hide below `sm`.
- Header data line (`stations · countries`) hides below `sm`; just stamp + tagline shown.
- Now-playing strip: visualizer trace shrinks to ~140px and the dBFS readout hides below `sm`.

## Out of scope

- Map view styling (still a placeholder).
- New OG image (the metadata field stays absent).
- Animation choreography between tab switches (no transitions added; tab switches stay instant).
- Sound design / audio cues.

## Acceptance criteria

1. Build remains green (`npm run build` passes, no TS errors, no new ESLint errors).
2. All existing functionality intact: play, pause, bookmark, share, deep-link, filter, fullscreen, navigation.
3. Mobile (≤640px) layout: no horizontal scroll, all touch targets ≥40px, content readable without zoom.
4. No Lucide imports remain in `components/` or `app/` (verifiable via grep).
5. The active-station glow is the brightest thing on screen at any moment when something's playing.
6. Trace visualizer renders at ≥30fps on a mid-range laptop with FFT data; falls back to the synthetic sine-based animation only when `MediaElementAudioSourceNode` setup fails.
