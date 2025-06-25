import { Play, Pause, Bookmark, Share2 } from 'lucide-react';
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { getObscurityBadge, generateStationDescription } from '@/lib/radio-api';
import { useToast } from '@/hooks/use-toast';

interface StationCardProps {
  station: RadioStation;
}

export function StationCard({ station }: StationCardProps) {
  const { playStation, currentStation, isPlaying, isLoading } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { toast } = useToast();
  
  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
  const isCurrentlyPlaying = isCurrentStation && isPlaying;
  const isCurrentlyLoading = isCurrentStation && isLoading;
  
  const obscurityBadge = getObscurityBadge(station);
  const description = generateStationDescription(station);
  
  const handlePlay = () => {
    playStation(station);
  };
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(station);
    toast({
      title: isBookmarked(station.stationuuid) ? "Bookmark removed" : "Station bookmarked",
      description: station.name,
    });
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?station=${station.stationuuid}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Signal Drift - ${station.name}`,
          text: `Check out this obscure radio station: ${station.name}`,
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
    <div className="border border-crt-dim bg-radio-gray p-3 md:p-4 hover:border-crt-green transition-colors group relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-crt-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-3 md:space-y-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={handlePlay}
              disabled={isCurrentlyLoading}
              className={`w-8 h-8 md:w-10 md:h-10 border flex-shrink-0 ${
                isCurrentlyPlaying
                  ? 'border-amber text-amber hover:bg-amber'
                  : 'border-crt-green text-crt-green hover:bg-crt-green'
              } hover:text-radio-black transition-all flex items-center justify-center ${
                isCurrentlyLoading ? 'animate-pulse' : ''
              }`}
            >
              {isCurrentlyLoading ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : isCurrentlyPlaying ? (
                <Pause className="w-3 h-3 md:w-4 md:h-4" />
              ) : (
                <Play className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-crt-green text-sm md:text-base truncate">{station.name}</h3>
              <p className="text-xs text-gray-400">{station.country}</p>
            </div>
            
            {isCurrentStation && (
              <span className="px-2 py-1 bg-amber text-radio-black text-xs font-bold animate-static flex-shrink-0 hidden md:inline">
                NOW PLAYING
              </span>
            )}
          </div>
          
          {/* Mobile Now Playing Indicator */}
          {isCurrentStation && (
            <div className="mb-2 md:hidden">
              <span className="px-2 py-1 bg-amber text-radio-black text-xs font-bold animate-static">
                NOW PLAYING
              </span>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-500 mb-2">
            <span className="flex-shrink-0">{station.bitrate ? `${station.bitrate} kbps` : 'Unknown bitrate'}</span>
            <span className="flex-shrink-0">{station.clickcount || 0} listeners</span>
            <span className="truncate">{station.tags || 'Unknown genre'}</span>
            <span className={`px-2 py-1 bg-${obscurityBadge.color} text-radio-black font-bold flex-shrink-0`}>
              {obscurityBadge.text}
            </span>
          </div>
          
          <p className="text-xs md:text-sm text-gray-400 font-serif italic line-clamp-2">
            "{description}"
          </p>
        </div>
        
        <div className="flex items-center justify-end space-x-3 md:space-x-2 md:flex-col md:space-y-2 md:space-x-0 flex-shrink-0">
          <button
            onClick={handleBookmark}
            className={`transition-colors ${
              isBookmarked(station.stationuuid)
                ? 'text-crt-green hover:text-amber'
                : 'text-gray-500 hover:text-crt-green'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked(station.stationuuid) ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-crt-green transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
