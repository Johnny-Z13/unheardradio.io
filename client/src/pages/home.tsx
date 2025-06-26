import { useState, useEffect } from 'react';
import { Radio, Bookmark, Shuffle } from 'lucide-react';
import { SearchFilters, RadioStation } from '@/types/radio';
import { SearchSidebar } from '@/components/search-sidebar';
import { StationList } from '@/components/station-list';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { AudioPlayer } from '@/components/audio-player';
import { FullscreenStation } from '@/components/fullscreen-station';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { fetchStations } from '@/lib/radio-api';

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [totalStations] = useState(47283);
  const [activeTab, setActiveTab] = useState<'discover' | 'search' | 'bookmarks'>('discover');
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null);
  const { currentStation, playStation } = useAudioStore();
  const { bookmarks } = useBookmarks();

  useEffect(() => {
    document.title = 'Unheard Radio - Obscure Radio Discovery';
  }, []);

  const playRandomStation = async () => {
    try {
      const randomStations = await fetchStations({ 
        listenerFilter: 'zero',
        limit: 50,
        offset: Math.floor(Math.random() * 1000)
      });
      
      if (randomStations.length > 0) {
        const randomIndex = Math.floor(Math.random() * randomStations.length);
        const randomStation = randomStations[randomIndex];
        await playStation(randomStation);
      }
    } catch (error) {
      console.error('Failed to play random station:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col crt-scanlines bg-radio-black">
      {/* Hidden audio player component */}
      <AudioPlayer />
      
      {/* Header */}
      <header className="bg-radio-black relative overflow-hidden sticky top-0 z-40 border-b border-vdu-green-dim">
        <div className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-vdu-green text-radio-black rounded border-2 border-vdu-green flex items-center justify-center font-black text-lg md:text-xl">
                  U
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-black text-vdu-green tracking-tight">
                    UNHEARD RADIO
                  </h1>
                  <p className="text-xs text-muted font-medium hidden sm:block">
                    Obscure Radio Discovery
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Random Button */}
              <button
                onClick={playRandomStation}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-radio-black transition-all font-bold text-xs"
              >
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:block">RANDOM</span>
              </button>

              {/* Bookmarks Button */}
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border font-bold text-xs transition-all ${
                  activeTab === 'bookmarks'
                    ? 'border-vdu-green bg-vdu-green text-radio-black'
                    : 'border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:block">BOOKMARKS</span>
                {bookmarks.length > 0 && (
                  <span className="bg-accent-cyan text-radio-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">
                    {bookmarks.length}
                  </span>
                )}
              </button>
              
              <div className="text-right">
                <div className="text-xs text-muted font-medium">STATIONS LIVE ON AIR</div>
                <div className="text-lg md:text-xl text-vdu-green font-black">
                  {totalStations.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-radio-dark border-b border-vdu-green-dim sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('discover')}
              className={`py-3 px-2 border-b-2 font-bold text-sm md:text-base transition-colors ${
                activeTab === 'discover'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
            >
              DISCOVER STATIONS
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-3 px-2 border-b-2 font-bold text-sm md:text-base transition-colors ${
                activeTab === 'search'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
            >
              SEARCH & FILTER
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`py-3 px-2 border-b-2 font-bold text-sm md:text-base transition-colors ${
                activeTab === 'bookmarks'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
            >
              BOOKMARKS {bookmarks.length > 0 && `(${bookmarks.length})`}
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
          {activeTab === 'bookmarks' ? (
            <div className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-vdu-green mb-2">YOUR BOOKMARKS</h2>
                  <p className="text-muted text-sm">
                    {bookmarks.length === 0 
                      ? 'No bookmarked stations yet. Click the bookmark icon on any station to save it here.'
                      : `${bookmarks.length} bookmarked station${bookmarks.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                
                {bookmarks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {bookmarks.map((bookmark) => (
                      <div key={bookmark.stationuuid} className="bg-radio-dark rounded-xl p-4 border border-vdu-green-dim hover:border-vdu-green transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-vdu-green font-bold text-sm mb-1 line-clamp-2 group-hover:text-accent-cyan transition-colors">
                              {bookmark.name}
                            </h3>
                            <p className="text-xs text-muted">
                              {bookmark.country} • {bookmark.genre}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted">
                            {bookmark.bitrate > 0 && `${bookmark.bitrate} kbps`}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                const station: RadioStation = {
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
                                };
                                playStation(station);
                              }}
                              className="w-8 h-8 rounded-lg bg-vdu-green text-radio-black hover:bg-accent-cyan transition-colors flex items-center justify-center"
                            >
                              <Radio className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => {
                                const station: RadioStation = {
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
                                };
                                setFullscreenStation(station);
                              }}
                              className="w-8 h-8 rounded-lg border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-colors flex items-center justify-center"
                            >
                              <span className="text-xs">↗</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-vdu-green-dim">
                          <p className="text-xs text-muted">
                            Bookmarked {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-vdu-green-dim mx-auto mb-4" />
                    <p className="text-muted text-lg mb-2">No bookmarks yet</p>
                    <p className="text-sm text-muted max-w-md mx-auto">
                      Discover obscure radio stations and bookmark your favorites to access them quickly here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <StationList filters={filters} />
          )}
        </main>
      </div>

      <NowPlayingBar 
        onMaximize={() => currentStation && setFullscreenStation(currentStation)}
      />

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
