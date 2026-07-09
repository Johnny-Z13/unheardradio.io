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
  state: 'idle' | 'hover' | 'armed' | 'playing'
}

const topo = worldTopo as unknown as Topology<{ land: GeometryCollection }>
const land = feature(topo, topo.objects.land)
const graticule = geoGraticule10()

const INK = {
  lineFaint: 'hsl(215 30% 24% / 0.35)',
  land: 'hsl(215 38% 9%)',
  coast: 'hsl(215 25% 32%)',
  dot: 'hsl(210 25% 78% / 0.85)',
  dotApprox: 'hsl(210 25% 78% / 0.45)',
  signal: 'hsl(36 95% 58%)',
}

/** Shared projection math so hit-testing and drawing always agree. */
export function createProjector() {
  const projection = geoNaturalEarth1()
  let fitW = 0
  let fitH = 0
  let baseScale = 150
  let baseTx = 0
  let baseTy = 0

  function fit(view: View) {
    if (view.w !== fitW || view.h !== fitH) {
      projection.scale(150).translate([0, 0])
      projection.fitExtent([[8, 8], [view.w - 8, view.h - 8]], land)
      fitW = view.w
      fitH = view.h
      baseScale = projection.scale()
      ;[baseTx, baseTy] = projection.translate()
    }
    // Zoom about the viewport centre, then apply pan.
    projection.scale(baseScale * view.k)
    projection.translate([
      view.w / 2 + (baseTx - view.w / 2) * view.k + view.x,
      view.h / 2 + (baseTy - view.h / 2) * view.k + view.y,
    ])
  }

  function project(lng: number, lat: number, view: View): [number, number] {
    fit(view)
    return (projection([lng, lat]) as [number, number] | null) ?? [-9999, -9999]
  }

  return { projection, fit, project }
}
export type Projector = ReturnType<typeof createProjector>

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const projector = createProjector()
  const path = geoPath(projector.projection, ctx)

  function draw(view: View, signals: Signal[], now: number, sweepStart: number) {
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(view.w * dpr) || canvas.height !== Math.round(view.h * dpr)) {
      canvas.width = Math.round(view.w * dpr)
      canvas.height = Math.round(view.h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, view.w, view.h)
    projector.fit(view)

    ctx.beginPath()
    path(graticule)
    ctx.strokeStyle = INK.lineFaint
    ctx.lineWidth = 0.5
    ctx.stroke()

    ctx.beginPath()
    path(land)
    ctx.fillStyle = INK.land
    ctx.fill()
    ctx.strokeStyle = INK.coast
    ctx.lineWidth = 0.75
    ctx.stroke()

    const sweepAge = now - sweepStart
    if (sweepAge >= 0 && sweepAge < 1200) {
      const angle = (sweepAge / 1200) * Math.PI * 2 - Math.PI / 2
      const cx = view.w / 2
      const cy = view.h / 2
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

    for (const s of signals) {
      const p = projector.projection([s.lng, s.lat]) as [number, number] | null
      if (!p) continue
      const [px, py] = p
      if (px < -20 || py < -20 || px > view.w + 20 || py > view.h + 20) continue
      if (s.state === 'playing') {
        // expanding amber rings, 1.8s cycle, two phases
        const t = (now % 1800) / 1800
        for (const phase of [t, (t + 0.5) % 1]) {
          ctx.beginPath()
          ctx.arc(px, py, 4 + phase * 22, 0, Math.PI * 2)
          ctx.strokeStyle = `hsl(36 95% 58% / ${(0.5 * (1 - phase)).toFixed(3)})`
          ctx.lineWidth = 1.25
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = INK.signal
        ctx.fill()
      } else if (s.state === 'hover' || s.state === 'armed') {
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = INK.signal
        ctx.fill()
        if (s.state === 'armed') {
          ctx.beginPath()
          ctx.arc(px, py, 7, 0, Math.PI * 2)
          ctx.strokeStyle = 'hsl(36 95% 58% / 0.4)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      } else {
        ctx.beginPath()
        ctx.arc(px, py, s.approx ? 1.5 : 2, 0, Math.PI * 2)
        ctx.fillStyle = s.approx ? INK.dotApprox : INK.dot
        ctx.fill()
      }
    }
  }

  return { draw, project: projector.project, destroy: () => { /* nothing retained */ } }
}
export type AtlasRenderer = ReturnType<typeof createRenderer>
