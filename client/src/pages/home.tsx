import { useState } from 'react';
import { Radar, Search, Bookmark, MapPin } from 'lucide-react';
import { SearchFilters } from '@/types/radio';
import { SearchSidebar } from '@/components/search-sidebar';
import { DiscoveryList } from '@/components/discovery-list';
import { BookmarkList } from '@/components/bookmark-list';
import { StationMap } from '@/components/station-map';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { FullscreenStation } from '@/components/fullscreen-station';
import { useAudioStore } from '@/lib/audio-store';
import { RadioStation } from '@/types/radio';

type Tab = 'discover' | 'search' | 'saved' | 'map';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null);
  const { currentStation } = useAudioStore();

  const totalStations = 47283;

  const tabs = [
    { id: 'discover' as Tab, label: 'Discover', icon: Radar },
    { id: 'search' as Tab, label: 'Filter', icon: Search },
    { id: 'saved' as Tab, label: 'Saved', icon: Bookmark },
    { id: 'map' as Tab, label: 'Map', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-radio-black text-vdu-green overflow-hidden">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="p-3 md:p-4 bg-radio-black border-b border-vdu-green-dim flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-vdu-green text-radio-black rounded font-black flex items-center justify-center text-lg md:text-xl">
                U
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl lg:text-2xl font-black text-vdu-green font-serif leading-tight">
                  Unheard Radio
                </h1>
                <p className="text-xs md:text-sm text-muted mt-0.5">
                  Obscure Radio Discovery
                </p>
              </div>
            </div>
            
            <div className="text-right text-xs md:text-sm text-muted flex-shrink-0">
              <p>Stations live on air: {totalStations.toLocaleString()}</p>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-radio-dark border-b border-vdu-green-dim p-2 md:p-3 flex-shrink-0">
          <div className="flex space-x-1 md:space-x-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 rounded-lg transition-all whitespace-nowrap text-xs md:text-sm font-mono group relative ${
                    isActive
                      ? 'bg-vdu-green text-radio-black'
                      : 'text-vdu-green-dim hover:text-vdu-green hover:bg-radio-black'
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden md:inline font-mono">{tab.label.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - only show for search tab */}
          {activeTab === 'search' && (
            <div className="w-full md:w-72 lg:w-80 flex-shrink-0 md:border-r md:border-vdu-green-dim">
              <SearchSidebar
                onFiltersChange={setFilters}
                totalStations={totalStations}
              />
            </div>
          )}
          
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {activeTab === 'saved' ? (
              <BookmarkList />
            ) : activeTab === 'discover' ? (
              <DiscoveryList filters={filters} />
            ) : activeTab === 'search' ? (
              <DiscoveryList filters={filters} />
            ) : activeTab === 'map' ? (
              <StationMap />
            ) : null}
          </main>
        </div>

        {/* Now Playing Bar */}
        {currentStation && (
          <NowPlayingBar onMaximize={() => setFullscreenStation(currentStation)} />
        )}

        {/* Fullscreen Station View */}
        {fullscreenStation && (
          <FullscreenStation 
            station={fullscreenStation} 
            onClose={() => setFullscreenStation(null)} 
          />
        )}
      </div>
    </div>
  );
}