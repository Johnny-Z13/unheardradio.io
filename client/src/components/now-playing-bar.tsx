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
    <div className="border-t border-crt-dim bg-radio-gray p-3 md:p-4 sticky bottom-0 z-30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
          <img
            src="https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
            alt="Vintage radio equipment"
            className="w-10 h-10 md:w-12 md:h-12 object-cover border border-crt-dim opacity-80 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-amber text-sm md:text-base truncate">{currentStation.name}</h4>
            <p className="text-xs md:text-sm text-gray-400 truncate">
              {currentStation.tags || 'Unknown genre'} • {currentStation.country}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-crt-green rounded-full animate-pulse"></div>
              <span className="text-xs text-crt-green">LIVE</span>
              <span className="text-xs text-gray-500 hidden md:inline">
                {currentStation.bitrate ? `${currentStation.bitrate} kbps` : 'Unknown bitrate'} • {currentStation.clickcount || 0} listeners
              </span>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1 truncate">{error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-3 md:space-x-4">
          {/* Player Controls */}
          <div className="flex items-center space-x-2">
            <button className="w-8 h-8 md:w-10 md:h-10 border border-crt-green text-crt-green hover:bg-crt-green hover:text-radio-black transition-all flex items-center justify-center">
              <SkipBack className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-10 h-10 md:w-12 md:h-12 border-2 border-amber text-amber hover:bg-amber hover:text-radio-black transition-all flex items-center justify-center animate-pulse-glow"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            
            <button className="w-8 h-8 md:w-10 md:h-10 border border-crt-green text-crt-green hover:bg-crt-green hover:text-radio-black transition-all flex items-center justify-center">
              <SkipForward className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Volume Control - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <Slider
              value={[volume * 100]}
              onValueChange={(value) => setVolume(value[0] / 100)}
              max={100}
              step={1}
              className="w-20"
            />
          </div>

          {/* Additional Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBookmark}
              className={`transition-colors ${
                isBookmarked(currentStation.stationuuid)
                  ? 'text-crt-green hover:text-amber'
                  : 'text-gray-400 hover:text-crt-green'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(currentStation.stationuuid) ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShare}
              className="text-gray-400 hover:text-crt-green transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            <button className="hidden md:block text-gray-400 hover:text-crt-green transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Waveform Visualization - Responsive */}
      <div className="mt-3 flex items-center space-x-1 h-6 md:h-8">
        {Array.from({ length: window.innerWidth < 768 ? 30 : 50 }, (_, i) => (
          <div
            key={i}
            className={`w-1 animate-pulse ${
              isPlaying
                ? i % 3 === 0
                  ? 'bg-amber opacity-90'
                  : i % 5 === 0
                  ? 'bg-tape-orange opacity-60'
                  : 'bg-crt-green opacity-70'
                : 'bg-gray-600 opacity-30'
            }`}
            style={{
              height: `${Math.random() * 80 + 20}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
