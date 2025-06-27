import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { RadioStation } from '@/types/radio';
import { StationCard } from './station-card';
import { FullscreenStation } from './fullscreen-station';
import { useBookmarks } from '@/hooks/use-bookmarks';

export function BookmarkList() {
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null);
  const { bookmarks } = useBookmarks();
  
  // Convert bookmarks to station format
  const bookmarkStations: RadioStation[] = bookmarks.map(bookmark => ({
    stationuuid: bookmark.stationuuid,
    name: bookmark.name,
    country: bookmark.country,
    tags: bookmark.genre,
    bitrate: bookmark.bitrate,
    url: bookmark.url,
    url_resolved: bookmark.url,
    homepage: '',
    favicon: '',
    countrycode: '',
    state: '',
    language: '',
    votes: 0,
    lastchangetime: '',
    codec: '',
    hls: 0,
    lastcheckok: 1,
    lastchecktime: '',
    lastcheckoktime: '',
    lastlocalchecktime: '',
    clicktimestamp: '',
    clickcount: 0,
    clicktrend: 0,
    ssl_error: 0,
    geo_lat: 0,
    geo_long: 0
  }));

  return (
    <div className="flex-1 p-3 md:p-6 overflow-y-auto">
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-vdu-green font-serif">
          Saved Stations
        </h2>
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          {bookmarkStations.length} saved {bookmarkStations.length === 1 ? 'station' : 'stations'}
        </p>
      </div>

      {bookmarkStations.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-vdu-green-dim mx-auto mb-4" />
          <p className="text-vdu-green text-lg mb-2">No saved stations</p>
          <p className="text-sm text-muted max-w-md mx-auto">
            Bookmark stations from the discover feed to keep them here for quick access.
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {bookmarkStations.map((station: RadioStation) => (
            <div key={station.stationuuid} data-station-id={station.stationuuid}>
              <StationCard 
                station={station} 
                onMaximize={() => setFullscreenStation(station)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Station View */}
      {fullscreenStation && (
        <FullscreenStation 
          station={fullscreenStation} 
          onClose={() => setFullscreenStation(null)} 
        />
      )}
    </div>
  );
}