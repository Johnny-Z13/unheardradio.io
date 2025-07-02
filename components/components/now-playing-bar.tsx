import { SkipBack, Play, Pause, SkipForward, Volume2, Bookmark, Share2, ChevronDown, Maximize2 } from 'lucide-react';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Slider } from '@/components/ui/slider';
import { AudioVisualizer } from '@/components/audio-visualizer';

export function NowPlayingBar({ onMaximize }: { onMaximize?: () => void }) {
  const {
    currentStation,
    isPlaying,
    volume,
    togglePlay,
    setVolume,
    error,
  } = useAudioStore();
  
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!currentStation) return null;

  const handleBookmark = () => {
    toggleBookmark(currentStation);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?station=${currentStation.stationuuid}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentStation.name} - Unheard Radio`,
          text: `I found this radio station at UnheardRadio.io: ${currentStation.name} from ${currentStation.country}`,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      try {
        const shareText = `I found this radio station at UnheardRadio.io: ${currentStation.name} from ${currentStation.country} - ${url}`;
        await navigator.clipboard.writeText(shareText);
      } catch (error) {
        // Clipboard write failed
      }
    }
  };

  return (
    <div className="border-t border-vdu-green-dim bg-radio-dark p-2 md:p-3 sticky bottom-0 z-30">
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="w-8 h-8 bg-vdu-green text-radio-black rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0">
            S
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-vdu-green text-sm truncate tracking-tight">
              {currentStation.name.toUpperCase()}
            </h4>
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-accent-cyan text-radio-black rounded-full text-xs font-black">
                <div className="w-1 h-1 bg-radio-black rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
              <span className="text-xs text-muted truncate">
                {currentStation.country} • {currentStation.clickcount || 0} listeners
              </span>
            </div>
            {error && (
              <p className="text-xs text-accent-cyan truncate font-medium">⚠ {error}</p>
            )}
          </div>
        </div>

        {/* Compact Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-accent-cyan text-radio-black'
                : 'bg-radio-dark border border-vdu-green text-vdu-green hover:bg-vdu-green hover:text-radio-black'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            onClick={handleBookmark}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isBookmarked(currentStation.stationuuid)
                ? 'bg-vdu-green text-radio-black'
                : 'border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green'
            }`}
          >
            <Bookmark className={`w-3 h-3 ${isBookmarked(currentStation.stationuuid) ? 'fill-current' : ''}`} />
          </button>
          
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="w-8 h-8 rounded-lg border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all flex items-center justify-center"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      
      {/* Compact Audio Visualizer */}
      <div className="mt-2">
        <AudioVisualizer height={16} barCount={50} compact={true} />
      </div>
    </div>
  );
}
