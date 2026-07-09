import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Scan } from '@/components/icons';
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
  const [randomSeed, setRandomSeed] = useState(() => filters.randomSeed ?? Date.now().toString(36));
  const limit = 20;
  const canRandomise = filters.listenerFilter !== 'high-to-low';
  const activeFilters = canRandomise ? { ...filters, randomSeed } : filters;
  
  const {
    data: stations = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['/api/stations', { ...activeFilters, limit, offset }],
    queryFn: () => fetchStations({ ...activeFilters, limit, offset }),
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // Garbage collect after 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on tab switch
  });

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
    setAllStations([]);
    if (canRandomise) {
      setRandomSeed(filters.randomSeed ?? Date.now().toString(36));
    }
  }, [canRandomise, filters.search, filters.country, filters.genre, filters.listenerFilter, filters.randomSeed]);

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
    }
    // Note: Removed the else condition that was causing infinite renders
  }, [stations, offset]);

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const handleRandomiseFeed = () => {
    if (!canRandomise) return;
    setAllStations([]);
    setOffset(0);
    setRandomSeed(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  };

  if (isLoading && offset === 0) {
    return (
    <div className="h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-chart-ink mx-auto mb-4" />
          <p className="text-chart-ink">Scanning airwaves...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
    <div className="h-full p-6 flex items-center justify-center">
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
    <div className="h-full min-h-0 p-3 md:p-6 overflow-y-auto overscroll-contain pb-28">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] md:text-[28px] leading-none text-chart-ink-bright ink-glow tracking-[0.04em]">
            // OBSCURE TRANSMISSIONS
          </h2>
          <p className="text-[10px] tracking-[0.12em] uppercase text-chart-ink-dim mt-1.5">
            {!filters.search && !filters.country && !filters.genre 
              ? `Random discoveries • ${allStations.length} stations`
              : `Sorted by reverse popularity • ${allStations.length} stations found`
            }
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Button
            onClick={handleRandomiseFeed}
            variant="outline"
            size="sm"
            disabled={isFetching || !canRandomise}
            className="border-chart-line text-chart-ink hover:bg-chart-ink-bright hover:text-chart-bg text-[10px] tracking-[0.15em] uppercase font-bold rounded-none"
          >
            <Scan size={12} className="mr-1.5" />
            <span className="hidden md:inline">RANDOMISE FEED</span>
            <span className="md:hidden">RANDOMISE</span>
          </Button>
        </div>
      </div>

      {allStations.length === 0 && !isLoading && !isFetching ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No stations found</h3>
            <p className="text-sm text-gray-500">
              {Object.keys(filters).some(key => filters[key as keyof SearchFilters]) 
                ? "This filter combination returned no results. Try using '0 listeners' or 'under 100 listeners' filters, or select a different country/genre."
                : "Try adjusting your search criteria or exploring different regions"
              }
            </p>
          </div>
        </div>
      ) : (
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
      )}

      {/* Load More Button */}
      {stations.length === limit && !isFetching && (
        <div className="text-center mt-6">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="border-chart-line text-chart-ink hover:bg-chart-ink hover:text-chart-bg"
          >
            Load More Stations
          </Button>
        </div>
      )}

      {/* Loading More Indicator */}
      {isFetching && offset > 0 && (
        <div className="text-center mt-6">
          <Loader2 className="w-6 h-6 animate-spin text-chart-ink mx-auto" />
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
