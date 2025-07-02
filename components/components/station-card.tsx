import { Play, Pause, Bookmark, Share2, Maximize2, MapPin } from 'lucide-react';
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { getObscurityBadge, generateStationDescription, getTimeOnAir, getStationPopularity, getStreamQuality } from '@/lib/radio-api';
import { useToast } from '@/hooks/use-toast';

interface StationCardProps {
  station: RadioStation;
  onMaximize?: () => void;
}

export function StationCard({ station, onMaximize }: StationCardProps) {
  const { playStation, currentStation, isPlaying, isLoading } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { toast } = useToast();
  
  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
  const isCurrentlyPlaying = isCurrentStation && isPlaying;
  const isCurrentlyLoading = isCurrentStation && isLoading;
  
  const obscurityBadge = getObscurityBadge(station);
  const description = generateStationDescription(station);
  const timeOnAir = getTimeOnAir(station);
  const popularity = getStationPopularity(station);
  const streamQuality = getStreamQuality(station);
  
  const handlePlay = () => {
    playStation(station);
  };
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(station);
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?station=${station.stationuuid}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${station.name} - Unheard Radio`,
          text: `I found this radio station at UnheardRadio.io: ${station.name} from ${station.country}`,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      try {
        const shareText = `I found this radio station at UnheardRadio.io: ${station.name} from ${station.country} - ${url}`;
        await navigator.clipboard.writeText(shareText);
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
    <div className="bg-radio-dark rounded-xl p-3 md:p-4 hover:bg-opacity-80 transition-all group relative overflow-hidden border border-vdu-green-dim hover:border-vdu-green">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff00' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3Ccircle cx='47' cy='37' r='1'/%3E%3Ccircle cx='17' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative z-10">
        {/* Header with play button and title */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            <button
              onClick={handlePlay}
              disabled={isCurrentlyLoading}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                isCurrentlyPlaying
                  ? 'bg-accent-cyan text-radio-black'
                  : 'bg-radio-dark border-2 border-vdu-green text-vdu-green hover:bg-vdu-green hover:text-radio-black'
              } ${isCurrentlyLoading ? 'animate-pulse' : ''}`}
            >
              {isCurrentlyLoading ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isCurrentlyPlaying ? (
                <Pause className="w-3 h-3 md:w-4 md:h-4" />
              ) : (
                <Play className="w-3 h-3 md:w-4 md:h-4 ml-1" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-black text-vdu-green tracking-tight truncate mb-1">
                {station.name.toUpperCase()}
              </h3>
              <p className="text-xs md:text-sm text-muted font-medium flex items-center">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                {station.country}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {onMaximize && (
              <button
                onClick={onMaximize}
                className="w-7 h-7 rounded-full border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all flex items-center justify-center"
                title="Fullscreen view"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
            
            <button
              onClick={handleBookmark}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                isBookmarked(station.stationuuid)
                  ? 'border-vdu-green bg-vdu-green text-radio-black'
                  : 'border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(station.stationuuid) ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShare}
              className="w-7 h-7 rounded-full border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all flex items-center justify-center"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Now Playing indicator */}
        {isCurrentStation && (
          <div className="mb-2">
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-accent-cyan text-radio-black rounded-full text-xs font-black">
              <div className="w-1 h-1 bg-radio-black rounded-full animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
        )}

        {/* Minimal metadata */}
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{station.bitrate ? `${station.bitrate} kbps` : 'Unknown'}</span>
          <span>{station.clickcount || 0} listeners</span>
        </div>
      </div>
    </div>
  );
}
