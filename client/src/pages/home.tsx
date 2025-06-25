import { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { SearchFilters } from '@/types/radio';
import { SearchSidebar } from '@/components/search-sidebar';
import { StationList } from '@/components/station-list';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { AudioPlayer } from '@/components/audio-player';

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [totalStations] = useState(47283); // This would be fetched from API in real app

  useEffect(() => {
    document.title = 'Signal Drift - Discover the World\'s Most Obscure Radio Stations';
  }, []);

  return (
    <div className="min-h-screen flex flex-col crt-scanlines bg-radio-black">
      {/* Hidden audio player component */}
      <AudioPlayer />
      
      {/* Header */}
      <header className="border-b border-crt-dim bg-radio-gray relative overflow-hidden sticky top-0 z-40">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-crt-green to-transparent opacity-10 animate-scan"></div>
        <div className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Radio className="w-6 h-6 md:w-8 md:h-8 text-crt-green animate-pulse-glow" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-crt-green font-serif tracking-wide">
                  Signal Drift
                </h1>
                <p className="text-xs md:text-sm text-gray-400 font-mono hidden sm:block">
                  discovering the world's most obscure radio stations
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-6">
              <div className="text-right">
                <div className="text-xs md:text-sm text-gray-400">Stations</div>
                <div className="text-sm md:text-xl text-crt-green font-bold">
                  {totalStations.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <SearchSidebar
          onFiltersChange={setFilters}
          totalStations={totalStations}
        />
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <StationList filters={filters} />
        </main>
      </div>

      <NowPlayingBar />
    </div>
  );
}
