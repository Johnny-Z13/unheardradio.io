import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shuffle, Loader2 } from 'lucide-react';
import { RadioStation, SearchFilters } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { StationCard } from './station-card';
import { Button } from '@/components/ui/button';

interface StationListProps {
  filters: SearchFilters;
}

export function StationList({ filters }: StationListProps) {
  const [page, setPage] = useState(0);
  const limit = 20;
  
  const {
    data: stations = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['/api/stations', { ...filters, limit, offset: page * limit }],
    queryFn: () => fetchStations({ ...filters, limit, offset: page * limit }),
    staleTime: 30 * 1000, // 30 seconds for more frequent refreshes
    refetchOnWindowFocus: true,
  });

  // Always show top 10 random stations when no filters are applied
  const displayStations = useMemo(() => {
    if (!filters.search && !filters.country && !filters.genre && stations.length > 10) {
      // Shuffle and take top 10 for discovery
      const shuffled = [...stations].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 10);
    }
    return stations;
  }, [stations, filters]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRandomDrift = () => {
    if (displayStations.length > 0) {
      const randomIndex = Math.floor(Math.random() * displayStations.length);
      const randomStation = displayStations[randomIndex];
      // Scroll to the random station
      const element = document.querySelector(`[data-station-id="${randomStation.stationuuid}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading && page === 0) {
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
          <h2 className="text-lg md:text-xl font-bold text-crt-green font-serif">Ultra-Obscure Transmissions</h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            {!filters.search && !filters.country && !filters.genre 
              ? `Top 10 random discoveries • ${displayStations.length} stations`
              : `Sorted by reverse popularity • ${displayStations.length} stations found`
            }
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Button
            onClick={handleRandomDrift}
            variant="outline"
            size="sm"
            className="border-crt-dim text-crt-green hover:bg-crt-green hover:text-radio-black text-xs md:text-sm"
          >
            <Shuffle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            <span className="hidden md:inline">Random Drift</span>
            <span className="md:hidden">Random</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {displayStations.map((station: RadioStation) => (
          <div key={station.stationuuid} data-station-id={station.stationuuid}>
            <StationCard station={station} />
          </div>
        ))}
      </div>

      {displayStations.length > 0 && !(!filters.search && !filters.country && !filters.genre) && (
        <div className="text-center py-6 md:py-8">
          <Button
            onClick={handleLoadMore}
            disabled={isFetching}
            variant="outline"
            className="px-4 md:px-6 py-2 md:py-3 border-crt-dim text-crt-green hover:border-crt-green hover:bg-crt-green hover:text-radio-black relative group text-sm"
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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-crt-green to-transparent opacity-0 group-hover:opacity-20 animate-scan"></div>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
