'use client'

import { useAudioStore } from '@/lib/audio-store'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { ShareMenu } from '@/components/share-menu'
import { Play, Stop, Log, LogOn, Send } from '@/components/icons'
import { getBand, getStationId, getOrigin, getRate } from '@/lib/station-format'
import type { Placed } from './atlas-map'

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
        {approx && <span className="opacity-70"> · POSN APPROX</span>}
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
          trigger={<Send size={12} />}
        />
      </div>
    </div>
  )
}
