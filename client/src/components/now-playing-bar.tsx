import { SkipBack, Play, Pause, SkipForward, Volume2, Bookmark, Share2, ChevronDown } from 'lucide-react';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';

export function NowPlayingBar() {
  const {
    currentStation,
    isPlaying,
    volume,
    togglePlay,
    setVolume,
    error,
  } = useAudioStore();
  
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { toast } = useToast();

  if (!currentStation) return null;

  const handleBookmark = () => {
    toggleBookmark(currentStation);
    toast({
      title: isBookmarked(currentStation.stationuuid) ? "Bookmark removed" : "Station bookmarked",
      description: currentStation.name,
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?station=${currentStation.stationuuid}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Signal Drift - ${currentStation.name}`,
          text: `Check out this obscure radio station: ${currentStation.name}`,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Station link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Failed to copy link",
          description: "Unable to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="border-t border-vdu-green-dim bg-radio-dark p-4 md:p-6 sticky bottom-0 z-30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-vdu-green text-radio-black rounded-xl flex items-center justify-center font-black text-lg md:text-2xl flex-shrink-0">
            S
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-vdu-green text-base md:text-xl truncate tracking-tight">
              {currentStation.name.toUpperCase()}
            </h4>
            <p className="text-sm md:text-base text-muted truncate font-medium">
              {currentStation.country} • {currentStation.tags?.split(',')[0]?.trim() || 'Unknown genre'}
            </p>
            <div className="flex items-center space-x-3 mt-2">
              <div className="inline-flex items-center space-x-2 px-2 py-1 bg-accent-yellow text-radio-black rounded-full text-xs font-black">
                <div className="w-1.5 h-1.5 bg-radio-black rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
              <span className="text-xs text-vdu-green-dim font-medium">
                {currentStation.bitrate ? `${currentStation.bitrate} KBPS` : 'Unknown'} • {currentStation.clickcount || 0} listeners
              </span>
            </div>
            {error && (
              <p className="text-xs text-accent-yellow mt-2 truncate font-medium">⚠ {error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-4 md:space-x-6">
          {/* Player Controls */}
          <div className="flex items-center space-x-3">
            <button className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all flex items-center justify-center">
              <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            <button
              onClick={togglePlay}
              className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-accent-yellow text-radio-black'
                  : 'bg-radio-dark border-2 border-vdu-green text-vdu-green hover:bg-vdu-green hover:text-radio-black'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 md:w-7 md:h-7" />
              ) : (
                <Play className="w-5 h-5 md:w-7 md:h-7 ml-1" />
              )}
            </button>
            
            <button className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all flex items-center justify-center">
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Volume Control - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-vdu-green-dim" />
            <Slider
              value={[volume * 100]}
              onValueChange={(value) => setVolume(value[0] / 100)}
              max={100}
              step={1}
              className="w-24"
            />
          </div>

          {/* Additional Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBookmark}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                isBookmarked(currentStation.stationuuid)
                  ? 'border-vdu-green bg-vdu-green text-radio-black'
                  : 'border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(currentStation.stationuuid) ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full border-2 border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all flex items-center justify-center"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Waveform Visualization - Responsive */}
      <div className="mt-4 flex items-center justify-center space-x-1 h-8 md:h-10">
        {Array.from({ length: window.innerWidth < 768 ? 40 : 60 }, (_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full ${
              isPlaying
                ? i % 3 === 0
                  ? 'bg-vdu-green animate-pulse'
                  : i % 5 === 0
                  ? 'bg-vdu-green-bright animate-pulse'
                  : 'bg-vdu-green-dim animate-pulse'
                : 'bg-radio-black opacity-50'
            }`}
            style={{
              height: `${Math.random() * 70 + 30}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: isPlaying ? `${0.5 + Math.random() * 0.5}s` : '1s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
