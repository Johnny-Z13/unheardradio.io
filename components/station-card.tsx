import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { ShareMenu } from './share-menu';
import { Play, Stop, Log, LogOn, Inspect, Send } from './icons';
import { getBand, getStationId, getCoords, getOrigin, getRate, getUptime } from '@/lib/station-format';

interface StationCardProps {
  station: RadioStation;
  onMaximize?: () => void;
}

export function StationCard({ station, onMaximize }: StationCardProps) {
  const { playStation, currentStation, isPlaying, isLoading } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const isCurrent = currentStation?.stationuuid === station.stationuuid;
  const isLive = isCurrent && isPlaying;
  const isBuffering = isCurrent && isLoading;
  const bookmarked = isBookmarked(station.stationuuid);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(station);
  };

  return (
    <div
      className={`bg-radio-dark border border-hairline border-l-2 p-3 sm:p-4 mb-2.5 transition-colors ${
        isCurrent
          ? 'border-l-vdu-green-bright'
          : 'border-l-vdu-green-dim hover:border-l-vdu-green'
      }`}
      style={isCurrent ? {
        background: 'linear-gradient(90deg, hsla(120, 80%, 35%, 0.08) 0%, transparent 60%)',
        boxShadow: 'inset 2px 0 12px hsla(120, 100%, 50%, 0.10)',
      } : undefined}
    >
      {/* Row 1: callsign + top metadata */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <h3 className={`font-bold text-sm sm:text-[15px] uppercase tracking-wide truncate ${isCurrent ? 'text-vdu-green-bright phosphor' : 'text-vdu-green-bright'}`}>
            {station.name}
          </h3>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 border border-accent-cyan/40 bg-accent-cyan/10 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-accent-cyan whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-accent-cyan animate-pulse" />
              RX&nbsp;ACTIVE
            </span>
          )}
        </div>
        <div className="text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-vdu-green-dim text-right ml-auto whitespace-nowrap">
          BAND&nbsp;{getBand(station)}
          <span className="opacity-50 px-1.5">·</span>
          ID&nbsp;{getStationId(station)}
          <span className="hidden sm:inline">
            <span className="opacity-50 px-1.5">·</span>
            {getCoords(station)}
          </span>
        </div>
      </div>

      {/* Row 2: play + data + actions */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-center">
        <button
          onClick={() => playStation(station)}
          disabled={isBuffering}
          aria-label={isLive ? 'Stop' : 'Tune in'}
          className={`w-9 h-9 sm:w-10 sm:h-10 border flex items-center justify-center transition-colors ${
            isLive
              ? 'bg-vdu-green-bright text-radio-black border-vdu-green-bright'
              : 'border-vdu-green-dim text-vdu-green hover:border-vdu-green-bright hover:text-vdu-green-bright'
          } ${isBuffering ? 'animate-pulse' : ''}`}
          style={isLive ? { boxShadow: '0 0 10px hsla(120,100%,55%,0.4)' } : undefined}
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
          <span className="text-vdu-green-dim uppercase">Origin</span>
          <span className="text-vdu-green-dim uppercase">RX</span>
          <span className="text-vdu-green-dim uppercase hidden sm:inline">Rate</span>
          <span className="text-vdu-green-dim uppercase hidden sm:inline">Uptime</span>
          <span className="text-vdu-green truncate">{getOrigin(station)}</span>
          <span className="text-vdu-green">{station.clickcount || 0}</span>
          <span className="text-vdu-green hidden sm:inline">{getRate(station)}</span>
          <span className="text-vdu-green hidden sm:inline">{getUptime(station)}</span>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={handleBookmark}
            aria-label={bookmarked ? 'Remove from log' : 'Log contact'}
            className={`w-7 h-7 border flex items-center justify-center transition-colors ${
              bookmarked
                ? 'border-vdu-green text-vdu-green-bright bg-vdu-green/10'
                : 'border-hairline text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green-dim'
            }`}
          >
            {bookmarked ? <LogOn size={12} /> : <Log size={12} />}
          </button>
          <ShareMenu
            station={station}
            iconClassName="w-7 h-7 border border-hairline text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green-dim flex items-center justify-center"
            trigger={<Send size={12} />}
          />
          {onMaximize && (
            <button
              onClick={onMaximize}
              aria-label="Inspect station"
              className="w-7 h-7 border border-hairline text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green-dim flex items-center justify-center transition-colors"
            >
              <Inspect size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
