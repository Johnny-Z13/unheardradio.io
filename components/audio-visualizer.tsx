'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudioStore } from '@/lib/audio-store'

type Mode = 'trace' | 'waterfall' | 'dbfs' | 'bars'

interface AudioVisualizerProps {
  mode?: Mode
  height?: number
  width?: number
}

const SAMPLES = 50

export function AudioVisualizer({ mode = 'trace', height = 28, width }: AudioVisualizerProps) {
  const { isPlaying, currentStation, getFrequencyData } = useAudioStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const traceRef = useRef<SVGPathElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const cursorRef = useRef<SVGLineElement>(null)

  const rafRef = useRef<number>()
  const prevPathRef = useRef<string>('')
  const phaseRef = useRef(0)

  const [readout, setReadout] = useState<{ peak: number; avg: number }>({ peak: -60, avg: -60 })

  // Reset animation state when stopping.
  useEffect(() => {
    if (!isPlaying || !currentStation) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      prevPathRef.current = ''
    }
  }, [isPlaying, currentStation])

  // Animation loop
  useEffect(() => {
    const tick = () => {
      const w = svgRef.current?.clientWidth || width || 280
      const h = height
      const bytes = getSignalBytes(getFrequencyData())

      if (mode === 'trace') {
        const path = bytes
          ? buildTraceFromBytes(bytes, w, h)
          : buildSyntheticTrace(w, h, phaseRef.current, isPlaying)
        traceRef.current?.setAttribute('d', path)
        trailRef.current?.setAttribute('d', prevPathRef.current)
        prevPathRef.current = path
        phaseRef.current += isPlaying ? 0.06 : 0.015
      } else if (mode === 'dbfs' && bytes) {
        let max = 0
        let sum = 0
        for (let i = 0; i < bytes.length; i++) {
          if (bytes[i] > max) max = bytes[i]
          sum += bytes[i]
        }
        const avg = sum / bytes.length
        // Map 0..255 to roughly -60..0 dBFS
        const peakDb = max === 0 ? -60 : 20 * Math.log10(max / 255)
        const avgDb = avg === 0 ? -60 : 20 * Math.log10(avg / 255)
        setReadout({ peak: peakDb, avg: avgDb })
      } else if (mode === 'waterfall' && canvasRef.current && bytes) {
        drawWaterfall(canvasRef.current, bytes)
      } else if (mode === 'waterfall' && canvasRef.current) {
        drawSyntheticWaterfall(canvasRef.current, phaseRef.current)
        phaseRef.current += isPlaying ? 0.08 : 0.02
      } else if (mode === 'bars' && canvasRef.current && bytes) {
        drawBars(canvasRef.current, bytes, isPlaying)
      } else if (mode === 'bars' && canvasRef.current) {
        drawSyntheticBars(canvasRef.current, phaseRef.current, isPlaying)
        phaseRef.current += isPlaying ? 0.08 : 0.02
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [mode, height, width, isPlaying, getFrequencyData])

  if (mode === 'dbfs') {
    return (
      <div className="text-[11px] tracking-[0.08em] uppercase text-chart-ink-dim whitespace-nowrap">
        Peak <span className="text-chart-ink-bright">{readout.peak.toFixed(1)}</span> dBFS
        <span className="opacity-50 px-1.5">·</span>
        Avg <span className="text-chart-ink-bright">{readout.avg.toFixed(1)}</span>
      </div>
    )
  }

  if (mode === 'waterfall' || mode === 'bars') {
    return (
      <canvas
        ref={canvasRef}
        width={512}
        height={height}
        className="w-full block"
        style={{ background: 'rgba(6,10,18,0.5)', height }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full border border-chart-line/50 overflow-hidden"
      style={{ height, background: 'rgba(6,10,18,0.5)' }}
    >
      <svg ref={svgRef} viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" className="w-full h-full block">
        <line x1="0" y1={height / 2} x2="600" y2={height / 2} stroke="hsl(var(--chart-line))" strokeWidth="0.5" />
        <line x1="0" y1={height / 4} x2="600" y2={height / 4} stroke="hsl(var(--chart-line))" strokeWidth="0.5" />
        <line x1="0" y1={(height * 3) / 4} x2="600" y2={(height * 3) / 4} stroke="hsl(var(--chart-line))" strokeWidth="0.5" />
        <path ref={trailRef} fill="none" stroke="hsl(var(--chart-ink))" strokeWidth="1" opacity="0.25" />
        <path ref={traceRef} fill="none" stroke="hsl(var(--chart-ink-bright))" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 2px hsl(210 40% 94% / 0.5))' }} />
        <line ref={cursorRef} x1="600" y1="0" x2="600" y2={height} stroke="hsl(var(--signal))" strokeWidth="0.8" opacity="0.7" />
      </svg>
    </div>
  )
}

function getSignalBytes(bytes: Uint8Array | null): Uint8Array | null {
  if (!bytes) return null

  let max = 0
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > max) max = bytes[i]
  }

  // Some streams play but cannot be inspected because they do not provide
  // cross-origin audio data. Treat all-zero output as unavailable signal data.
  return max > 1 ? bytes : null
}

function buildTraceFromBytes(bytes: Uint8Array, width: number, height: number): string {
  const center = height / 2
  const len = SAMPLES
  const step = bytes.length / len
  const parts: string[] = []
  for (let i = 0; i <= len; i++) {
    const x = (i / len) * 600
    const v = bytes[Math.floor(i * step)] || 0
    const norm = (v / 255) - 0.5
    const y = center + norm * height * 0.85
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return parts.join(' ')
}

function buildSyntheticTrace(width: number, height: number, phase: number, active: boolean): string {
  const center = height / 2
  const amp = active ? height * 0.35 : height * 0.05
  const len = SAMPLES
  const parts: string[] = []
  for (let i = 0; i <= len; i++) {
    const x = (i / len) * 600
    const t = phase + i * 0.4
    const y = center
      + Math.sin(t) * amp * 0.5
      + Math.sin(t * 1.7) * amp * 0.25
      + Math.sin(t * 0.3 + i * 0.2) * amp * 0.15
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return parts.join(' ')
}

function drawWaterfall(canvas: HTMLCanvasElement, bytes: Uint8Array) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  // Shift everything down 1px
  const img = ctx.getImageData(0, 0, w, h - 1)
  ctx.putImageData(img, 0, 1)
  // Draw new top row
  const row = ctx.createImageData(w, 1)
  for (let x = 0; x < w; x++) {
    const idx = Math.floor((x / w) * bytes.length)
    const v = bytes[idx] / 255
    const [r, g, b, a] = waterfallColor(v)
    const off = x * 4
    row.data[off] = r
    row.data[off + 1] = g
    row.data[off + 2] = b
    row.data[off + 3] = a
  }
  ctx.putImageData(row, 0, 0)
}

function drawSyntheticWaterfall(canvas: HTMLCanvasElement, phase: number) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const img = ctx.getImageData(0, 0, w, h - 1)
  ctx.putImageData(img, 0, 1)
  const row = ctx.createImageData(w, 1)
  for (let x = 0; x < w; x++) {
    const t = phase + x * 0.04
    let v = 0.2 + Math.sin(t) * 0.15 + Math.sin(t * 2.3) * 0.1 + Math.sin(t * 0.31) * 0.1
    v += (Math.random() - 0.5) * 0.05
    v = Math.max(0, Math.min(1, v))
    const [r, g, b, a] = waterfallColor(v)
    const off = x * 4
    row.data[off] = r
    row.data[off + 1] = g
    row.data[off + 2] = b
    row.data[off + 3] = a
  }
  ctx.putImageData(row, 0, 0)
}

function drawBars(canvas: HTMLCanvasElement, bytes: Uint8Array, active: boolean) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const bars = 42
  const gap = 2
  const barW = (w - gap * (bars - 1)) / bars

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(6,10,18,0.65)'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < bars; i++) {
    const start = Math.floor((i / bars) * bytes.length)
    const end = Math.floor(((i + 1) / bars) * bytes.length)
    let sum = 0
    for (let j = start; j < end; j++) sum += bytes[j] || 0
    const level = Math.pow(sum / Math.max(1, end - start) / 255, 0.72)
    const barH = Math.max(active ? 2 : 1, level * h)
    const x = i * (barW + gap)
    const y = h - barH
    const hot = level > 0.72

    ctx.fillStyle = hot ? 'rgba(255,170,60,0.9)' : 'rgba(147,170,200,0.55)'
    ctx.fillRect(x, y, barW, barH)

    if (hot) {
      ctx.fillStyle = 'rgba(255,170,60,0.22)'
      ctx.fillRect(x, Math.max(0, y - 3), barW, 2)
    }
  }
}

function drawSyntheticBars(canvas: HTMLCanvasElement, phase: number, active: boolean) {
  const synthetic = new Uint8Array(128)
  const base = active ? 48 : 12
  const swing = active ? 90 : 12

  for (let i = 0; i < synthetic.length; i++) {
    const t = phase + i * 0.15
    const envelope = Math.max(0, 1 - i / synthetic.length)
    synthetic[i] = Math.max(0, Math.min(255, base + swing * envelope * (
      Math.sin(t) * 0.45 + Math.sin(t * 0.37 + 1.8) * 0.35 + Math.random() * 0.18
    )))
  }

  drawBars(canvas, synthetic, active)
}

function waterfallColor(v: number): [number, number, number, number] {
  // Ramp: faint → dim → ink → bright → amber
  if (v < 0.05) return [0, 0, 0, 0]
  if (v < 0.2) return [20, 30, 50, 180]
  if (v < 0.5) return [60, 80, 110, 210]
  if (v < 0.8) return [150, 170, 200, 230]
  return [255, 170, 60, 240]
}
