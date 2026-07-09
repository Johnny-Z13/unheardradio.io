# Signal Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin Unheard Radio as a night-chart "Signal Atlas", replace the placeholder map with a dynamic canvas atlas as the landing view, and make the discovery feed geographically diverse and locale-aware.

**Architecture:** Token-first reskin (retarget CSS variables, then rename semantically), a pure server-side `diversify()` pass in the existing stations API, and a new canvas atlas built on d3-geo + bundled TopoJSON (no tiles, no keys) with module-level animation state.

**Tech Stack:** Next.js 15 (mixed routers), Tailwind + shadcn tokens, Zustand audio store (unchanged), d3-geo + topojson-client, `node --test` for unit tests.

**Spec:** `docs/superpowers/specs/2026-07-09-signal-atlas-design.md`

## Global Constraints

- Amber (`--signal`) only for live/playing signal, pulses, and primary play actions. Coral (`--danger`) only for stream errors. Bright ink for brand/active text. If everything glows, nothing glows.
- No Lucide icons except the existing `Loader2` spinner. New glyphs go in `components/icons.tsx` (14×14 SVG, 1.5px stroke, square caps).
- Do NOT modify `lib/audio-store.ts`.
- Per-frame animation state is module-level, read in rAF. Never per-frame React state.
- Map component must be dynamically imported with `ssr: false`.
- Match each file's existing quote/style conventions.
- `npm run typecheck` must pass after every task. Commit at the end of every task.
- Diversity passes apply only to seeded (randomSeed) requests; explicit FILTER searches bypass them.
- Station data language (BAND/ID/COORDS/ORIGIN/RX/RATE/UPTIME) via `lib/station-format.ts` helpers, unchanged.

---

### Task 1: Atlas tokens + global chrome

**Files:**
- Modify: `app/globals.css` (full token rewrite below)
- Modify: `tailwind.config.ts:59-68` (custom color names)
- Test: visual smoke + `npm run check`

**Interfaces:**
- Produces: CSS vars `--chart-bg`, `--chart-panel`, `--chart-panel-2`, `--chart-line`, `--chart-ink-dim`, `--chart-ink`, `--chart-ink-bright`, `--signal`, `--signal-dim`, `--danger` (HSL channel triples); Tailwind colors `chart-bg`, `chart-panel`, `chart-panel-2`, `chart-line`, `chart-ink`, `chart-ink-dim`, `chart-ink-bright`, `signal`, `signal-dim`, `danger`; utility classes `.signal-glow`, `.ink-glow`. Legacy `vdu-*` / `radio-*` / `accent-cyan` names KEEP WORKING (retargeted to atlas values) until Task 7 removes them.

- [ ] **Step 1: Rewrite `app/globals.css` tokens** — replace lines 5–84 with:

```css
:root {
  /* Signal Atlas tokens (HSL channels for shadcn compatibility) */
  --chart-bg: 215 45% 4%;
  --chart-panel: 215 40% 7%;
  --chart-panel-2: 215 38% 9%;
  --chart-line: 215 30% 24%;
  --chart-ink-dim: 215 18% 48%;
  --chart-ink: 210 25% 78%;
  --chart-ink-bright: 210 40% 94%;
  --signal: 36 95% 58%;
  --signal-dim: 36 45% 42%;
  --danger: 5 75% 62%;

  /* shadcn mapping */
  --background: var(--chart-bg);
  --foreground: var(--chart-ink);
  --card: var(--chart-panel);
  --card-foreground: var(--chart-ink);
  --popover: var(--chart-panel);
  --popover-foreground: var(--chart-ink);
  --primary: var(--signal);
  --primary-foreground: var(--chart-bg);
  --secondary: var(--chart-panel-2);
  --secondary-foreground: var(--chart-ink);
  --muted: var(--chart-panel-2);
  --muted-foreground: var(--chart-ink-dim);
  --accent: var(--signal);
  --accent-foreground: var(--chart-bg);
  --destructive: var(--danger);
  --destructive-foreground: var(--chart-ink-bright);
  --border: var(--chart-line);
  --input: var(--chart-panel);
  --ring: var(--signal);
  --radius: 0;

  /* Legacy aliases — retargeted so existing classnames render atlas colors.
     Removed in the final sweep task. */
  --vdu-green: var(--chart-ink);
  --vdu-green-dim: var(--chart-ink-dim);
  --vdu-green-bright: var(--chart-ink-bright);
  --vdu-green-faint: var(--chart-line);
  --vdu-glow: var(--chart-ink-bright);
  --radio-black: var(--chart-bg);
  --radio-dark: var(--chart-panel);
  --radio-panel: var(--chart-panel-2);
  --accent-cyan: var(--signal);
  --text-muted: var(--chart-ink-dim);
  --hairline: var(--chart-line);
}

* {
  border-color: hsl(var(--border) / 0.5);
}

body {
  background-color: hsl(var(--chart-bg));
  color: hsl(var(--chart-ink));
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  /* faint graticule motif — replaces CRT scanlines */
  background-image:
    linear-gradient(hsl(var(--chart-line) / 0.07) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--chart-line) / 0.07) 1px, transparent 1px);
  background-size: 56px 56px;
  overflow: hidden;
}

html {
  background-color: hsl(var(--chart-bg));
}

.font-display {
  font-family: var(--font-mono), monospace;
  letter-spacing: 0.12em;
}

.signal-glow {
  text-shadow: 0 0 6px hsl(var(--signal) / 0.45);
}

.ink-glow {
  text-shadow: 0 0 6px hsl(var(--chart-ink-bright) / 0.25);
}

/* Legacy glow aliases (removed in final sweep) */
.phosphor { text-shadow: 0 0 6px hsl(var(--chart-ink-bright) / 0.25); }
.glow { text-shadow: 0 0 6px hsl(var(--chart-ink-bright) / 0.25); }

.text-vdu-green { color: hsl(var(--vdu-green)); }
.text-vdu-green-dim { color: hsl(var(--vdu-green-dim)); }
.text-vdu-green-bright { color: hsl(var(--vdu-green-bright)); }
.bg-vdu-green { background-color: hsl(var(--vdu-green)); }
.bg-radio-dark { background-color: hsl(var(--radio-dark)); }
.bg-radio-panel { background-color: hsl(var(--radio-panel)); }
.border-vdu-green { border-color: hsl(var(--vdu-green)); }
.border-vdu-green-dim { border-color: hsl(var(--vdu-green-dim)); }
.border-hairline { border-color: hsl(var(--hairline) / 0.35); }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: hsl(var(--chart-bg)); }
::-webkit-scrollbar-thumb { background: hsl(var(--chart-line)); }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--chart-ink-dim)); }
```

Note: legacy utilities that previously used `hsla(var(--x), a)` syntax must use the modern `hsl(var(--x) / a)` form as shown, since values are unchanged HSL channel triples.

- [ ] **Step 2: Add semantic Tailwind colors** in `tailwind.config.ts` — replace the `// Signal Drift custom colors` block (keeping the legacy names, now resolving to retargeted vars) with:

```ts
        // Signal Atlas semantic colors
        "chart-bg": "hsl(var(--chart-bg))",
        "chart-panel": "hsl(var(--chart-panel))",
        "chart-panel-2": "hsl(var(--chart-panel-2))",
        "chart-line": "hsl(var(--chart-line))",
        "chart-ink": "hsl(var(--chart-ink))",
        "chart-ink-dim": "hsl(var(--chart-ink-dim))",
        "chart-ink-bright": "hsl(var(--chart-ink-bright))",
        signal: "hsl(var(--signal))",
        "signal-dim": "hsl(var(--signal-dim))",
        danger: "hsl(var(--danger))",
        // Legacy names (removed in final sweep) — retargeted via CSS vars
        "radio-black": "hsl(var(--radio-black))",
        "radio-dark": "hsl(var(--radio-dark))",
        "vdu-green": "hsl(var(--vdu-green))",
        "vdu-green-bright": "hsl(var(--vdu-green-bright))",
        "vdu-green-dim": "hsl(var(--vdu-green-dim))",
        "accent-cyan": "hsl(var(--accent-cyan))",
        "vdu-green-faint": "hsl(var(--vdu-green-faint))",
        "radio-panel": "hsl(var(--radio-panel))",
        "text-muted": "hsl(var(--text-muted))",
        hairline: "hsl(var(--hairline))",
```

(Also fixes the pre-existing inconsistency where some legacy entries lacked the `hsl()` wrapper. Grep components for `bg-vdu-green/` or `text-…/` opacity-suffix usages like `bg-vdu-green/10` — Tailwind opacity modifiers require the `hsl(var(--x))` form without embedded alpha, which this provides.)

- [ ] **Step 3: Verify** — Run: `npm run check`. Expected: typecheck + build pass. Start dev server, load `/`, confirm: navy ground, graticule background, no scanlines, ink text, amber where cyan used to be (LIVE pulse, waterfall hot end).

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(atlas): night-chart tokens, graticule ground, legacy aliases"`

---

### Task 2: Diversity algorithm + API wiring

**Files:**
- Create: `lib/discovery.ts`
- Create: `lib/discovery.test.ts`
- Modify: `pages/api/stations/index.ts` (after the `seededShuffle` block, line 64-69)
- Modify: `package.json` (add `"test": "node --test lib/"` script)

**Interfaces:**
- Produces: `diversify(stations: RadioStation[], opts: DiversifyOptions): RadioStation[]` where `DiversifyOptions = { pageSize: number; maxPerCountry: number; homeCountry?: string; homeCap: number }`. Pure, deterministic, order-stable. Test file imports types via relative path (`./discovery` only, no `@/` aliases — `node --test` runs without the TS path map; `import type` for `RadioStation` is erased by Node's type stripping).

- [ ] **Step 1: Write failing tests** — `lib/discovery.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diversify } from './discovery'

type S = { stationuuid: string; countrycode: string }
const mk = (cc: string, i: number): S => ({ stationuuid: `${cc}-${i}`, countrycode: cc })
const codes = (s: S[]) => s.map(x => x.countrycode)

test('caps each country at maxPerCountry per page', () => {
  const pool = [...Array(10)].flatMap((_, i) => [mk('US', i), mk('DE', i), mk('FR', i), mk('NP', i)])
  const out = diversify(pool as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 })
  const page = codes(out.slice(0, 20) as never)
  for (const cc of new Set(page)) {
    assert.ok(page.filter(c => c === cc).length <= 2, `${cc} appears ${page.filter(c => c === cc).length}×`)
  }
})

test('home country capped at homeCap and placed last on the page', () => {
  const pool = [mk('US', 0), mk('US', 1), mk('DE', 0), mk('FR', 0), mk('NP', 0), mk('KE', 0)]
  const out = diversify(pool as never, { pageSize: 5, maxPerCountry: 2, homeCountry: 'US', homeCap: 1 })
  const page = codes(out.slice(0, 5) as never)
  assert.equal(page.filter(c => c === 'US').length, 1)
  assert.equal(page[page.length - 1], 'US')
})

test('deterministic and lossless', () => {
  const pool = [...Array(30)].map((_, i) => mk(['US', 'DE', 'FR'][i % 3], i))
  const a = diversify(pool as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 })
  const b = diversify(pool as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 })
  assert.deepEqual(a, b)
  assert.equal(a.length, pool.length)
  assert.deepEqual([...a].map(s => s.stationuuid).sort(), pool.map(s => s.stationuuid).sort())
})

test('empty and missing countrycode handled', () => {
  assert.deepEqual(diversify([] as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }), [])
  const pool = [{ stationuuid: 'x' }, { stationuuid: 'y' }] as never
  assert.equal(diversify(pool, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }).length, 2)
})
```

- [ ] **Step 2: Run to verify failure** — Run: `npm test` (after adding `"test": "node --test lib/"` to package.json scripts). Expected: FAIL, cannot find `./discovery`.

- [ ] **Step 3: Implement `lib/discovery.ts`:**

```ts
import type { RadioStation } from '../types/radio'

export interface DiversifyOptions {
  pageSize: number
  maxPerCountry: number
  homeCountry?: string
  homeCap: number
}

/**
 * Re-orders an already-shuffled pool so every page reads like a world tour:
 * at most maxPerCountry stations per country per page, and the listener's
 * own country capped at homeCap and pushed to the bottom of each page.
 * Deterministic and lossless — output is a permutation of the input.
 */
export function diversify(stations: RadioStation[], opts: DiversifyOptions): RadioStation[] {
  const { pageSize, maxPerCountry, homeCountry, homeCap } = opts
  const pool = [...stations]
  const out: RadioStation[] = []

  while (pool.length > 0) {
    const page: RadioStation[] = []
    const homeTail: RadioStation[] = []
    const counts = new Map<string, number>()
    let i = 0

    while (page.length + homeTail.length < pageSize && i < pool.length) {
      const station = pool[i]
      const cc = station.countrycode || '??'
      const isHome = Boolean(homeCountry) && cc === homeCountry
      const cap = isHome ? Math.min(homeCap, maxPerCountry) : maxPerCountry

      if ((counts.get(cc) || 0) >= cap) {
        i++
        continue
      }

      pool.splice(i, 1)
      counts.set(cc, (counts.get(cc) || 0) + 1)
      if (isHome) homeTail.push(station)
      else page.push(station)
    }

    if (page.length + homeTail.length === 0) {
      // Everything left is over-cap for this page; flush in pool order.
      out.push(...pool)
      break
    }
    out.push(...page, ...homeTail)
  }

  return out
}
```

- [ ] **Step 4: Run tests** — Run: `npm test`. Expected: 4 pass.

- [ ] **Step 5: Wire into the API** — in `pages/api/stations/index.ts`, import `diversify` from `@/lib/discovery`, then inside the `if (shouldRandomise && filters.randomSeed)` block, between the shuffle and the slice:

```ts
    if (shouldRandomise && filters.randomSeed) {
      stations = seededShuffle(stations, filters.randomSeed)
      const homeCountry = (req.headers['x-vercel-ip-country'] as string | undefined)?.toUpperCase()
      stations = diversify(stations, {
        pageSize: filters.limit || 20,
        maxPerCountry: 2,
        homeCountry,
        homeCap: 1,
      })
      const start = filters.offset || 0
      const end = start + (filters.limit || 20)
      stations = stations.slice(start, end)
    }
```

And extend the cache header so the edge cache varies by listener country:

```ts
    res.setHeader('Vary', 'x-vercel-ip-country')
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
```

- [ ] **Step 6: Verify against dev server** — Run (dev server up):

```bash
curl -s "http://localhost:3000/api/stations?listenerFilter=low-to-high&limit=20&randomSeed=divtest" | python3 -c "
import json,sys,collections
d=json.load(sys.stdin)
c=collections.Counter(s.get('countrycode','??') for s in d)
assert max(c.values())<=2, c
print('countries on page:', len(c), '— max per country:', max(c.values()))"
curl -s -H 'x-vercel-ip-country: DE' "http://localhost:3000/api/stations?listenerFilter=low-to-high&limit=20&randomSeed=divtest" | python3 -c "
import json,sys
d=json.load(sys.stdin)
de=[i for i,s in enumerate(d) if s.get('countrycode')=='DE']
assert len(de)<=1 and (not de or de[0]==len(d)-1), de
print('DE stations:', len(de), 'position:', de)"
```

Expected: both assertions pass.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(discovery): country interleave + locale-aware home downrank"`

---

### Task 3: Geo data assets (world shape + country centroids)

**Files:**
- Create: `scripts/generate-geo-assets.mjs`
- Create (generated, committed): `lib/geo/world-land-110m.json`, `lib/geo/country-centroids.json`
- Modify: `package.json` (devDependencies: `world-atlas`, `world-countries`)

**Interfaces:**
- Produces: `lib/geo/world-land-110m.json` — TopoJSON with `objects.land`; `lib/geo/country-centroids.json` — `{ [alpha2: string]: { lat: number, lng: number, region: string } }` where region ∈ Africa/Americas/Asia/Europe/Oceania/Antarctic.

- [ ] **Step 1: Install data packages** — Run: `npm i -D world-atlas world-countries`

- [ ] **Step 2: Write `scripts/generate-geo-assets.mjs`:**

```js
// Offline generation script — copies simplified world land TopoJSON and
// derives an alpha2 -> centroid/region table. Run once; outputs are committed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
mkdirSync('lib/geo', { recursive: true })

const land = readFileSync(require.resolve('world-atlas/land-110m.json'), 'utf8')
writeFileSync('lib/geo/world-land-110m.json', land)

const countries = require('world-countries')
const centroids = {}
for (const c of countries) {
  if (!c.cca2 || !Array.isArray(c.latlng) || c.latlng.length !== 2) continue
  centroids[c.cca2.toUpperCase()] = { lat: c.latlng[0], lng: c.latlng[1], region: c.region || 'Unknown' }
}
writeFileSync('lib/geo/country-centroids.json', JSON.stringify(centroids))
console.log(`land topo: ${(land.length / 1024).toFixed(0)}kB, centroids: ${Object.keys(centroids).length} countries`)
```

- [ ] **Step 3: Run and sanity-check** — Run: `node scripts/generate-geo-assets.mjs`. Expected: prints ~90kB and ~250 countries. Then: `python3 -c "import json; d=json.load(open('lib/geo/country-centroids.json')); print(d['NP'], d['US'], d['CD'])"` — Nepal ≈ {lat 28, lng 84, region Asia}.

- [ ] **Step 4: Verify tsconfig allows JSON imports** — check `resolveJsonModule: true` in `tsconfig.json` (add if missing) and `npm run typecheck` passes.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(atlas): bundled world land topo + country centroid table"`

---

### Task 4: Atlas base map (canvas render, pan/zoom, landing tab)

**Files:**
- Create: `components/atlas/atlas-render.ts`
- Create: `components/atlas/atlas-map.tsx`
- Modify: `app/page.tsx` (tab order/rename, dynamic import, default tab)
- Delete: `components/station-map-simple.tsx` (in Task 5, once callout replaces its selection duty)

**Interfaces:**
- Consumes: `lib/geo/world-land-110m.json`.
- Produces: `<AtlasMap onStationSelect={(s: RadioStation) => void} />` default export from `components/atlas/atlas-map.tsx`; `atlas-render.ts` exports `createRenderer(canvas: HTMLCanvasElement): AtlasRenderer` with `AtlasRenderer = { draw(view: View, signals: Signal[], now: number): void; project(lng: number, lat: number, view: View): [number, number]; destroy(): void }`, `View = { k: number; x: number; y: number; w: number; h: number }`, and `Signal = { uuid: string; lng: number; lat: number; approx: boolean; state: 'idle' | 'hover' | 'playing' }`.

- [ ] **Step 1: Install runtime deps** — Run: `npm i d3-geo topojson-client && npm i -D @types/d3-geo @types/topojson-client @types/geojson`

- [ ] **Step 2: Write `components/atlas/atlas-render.ts`** — pure canvas drawing, no React:

```ts
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import worldTopo from '@/lib/geo/world-land-110m.json'

export interface View { k: number; x: number; y: number; w: number; h: number }
export interface Signal {
  uuid: string
  lng: number
  lat: number
  approx: boolean
  state: 'idle' | 'hover' | 'playing'
}

const topo = worldTopo as unknown as Topology<{ land: GeometryCollection }>
const land = feature(topo, topo.objects.land)
const graticule = geoGraticule10()

const INK = { line: 'hsl(215 30% 24%)', lineFaint: 'hsl(215 30% 24% / 0.35)', land: 'hsl(215 38% 9%)', coast: 'hsl(215 25% 32%)', dot: 'hsl(210 25% 78% / 0.85)', dotApprox: 'hsl(210 25% 78% / 0.45)', signal: 'hsl(36 95% 58%)' }

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const projection = geoNaturalEarth1()
  const path = geoPath(projection, ctx)

  function fit(view: View) {
    projection.fitExtent([[8, 8], [view.w - 8, view.h - 8]], land)
    const [tx, ty] = projection.translate()
    const s = projection.scale()
    projection.scale(s * view.k).translate([tx * view.k + view.x, ty * view.k + view.y])
  }

  function project(lng: number, lat: number, view: View): [number, number] {
    fit(view)
    return projection([lng, lat]) ?? [-9999, -9999]
  }

  function draw(view: View, signals: Signal[], now: number) {
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== view.w * dpr || canvas.height !== view.h * dpr) {
      canvas.width = view.w * dpr
      canvas.height = view.h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, view.w, view.h)
    fit(view)

    ctx.beginPath(); path(graticule)
    ctx.strokeStyle = INK.lineFaint; ctx.lineWidth = 0.5; ctx.stroke()

    ctx.beginPath(); path(land)
    ctx.fillStyle = INK.land; ctx.fill()
    ctx.strokeStyle = INK.coast; ctx.lineWidth = 0.75; ctx.stroke()

    for (const s of signals) {
      const p = projection([s.lng, s.lat])
      if (!p) continue
      const [px, py] = p
      if (px < -20 || py < -20 || px > view.w + 20 || py > view.h + 20) continue
      if (s.state === 'playing') {
        // expanding amber rings, 1.8s cycle
        const t = (now % 1800) / 1800
        for (const phase of [t, (t + 0.5) % 1]) {
          ctx.beginPath()
          ctx.arc(px, py, 4 + phase * 22, 0, Math.PI * 2)
          ctx.strokeStyle = `hsl(36 95% 58% / ${0.5 * (1 - phase)})`
          ctx.lineWidth = 1.25
          ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = INK.signal; ctx.fill()
      } else if (s.state === 'hover') {
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = INK.signal; ctx.fill()
      } else {
        ctx.beginPath(); ctx.arc(px, py, s.approx ? 1.5 : 2, 0, Math.PI * 2)
        ctx.fillStyle = s.approx ? INK.dotApprox : INK.dot
        ctx.fill()
      }
    }
  }

  return { draw, project, destroy: () => { /* nothing retained */ } }
}
export type AtlasRenderer = ReturnType<typeof createRenderer>
```

(If `topojson-specification` types are unavailable, type `topo` as `any` with a one-line comment — the JSON never changes shape.)

- [ ] **Step 3: Write `components/atlas/atlas-map.tsx`** — React wrapper owning size/pointer state; rAF loop reads module-level refs only:

```tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RadioStation } from '@/types/radio'
import { fetchStations } from '@/lib/radio-api'
import { useAudioStore } from '@/lib/audio-store'
import { createRenderer, type Signal, type View } from './atlas-render'
import centroids from '@/lib/geo/country-centroids.json'

const CENTROIDS = centroids as Record<string, { lat: number; lng: number; region: string }>

interface Placed { station: RadioStation; lng: number; lat: number; approx: boolean }

function hashJitter(uuid: string): [number, number] {
  let h = 2166136261
  for (let i = 0; i < uuid.length; i++) { h ^= uuid.charCodeAt(i); h = Math.imul(h, 16777619) }
  const a = ((h >>> 16) % 1000) / 1000 - 0.5
  const b = ((h & 0xffff) % 1000) / 1000 - 0.5
  return [a * 3, b * 3] // ±1.5°
}

export function placeStations(stations: RadioStation[]): Placed[] {
  const out: Placed[] = []
  for (const s of stations) {
    if (typeof s.geo_lat === 'number' && typeof s.geo_long === 'number' && (s.geo_lat !== 0 || s.geo_long !== 0)) {
      out.push({ station: s, lng: s.geo_long, lat: s.geo_lat, approx: false })
    } else if (s.countrycode && CENTROIDS[s.countrycode.toUpperCase()]) {
      const c = CENTROIDS[s.countrycode.toUpperCase()]
      const [jx, jy] = hashJitter(s.stationuuid)
      out.push({ station: s, lng: c.lng + jx, lat: c.lat + jy, approx: true })
    }
  }
  return out
}

export default function AtlasMap({ onStationSelect }: { onStationSelect: (s: RadioStation) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [seed, setSeed] = useState('atlas-1')
  const [selected, setSelected] = useState<Placed | null>(null)
  const currentStation = useAudioStore((s) => s.currentStation)

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['/api/stations', 'atlas', seed],
    queryFn: () => fetchStations({ listenerFilter: 'low-to-high', limit: 400, offset: 0, randomSeed: seed }),
    staleTime: 5 * 60 * 1000,
  })

  // Mutable render inputs — written by React, read by the rAF loop.
  const stateRef = useRef<{ placed: Placed[]; view: View; hover: string | null; playingUuid: string | null; sweepStart: number }>({
    placed: [], view: { k: 1, x: 0, y: 0, w: 300, h: 300 }, hover: null, playingUuid: null, sweepStart: 0,
  })
  stateRef.current.placed = placeStations(stations)
  stateRef.current.playingUuid = currentStation?.stationuuid ?? null

  useEffect(() => { stateRef.current.sweepStart = performance.now() }, [stations])

  useEffect(() => {
    const canvas = canvasRef.current!
    const renderer = createRenderer(canvas)
    let raf = 0
    const loop = (now: number) => {
      const st = stateRef.current
      const signals: Signal[] = st.placed.map((p) => ({
        uuid: p.station.stationuuid, lng: p.lng, lat: p.lat, approx: p.approx,
        state: p.station.stationuuid === st.playingUuid ? 'playing' : p.station.stationuuid === st.hover ? 'hover' : 'idle',
      }))
      renderer.draw(st.view, signals, now)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => {
      const r = wrapRef.current!.getBoundingClientRect()
      stateRef.current.view.w = r.width
      stateRef.current.view.h = r.height
    })
    ro.observe(wrapRef.current!)

    return () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.destroy() }
  }, [])

  // pointer: pan / wheel-zoom / pinch / hover / tap
  useEffect(() => {
    const canvas = canvasRef.current!
    const renderer = createRenderer(canvas) // projection math only; draws nothing
    const pointers = new Map<number, { x: number; y: number }>()
    let dragged = false
    let pinchDist = 0

    const clamp = (v: View) => {
      v.k = Math.min(12, Math.max(1, v.k))
      const maxPan = 0.75 * Math.max(v.w, v.h) * v.k
      v.x = Math.min(maxPan, Math.max(-maxPan, v.x))
      v.y = Math.min(maxPan, Math.max(-maxPan, v.y))
    }

    const nearest = (x: number, y: number): Placed | null => {
      const st = stateRef.current
      let best: Placed | null = null
      let bestD = 14 * 14
      for (const p of st.placed) {
        const [px, py] = renderer.project(p.lng, p.lat, st.view)
        const d = (px - x) ** 2 + (py - y) ** 2
        if (d < bestD) { bestD = d; best = p }
      }
      return best
    }

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY })
      dragged = false
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
      }
    }
    const onMove = (e: PointerEvent) => {
      const st = stateRef.current
      if (pointers.has(e.pointerId)) {
        const prev = pointers.get(e.pointerId)!
        const dx = e.offsetX - prev.x, dy = e.offsetY - prev.y
        pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY })
        if (pointers.size === 1) {
          if (Math.abs(dx) + Math.abs(dy) > 2) dragged = true
          st.view.x += dx; st.view.y += dy; clamp(st.view)
        } else if (pointers.size === 2) {
          const [a, b] = [...pointers.values()]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (pinchDist > 0) { st.view.k *= d / pinchDist; clamp(st.view) }
          pinchDist = d
          dragged = true
        }
      } else {
        st.hover = nearest(e.offsetX, e.offsetY)?.station.stationuuid ?? null
        canvas.style.cursor = st.hover ? 'pointer' : 'grab'
      }
    }
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (!dragged) {
        const hit = nearest(e.offsetX, e.offsetY)
        setSelected(hit)
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const st = stateRef.current
      st.view.k *= Math.exp(-e.deltaY * 0.0018)
      clamp(st.view)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [])

  return (
    <div ref={wrapRef} className="relative h-full min-h-0 overflow-hidden bg-chart-bg touch-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute top-3 left-3 flex items-center gap-3 text-[10px] tracking-[0.14em] uppercase text-chart-ink-dim">
        <span className="text-chart-ink-bright">// SIGNAL ATLAS</span>
        <span>{stateRef.current.placed.length} signals plotted</span>
        {isLoading && <span>sweeping…</span>}
      </div>
      <button
        onClick={() => setSeed(`atlas-${Date.now().toString(36)}`)}
        className="absolute top-3 right-3 border border-chart-line px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase text-chart-ink hover:text-chart-ink-bright hover:border-chart-ink-dim transition-colors"
      >
        RESWEEP
      </button>
      {selected && (
        <AtlasCallout placed={selected} onTune={() => onStationSelect(selected.station)} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
```

(The `AtlasCallout` referenced here is created in Task 5 — for this task, stub it inline as `function AtlasCallout(): null { return null }` with selection logging removed before commit, or defer the `{selected && …}` block to Task 5. Prefer deferring the block; keep `selected` state unused-free by adding it in Task 5 instead.)

Note the second `createRenderer` for hit-testing shares no canvas state — it only uses `project()`. If that feels wasteful, export a standalone `createProjector(view)` from `atlas-render.ts`; either is acceptable, but keep signatures consistent.

- [ ] **Step 4: Wire into `app/page.tsx`:**

```tsx
import dynamic from 'next/dynamic'
const AtlasMap = dynamic(() => import('@/components/atlas/atlas-map'), { ssr: false })
```

Replace the `StationMap` usage (lines 146–153) with `<AtlasMap onStationSelect={(station) => { playStation(station); }} />` (no fullscreen jump — the callout handles detail). Change the tabs array so ATLAS is first and default: `useState<Tab>('map')`, tabs order `map (01 ATLAS, icon: new Atlas glyph), discover (02 SCAN), search (03 FILTER), saved (04 LOG), about (05 NFO)`. Add an `Atlas` icon (14×14 globe: circle + two meridian arcs + equator line) to `components/icons.tsx` matching stroke conventions.

- [ ] **Step 5: Verify in browser** — Load `/`: atlas is the landing tab; navy world chart with graticule, coastlines, ~300+ ink dots; wheel zooms toward view, drag pans, hover highlights a dot amber; clicking a dot logs no errors (selection UI comes next task). `npm run check` passes.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(atlas): canvas world chart with signal dots, pan/zoom, landing tab"`

---

### Task 5: Atlas callout + playback wiring + sweep animation

**Files:**
- Create: `components/atlas/atlas-callout.tsx`
- Modify: `components/atlas/atlas-map.tsx` (use real callout; radar sweep)
- Modify: `components/atlas/atlas-render.ts` (sweep arc)
- Delete: `components/station-map-simple.tsx`

**Interfaces:**
- Consumes: `Placed` from atlas-map, `useAudioStore` (`playStation`, `currentStation`, `isPlaying`, `isLoading`, `error`), `useBookmarks`, `ShareMenu`, `lib/station-format` helpers.
- Produces: `<AtlasCallout placed={Placed} onTune={() => void} onClose={() => void} />`.

- [ ] **Step 1: Write `components/atlas/atlas-callout.tsx`:**

```tsx
'use client'

import { RadioStation } from '@/types/radio'
import { useAudioStore } from '@/lib/audio-store'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { ShareMenu } from '@/components/share-menu'
import { Play, Stop, Log, LogOn } from '@/components/icons'
import { getBand, getStationId, getOrigin, getRate } from '@/lib/station-format'

interface Placed { station: RadioStation; lng: number; lat: number; approx: boolean }

export function AtlasCallout({ placed, onTune, onClose }: { placed: Placed; onTune: () => void; onClose: () => void }) {
  const { station, approx, lat, lng } = placed
  const { currentStation, isPlaying, isLoading, error } = useAudioStore()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const isCurrent = currentStation?.stationuuid === station.stationuuid
  const live = isCurrent && isPlaying
  const bookmarked = isBookmarked(station.stationuuid)

  return (
    <div className="absolute left-3 right-3 bottom-3 sm:left-auto sm:right-3 sm:bottom-3 sm:w-[320px] border border-chart-line bg-chart-panel/95 backdrop-blur-sm p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.12em] uppercase text-chart-ink-dim mb-0.5">
            ID {getStationId(station)} · BAND {getBand(station)}
          </div>
          <h3 className={`text-[13px] font-bold uppercase tracking-wide truncate ${live ? 'text-signal signal-glow' : 'text-chart-ink-bright'}`}>
            {station.name}
          </h3>
        </div>
        <button onClick={onClose} aria-label="Close" className="text-chart-ink-dim hover:text-chart-ink text-sm leading-none px-1">×</button>
      </div>
      <div className="text-[10px] tracking-[0.08em] uppercase text-chart-ink-dim mb-2.5">
        {getOrigin(station)} · {Math.abs(lat).toFixed(1)}°{lat >= 0 ? 'N' : 'S'} {Math.abs(lng).toFixed(1)}°{lng >= 0 ? 'E' : 'W'}
        {approx && <span className="text-chart-ink-dim/70"> · POSN APPROX</span>}
        <span className="px-1.5 opacity-50">·</span>{getRate(station)}
      </div>
      {isCurrent && error && (
        <p className="text-[10px] tracking-[0.08em] uppercase text-danger mb-2">{error}</p>
      )}
      <div className="flex gap-1.5">
        <button
          onClick={onTune}
          disabled={isCurrent && isLoading}
          aria-label={live ? 'Stop' : 'Tune in'}
          className={`h-10 px-4 flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase border transition-colors ${
            live
              ? 'bg-signal text-chart-bg border-signal'
              : 'border-chart-ink-dim text-chart-ink hover:border-signal hover:text-signal'
          }`}
        >
          {isCurrent && isLoading
            ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : live ? <Stop size={12} /> : <Play size={12} />}
          {live ? 'STOP' : 'TUNE IN'}
        </button>
        <button
          onClick={() => toggleBookmark(station)}
          aria-label={bookmarked ? 'Remove from log' : 'Log contact'}
          className={`w-10 h-10 border flex items-center justify-center transition-colors ${
            bookmarked ? 'border-chart-ink text-chart-ink-bright bg-chart-ink/[0.06]' : 'border-chart-line text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim'
          }`}
        >
          {bookmarked ? <LogOn size={12} /> : <Log size={12} />}
        </button>
        <ShareMenu
          station={station}
          iconClassName="w-10 h-10 border border-chart-line text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim flex items-center justify-center transition-colors"
        />
      </div>
    </div>
  )
}
```

(Check `ShareMenu`'s actual props in `components/share-menu.tsx` before use — pass `trigger` if required, matching how `station-card.tsx` calls it.)

- [ ] **Step 2: Radar sweep in `atlas-render.ts`** — add to `draw()` signature `sweepStart: number`; after drawing land and before signals:

```ts
    const sweepAge = now - sweepStart
    if (sweepAge < 1200) {
      const angle = (sweepAge / 1200) * Math.PI * 2 - Math.PI / 2
      const cx = view.w / 2, cy = view.h / 2
      const r = Math.hypot(view.w, view.h)
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
      grad.addColorStop(0, 'hsl(36 95% 58% / 0.25)')
      grad.addColorStop(1, 'hsl(36 95% 58% / 0)')
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.stroke()
    }
```

Wire `stateRef.current.sweepStart` through the loop's `renderer.draw(st.view, signals, now, st.sweepStart)`.

- [ ] **Step 3: Enable the callout in atlas-map** (the deferred `{selected && …}` block), import from `./atlas-callout`, and pass `onTune={() => onStationSelect(selected.station)}`. Delete `components/station-map-simple.tsx` and remove its import from `app/page.tsx` (grep to confirm no other usages: `grep -rn "station-map-simple" --include='*.tsx' .` → only page.tsx).

- [ ] **Step 4: Verify in browser** — click a dot → callout shows callsign/origin/coords (approx-flagged where relevant); TUNE IN plays (LIVE state + amber rings pulse on the map at that dot); STOP works; bookmark toggles; share menu opens; RESWEEP redraws with sweep animation and new dots; mobile width (resize to 390px): callout docks full-width bottom. No console errors. `npm run check` passes.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(atlas): signal callout, playback rings, radar sweep; retire placeholder map"`

---

### Task 6: Station card + now-playing bar — states, targets, locator

**Files:**
- Modify: `components/station-card.tsx`
- Modify: `components/now-playing-bar.tsx`
- Create: `lib/locator.ts`

**Interfaces:**
- Produces: `getLocator(station: RadioStation): string` in `lib/locator.ts` — returns e.g. `"ASIA"`, `"AFRC"`, `"AMER"`, `"EURO"`, `"OCEA"`, or `"----"` (unknown), derived from `country-centroids.json` region.

- [ ] **Step 1: Write `lib/locator.ts`:**

```ts
import type { RadioStation } from '@/types/radio'
import centroids from './geo/country-centroids.json'

const REGION_CODE: Record<string, string> = {
  Africa: 'AFRC', Americas: 'AMER', Asia: 'ASIA', Europe: 'EURO', Oceania: 'OCEA', Antarctic: 'ANTC',
}

export function getLocator(station: RadioStation): string {
  const cc = station.countrycode?.toUpperCase()
  const entry = cc ? (centroids as Record<string, { region: string }>)[cc] : undefined
  return entry ? REGION_CODE[entry.region] ?? '----' : '----'
}
```

- [ ] **Step 2: Station card states + reskin** — in `components/station-card.tsx`: derive `hasError = isCurrent && Boolean(error)` and `isPaused = isCurrent && !isPlaying && !isLoading && !hasError` (pull `error` from the store). Badges next to the callsign: LIVE (border/text `signal`, amber pulse dot), BUFFERING (`chart-ink-dim` border, no pulse), PAUSED (`chart-ink-dim`), SIGNAL LOST (`danger` border/text). Below the action row, when `hasError`, a `text-danger` line with the store `error` text. Play button: 40×40 (`w-10 h-10`), idle = `border-chart-ink-dim text-chart-ink hover:border-signal hover:text-signal`, live = `bg-signal text-chart-bg border-signal`. Secondary buttons (log/share/inspect) `w-10 h-10`. Class translation applied throughout the file (mechanical): `text-vdu-green-bright`→`text-chart-ink-bright`, `text-vdu-green-dim`→`text-chart-ink-dim`, `text-vdu-green`→`text-chart-ink`, `border-vdu-green-dim`→`border-chart-line`, `border-vdu-green`→`border-chart-ink-dim`, `bg-radio-dark`→`bg-chart-panel`, `text-accent-cyan`/`bg-accent-cyan`→`text-signal`/`bg-signal` (live pulse only), `phosphor`→`ink-glow`. Inline `hsla(120 …)` glows → `hsl(36 95% 58% / …)` on live elements only, `hsl(215 …)` ink washes otherwise. Add the locator to the card's top metadata row: `<span>{getLocator(station)}</span>` before BAND, styled like its siblings.

- [ ] **Step 3: Now-playing bar** — same class translation. Status chip: `error ? 'SIGNAL LOST' : isLoading ? 'BUFFERING' : isPlaying ? 'LIVE' : 'PAUSED'` — pull `isLoading` from the store; LIVE = `text-signal` + amber pulse dot, SIGNAL LOST = `text-danger` + coral dot, else dim. Error line under the callsign in `text-danger`. Controls `w-10 h-10`. On `<sm`, exactly one visualizer (keep `bars`, drop the stacked `trace`); dBFS readout stays `md+`. Play/stop primary button = `bg-signal text-chart-bg border-signal` with `hsl(36 95% 58% / 0.4)` glow.

- [ ] **Step 4: Verify in browser** — SCAN tab: tune a station → LIVE badge amber, bar shows LIVE + amber play button; pause → PAUSED; pick a dead stream (FILTER an obscure country and try candidates, or temporarily point a station's URL at `https://invalid.example/stream` via devtools request blocking) → SIGNAL LOST in coral on card and bar with error line. 390px width: single visualizer, all targets ≥40px. `npm run check` passes.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(atlas): card/bar playback states, 40px targets, region locator"`

---

### Task 7: Full-surface sweep + legacy token removal

**Files:**
- Modify: `components/discovery-list.tsx`, `components/bookmark-list.tsx`, `components/search-sidebar.tsx`, `components/fullscreen-station.tsx`, `components/share-menu.tsx`, `components/audio-visualizer.tsx`, `app/page.tsx`, `app/privacy/page.tsx`, `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`

**Interfaces:** none new — mechanical translation with these rules:

| Legacy | Atlas |
| --- | --- |
| `text-vdu-green-bright` | `text-chart-ink-bright` |
| `text-vdu-green-dim` / `text-text-muted` | `text-chart-ink-dim` |
| `text-vdu-green` | `text-chart-ink` |
| `text-vdu-green-faint` | `text-chart-line` |
| `border-vdu-green-bright` | `border-chart-ink-bright` |
| `border-vdu-green` | `border-chart-ink-dim` |
| `border-vdu-green-dim` / `border-hairline` | `border-chart-line` |
| `bg-radio-black` / `bg-black` | `bg-chart-bg` |
| `bg-radio-dark` | `bg-chart-panel` |
| `bg-radio-panel` | `bg-chart-panel-2` |
| `bg-vdu-green*` washes (`/10` etc.) | `bg-chart-ink/[0.06]` |
| `text-accent-cyan` / `bg-accent-cyan` / `border-accent-cyan*` | `signal` equivalents — ONLY where marking live signal / visualizer hot; otherwise `chart-ink-bright` |
| `.phosphor` | `.ink-glow` (brand/active text) |
| `.glow` | `.ink-glow` |
| inline `hsla(120,…)` | `hsl(215 30% 24% / …)` ink washes; `hsl(36 95% 58% / …)` only on live/primary-play |
| inline `hsla(180,…)` (cyan) | `hsl(36 95% 58% / …)` if live-signal, else drop |

- [ ] **Step 1: Sweep each file** with the table (audit every `accent-cyan` use against the amber-scarcity rule — RX pulse and visualizer trace cursor/waterfall hot-end become amber; anything decorative becomes ink). In `audio-visualizer.tsx` update the hardcoded canvas colors: bars base `rgba(147,170,200,0.55)` (ink), hot bars + waterfall hot end `rgba(255,170,60,0.9)` (amber), trace stroke `hsl(var(--chart-ink))` / cursor `hsl(var(--signal))`, canvas bg `rgba(6,10,18,0.5)`; `waterfallColor` ramp: transparent → deep navy → slate → pale ink → amber. In `app/layout.tsx` remove the VT323 font import/variable (grep `VT323` and `--font-display` usages first; `.font-display` in globals now falls back to mono). In `app/page.tsx` update header/nav chrome and NFO tab body copy chrome (copy text itself unchanged).

- [ ] **Step 2: Remove legacy aliases** — delete the legacy alias block from `globals.css` (`--vdu-*`, `--radio-*`, `--accent-cyan`, `--text-muted`, `--hairline`, `.phosphor`, `.glow`, `.text-vdu-*`, `.bg-radio-*`, `.border-vdu-*`, `.border-hairline`) and the legacy names from `tailwind.config.ts`.

- [ ] **Step 3: Prove nothing references legacy names** — Run:

```bash
grep -rn "vdu-green\|radio-black\|radio-dark\|radio-panel\|accent-cyan\|text-muted\|phosphor\|\bglow\b\|hairline\|VT323" app components lib --include='*.tsx' --include='*.ts' --include='*.css' | grep -v node_modules
```

Expected: zero hits (adjust any stragglers). Then `npm run check` — build fails on any missed Tailwind class, which is the drift guard here.

- [ ] **Step 4: Update `CLAUDE.md` design-system paragraph** — replace the Listening Post color-discipline paragraph with the Signal Atlas one (amber scarce, tokens list, spec path `docs/superpowers/specs/2026-07-09-signal-atlas-design.md`).

- [ ] **Step 5: Verify in browser** — every tab (ATLAS/SCAN/FILTER/LOG/NFO) + privacy page + fullscreen station + share popover: coherent night-chart look, amber only on live/primary-play/visualizer-hot. Screenshots at desktop + 390px.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(atlas): sweep all surfaces to night-chart tokens, retire green CRT"`

---

### Task 8: Final verification + deploy

**Files:** none (verification only)

- [ ] **Step 1:** `npm test && npm run check` — all pass.
- [ ] **Step 2:** Playwright click-through: landing = atlas; tap dot → callout → TUNE IN → LIVE rings; SCAN → country diversity visible (≤2 per country); play/pause/SIGNAL LOST states; LOG bookmark persists across reload; FILTER search bypasses diversity (search a specific country, page can be 100% that country); deep link `/?station=<uuid>` still plays; mobile 390px pass of all tabs.
- [ ] **Step 3:** Diversity API assertions from Task 2 Step 6 re-run against the dev server.
- [ ] **Step 4:** Push to main; after Vercel deploy, verify production: atlas renders, a station plays (https streams only), `x-vercel-ip-country` downrank observable (home country ≤1 on first SCAN page).
- [ ] **Step 5:** Report before/after: default-feed country count per page, and confirm zero mixed-content console errors in production.
