import { useRef, useState } from 'react';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
import { Pause, Play, Stop, Log, LogOn, Send, Inspect, ArrowLeft, Scan, Close } from './icons';
import { getOrigin, getStationContext } from '@/lib/station-format';

export function NowPlayingBar({ onMaximize, onNext, canNext }: { onMaximize?: () => void; onNext: () => void; canNext: boolean }) {
  const { currentStation, status, togglePlay, error, history, historyIndex, playPrevious, playStation } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [showHistory, setShowHistory] = useState(false);
  const mobileHistoryButton = useRef<HTMLButtonElement>(null);
  const historyButton = useRef<HTMLButtonElement>(null);
  const bookmarked = currentStation ? isBookmarked(currentStation.stationuuid) : false;
  const previousIndex = history[historyIndex]?.stationuuid === currentStation?.stationuuid ? historyIndex + 1 : historyIndex;
  const statusText = { idle: 'Receiver ready', ready: 'Ready · tap play', loading: 'Tuning…', playing: 'Live signal', paused: 'Paused', failed: 'Signal lost' }[status];
  const active = status === 'playing' || status === 'loading';
  const closeHistory = () => { setShowHistory(false); (historyButton.current?.getClientRects().length ? historyButton.current : mobileHistoryButton.current)?.focus(); };

  return (
    <section aria-label="Radio player" className="receiver-dock px-3 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 text-[11px] tracking-[0.12em] uppercase" role="status" aria-live="polite">
            <span className={`inline-block h-1.5 w-1.5 ${status === 'playing' ? 'bg-signal' : 'bg-chart-ink-dim'}`} />
            <span className={status === 'failed' ? 'text-danger' : 'text-signal'}>{statusText}</span>
            {currentStation && <span className="text-chart-ink-dim truncate">/ {getOrigin(currentStation)}</span>}
          </div>
          <div className="text-sm sm:text-base font-semibold text-chart-ink-bright truncate">{currentStation?.name || 'Your next favourite station is out there.'}</div>
          <p className={`text-[11px] leading-relaxed truncate mt-1 ${status === 'failed' ? 'text-danger' : 'text-chart-ink-dim'}`}>
            {error || (currentStation ? getStationContext(currentStation) : 'Choose a signal on the map, or let the dial decide.')}
          </p>
        </div>
        <div className="hidden xl:block w-28 shrink-0" aria-hidden="true"><AudioVisualizer mode="bars" height={32} /></div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button className="receiver-control" aria-label="Previous signal" title="Previous signal" onClick={playPrevious} disabled={!history[previousIndex]}><ArrowLeft size={15} /></button>
          <button className="receiver-control receiver-play" onClick={togglePlay} disabled={!currentStation} aria-label={status === 'loading' ? 'Cancel tuning' : status === 'playing' ? 'Pause signal' : 'Play signal'} title={active ? 'Pause / cancel' : 'Play'}>
            {status === 'loading' ? <Stop size={14} /> : status === 'playing' ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="receiver-control px-3 gap-2 font-semibold text-xs whitespace-nowrap" onClick={onNext} disabled={!canNext}><Scan size={14} /><span>Next signal</span></button>
          <span className="flex-1 lg:hidden" />
          <div className="flex gap-1.5 sm:gap-2">
            <button className="receiver-control" disabled={!currentStation} onClick={() => currentStation && toggleBookmark(currentStation)} aria-label={bookmarked ? 'Remove saved station' : 'Save station'} title={bookmarked ? 'Saved' : 'Save station'}>{bookmarked ? <LogOn size={14} /> : <Log size={14} />}</button>
            {currentStation ? <ShareMenu side="above" station={currentStation} iconClassName="receiver-control" trigger={<Send size={14} />} /> : <button className="receiver-control" disabled aria-label="Share station"><Send size={14} /></button>}
            {onMaximize && <button disabled={!currentStation} className="receiver-control hidden sm:flex" onClick={onMaximize} aria-label="Station details" title="Station details"><Inspect size={14} /></button>}
          </div>
          <button ref={historyButton} className="receiver-control px-2 text-xs hidden sm:flex" aria-expanded={showHistory} aria-controls="recent-signals" disabled={!history.length} onClick={() => setShowHistory(!showHistory)}>Recent</button>
        </div>
      </div>
      <button disabled={!history.length} ref={mobileHistoryButton} className="sm:hidden text-[11px] text-chart-ink-dim underline underline-offset-4 mt-2" aria-expanded={showHistory} onClick={() => setShowHistory(!showHistory)}>Recent signals ({history.length})</button>
      {showHistory && <div id="recent-signals" className="absolute bottom-full right-2 left-2 sm:left-auto sm:w-96 mb-2 border border-chart-line bg-chart-panel shadow-2xl p-3" onKeyDown={(e) => { if (e.key === 'Escape') closeHistory(); }}>
        <div className="flex items-center justify-between mb-2"><h2 className="text-xs text-chart-ink-bright">Recent signals · this visit</h2><button className="receiver-control" onClick={closeHistory} aria-label="Close recent signals"><Close size={14} /></button></div>
        <ol className="max-h-64 overflow-y-auto">
          {history.map((station) => <li key={station.stationuuid}><button className="w-full text-left px-2 py-3 text-xs hover:bg-chart-line/30 flex flex-col gap-1" onClick={() => { void playStation(station, true); closeHistory(); }}><span className="text-chart-ink-bright truncate">{station.name}</span><span className="text-chart-ink-dim">{getOrigin(station)}</span></button></li>)}
        </ol>
      </div>}
    </section>
  );
}
