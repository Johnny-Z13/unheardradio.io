'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SearchSidebar } from '@/components/search-sidebar'
import { DiscoveryList } from '@/components/discovery-list'
import { BookmarkList } from '@/components/bookmark-list'
import { StationMap } from '@/components/station-map-simple'
import { NowPlayingBar } from '@/components/now-playing-bar'
import { FullscreenStation } from '@/components/fullscreen-station'
import { RadioStation, SearchFilters } from '@/types/radio'
import { useAudioStore } from '@/lib/audio-store'
import { Discover, Filter, Log, MapPin, Info } from '@/components/icons'

type Tab = 'discover' | 'search' | 'saved' | 'map' | 'about'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('discover')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    listenerFilter: 'low-to-high',
    limit: 20,
    offset: 0,
  })
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null)

  const { currentStation, playStation } = useAudioStore()

  const { data: stats } = useQuery<{ stations: number; countries: number; languages: number }>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('stats')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  // Deep link: ?station=<uuid> auto-plays that station via RadioBrowser lookup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uuid = params.get('station')
    if (!uuid) return

    let cancelled = false
    fetch(`https://de1.api.radio-browser.info/json/stations/byuuid/${uuid}`, {
      headers: { 'User-Agent': 'UnheardRadio/1.0' },
    })
      .then(r => (r.ok ? r.json() : []))
      .then((stations: RadioStation[]) => {
        if (cancelled || !stations.length) return
        playStation(stations[0])
        setFullscreenStation(stations[0])
        // Clean the URL so refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname)
      })
      .catch(() => { /* link broken, ignore */ })

    return () => { cancelled = true }
  }, [playStation])

  const handleRefreshToDiscovery = (appliedFilters: SearchFilters) => {
    setSearchFilters(appliedFilters)
    setActiveTab('discover')
  }

  const handleCloseFullscreen = () => {
    setFullscreenStation(null)
  }

  const handleMaximizeStation = () => {
    if (currentStation) {
      setFullscreenStation(currentStation)
    }
  }

  const tabs = [
    { id: 'discover' as Tab, icon: Discover, label: 'SCAN', num: '01' },
    { id: 'search' as Tab, icon: Filter, label: 'FILTER', num: '02' },
    { id: 'saved' as Tab, icon: Log, label: 'LOG', num: '03' },
    { id: 'map' as Tab, icon: MapPin, label: 'GRID', num: '04' },
    { id: 'about' as Tab, icon: Info, label: 'NFO', num: '05' },
  ]

  return (
    <div className="min-h-screen bg-black text-vdu-green font-mono">
      <header className="border-b border-hairline px-3 sm:px-4 py-3 flex items-end justify-between gap-3">
        <div className="border border-vdu-green-bright px-2.5 py-1 font-display text-[20px] sm:text-[22px] leading-none text-vdu-green-bright phosphor tracking-[0.08em]">
          UNHEARD&nbsp;//&nbsp;RADIO
        </div>
        <div className="text-right text-[10px] tracking-[0.12em] uppercase text-vdu-green-dim leading-relaxed">
          <div>// Listening Post</div>
          <div className="hidden sm:block">
            <span className="text-vdu-green">{stats ? stats.stations.toLocaleString() : '…'}</span> stations
            <span className="opacity-50 px-1.5">·</span>
            <span className="text-vdu-green">{stats ? stats.countries : '…'}</span> countries
          </div>
        </div>
      </header>

      <nav className="border-b border-hairline overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-r border-hairline transition-colors text-[11px] tracking-[0.12em] uppercase whitespace-nowrap ${
                  active
                    ? 'text-vdu-green-bright bg-vdu-green/[0.06] phosphor border-b-2 border-b-vdu-green-bright'
                    : 'text-vdu-green-dim hover:text-vdu-green'
                }`}
                title={tab.label}
              >
                <Icon size={12} />
                <span className="hidden sm:inline text-vdu-green-faint text-[9px]">{tab.num}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {activeTab === 'search' && (
          <div className="w-full lg:w-80 border-r border-vdu-green/20 bg-black/50">
            <SearchSidebar
              onFiltersChange={setSearchFilters}
              onRefreshToDiscovery={handleRefreshToDiscovery}
              totalStations={stats?.stations ?? 0}
            />
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'discover' && <DiscoveryList filters={searchFilters} />}
          {activeTab === 'saved' && <BookmarkList />}
          {activeTab === 'map' && <StationMap />}
          {activeTab === 'search' && <DiscoveryList filters={searchFilters} />}
          {activeTab === 'about' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4 glow">UNHEARD RADIO</h1>
                  <p className="text-xl text-vdu-green-dim mb-6">
                    your portal to the strange side of sound
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-lg leading-relaxed">
                    Welcome to the underground. While everyone else feeds you the same popular frequencies,
                    we dig deeper into the weird, wonderful, and completely overlooked corners of global radio.
                  </p>

                  <p className="leading-relaxed">
                    Our reverse-algorithm doesn&apos;t chase listeners—it finds the stations nobody else bothers with.
                    The glitchy transmissions. The ghost signals. The offbeat gems broadcasting to empty rooms
                    at 3 AM.
                  </p>

                  <p className="leading-relaxed">
                    This is anti-algorithm radio. Always live. Never normal.
                  </p>

                  <p className="leading-relaxed">
                    Every station here is real, broadcasting right now from some forgotten corner of the world.
                    No playlists. No recommendations. Just pure, unfiltered discovery of sounds you never
                    knew existed.
                  </p>
                </div>

                <div className="border-t border-vdu-green/20 pt-6 mt-8">
                  <div className="text-sm text-vdu-green-dim space-y-2">
                    <p>Built by Z13labs</p>
                    <p>Contact: hello@z13labs.com</p>
                    <a href="/privacy" className="block text-vdu-green hover:text-vdu-green-dim underline">
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentStation && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <NowPlayingBar onMaximize={handleMaximizeStation} />
        </div>
      )}

      {fullscreenStation && (
        <FullscreenStation station={fullscreenStation} onClose={handleCloseFullscreen} />
      )}
    </div>
  )
}
