import { useState, useEffect } from 'react';
import { Radio, Bookmark, Shuffle, MapPin, Search, Radar, Play, Pause } from 'lucide-react';
import { SearchFilters, RadioStation } from '@/types/radio';
import { SearchSidebar } from '@/components/search-sidebar';
import { StationList } from '@/components/station-list';
import { StationMap } from '@/components/station-map';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { AudioPlayer } from '@/components/audio-player';
import { FullscreenStation } from '@/components/fullscreen-station';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { fetchStations } from '@/lib/radio-api';

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [totalStations] = useState(47283);
  const [activeTab, setActiveTab] = useState<'discover' | 'search' | 'bookmarks' | 'locations'>('discover');
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null);
  const { currentStation, playStation, isPlaying, isLoading } = useAudioStore();
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
        <div className="container mx-auto px-3 py-3 md:px-4 md:py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <div className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-vdu-green text-radio-black rounded border-2 border-vdu-green flex items-center justify-center font-black text-sm md:text-lg lg:text-xl flex-shrink-0">
                  U
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm md:text-lg lg:text-2xl font-black text-vdu-green tracking-tight truncate">
                    UNHEARD RADIO
                  </h1>
                  <p className="text-xs text-muted font-medium hidden sm:block">
                    Obscure Radio Discovery
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end flex-shrink-0">
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
      <div className="bg-radio-dark border-b border-vdu-green-dim sticky top-12 md:top-16 z-30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex space-x-3 md:space-x-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('discover')}
              className={`py-2 md:py-3 px-3 md:px-4 border-b-2 font-bold transition-colors flex items-center space-x-2 ${
                activeTab === 'discover'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
              title="Discover obscure stations"
            >
              <Radar className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline text-xs md:text-sm font-mono">DISCOVER</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 md:py-3 px-3 md:px-4 border-b-2 font-bold transition-colors flex items-center space-x-2 ${
                activeTab === 'search'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
              title="Filter stations"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline text-xs md:text-sm font-mono">FILTER</span>
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`py-2 md:py-3 px-3 md:px-4 border-b-2 font-bold transition-colors flex items-center space-x-2 ${
                activeTab === 'bookmarks'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
              title="Saved stations"
            >
              <Bookmark className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline text-xs md:text-sm font-mono">SAVED</span>
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-2 md:py-3 px-3 md:px-4 border-b-2 font-bold transition-colors flex items-center space-x-2 ${
                activeTab === 'locations'
                  ? 'border-vdu-green text-vdu-green'
                  : 'border-transparent text-muted hover:text-vdu-green-dim'
              }`}
              title="Global station map"
            >
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline text-xs md:text-sm font-mono">MAP</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar - Only show for search tab */}
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
            <StationList filters={{ bookmarkedOnly: true }} />
          ) : activeTab === 'discover' ? (
            <StationList filters={filters} />
          ) : activeTab === 'search' ? (
            <StationList filters={filters} />
          ) : activeTab === 'map' ? (
            <StationMap />
          ) : null}
        </main>

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
                                disabled={isCurrentlyLoading}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all font-bold ${
                                  isCurrentlyPlaying
                                    ? 'bg-accent-cyan text-radio-black'
                                    : 'bg-vdu-green text-radio-black hover:bg-accent-cyan'
                                } ${isCurrentlyLoading ? 'animate-pulse' : ''}`}
                                title={isCurrentlyPlaying ? 'Currently Playing' : 'Play Station'}
                              >
                                {isCurrentlyLoading ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : isCurrentlyPlaying ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5" />
                                )}
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
                      );
                    })}
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
          ) : activeTab === 'locations' ? (
            <div className="flex-1 overflow-hidden h-full">
              <StationMap onStationSelect={setFullscreenStation} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Random Station Button for Discover Tab */}
              {activeTab === 'discover' && (
                <div className="p-4 border-b border-vdu-green-dim bg-radio-dark flex-shrink-0">
                  <button
                    onClick={playRandomStation}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-radio-black transition-all font-bold text-sm"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>RANDOM ZERO-LISTENER STATION</span>
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <StationList filters={filters} />
              </div>
            </div>
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
