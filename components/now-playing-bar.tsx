import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
import { Stop, Play, Log, LogOn, Send, Inspect } from './icons';
import { getBand, getStationId, getCoords } from '@/lib/station-format';

export function NowPlayingBar({ onMaximize }: { onMaximize?: () => void }) {
  const { currentStation, isPlaying, isLoading, togglePlay, error } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!currentStation) return null;
  const bookmarked = isBookmarked(currentStation.stationuuid);
  const autoplayBlocked = error === 'Tap play to receive this signal.';
  const statusLabel = autoplayBlocked ? 'READY' : error ? 'SIGNAL LOST' : isLoading ? 'BUFFERING' : isPlaying ? 'LIVE' : 'PAUSED';
  const statusIsLive = statusLabel === 'LIVE';

  return (
    <div
      className="border-t border-chart-line bg-chart-panel-2 px-3 sm:px-4 pt-2.5 sm:pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      style={{ boxShadow: '0 -4px 22px hsl(215 40% 12% / 0.6)' }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(160px,320px)_auto] items-center gap-3 sm:gap-4">
        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-chart-ink-dim mb-0.5">
            <span>► Signal</span>
            <span className="text-chart-ink">ID&nbsp;{getStationId(currentStation)}</span>
            <span className="hidden sm:inline">·&nbsp;BAND&nbsp;{getBand(currentStation)}</span>
            <span className="hidden md:inline">·&nbsp;{getCoords(currentStation)}</span>
            <span className={`ml-auto inline-flex items-center gap-1.5 ${statusIsLive || autoplayBlocked ? 'text-signal' : error ? 'text-danger' : 'text-chart-ink-dim'}`}>
              <span className={`w-1.5 h-1.5 ${statusIsLive || autoplayBlocked ? 'bg-signal animate-pulse' : error ? 'bg-danger' : 'bg-chart-ink-dim opacity-40'}`} />
              {statusLabel}
            </span>
          </div>
          <div className={`font-bold text-[13px] sm:text-sm uppercase tracking-wide truncate ${statusIsLive ? 'text-chart-ink-bright signal-glow' : 'text-chart-ink-bright'}`}>
            {currentStation.name}
          </div>
          {error && (
            <p className={`text-[10px] truncate mt-0.5 ${autoplayBlocked ? 'text-chart-ink-dim' : 'text-danger'}`}>
              {autoplayBlocked ? '►' : '⚠'} {error}
            </p>
          )}
        </div>

        {/* sm+: single visualizer + dBFS on md+ */}
        <div className="hidden sm:grid grid-cols-[1fr_auto] items-center gap-2 min-w-0">
          <AudioVisualizer mode="bars" height={28} />
          <div className="hidden md:block text-right">
            <AudioVisualizer mode="dbfs" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-1 sm:gap-1.5">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Stop' : 'Play'}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-signal text-chart-bg border border-signal flex items-center justify-center"
            style={{ boxShadow: '0 0 8px hsl(36 95% 58% / 0.4)' }}
          >
            {isPlaying ? <Stop size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={() => toggleBookmark(currentStation)}
            aria-label={bookmarked ? 'Remove from log' : 'Log contact'}
            className={`w-9 h-9 sm:w-10 sm:h-10 border flex items-center justify-center transition-colors ${
              bookmarked
                ? 'border-chart-ink text-chart-ink-bright bg-chart-ink/[0.06]'
                : 'border-chart-line text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim'
            }`}
          >
            {bookmarked ? <LogOn size={12} /> : <Log size={12} />}
          </button>
          <ShareMenu
            station={currentStation}
            iconClassName="w-9 h-9 sm:w-10 sm:h-10 border border-chart-line text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim flex items-center justify-center transition-colors"
            trigger={<Send size={12} />}
          />
          {onMaximize && (
            <button
              onClick={onMaximize}
              aria-label="Inspect"
              className="w-9 h-9 sm:w-10 sm:h-10 border border-chart-line text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim flex items-center justify-center transition-colors"
            >
              <Inspect size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: single bars visualizer */}
      <div className="sm:hidden mt-2 min-w-0">
        <AudioVisualizer mode="bars" height={22} />
      </div>
    </div>
  );
}
