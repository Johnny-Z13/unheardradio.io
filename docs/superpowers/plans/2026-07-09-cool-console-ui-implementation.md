# Cool Console UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Unheard Radio from CRT/phosphor green into a cool mint/teal radio console — Departure Mono display type, quieter chrome, clearer first-run / mobile / playback states — without changing product IA or APIs.

**Architecture:** Token-first visual pass. Foundation (CSS tokens + self-hosted Departure Mono + Tailwind aliases) lands first so mid-pass builds stay coherent. Then restyle shell surfaces (header/nav, cards, player bar, discovery CTA), then remaining chrome (sidebar, fullscreen, share, visualizer colors, map, bookmarks, privacy), then docs + final class sweep.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind 3.4, shadcn/Radix, Zustand, TanStack Query. No new runtime npm deps. Self-host `DepartureMono-Regular.woff2` from proofslip.

**Spec:** `docs/superpowers/specs/2026-07-09-cool-console-ui-design.md`

## Global Constraints

- Keep SCAN / FILTER / LOG / GRID / NFO IA and operational labels (BAND / ID / ORIGIN / RX / RATE / UPTIME).
- No API, audio-store behavior, or bookmark storage changes (UI state presentation only).
- Teal (`--signal` / `accent-cyan` alias) only for live pulse and visualizer hot spots.
- Soft coral `--danger` for SIGNAL LOST / stream errors — never teal for errors.
- Lucide allowed only as `Loader2` spinner.
- Verify with `npm run check` (typecheck + build); no unit test runner exists.
- Keep “Listening Post” tagline; do not rename the product metaphor.
- Temporary `--vdu-green*` aliases map to new mint values until class sweep is complete.

---

## File Structure

**Create:**
- `public/fonts/DepartureMono-Regular.woff2` — display font asset (~22KB)

**Modify:**
- `app/globals.css` — cool-console tokens, remove scanlines, font-face, utilities
- `app/layout.tsx` — drop VT323; keep JetBrains Mono; wire Departure via CSS
- `tailwind.config.ts` — ink/signal/danger tokens + legacy aliases
- `app/page.tsx` — header/nav restyle on new tokens
- `components/station-card.tsx` — density + LIVE/BUFFERING/PAUSED/SIGNAL LOST
- `components/now-playing-bar.tsx` — one visualizer on small screens; danger errors
- `components/discovery-list.tsx` — Randomise CTA + loading/empty polish
- `components/bookmark-list.tsx` — token/empty polish
- `components/search-sidebar.tsx` — recolor + Departure section header
- `components/fullscreen-station.tsx` — recolor + Departure callsign
- `components/share-menu.tsx` — panel/hairline recolor
- `components/audio-visualizer.tsx` — mint/teal color ramp
- `components/station-map-simple.tsx` — light token pass
- `app/privacy/page.tsx` — token pass
- `README.md` / `CLAUDE.md` — cool-console principles

**Out of scope:** map rebuild, OG image, ESLint, Playwright, API changes, IA rewrite.

---

## Verification approach (every task)

This repo has no test runner. Each task ends with:

1. `npm run typecheck` (or `npm run check` on foundation / final tasks)
2. Manual visual/behavior checklist for the touched surface
3. Commit

---

### Task 1: Foundation — font + tokens + layout

**Files:**
- Create: `public/fonts/DepartureMono-Regular.woff2`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Consumes: proofslip font URL `https://raw.githubusercontent.com/Johnny-Z13/proofslip/master/src/public/fonts/DepartureMono-Regular.woff2`
- Produces: CSS vars `--ink`, `--ink-dim`, `--ink-bright`, `--ink-faint`, `--signal`, `--danger`, `--panel`, `--panel-2`, `--bg`, `--hairline`; utility classes `.text-ink`, `.text-ink-dim`, `.text-ink-bright`, `.text-signal`, `.text-danger`, `.bg-panel`, `.border-hairline`, `.font-display`, `.signal-glow`; Tailwind colors `ink`, `ink-dim`, `ink-bright`, `ink-faint`, `signal`, `danger`, `panel`, `panel-2`, `console-bg`; legacy aliases still resolve (`vdu-green*` → mint, `accent-cyan` → signal)

- [ ] **Step 1: Vendor Departure Mono**

```bash
mkdir -p public/fonts
curl -fsSL -o public/fonts/DepartureMono-Regular.woff2 \
  "https://raw.githubusercontent.com/Johnny-Z13/proofslip/master/src/public/fonts/DepartureMono-Regular.woff2"
file public/fonts/DepartureMono-Regular.woff2
ls -la public/fonts/DepartureMono-Regular.woff2
```

Expected: `Web Open Font Format (Version 2)`, size ~22496 bytes.

- [ ] **Step 2: Replace `app/globals.css`**

Write the full file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: 'Departure Mono';
  src: url('/fonts/DepartureMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  /* Cool console — HSL channels (space-separated for hsl(var(--x))) */
  --background: 200 10% 4%;
  --foreground: 160 25% 62%;
  --card: 200 10% 6%;
  --card-foreground: 160 25% 62%;
  --popover: 200 10% 6%;
  --popover-foreground: 160 25% 62%;
  --primary: 160 45% 72%;
  --primary-foreground: 200 10% 4%;
  --secondary: 200 10% 8%;
  --secondary-foreground: 160 25% 62%;
  --muted: 200 8% 10%;
  --muted-foreground: 160 18% 42%;
  --accent: 180 70% 58%;
  --accent-foreground: 200 10% 4%;
  --destructive: 0 70% 62%;
  --destructive-foreground: 0 0% 98%;
  --border: 160 15% 18%;
  --input: 200 10% 8%;
  --ring: 160 45% 72%;
  --radius: 0;

  /* Semantic cool-console tokens */
  --bg: 200 10% 4%;
  --panel: 200 10% 6%;
  --panel-2: 200 10% 8%;
  --ink-faint: 160 15% 18%;
  --ink-dim: 160 18% 42%;
  --ink: 160 25% 62%;
  --ink-bright: 160 45% 72%;
  --signal: 180 70% 58%;
  --danger: 0 70% 62%;
  --hairline: 160 20% 28%;

  /* Legacy aliases → cool console (remove after class sweep) */
  --vdu-green: var(--ink);
  --vdu-green-dim: var(--ink-dim);
  --vdu-green-bright: var(--ink-bright);
  --vdu-green-faint: var(--ink-faint);
  --vdu-glow: var(--ink-bright);
  --radio-black: var(--bg);
  --radio-dark: var(--panel);
  --radio-panel: var(--panel-2);
  --accent-cyan: var(--signal);
  --text-muted: var(--ink-dim);
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--bg));
  color: hsl(var(--ink));
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow: hidden;
}

html {
  background-color: hsl(var(--bg));
}

.font-display {
  font-family: 'Departure Mono', var(--font-mono), monospace;
}

.signal-glow {
  text-shadow: 0 0 6px hsla(160, 45%, 72%, 0.35);
}

/* Prefer .signal-glow; keep .phosphor as alias during migration */
.phosphor {
  text-shadow: 0 0 6px hsla(160, 45%, 72%, 0.35);
}

.text-ink { color: hsl(var(--ink)); }
.text-ink-dim { color: hsl(var(--ink-dim)); }
.text-ink-bright { color: hsl(var(--ink-bright)); }
.text-ink-faint { color: hsl(var(--ink-faint)); }
.text-signal { color: hsl(var(--signal)); }
.text-danger { color: hsl(var(--danger)); }
.bg-panel { background-color: hsl(var(--panel)); }
.bg-panel-2 { background-color: hsl(var(--panel-2)); }
.bg-console { background-color: hsl(var(--bg)); }
.border-hairline { border-color: hsla(var(--hairline), 0.45); }

/* Legacy utility aliases */
.text-vdu-green { color: hsl(var(--ink)); }
.text-vdu-green-dim { color: hsl(var(--ink-dim)); }
.text-vdu-green-bright { color: hsl(var(--ink-bright)); }
.bg-vdu-green { background-color: hsl(var(--ink)); }
.bg-radio-dark { background-color: hsl(var(--panel)); }
.bg-radio-panel { background-color: hsl(var(--panel-2)); }
.border-vdu-green { border-color: hsl(var(--ink)); }
.border-vdu-green-dim { border-color: hsl(var(--ink-dim)); }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: hsl(var(--bg)); }
::-webkit-scrollbar-thumb { background: hsl(var(--ink-dim)); }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--ink)); }
```

- [ ] **Step 3: Update `app/layout.tsx` — remove VT323**

Replace font imports and html/body classes:

```tsx
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { QueryProvider } from '@/lib/query-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://unheardradio.io'),
  title: 'Unheard Radio - Discover Obscure Underground Radio Stations Worldwide',
  description: 'Anti-algorithm radio discovery platform. Find the world\'s most obscure, underground radio stations with zero listeners. Stream live broadcasts from forgotten corners of the globe.',
  keywords: 'radio, obscure radio, underground radio, radio discovery, live radio, streaming radio, zero listeners, anti-algorithm, radio browser, global radio, experimental radio, rare radio stations',
  authors: [{ name: 'Z13labs' }],
  creator: 'Z13labs',
  publisher: 'Unheard Radio',
  category: 'Music & Audio',
  robots: 'index, follow',
  openGraph: {
    title: 'Unheard Radio - Discover Obscure Radio Stations',
    description: 'Your portal to the strange side of sound. Stream live radio from the world\'s most overlooked stations.',
    url: 'https://unheardradio.io',
    siteName: 'Unheard Radio',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unheard Radio - Discover Obscure Radio Stations',
    description: 'Anti-algorithm radio discovery. Find stations with zero listeners.',
    creator: '@z13labs',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jetBrainsMono.variable} dark`}>
      <body className="min-h-screen bg-console text-ink antialiased">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Update `tailwind.config.ts` color map**

In `theme.extend.colors`, replace the Signal Drift custom colors block with:

```ts
        // Cool console
        "console-bg": "hsl(var(--bg))",
        panel: {
          DEFAULT: "hsl(var(--panel))",
          2: "hsl(var(--panel-2))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          dim: "hsl(var(--ink-dim))",
          bright: "hsl(var(--ink-bright))",
          faint: "hsl(var(--ink-faint))",
        },
        signal: "hsl(var(--signal))",
        danger: "hsl(var(--danger))",
        // Legacy aliases (map to cool console)
        "radio-black": "hsl(var(--bg))",
        "radio-dark": "hsl(var(--panel))",
        "radio-panel": "hsl(var(--panel-2))",
        "vdu-green": "hsl(var(--ink))",
        "vdu-green-bright": "hsl(var(--ink-bright))",
        "vdu-green-dim": "hsl(var(--ink-dim))",
        "vdu-green-faint": "hsl(var(--ink-faint))",
        "accent-cyan": "hsl(var(--signal))",
        "text-muted": "hsl(var(--ink-dim))",
```

Keep existing shadcn/sidebar/chart entries unchanged.

- [ ] **Step 5: Verify foundation**

```bash
npm run typecheck
```

Expected: exit 0.

Manual: `npm run dev`, open `/`, confirm:
- No scanline stripes on body
- Wordmark still renders (may still use old class names via aliases) but font-display should be Departure Mono
- Overall palette shifted toward mint (not neon CRT green)

- [ ] **Step 6: Commit**

```bash
git add public/fonts/DepartureMono-Regular.woff2 app/globals.css app/layout.tsx tailwind.config.ts
git commit -m "$(cat <<'EOF'
feat(ui): add cool console tokens and Departure Mono

Establish mint/teal foundation, self-hosted display font, and legacy color aliases for the console overhaul.
EOF
)"
```

---

### Task 2: Shell — header + nav

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `.font-display`, `text-ink-*`, `text-signal`, `border-hairline`, `signal-glow`
- Produces: restyled header stamp + tab chrome on cool-console tokens; tagline remains `// Listening Post`

- [ ] **Step 1: Restyle header stamp and meta**

In `app/page.tsx`, update the outer shell + header:

```tsx
    <div className="h-dvh overflow-hidden bg-console text-ink font-mono flex flex-col">
      <header className="shrink-0 border-b border-hairline px-3 sm:px-4 py-3 flex items-end justify-between gap-3">
        <div className="border border-ink-bright px-2.5 py-1 font-display text-[20px] sm:text-[22px] leading-none text-ink-bright signal-glow tracking-[0.08em]">
          UNHEARD&nbsp;//&nbsp;RADIO
        </div>
        <div className="text-right text-[10px] tracking-[0.12em] uppercase text-ink-dim leading-relaxed">
          <div>// Listening Post</div>
          <div className="hidden sm:block">
            <span className="text-ink">{stats ? stats.stations.toLocaleString() : '…'}</span> stations
            <span className="opacity-50 px-1.5">·</span>
            <span className="text-ink">{stats ? stats.countries : '…'}</span> countries
          </div>
        </div>
      </header>
```

- [ ] **Step 2: Restyle nav tabs**

Replace the tab button className branch:

```tsx
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-r border-hairline transition-colors text-[11px] tracking-[0.12em] uppercase whitespace-nowrap ${
                  active
                    ? 'text-ink-bright bg-ink/[0.06] signal-glow border-b-2 border-b-ink-bright'
                    : 'text-ink-dim hover:text-ink'
                }`}
```

And channel number span:

```tsx
                <span className="hidden sm:inline text-ink-faint text-[9px]">{tab.num}</span>
```

- [ ] **Step 3: Soften FILTER sidebar chrome border**

Where the search sidebar wrapper uses `border-vdu-green/20`, switch to `border-hairline`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
```

Manual at 375px and desktop:
- Stamp uses Departure Mono
- Active tab has bright mint bottom edge
- Tagline still says Listening Post
- Deep link / tabs still switch content

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "$(cat <<'EOF'
feat(ui): restyle header and nav for cool console

Apply mint chrome and Departure Mono wordmark while keeping Listening Post IA.
EOF
)"
```

---

### Task 3: Station card — density + playback states

**Files:**
- Modify: `components/station-card.tsx`

**Interfaces:**
- Consumes: `useAudioStore()` → `currentStation`, `isPlaying`, `isLoading`, `error`, `playStation`
- Produces: badges for LIVE / BUFFERING / PAUSED; SIGNAL LOST when `isCurrent && error`; coords/RATE/UPTIME remain hidden below `sm`

- [ ] **Step 1: Derive explicit playback state**

Near the top of `StationCard`, after existing `isLive` / `isBuffering` flags, add:

```tsx
  const hasError = isCurrent && Boolean(error);
  const isPaused = isCurrent && !isPlaying && !isLoading && !hasError;
```

Import `error` from `useAudioStore()` alongside existing fields.

- [ ] **Step 2: Replace LIVE-only badge with state badges**

Replace the `{isLive && (... LIVE SIGNAL ...)}` block with:

```tsx
          {isLive && (
            <span className="inline-flex items-center gap-1.5 border border-signal/40 bg-signal/10 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-signal whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-signal animate-pulse" />
              LIVE
            </span>
          )}
          {isBuffering && (
            <span className="inline-flex items-center gap-1.5 border border-ink-dim/40 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-ink-dim whitespace-nowrap">
              BUFFERING
            </span>
          )}
          {isPaused && (
            <span className="inline-flex items-center gap-1.5 border border-ink-dim/30 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-ink-dim whitespace-nowrap">
              PAUSED
            </span>
          )}
          {hasError && (
            <span className="inline-flex items-center gap-1.5 border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-danger whitespace-nowrap">
              SIGNAL LOST
            </span>
          )}
```

- [ ] **Step 3: Retoken card chrome**

Update card container / callsign / meta / play button / data labels to `ink` / `panel` / `hairline` / `signal-glow` equivalents. Active wash:

```tsx
      style={isCurrent ? {
        background: 'linear-gradient(90deg, hsla(160, 40%, 35%, 0.10) 0%, transparent 60%)',
        boxShadow: 'inset 2px 0 12px hsla(160, 45%, 50%, 0.08)',
      } : undefined}
```

Active top hairline: `bg-signal` (teal reserved for live edge cue on current station only when live — if not live, use `bg-ink-bright/40`).

Play button live glow:

```tsx
          style={isLive ? { boxShadow: '0 0 10px hsla(160,45%,72%,0.35)' } : undefined}
```

Touch targets: bump action buttons to `w-8 h-8` / `min-w-[40px] min-h-[40px]` on mobile (`w-10 h-10` play already close — ensure `w-10 h-10` on default, not only `sm`).

- [ ] **Step 4: Show error line under data row when `hasError`**

After the row-2 grid, add:

```tsx
      {hasError && (
        <p className="mt-2 text-[10px] tracking-[0.08em] uppercase text-danger truncate">
          {error}
        </p>
      )}
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck
```

Manual:
- Play a station → LIVE teal badge
- Pause → PAUSED dim badge (no teal pulse)
- Force a bad stream if possible / inspect buffering → BUFFERING without LIVE
- Mobile 375px: RATE/UPTIME/coords hidden; play target ≥40px

- [ ] **Step 6: Commit**

```bash
git add components/station-card.tsx
git commit -m "$(cat <<'EOF'
feat(ui): clarify station card playback states

Add LIVE/BUFFERING/PAUSED/SIGNAL LOST badges and cool-console card chrome.
EOF
)"
```

---

### Task 4: Now-playing bar — mobile visualizer + errors

**Files:**
- Modify: `components/now-playing-bar.tsx`

**Interfaces:**
- Consumes: `useAudioStore()` → `currentStation`, `isPlaying`, `isLoading`, `error`, `togglePlay`
- Produces: single visualizer below `sm`; bars+optional dBFS on `sm+`/`md+`; danger-colored errors; ≥40px controls

- [ ] **Step 1: Pull loading state and derive labels**

```tsx
  const { currentStation, isPlaying, isLoading, togglePlay, error } = useAudioStore();
  // ...
  const statusLabel = error
    ? 'SIGNAL LOST'
    : isLoading
      ? 'BUFFERING'
      : isPlaying
        ? 'LIVE'
        : 'PAUSED';
  const statusIsLive = statusLabel === 'LIVE';
```

- [ ] **Step 2: Replace status badge + error color**

Status cluster:

```tsx
          <span className={`ml-auto inline-flex items-center gap-1.5 ${statusIsLive ? 'text-signal' : error ? 'text-danger' : 'text-ink-dim'}`}>
            <span className={`w-1.5 h-1.5 ${statusIsLive ? 'bg-signal animate-pulse' : error ? 'bg-danger' : 'bg-ink-dim opacity-40'}`} />
            {statusLabel}
          </span>
```

Error line:

```tsx
        {error && (
          <p className="text-[10px] text-danger truncate mt-0.5">⚠ {error}</p>
        )}
```

- [ ] **Step 3: Visualizer layout — one on mobile**

Replace the center visualizer column with:

```tsx
      {/* Mobile: single bars visualizer */}
      <div className="sm:hidden min-w-0">
        <AudioVisualizer mode="bars" height={22} />
      </div>

      {/* sm+: bars + optional dBFS */}
      <div className="hidden sm:grid grid-cols-[1fr_88px] items-center gap-2 min-w-0">
        <AudioVisualizer mode="bars" height={28} />
        <div className="hidden md:block text-right">
          <AudioVisualizer mode="dbfs" />
        </div>
      </div>
```

Remove the stacked bars+trace pair on small/medium; keep one primary bars mode (spec allows bars or trace — choose bars for continuity with cards).

Update grid template so mobile still works — use responsive grid classes:

```tsx
      className="border-t border-hairline bg-panel-2 px-3 sm:px-4 py-2.5 sm:py-3 grid items-center gap-3 sm:gap-4 grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(160px,320px)_auto]"
      style={{ boxShadow: '0 -4px 22px hsla(160, 40%, 40%, 0.10)' }}
```

On mobile the single visualizer can sit under the info column instead of a middle column if the two-column grid is cleaner — preferred structure:

```tsx
    <div className="border-t border-hairline bg-panel-2 px-3 sm:px-4 py-2.5 sm:py-3" style={{ boxShadow: '0 -4px 22px hsla(160, 40%, 40%, 0.10)' }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(160px,320px)_auto] items-center gap-3 sm:gap-4">
        {/* info */}
        {/* visualizer center: hidden on xs, shown sm+ */}
        {/* controls */}
      </div>
      <div className="sm:hidden mt-2">
        <AudioVisualizer mode="bars" height={22} />
      </div>
    </div>
```

- [ ] **Step 4: Enlarge control hit targets**

All control buttons: `w-10 h-10` (40px). Primary play/stop keeps `bg-ink-bright text-console-bg` with soft mint glow.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
```

Manual at 375px:
- Only one visualizer visible in the bar
- Controls are 40×40
- On stream error, danger text shows (not teal)

- [ ] **Step 6: Commit**

```bash
git add components/now-playing-bar.tsx
git commit -m "$(cat <<'EOF'
feat(ui): harden now-playing bar for mobile and errors

Use one visualizer on small screens, larger targets, and danger-colored signal loss.
EOF
)"
```

---

### Task 5: Discovery list — first-run CTA + empty/loading

**Files:**
- Modify: `components/discovery-list.tsx`

**Interfaces:**
- Consumes: existing `handleRandomiseFeed`, `canRandomise`, `isFetching`
- Produces: bright Randomise primary CTA + “Fresh obscure signals” cue; tokenized loading/empty/error

- [ ] **Step 1: Restyle loading / error / empty**

Loading:

```tsx
          <Loader2 className="w-8 h-8 animate-spin text-ink mx-auto mb-4" />
          <p className="text-ink tracking-[0.08em] uppercase text-[11px]">Scanning airwaves...</p>
```

Error:

```tsx
          <div className="text-danger mb-2 tracking-[0.12em] uppercase text-[11px]">Signal Lost</div>
          <p className="text-ink-dim text-sm">
            {error instanceof Error ? error.message : 'Failed to load stations'}
          </p>
```

Empty:

```tsx
            <h3 className="font-display text-lg text-ink-dim mb-2">// NO CONTACTS</h3>
            <p className="text-sm text-ink-dim">
              {Object.keys(filters).some(key => filters[key as keyof SearchFilters])
                ? "This filter combination returned no results. Try '0 listeners' or a different country/genre."
                : "Try adjusting filters or randomise again."}
            </p>
```

- [ ] **Step 2: Elevate Randomise CTA + cue copy**

Header block:

```tsx
        <div className="min-w-0">
          <h2 className="font-display text-[22px] md:text-[28px] leading-none text-ink-bright signal-glow tracking-[0.04em]">
            // OBSCURE TRANSMISSIONS
          </h2>
          <p className="text-[10px] tracking-[0.12em] uppercase text-ink-dim mt-1.5">
            {!filters.search && !filters.country && !filters.genre
              ? `Fresh obscure signals · ${allStations.length} stations`
              : `Sorted by reverse popularity · ${allStations.length} stations found`}
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Button
            onClick={handleRandomiseFeed}
            variant="outline"
            size="sm"
            disabled={isFetching || !canRandomise}
            className="border-ink-bright bg-ink-bright text-console-bg hover:bg-ink hover:border-ink text-[10px] tracking-[0.15em] uppercase font-bold rounded-none min-h-10 px-3"
          >
            <Scan size={12} className="mr-1.5" />
            <span className="hidden md:inline">RANDOMISE FEED</span>
            <span className="md:hidden">RANDOMISE</span>
          </Button>
        </div>
```

Load-more button: outline `border-ink-dim text-ink hover:bg-ink hover:text-console-bg`.

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Manual:
- First paint shows Randomise as brightest control
- Cue reads “Fresh obscure signals” on unfiltered SCAN
- Click Randomise reshuffles feed

- [ ] **Step 4: Commit**

```bash
git add components/discovery-list.tsx
git commit -m "$(cat <<'EOF'
feat(ui): sharpen discovery first-run CTA

Make Randomise the primary action and clarify obscure-feed loading/empty states.
EOF
)"
```

---

### Task 6: Remaining surfaces — recolor pass

**Files:**
- Modify: `components/search-sidebar.tsx`
- Modify: `components/fullscreen-station.tsx`
- Modify: `components/share-menu.tsx`
- Modify: `components/audio-visualizer.tsx`
- Modify: `components/bookmark-list.tsx`
- Modify: `components/station-map-simple.tsx`
- Modify: `app/privacy/page.tsx`

**Interfaces:**
- Consumes: cool-console tokens from Task 1
- Produces: all primary UI surfaces on mint/teal; visualizer ramp uses ink → signal; no new features

- [ ] **Step 1: `search-sidebar.tsx`**

- Section title `// FILTERS` → `font-display text-ink-bright`
- Labels → `text-ink-dim`
- Borders/focus → `border-hairline` / `ring-ink-dim`
- Apply button → bright mint primary like Randomise
- Replace remaining `vdu-green*` / `phosphor` with `ink*` / `signal-glow`

- [ ] **Step 2: `fullscreen-station.tsx`**

- Callsign → `font-display text-ink-bright signal-glow` (keep large size)
- Meta chrome → ink tokens
- Waterfall stays; colors come from visualizer update
- Error/status badges match card vocabulary (LIVE teal, SIGNAL LOST danger)

- [ ] **Step 3: `share-menu.tsx`**

- Popover: `bg-panel border-hairline text-ink`
- Items: `text-ink-dim hover:text-ink-bright`
- No backdrop blur; keep existing share behavior

- [ ] **Step 4: `audio-visualizer.tsx` color ramp**

Update SVG strokes to CSS vars:

```tsx
stroke="hsl(var(--ink-faint))"
stroke="hsl(var(--ink))"
stroke="hsl(var(--ink-bright))"
stroke="hsl(var(--signal))"
```

Trace drop-shadow: `hsla(160,45%,72%,0.55)`.

dbfs labels: `text-ink-dim` / values `text-ink-bright`.

Waterfall canvas ramp (replace green/cyan rgba literals):

```ts
// faint mint → ink → bright → signal teal
// examples:
'rgba(20, 40, 36, 0.65)'   // clear/fade
'rgba(90, 160, 140, 0.78)' // mid
'rgba(140, 220, 190, 0.9)' // bright
'rgba(110, 230, 220, 0.9)' // hot / signal
```

Keep FFT logic unchanged.

- [ ] **Step 5: `bookmark-list.tsx` + `station-map-simple.tsx` + `privacy/page.tsx`**

Token/class swap only (`vdu-green*` → `ink*`, cyan → `signal` only where live). Empty LOG state should use `font-display` + `text-ink-dim` similar to discovery empty.

- [ ] **Step 6: Verify**

```bash
npm run typecheck
```

Manual smoke:
- FILTER tab styles
- Open Inspect fullscreen
- Open share popover
- LOG empty + with bookmarks
- GRID still plots
- `/privacy` readable

- [ ] **Step 7: Commit**

```bash
git add components/search-sidebar.tsx components/fullscreen-station.tsx components/share-menu.tsx components/audio-visualizer.tsx components/bookmark-list.tsx components/station-map-simple.tsx app/privacy/page.tsx
git commit -m "$(cat <<'EOF'
feat(ui): recolor remaining surfaces for cool console

Align sidebar, fullscreen, share, visualizer, map, bookmarks, and privacy with mint/teal tokens.
EOF
)"
```

---

### Task 7: Docs + final sweep + acceptance

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: any remaining component/app files still using CRT-only language or stray `vdu-green` if easy to finish
- Optionally simplify `app/globals.css` legacy utilities once grep is clean

**Interfaces:**
- Produces: docs match cool-console principles; `npm run check` green; acceptance criteria from spec met

- [ ] **Step 1: Update README product principles**

Replace CRT-specific bullets under Product Principles with:

```md
- First screen is the product, not a landing page.
- Obscure discovery should feel immediate: every visit produces a new scan.
- The UI should feel like a cool radio console: dense, readable, instrument-like.
- Bright mint is reserved for active states, primary actions, and the brand wordmark.
- Teal is reserved for live signal state and visualizer hot spots.
- Do not reintroduce heavy scanlines, CRT flicker, or marketing cards.
- Keep station metadata formatting in `lib/station-format.ts`.
- Keep share behavior centralized in `components/share-menu.tsx`.
- Display type is Departure Mono; body/data stays JetBrains Mono.
```

Also update the intro sentence that says “monochrome CRT greens” to mint/teal console language.

- [ ] **Step 2: Update CLAUDE.md Listening Post styling section**

Align color discipline with `--ink-bright` / `--signal`, Departure Mono display, no heavy scanlines. Keep iconography + station-format rules.

- [ ] **Step 3: Class sweep**

```bash
rg -n "VT323|scanline|phosphor|vdu-green|accent-cyan|radio-dark|radio-panel|radio-black" app components lib --glob '!docs/**'
```

Expected: ideally zero in `app/` + `components/` (legacy aliases may remain in `globals.css` / `tailwind.config.ts` intentionally). Replace any remaining component class names with `ink*` / `signal` / `panel*`. Keep `.phosphor` alias only if still referenced; otherwise remove.

- [ ] **Step 4: Full acceptance check**

```bash
npm run check
```

Expected: typecheck + build succeed.

Manual acceptance (from spec):
1. Play / pause / bookmark / share / deep-link / filter / randomise / fullscreen / tabs all work
2. Mobile ≤640px: no horizontal scroll; 40px targets; one visualizer in bar; errors visible in danger color
3. No new Lucide except `Loader2`
4. Teal only on live pulse / visualizer hot spots
5. VT323 gone; Departure Mono on wordmark; JetBrains on data
6. No heavy global scanlines
7. Active/live station is the brightest focal point

- [ ] **Step 5: Commit**

```bash
git add README.md CLAUDE.md app/globals.css app components
git commit -m "$(cat <<'EOF'
docs(ui): align product docs with cool console

Update principles and finish the token class sweep after the visual overhaul.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Cool mint/teal tokens + scarce bright/signal | Task 1 |
| Remove heavy scanlines | Task 1 |
| Departure Mono display + JetBrains body | Task 1 |
| Header/nav restyle, keep Listening Post | Task 2 |
| Card density + LIVE/BUFFERING/PAUSED/SIGNAL LOST | Task 3 |
| Now-playing: one visualizer mobile, danger errors | Task 4 |
| Randomise CTA + fresh obscure cue | Task 5 |
| Sidebar / fullscreen / share / visualizer / map / bookmarks | Task 6 |
| README / CLAUDE + final sweep + `npm run check` | Task 7 |
| Out of scope (map rebuild, OG, ESLint, API) | Explicitly omitted |

## Self-review notes

- No TBD/placeholder steps; font URL and token values are concrete.
- No unit-test scaffolding invented — verification matches repo reality (`typecheck` / `check` + manual).
- Legacy aliases intentionally kept through Task 6 so intermediate commits render; Task 7 finishes the sweep.
