import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { ShareMenu } from './share-menu';
import { AudioVisualizer } from './audio-visualizer';
import { Play, Stop, Log, LogOn, Inspect, Send } from './icons';
import { getBand, getStationId, getCoords, getOrigin, getRate, getUptime } from '@/lib/station-format';
import { getLocator } from '@/lib/locator';

interface StationCardProps {
  station: RadioStation;
  onMaximize?: () => void;
}

export function StationCard({ station, onMaximize }: StationCardProps) {
  const { playStation, currentStation, isPlaying, isLoading, error } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const isCurrent = currentStation?.stationuuid === station.stationuuid;
  const isLive = isCurrent && isPlaying;
  const isBuffering = isCurrent && isLoading;
  const hasError = isCurrent && Boolean(error);
  const isPaused = isCurrent && !isPlaying && !isLoading && !hasError;
  const bookmarked = isBookmarked(station.stationuuid);
  const listenerCount = station.clickcount || 0;

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(station);
  };

  return (
    <div
      className={`relative bg-chart-panel border border-chart-line/50 border-l-2 p-3 sm:p-4 mb-2.5 transition-colors overflow-hidden ${
        isCurrent
          ? 'border-l-signal'
          : 'border-l-chart-line hover:border-l-chart-ink-dim'
      }`}
      style={isCurrent ? {
        background: 'linear-gradient(90deg, hsl(36 60% 40% / 0.06) 0%, transparent 60%)',
        boxShadow: 'inset 2px 0 12px hsl(36 95% 58% / 0.08)',
      } : undefined}
    >
      {isCurrent && (
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-px opacity-70 ${isLive ? 'bg-signal' : 'bg-chart-ink-dim'}`} />
      )}

      {/* Row 1: callsign + top metadata */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <h3 className={`font-bold text-sm sm:text-[15px] uppercase tracking-wide truncate ${isCurrent ? 'text-chart-ink-bright ink-glow' : 'text-chart-ink-bright'}`}>
            {station.name}
          </h3>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 border border-signal/40 bg-signal/10 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-signal whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-signal animate-pulse" />
              LIVE
            </span>
          )}
          {isBuffering && (
            <span className="inline-flex items-center gap-1.5 border border-chart-ink-dim/40 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-chart-ink-dim whitespace-nowrap">
              BUFFERING
            </span>
          )}
          {isPaused && (
            <span className="inline-flex items-center gap-1.5 border border-chart-ink-dim/30 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-chart-ink-dim whitespace-nowrap">
              PAUSED
            </span>
          )}
          {hasError && (
            <span className="inline-flex items-center gap-1.5 border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-danger whitespace-nowrap">
              SIGNAL&nbsp;LOST
            </span>
          )}
        </div>
        <div className="text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-chart-ink-dim text-right ml-auto whitespace-nowrap">
          {getLocator(station)}
          <span className="opacity-50 px-1.5">·</span>
          BAND&nbsp;{getBand(station)}
          <span className="opacity-50 px-1.5">·</span>
          ID&nbsp;{getStationId(station)}
          <span className="hidden sm:inline">
            <span className="opacity-50 px-1.5">·</span>
            {getCoords(station)}
          </span>
        </div>
      </div>

      {isCurrent && (
        <div className="mb-3 grid grid-cols-[1fr_auto] items-end gap-3">
          <AudioVisualizer mode="bars" height={22} />
          <div className={`hidden sm:block text-[10px] tracking-[0.14em] uppercase ${hasError ? 'text-danger' : isLive ? 'text-signal' : 'text-chart-ink-dim'}`}>
            {hasError ? 'Signal lost' : isBuffering ? 'Buffering' : isLive ? 'Live signal' : 'Paused'}
          </div>
        </div>
      )}

      {/* Row 2: play + data + actions */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-center">
        <button
          onClick={() => playStation(station)}
          disabled={isBuffering}
          aria-label={isLive ? 'Stop' : 'Tune in'}
          className={`w-10 h-10 border flex items-center justify-center transition-colors ${
            isLive
              ? 'bg-signal text-chart-bg border-signal'
              : 'border-chart-ink-dim text-chart-ink hover:border-signal hover:text-signal'
          } ${isBuffering ? 'animate-pulse' : ''}`}
          style={isLive ? { boxShadow: '0 0 10px hsl(36 95% 58% / 0.4)' } : undefined}
        >
          {isBuffering ? (
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isLive ? (
            <Stop size={14} />
          ) : (
            <Play size={14} />
          )}
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-0.5 text-[11px] tracking-[0.04em] min-w-0">
          <span className="text-chart-ink-dim uppercase">Origin</span>
          <span className="text-chart-ink-dim uppercase">Listeners</span>
          <span className="text-chart-ink-dim uppercase hidden sm:inline">Rate</span>
          <span className="text-chart-ink-dim uppercase hidden sm:inline">Uptime</span>
          <span className="text-chart-ink truncate">{getOrigin(station)}</span>
          <span className="text-chart-ink">{listenerCount.toLocaleString()}</span>
          <span className="text-chart-ink hidden sm:inline">{getRate(station)}</span>
          <span className="text-chart-ink hidden sm:inline">{getUptime(station)}</span>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={handleBookmark}
            aria-label={bookmarked ? 'Remove from log' : 'Log contact'}
            className={`w-10 h-10 border flex items-center justify-center transition-colors ${
              bookmarked
                ? 'border-chart-ink text-chart-ink-bright bg-chart-ink/[0.06]'
                : 'border-chart-line/50 text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim'
            }`}
          >
            {bookmarked ? <LogOn size={12} /> : <Log size={12} />}
          </button>
          <ShareMenu
            station={station}
            iconClassName="w-10 h-10 border border-chart-line/50 text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim flex items-center justify-center"
            trigger={<Send size={12} />}
          />
          {onMaximize && (
            <button
              onClick={onMaximize}
              aria-label="Inspect station"
              className="w-10 h-10 border border-chart-line/50 text-chart-ink-dim hover:text-chart-ink hover:border-chart-ink-dim flex items-center justify-center transition-colors"
            >
              <Inspect size={12} />
            </button>
          )}
        </div>
      </div>

      {hasError && (
        <p className="mt-2 text-[10px] tracking-[0.08em] uppercase text-danger truncate">
          {error}
        </p>
      )}
    </div>
  );
}
