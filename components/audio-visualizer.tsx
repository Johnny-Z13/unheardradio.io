'use client'

import { useEffect, useRef } from 'react'
import { useAudioStore } from '@/lib/audio-store'

type Mode = 'trace' | 'waterfall' | 'bars'

/** Decorative audio activity only. Silence and unavailable analyser data stay quiet. */
export function AudioVisualizer({ mode = 'trace', height = 28, width = 600, stationUuid }: { mode?: Mode; height?: number; width?: number; stationUuid?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isPlaying = useAudioStore((s) => s.isPlaying && (!stationUuid || stationUuid === s.currentStation?.stationuuid))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const tokens = getComputedStyle(document.documentElement)
    const color = (name: string, alpha = 1) => `hsl(${tokens.getPropertyValue(`--${name}`).trim()} / ${alpha})`
    const palette = { background: color('chart-panel'), line: color('chart-line'), ink: color('chart-ink'), signal: color('signal') }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let lastFrame = 0
    const draw = (time: number) => {
      if (time - lastFrame >= 50 || !isPlaying || motion.matches) {
        lastFrame = time
        const bytes = isPlaying ? useAudioStore.getState().getFrequencyData() : null
        if (mode === 'waterfall' && bytes) {
          ctx.drawImage(canvas, 0, 0, width, height - 1, 0, 1, width, height - 1)
          for (let x = 0; x < width; x++) {
            const level = bytes[Math.floor(x / width * bytes.length)] / 255
            ctx.fillStyle = level > 0.7 ? palette.signal : level > 0.3 ? palette.ink : level > 0.1 ? palette.line : palette.background
            ctx.fillRect(x, 0, 1, 1)
          }
        } else {
          ctx.clearRect(0, 0, width, height)
          if (mode === 'trace' && bytes) {
            ctx.beginPath()
            for (let i = 0; i < bytes.length; i++) {
              const x = i / (bytes.length - 1) * width
              const y = height - bytes[i] / 255 * height
              if (i === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.strokeStyle = palette.ink
            ctx.stroke()
          } else {
            const bars = 42
            const gap = 3
            const barWidth = width / bars - gap
            for (let i = 0; i < bars; i++) {
              const level = bytes ? bytes[Math.floor(i / bars * bytes.length)] / 255 : 0
              const barHeight = Math.max(1, level * height)
              ctx.fillStyle = level > 0.7 ? palette.signal : level > 0 ? palette.ink : palette.line
              ctx.fillRect(i * width / bars, height - barHeight, barWidth, barHeight)
            }
          }
        }
      }
      if (isPlaying && !motion.matches) frame = requestAnimationFrame(draw)
    }
    const restart = () => { cancelAnimationFrame(frame); lastFrame = -Infinity; draw(performance.now()) }
    motion.addEventListener('change', restart)
    restart()
    return () => { cancelAnimationFrame(frame); motion.removeEventListener('change', restart) }
  }, [mode, height, width, isPlaying])

  return <canvas ref={canvasRef} width={width} height={height} className="block w-full" style={{ height }} aria-hidden="true" />
}
