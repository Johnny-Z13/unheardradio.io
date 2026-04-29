'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudioStore } from '@/lib/audio-store'

type Mode = 'trace' | 'waterfall' | 'dbfs'

interface AudioVisualizerProps {
  mode?: Mode
  height?: number
  width?: number
}

const SAMPLES = 50

export function AudioVisualizer({ mode = 'trace', height = 28, width }: AudioVisualizerProps) {
  const { isPlaying, currentStation } = useAudioStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const traceRef = useRef<SVGPathElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const cursorRef = useRef<SVGLineElement>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const rafRef = useRef<number>()
  const prevPathRef = useRef<string>('')
  const phaseRef = useRef(0)

  const [readout, setReadout] = useState<{ peak: number; avg: number }>({ peak: -60, avg: -60 })

  // Audio graph setup
  useEffect(() => {
    let cancelled = false
    if (!isPlaying || !currentStation || analyserRef.current) return

    const t = setTimeout(() => {
      if (cancelled) return
      try {
        const audio = document.getElementById('main-audio-player') as HTMLAudioElement | null
        if (!audio || !audio.src || audio.paused) return

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        if (ctx.state === 'suspended') ctx.resume()
        const src = ctx.createMediaElementSource(audio)
        const ana = ctx.createAnalyser()
        ana.fftSize = 256
        ana.smoothingTimeConstant = 0.15
        ana.minDecibels = -80
        ana.maxDecibels = -20
        src.connect(ana)
        ana.connect(ctx.destination)
        audioContextRef.current = ctx
        sourceRef.current = src
        analyserRef.current = ana
        dataRef.current = new Uint8Array(new ArrayBuffer(ana.frequencyBinCount))
      } catch {
        // setup failed — animation will use synthetic fallback
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [isPlaying, currentStation])

  // Cleanup on unmount or when stopping
  useEffect(() => {
    if (!isPlaying || !currentStation) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { sourceRef.current?.disconnect() } catch { /* ignore */ }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close() } catch { /* ignore */ }
      }
      sourceRef.current = null
      analyserRef.current = null
      audioContextRef.current = null
      dataRef.current = null
      prevPathRef.current = ''
    }
  }, [isPlaying, currentStation])

  // Animation loop
  useEffect(() => {
    const tick = () => {
      const w = svgRef.current?.clientWidth || width || 280
      const h = height
      let bytes: Uint8Array | null = null

      if (analyserRef.current && dataRef.current) {
        analyserRef.current.getByteFrequencyData(dataRef.current)
        bytes = dataRef.current
      }

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
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [mode, height, width, isPlaying])

  if (mode === 'dbfs') {
    return (
      <div className="text-[11px] tracking-[0.08em] uppercase text-vdu-green-dim whitespace-nowrap">
        Peak <span className="text-vdu-green-bright">{readout.peak.toFixed(1)}</span> dBFS
        <span className="opacity-50 px-1.5">·</span>
        Avg <span className="text-vdu-green-bright">{readout.avg.toFixed(1)}</span>
      </div>
    )
  }

  if (mode === 'waterfall') {
    return (
      <canvas
        ref={canvasRef}
        width={512}
        height={height}
        className="w-full block"
        style={{ background: 'rgba(0, 18, 0, 0.5)', height }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full border border-hairline overflow-hidden"
      style={{ height, background: 'rgba(0, 18, 0, 0.5)' }}
    >
      <svg ref={svgRef} viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" className="w-full h-full block">
        <line x1="0" y1={height / 2} x2="600" y2={height / 2} stroke="hsl(var(--vdu-green-faint))" strokeWidth="0.5" />
        <line x1="0" y1={height / 4} x2="600" y2={height / 4} stroke="hsl(var(--vdu-green-faint))" strokeWidth="0.5" />
        <line x1="0" y1={(height * 3) / 4} x2="600" y2={(height * 3) / 4} stroke="hsl(var(--vdu-green-faint))" strokeWidth="0.5" />
        <path ref={trailRef} fill="none" stroke="hsl(var(--vdu-green))" strokeWidth="1" opacity="0.25" />
        <path ref={traceRef} fill="none" stroke="hsl(var(--vdu-green-bright))" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 2px hsla(120,100%,60%,0.7))' }} />
        <line ref={cursorRef} x1="600" y1="0" x2="600" y2={height} stroke="hsl(var(--accent-cyan))" strokeWidth="0.8" opacity="0.7" />
      </svg>
    </div>
  )
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
  const ctx = canvas.getContext('2d')
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
  const ctx = canvas.getContext('2d')
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

function waterfallColor(v: number): [number, number, number, number] {
  // Ramp: faint → dim → green → bright → cyan
  if (v < 0.05) return [0, 0, 0, 0]
  if (v < 0.2) return [10, 50, 10, 180]
  if (v < 0.5) return [20, 130, 30, 210]
  if (v < 0.8) return [40, 230, 60, 230]
  return [80, 255, 200, 240]
}
