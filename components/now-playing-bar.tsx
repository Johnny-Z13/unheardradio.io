import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
import { Stop, Play, Log, LogOn, Send, Inspect } from './icons';
import { getBand, getStationId, getCoords } from '@/lib/station-format';

export function NowPlayingBar({ onMaximize }: { onMaximize?: () => void }) {
  const { currentStation, isPlaying, togglePlay, error } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!currentStation) return null;
  const bookmarked = isBookmarked(currentStation.stationuuid);

  return (
    <div
      className="border-t border-vdu-green-dim bg-radio-panel px-3 sm:px-4 py-2 sm:py-3 grid items-center gap-3 sm:gap-4"
      style={{
        gridTemplateColumns: 'minmax(0, 1fr) auto auto',
        boxShadow: '0 -4px 20px hsla(120, 100%, 40%, 0.08)',
      }}
    >
      {/* Info + trace stack */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-vdu-green-dim mb-0.5">
          <span>► RX</span>
          <span className="text-accent-cyan">ID&nbsp;{getStationId(currentStation)}</span>
          <span className="hidden sm:inline">·&nbsp;BAND&nbsp;{getBand(currentStation)}</span>
          <span className="hidden md:inline">·&nbsp;{getCoords(currentStation)}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-accent-cyan">
            <span className={`w-1.5 h-1.5 bg-accent-cyan ${isPlaying ? 'animate-pulse' : 'opacity-30'}`} />
            {isPlaying ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
        <div className="text-vdu-green-bright font-bold text-[13px] sm:text-sm uppercase tracking-wide truncate phosphor">
          {currentStation.name}
        </div>
        {error && (
          <p className="text-[10px] text-accent-cyan truncate mt-0.5">⚠ {error}</p>
        )}
      </div>

      {/* Visualizer (hidden on the smallest screens to keep the strip glanceable) */}
      <div className="hidden sm:block w-[180px] md:w-[260px] lg:w-[300px]">
        <AudioVisualizer mode="trace" height={28} />
      </div>

      {/* Controls */}
      <div className="flex gap-1.5">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Stop' : 'Play'}
          className="w-8 h-8 bg-vdu-green-bright text-radio-black border border-vdu-green-bright flex items-center justify-center"
          style={{ boxShadow: '0 0 8px hsla(120,100%,55%,0.4)' }}
        >
          {isPlaying ? <Stop size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={() => toggleBookmark(currentStation)}
          aria-label={bookmarked ? 'Remove from log' : 'Log contact'}
          className={`w-8 h-8 border flex items-center justify-center transition-colors ${
            bookmarked
              ? 'border-vdu-green text-vdu-green-bright bg-vdu-green/10'
              : 'border-vdu-green-dim text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green'
          }`}
        >
          {bookmarked ? <LogOn size={12} /> : <Log size={12} />}
        </button>
        <ShareMenu
          station={currentStation}
          iconClassName="w-8 h-8 border border-vdu-green-dim text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green flex items-center justify-center transition-colors"
          trigger={<Send size={12} />}
        />
        {onMaximize && (
          <button
            onClick={onMaximize}
            aria-label="Inspect"
            className="w-8 h-8 border border-vdu-green-dim text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green flex items-center justify-center transition-colors"
          >
            <Inspect size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
