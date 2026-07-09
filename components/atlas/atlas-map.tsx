'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RadioStation } from '@/types/radio'
import { fetchStations } from '@/lib/radio-api'
import { useAudioStore } from '@/lib/audio-store'
import { createRenderer, createProjector, type Signal, type View } from './atlas-render'
import { AtlasCallout } from './atlas-callout'
import centroids from '@/lib/geo/country-centroids.json'

const CENTROIDS = centroids as Record<string, { lat: number; lng: number; region: string }>

export interface Placed { station: RadioStation; lng: number; lat: number; approx: boolean }

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

interface AtlasState {
  placed: Placed[]
  view: View
  hover: string | null
  currentUuid: string | null
  isPlaying: boolean
  sweepStart: number
}

export default function AtlasMap({ onStationSelect }: { onStationSelect: (s: RadioStation) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [seed, setSeed] = useState('atlas-1')
  const [selected, setSelected] = useState<Placed | null>(null)
  const [plottedCount, setPlottedCount] = useState(0)
  const currentStation = useAudioStore((s) => s.currentStation)
  const isPlaying = useAudioStore((s) => s.isPlaying)
  const tuneStation = useAudioStore((s) => s.tuneStation)

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['/api/stations', 'atlas', seed],
    queryFn: () => fetchStations({ listenerFilter: 'low-to-high', limit: 400, offset: 0, randomSeed: seed }),
    staleTime: 5 * 60 * 1000,
  })

  // Mutable render inputs — written by React, read by the rAF loop.
  const stateRef = useRef<AtlasState>({
    placed: [], view: { k: 1, x: 0, y: 0, w: 300, h: 300 }, hover: null, currentUuid: null, sweepStart: -10000, isPlaying: false,
  })
  stateRef.current.currentUuid = currentStation?.stationuuid ?? null
  stateRef.current.isPlaying = isPlaying

  useEffect(() => {
    // The tuned station is always plotted, even when it came from the SCAN
    // feed or a deep link rather than this sweep's pool.
    const placed = placeStations(stations)
    if (currentStation && !placed.some((p) => p.station.stationuuid === currentStation.stationuuid)) {
      placed.push(...placeStations([currentStation]))
    }
    stateRef.current.placed = placed
    setPlottedCount(placed.length)
  }, [stations, currentStation])

  useEffect(() => {
    if (stations.length > 0) stateRef.current.sweepStart = performance.now()
  }, [stations])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const renderer = createRenderer(canvas)
    let raf = 0
    const loop = (now: number) => {
      const st = stateRef.current
      const signals: Signal[] = st.placed.map((p) => ({
        uuid: p.station.stationuuid,
        lng: p.lng,
        lat: p.lat,
        approx: p.approx,
        state: p.station.stationuuid === st.currentUuid
          ? (st.isPlaying ? 'playing' : 'armed')
          : p.station.stationuuid === st.hover ? 'hover' : 'idle',
      }))
      renderer.draw(st.view, signals, now, st.sweepStart)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect()
      stateRef.current.view.w = Math.max(1, r.width)
      stateRef.current.view.h = Math.max(1, r.height)
    })
    ro.observe(wrap)

    return () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.destroy() }
  }, [])

  // Pointer: pan / wheel-zoom / pinch / hover / tap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const projector = createProjector()
    const pointers = new Map<number, { x: number; y: number }>()
    let dragged = false
    let pinchDist = 0

    // Canvas-local coordinates from client coords — offsetX/Y is unreliable
    // for synthetic events and after event retargeting.
    const pt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

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
        const [px, py] = projector.project(p.lng, p.lat, st.view)
        const d = (px - x) ** 2 + (py - y) ** 2
        if (d < bestD) { bestD = d; best = p }
      }
      return best
    }

    const onDown = (e: PointerEvent) => {
      try { canvas.setPointerCapture(e.pointerId) } catch { /* synthetic pointer */ }
      pointers.set(e.pointerId, pt(e))
      dragged = false
      if (pointers.size === 2) {
        const pts = Array.from(pointers.values())
        pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      }
    }
    const onMove = (e: PointerEvent) => {
      const st = stateRef.current
      if (pointers.has(e.pointerId)) {
        const prev = pointers.get(e.pointerId)!
        const cur = pt(e)
        const dx = cur.x - prev.x
        const dy = cur.y - prev.y
        pointers.set(e.pointerId, cur)
        if (pointers.size === 1) {
          if (Math.abs(dx) + Math.abs(dy) > 2) dragged = true
          st.view.x += dx
          st.view.y += dy
          clamp(st.view)
        } else if (pointers.size === 2) {
          const pts = Array.from(pointers.values())
          const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
          if (pinchDist > 0) { st.view.k *= d / pinchDist; clamp(st.view) }
          pinchDist = d
          dragged = true
        }
      } else {
        const cur = pt(e)
        st.hover = nearest(cur.x, cur.y)?.station.stationuuid ?? null
        canvas.style.cursor = st.hover ? 'pointer' : 'grab'
      }
    }
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (!dragged) {
        const cur = pt(e)
        const hit = nearest(cur.x, cur.y)
        setSelected(hit)
        // Tapping a node tunes it: it becomes the current (armed) station,
        // so the player bar's PLAY starts this signal, not the previous one.
        if (hit) tuneStation(hit.station)
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
      <div className="absolute top-3 left-3 flex items-center gap-3 text-[10px] tracking-[0.14em] uppercase text-chart-ink-dim pointer-events-none">
        <span className="text-chart-ink-bright">// SIGNAL ATLAS</span>
        <span>{plottedCount} signals plotted</span>
        {isLoading && <span>sweeping…</span>}
      </div>
      <button
        onClick={() => { setSelected(null); setSeed(`atlas-${Date.now().toString(36)}`) }}
        className="absolute top-3 right-3 border border-chart-line bg-chart-bg/70 px-2.5 py-2 text-[10px] tracking-[0.14em] uppercase text-chart-ink hover:text-chart-ink-bright hover:border-chart-ink-dim transition-colors"
      >
        RESWEEP
      </button>
      {selected && (
        <AtlasCallout
          placed={selected}
          onTune={() => onStationSelect(selected.station)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
