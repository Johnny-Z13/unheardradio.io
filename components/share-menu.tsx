'use client'

import { useEffect, useRef, useState } from 'react'
import { Send as SendIcon, Close } from '@/components/icons'
import { RadioStation } from '@/types/radio'
import { useToast } from '@/hooks/use-toast'

interface ShareMenuProps {
  station: RadioStation
  className?: string
  iconClassName?: string
  trigger?: React.ReactNode
}

function buildShareData(station: RadioStation) {
  const url = `${window.location.origin}/?station=${station.stationuuid}`
  const title = `${station.name} — Unheard Radio`
  const text = `Found with UnheardRadio.io: ${station.name}${station.country ? ` from ${station.country}` : ''}`
  return { url, title, text, full: `${text} — ${url}` }
}

export function ShareMenu({ station, className, iconClassName, trigger }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const data = buildShareData(station)

    // Mobile: try native share sheet first (gives WhatsApp/Telegram/etc natively)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.text, url: data.url })
        return
      } catch (err) {
        // User cancelled or share failed — fall through to menu
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    // Desktop or native share unavailable: open menu
    setOpen(v => !v)
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { full } = buildShareData(station)
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      toast({ title: 'Link copied', description: 'Share text copied to clipboard' })
      setTimeout(() => setCopied(false), 1500)
      setTimeout(() => setOpen(false), 600)
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not access clipboard',
        variant: 'destructive',
      })
    }
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  const { url, text, full } = open ? buildShareData(station) : { url: '', text: '', full: '' }

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ''}`}>
      <button
        onClick={handleClick}
        title="Share"
        className={iconClassName ?? 'w-7 h-7 rounded-full border border-chart-line text-chart-ink-dim hover:border-chart-ink-dim hover:text-chart-ink transition-all flex items-center justify-center'}
      >
        {trigger ?? <SendIcon size={12} />}
      </button>

      {open && (
        <div
          onClick={stop}
          role="menu"
          className="absolute right-0 top-full mt-2 z-[60] w-56 border border-chart-line bg-chart-panel-2 p-1 shadow-[0_4px_20px_hsl(215_30%_24%/0.12)]"
        >
          <div className="flex items-center justify-between px-2 py-1.5 text-[10px] tracking-[0.15em] uppercase text-chart-ink-dim border-b border-chart-line/50 mb-1">
            <span>// Send to</span>
            <button
              onClick={() => setOpen(false)}
              className="text-chart-ink-dim hover:text-chart-ink-bright"
              aria-label="Close share menu"
            >
              <Close size={10} />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-2 py-2 text-[11px] tracking-[0.05em] uppercase text-chart-ink hover:bg-chart-ink/[0.06] hover:text-chart-ink-bright transition-colors"
          >
            {copied ? <span className="font-display text-[14px] leading-none w-4">✓</span> : <span className="font-display text-[14px] leading-none w-4">⎘</span>}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(full)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-2 py-2 text-[11px] tracking-[0.05em] uppercase text-chart-ink hover:bg-chart-ink/[0.06] hover:text-chart-ink-bright transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="font-display text-[14px] leading-none w-4">W</span>
            <span>WhatsApp</span>
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-2 py-2 text-[11px] tracking-[0.05em] uppercase text-chart-ink hover:bg-chart-ink/[0.06] hover:text-chart-ink-bright transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="font-display text-[14px] leading-none w-4">T</span>
            <span>Telegram</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-2 py-2 text-[11px] tracking-[0.05em] uppercase text-chart-ink hover:bg-chart-ink/[0.06] hover:text-chart-ink-bright transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="font-display text-[14px] leading-none w-4">X</span>
            <span>X / Twitter</span>
          </a>

          <a
            href={`mailto:?subject=${encodeURIComponent(`${station.name} — Unheard Radio`)}&body=${encodeURIComponent(full)}`}
            className="w-full flex items-center gap-2 px-2 py-2 text-[11px] tracking-[0.05em] uppercase text-chart-ink hover:bg-chart-ink/[0.06] hover:text-chart-ink-bright transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="font-display text-[14px] leading-none w-4">@</span>
            <span>Email</span>
          </a>
        </div>
      )}
    </div>
  )
}
