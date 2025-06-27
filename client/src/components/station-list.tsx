import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shuffle, Loader2, Bookmark } from 'lucide-react';
import { RadioStation, SearchFilters } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { StationCard } from './station-card';
import { FullscreenStation } from './fullscreen-station';
import { Button } from '@/components/ui/button';
import { useBookmarks } from '@/hooks/use-bookmarks';

interface StationListProps {
  filters: SearchFilters;
}

export function StationList({ filters }: StationListProps) {
  const [allStations, setAllStations] = useState<RadioStation[]>([]);
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { bookmarks } = useBookmarks();
  
  // If showing bookmarks only, create stations from bookmark data
  const bookmarkStations = useMemo(() => {
    return bookmarks.map(bookmark => ({
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
    } as RadioStation));
  }, [bookmarks]);
  
  const {
    data: stations = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['/api/stations', { ...filters, limit, offset }],
    queryFn: () => fetchStations({ ...filters, limit, offset }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    enabled: !filters.bookmarkedOnly, // Only fetch from API if not showing bookmarks
  });
  
  // Use bookmark stations if bookmarkedOnly filter is active
  const displayStations = filters.bookmarkedOnly ? bookmarkStations : stations;
  
  // Debug logging for bookmarks
  useEffect(() => {
    if (filters.bookmarkedOnly) {
      console.log('Bookmarks mode - found bookmarks:', bookmarks.length);
      console.log('Bookmark stations:', bookmarkStations.length);
    }
  }, [filters.bookmarkedOnly, bookmarks.length, bookmarkStations.length]);

  // Update allStations when new data comes in (but not for bookmark mode)
  useEffect(() => {
    if (!filters.bookmarkedOnly && stations.length > 0) {
      if (offset === 0) {
        setAllStations(stations);
      } else {
        setAllStations(prev => [...prev, ...stations]);
      }
    }
  }, [stations, offset, filters.bookmarkedOnly]);

  // For bookmark mode, use bookmark stations directly
  useEffect(() => {
    if (filters.bookmarkedOnly) {
      setAllStations(bookmarkStations);
      setOffset(0);
    }
  }, [filters.bookmarkedOnly, bookmarkStations]);

  // Reset offset when filters change (but preserve data if filters are just empty)
  useEffect(() => {
    const hasActiveFilters = filters.search || filters.country || filters.genre || filters.bookmarkedOnly;
    const prevHadActiveFilters = allStations.length > 0;
    
    // Only reset if we actually have new filter criteria
    if (hasActiveFilters || (prevHadActiveFilters && !hasActiveFilters)) {
      setOffset(0);
      if (!filters.bookmarkedOnly) {
        setAllStations([]);
      }
    }
  }, [filters.search, filters.country, filters.genre, filters.bookmarkedOnly]);

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const handleRandomDrift = () => {
    if (allStations.length > 0) {
      const randomIndex = Math.floor(Math.random() * allStations.length);
      const randomStation = allStations[randomIndex];
      // Scroll to the random station
      const element = document.querySelector(`[data-station-id="${randomStation.stationuuid}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading && offset === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-crt-green mx-auto mb-4" />
          <p className="text-crt-green">Scanning airwaves...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">Signal Lost</div>
          <p className="text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load stations'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 md:p-6 overflow-y-auto">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-vdu-green font-serif">
            {filters.bookmarkedOnly ? 'Saved Stations' : 'Ultra-Obscure Transmissions'}
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            {filters.bookmarkedOnly 
              ? `${allStations.length} saved ${allStations.length === 1 ? 'station' : 'stations'}`
              : !filters.search && !filters.country && !filters.genre 
                ? `Random discoveries • ${allStations.length} stations`
                : `Sorted by reverse popularity • ${allStations.length} stations found`
            }
          </p>
        </div>
        {!filters.bookmarkedOnly && (
          <div className="flex items-center justify-end">
            <Button
              onClick={handleRandomDrift}
              variant="outline"
              size="sm"
              className="border-vdu-green-dim text-vdu-green hover:bg-vdu-green hover:text-radio-black text-xs md:text-sm"
            >
              <Shuffle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden md:inline">Random Drift</span>
              <span className="md:hidden">Random</span>
            </Button>
          </div>
        )}
      </div>

      {allStations.length === 0 && filters.bookmarkedOnly ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-vdu-green-dim mx-auto mb-4" />
          <p className="text-vdu-green text-lg mb-2">No saved stations</p>
          <p className="text-sm text-muted max-w-md mx-auto">
            Bookmark stations from the discover feed to keep them here for quick access.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:space-y-4">
            {allStations.map((station: RadioStation) => (
              <div key={station.stationuuid} data-station-id={station.stationuuid}>
                <StationCard 
                  station={station} 
                  onMaximize={() => setFullscreenStation(station)}
                />
              </div>
            ))}
          </div>

          {allStations.length > 0 && !filters.bookmarkedOnly && stations.length === limit && (
            <div className="text-center py-6 md:py-8">
              <Button
                onClick={handleLoadMore}
                disabled={isFetching}
                variant="outline"
                className="px-4 md:px-6 py-2 md:py-3 border-vdu-green-dim text-vdu-green hover:border-vdu-green hover:bg-vdu-green hover:text-radio-black relative group text-sm"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="hidden md:inline">Scanning Airwaves...</span>
                    <span className="md:hidden">Scanning...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">
                      <span className="hidden md:inline">Scan for More Signals</span>
                      <span className="md:hidden">Load More</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-vdu-green to-transparent opacity-0 group-hover:opacity-20 animate-scan"></div>
                  </>
                )}
              </Button>
            </div>
          )}
        </>
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
