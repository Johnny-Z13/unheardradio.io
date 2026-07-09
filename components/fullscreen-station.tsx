import { useEffect } from 'react';
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import {
  generateStationDescription,
  getObscurityBadge,
  getStationPopularity,
  getStreamQuality,
  getTimeOnAir,
} from '@/lib/radio-api';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
import { Close, Log, LogOn, MapPin, Play, Send, Stop } from './icons';
import { getBand, getCoords, getOrigin, getRate, getStationId, getUptime } from '@/lib/station-format';

interface FullscreenStationProps {
  station: RadioStation;
  onClose: () => void;
}

export function FullscreenStation({ station, onClose }: FullscreenStationProps) {
  const { currentStation, isPlaying, isLoading, error, playStation, togglePlay } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
  const isLive = isCurrentStation && isPlaying;
  const bookmarked = isBookmarked(station.stationuuid);
  const obscurityBadge = getObscurityBadge(station);
  const streamQuality = getStreamQuality(station);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handlePrimary = () => {
    if (isCurrentStation) {
      togglePlay();
    } else {
      playStation(station);
    }
  };

  return (
    <div className="fixed inset-0 bg-chart-bg z-[9999] w-screen h-dvh overflow-y-auto overscroll-contain">
      <div className="sticky top-0 z-20 border-b border-chart-line/50 bg-chart-bg/95 backdrop-blur px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[22px] leading-none text-chart-ink-bright ink-glow tracking-[0.08em]">
            UNHEARD // SIGNAL DETAIL
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-chart-ink-dim truncate">
            ID {getStationId(station)} · BAND {getBand(station)} · {getOrigin(station)}
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close station detail"
          className="w-10 h-10 border border-chart-line text-chart-ink hover:border-chart-ink-bright hover:text-chart-ink-bright flex items-center justify-center transition-colors shrink-0"
        >
          <Close size={16} />
        </button>
      </div>

      <div className="relative min-h-[220px] border-b border-chart-line/50 overflow-hidden">
        <div className="absolute inset-0 opacity-45 pointer-events-none">
          <AudioVisualizer mode="waterfall" height={260} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-chart-bg/10 via-chart-bg/60 to-chart-bg" />

        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge>{obscurityBadge.text}</Badge>
                <Badge>{isLive ? 'LIVE SIGNAL' : isCurrentStation ? 'PAUSED' : 'READY'}</Badge>
                <Badge>{streamQuality.quality}</Badge>
              </div>
              <h1 className="font-display text-[40px] sm:text-[56px] leading-none text-chart-ink-bright ink-glow tracking-[0.03em] uppercase break-words">
                {station.name || 'Unknown Station'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base text-chart-ink-dim leading-relaxed">
                {generateStationDescription(station)}
              </p>
            </div>

            <div className="border border-chart-line/50 bg-chart-panel/80 p-3">
              <AudioVisualizer mode="bars" height={54} />
              <div className="mt-2">
                <AudioVisualizer mode="dbfs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 pb-10">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={handlePrimary}
            disabled={isLoading}
            className="h-9 px-4 bg-signal text-chart-bg border border-signal flex items-center gap-2 font-bold text-[11px] uppercase tracking-[0.14em] disabled:opacity-60"
          >
            {isLoading ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isLive ? (
              <Stop size={13} />
            ) : (
              <Play size={13} />
            )}
            {isLive ? 'Pause signal' : 'Tune signal'}
          </button>

          <button
            onClick={() => toggleBookmark(station)}
            className={`h-9 px-3 border flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-bold transition-colors ${
              bookmarked
                ? 'border-chart-ink-dim bg-chart-ink/[0.06] text-chart-ink-bright'
                : 'border-chart-line text-chart-ink-dim hover:border-chart-ink-dim hover:text-chart-ink'
            }`}
          >
            {bookmarked ? <LogOn size={13} /> : <Log size={13} />}
            {bookmarked ? 'Saved' : 'Save'}
          </button>

          <ShareMenu
            station={station}
            iconClassName="h-9 px-3 border border-chart-line text-chart-ink-dim hover:border-chart-ink-dim hover:text-chart-ink flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-bold transition-colors"
            trigger={<><Send size={13} /><span>Share</span></>}
          />

          {station.homepage && (
            <a
              href={station.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 border border-chart-line text-chart-ink-dim hover:border-chart-ink-dim hover:text-chart-ink flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-bold transition-colors"
            >
              <MapPin size={13} />
              Site
            </a>
          )}
        </div>

        {error && isCurrentStation && (
          <div className="mb-5 border border-danger bg-chart-panel px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <DetailPanel title="Signal">
            <DetailItem label="Origin" value={getOrigin(station)} />
            <DetailItem label="Coordinates" value={getCoords(station)} />
            <DetailItem label="Language" value={station.language || 'Unknown'} />
            <DetailItem label="Status" value={station.lastcheckok === 1 ? 'Verified online' : 'Unverified'} />
          </DetailPanel>

          <DetailPanel title="Audio">
            <DetailItem label="Rate" value={getRate(station)} />
            <DetailItem label="Codec" value={station.codec || 'Unknown'} />
            <DetailItem label="Quality" value={streamQuality.quality} />
            <DetailItem label="Protocol" value={station.url?.startsWith('https') ? 'HTTPS' : 'HTTP'} />
          </DetailPanel>

          <DetailPanel title="Discovery">
            <DetailItem label="Listeners" value={(station.clickcount || 0).toLocaleString()} />
            <DetailItem label="Popularity" value={getStationPopularity(station)} />
            <DetailItem label="Uptime" value={getUptime(station)} />
            <DetailItem label="On air" value={getTimeOnAir(station)} />
          </DetailPanel>

          <DetailPanel title="Content">
            <DetailItem label="Primary tag" value={station.tags ? station.tags.split(',')[0].trim() : 'Various'} />
            <DetailItem label="Country code" value={station.countrycode || 'N/A'} />
            <DetailItem label="Station ID" value={station.stationuuid.slice(0, 8).toUpperCase()} />
            <DetailItem label="Homepage" value={station.homepage ? station.homepage.replace(/^https?:\/\//, '').slice(0, 28) : 'Not listed'} />
          </DetailPanel>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-chart-line bg-chart-panel/80 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-chart-ink">
      {children}
    </span>
  );
}

function DetailPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-chart-line/50 bg-chart-panel p-3">
      <h2 className="text-[11px] uppercase tracking-[0.14em] text-chart-ink-bright mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 text-[11px] uppercase tracking-[0.05em]">
      <span className="text-chart-ink-dim">{label}</span>
      <span className="text-chart-ink truncate">{value}</span>
    </div>
  );
}
