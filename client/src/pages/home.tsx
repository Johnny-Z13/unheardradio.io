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
  const [activeTab, setActiveTab] = useState<'discover' | 'search'>('discover');

  useEffect(() => {
    document.title = 'Signal Drift - Discover the World\'s Most Obscure Radio Stations';
  }, []);

  return (
    <div className="min-h-screen flex flex-col crt-scanlines bg-radio-black">
      {/* Hidden audio player component */}
      <AudioPlayer />
      
      {/* Header */}
      <header className="bg-radio-black relative overflow-hidden sticky top-0 z-40 border-b border-vdu-green-dim">
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-vdu-green text-radio-black rounded-lg flex items-center justify-center font-black text-xl md:text-2xl">
                  S
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-vdu-green tracking-tight">
                    SIGNAL DRIFT
                  </h1>
                  <p className="text-xs md:text-sm text-muted font-medium hidden sm:block">
                    Obscure Radio Discovery
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-muted font-medium">STATIONS</div>
                <div className="text-lg md:text-2xl text-vdu-green font-black">
                  {totalStations.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-radio-dark border-b border-vdu-green-dim sticky top-20 z-30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('discover')}
              className={`py-4 px-2 border-b-2 font-bold text-sm md:text-base transition-colors ${
                activeTab === 'discover'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
            >
              DISCOVER STATIONS
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-2 border-b-2 font-bold text-sm md:text-base transition-colors ${
                activeTab === 'search'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
            >
              SEARCH & FILTER
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Conditional Sidebar */}
        {activeTab === 'search' && (
          <SearchSidebar
            onFiltersChange={setFilters}
            totalStations={totalStations}
          />
        )}
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <StationList filters={filters} />
        </main>
      </div>

      <NowPlayingBar />
    </div>
  );
}
