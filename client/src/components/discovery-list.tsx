import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shuffle, Loader2 } from 'lucide-react';
import { RadioStation, SearchFilters } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { StationCard } from './station-card';
import { FullscreenStation } from './fullscreen-station';
import { Button } from '@/components/ui/button';

interface DiscoveryListProps {
  filters: SearchFilters;
}

export function DiscoveryList({ filters }: DiscoveryListProps) {
  const [allStations, setAllStations] = useState<RadioStation[]>([]);
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  
  const {
    data: stations = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['/api/stations', { ...filters, limit, offset }],
    queryFn: () => {
      console.log('DiscoveryList fetchStations with filters:', { ...filters, limit, offset });
      return fetchStations({ ...filters, limit, offset });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // Garbage collect after 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on tab switch
  });

  // Reset offset when filters change (memoize filters to prevent unnecessary resets)
  const stableFiltersString = JSON.stringify({
    search: filters.search || '',
    country: filters.country || '',
    genre: filters.genre || '',
    listenerFilter: filters.listenerFilter || 'all'
  });

  useEffect(() => {
    setOffset(0);
    setAllStations([]);
  }, [stableFiltersString]);

  // Update allStations when new data comes in
  useEffect(() => {
    if (stations.length > 0) {
      if (offset === 0) {
        setAllStations(stations);
      } else {
        setAllStations(prev => {
          // Prevent duplicates by checking if station already exists
          const existingIds = new Set(prev.map(s => s.stationuuid));
          const newStations = stations.filter(s => !existingIds.has(s.stationuuid));
          return [...prev, ...newStations];
        });
      }
    } else if (offset === 0 && !isLoading && !isFetching) {
      // Only clear if we're at offset 0 and not loading/fetching
      setAllStations([]);
    }
  }, [stations, offset, isLoading, isFetching]);

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const handleRandomDrift = () => {
    if (allStations.length > 0) {
      const randomIndex = Math.floor(Math.random() * allStations.length);
      const randomStation = allStations[randomIndex];
      const element = document.querySelector(`[data-station-id="${randomStation.stationuuid}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading && offset === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-vdu-green mx-auto mb-4" />
          <p className="text-vdu-green">Scanning airwaves...</p>
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
            Ultra-Obscure Transmissions
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            {!filters.search && !filters.country && !filters.genre 
              ? `Random discoveries • ${allStations.length} stations`
              : `Sorted by reverse popularity • ${allStations.length} stations found`
            }
          </p>
        </div>
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
      </div>

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

      {/* Load More Button */}
      {stations.length === limit && !isFetching && (
        <div className="text-center mt-6">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="border-vdu-green-dim text-vdu-green hover:bg-vdu-green hover:text-radio-black"
          >
            Load More Stations
          </Button>
        </div>
      )}

      {/* Loading More Indicator */}
      {isFetching && offset > 0 && (
        <div className="text-center mt-6">
          <Loader2 className="w-6 h-6 animate-spin text-vdu-green mx-auto" />
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