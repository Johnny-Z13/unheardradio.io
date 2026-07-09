import { useState } from 'react';
import { Log } from '@/components/icons';
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
    <div className="h-full min-h-0 p-3 md:p-6 overflow-y-auto overscroll-contain pb-28">
      <div className="mb-4 md:mb-6">
        <h2 className="font-display text-[22px] md:text-[28px] leading-none text-chart-ink-bright ink-glow tracking-[0.04em]">// LOG / SAVED CONTACTS</h2>
        <p className="text-[10px] tracking-[0.12em] uppercase text-chart-ink-dim mt-1.5">{bookmarkStations.length} saved {bookmarkStations.length === 1 ? 'contact' : 'contacts'}</p>
      </div>

      {bookmarkStations.length === 0 ? (
        <div className="text-center py-12">
          <Log size={64} className="text-chart-ink-dim mx-auto mb-4 block" />
          <p className="text-chart-ink text-lg mb-2">No saved stations</p>
          <p className="text-sm text-chart-ink-dim max-w-md mx-auto">
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
