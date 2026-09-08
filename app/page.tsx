'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { SearchSidebar } from '@/components/search-sidebar'
import { DiscoveryList } from '@/components/discovery-list'
import { BookmarkList } from '@/components/bookmark-list'
import { NowPlayingBar } from '@/components/now-playing-bar'
import { FullscreenStation } from '@/components/fullscreen-station'
import { RadioStation, SearchFilters } from '@/types/radio'
import { useAudioStore } from '@/lib/audio-store'
import { fetchStationByUuid } from '@/lib/radio-api'
import { Discover, Filter, Log, Atlas, Info, Play } from '@/components/icons'

import { useRadioRoulette } from '@/hooks/use-radio-roulette'

const AtlasMap = dynamic(() => import('@/components/atlas/atlas-map'), { ssr: false })

type Tab = 'discover' | 'search' | 'saved' | 'map' | 'about'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    listenerFilter: 'low-to-high',
    limit: 20,
    offset: 0,
    randomSeed: Date.now().toString(36),
  })
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null)
  const roulette = useRadioRoulette()
  const [linkError, setLinkError] = useState<string | null>(null)

  const { currentStation, playStation, armStation } = useAudioStore()

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

  // A shared station is armed for an explicit tap, preserving browser media permissions.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uuid = params.get('station')
    if (!uuid) return

    let cancelled = false
    fetchStationByUuid(uuid)
      .then((station) => {
        if (cancelled) return
        if (!station) { setLinkError('This shared station is no longer listed. Try a new signal.'); return }
        armStation(station)
        setFullscreenStation(station)
        // Clean the URL so refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname)
      })
      .catch(() => { if (!cancelled) setLinkError('Could not load this shared station. Try a new signal.') })

    return () => { cancelled = true }
  }, [armStation])

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
    { id: 'map' as Tab, icon: Atlas, label: 'ATLAS', num: '01' },
    { id: 'discover' as Tab, icon: Discover, label: 'STATIONS', num: '02' },
    { id: 'search' as Tab, icon: Filter, label: 'FILTER', num: '03' },
    { id: 'saved' as Tab, icon: Log, label: 'SAVED', num: '04' },
    { id: 'about' as Tab, icon: Info, label: 'ABOUT', num: '05' },
  ]

  return (
    <div className="radio-shell h-dvh overflow-hidden bg-chart-bg text-chart-ink font-mono flex flex-col">
      <a href="#radio-main" className="skip-link">Skip to radio</a>
      <header className="shrink-0 border-b border-chart-line/50 px-3 sm:px-4 py-3 flex items-end justify-between gap-3">
        <div className="border border-chart-line px-2.5 py-2 font-display whitespace-nowrap text-[16px] sm:text-[22px] leading-none text-chart-ink-bright ink-glow tracking-[0.08em]">
          UNHEARD<span className="text-signal"> / </span>RADIO
        </div>
        <div className="text-right text-[10px] tracking-[0.12em] uppercase text-chart-ink-dim leading-relaxed">
          <div className="hidden sm:block">A receiver for the overlooked</div>
          <div className="hidden sm:block">
            <span className="text-chart-ink">{stats ? stats.stations.toLocaleString() : '…'}</span> stations
            <span className="opacity-50 px-1.5">·</span>
            <span className="text-chart-ink">{stats ? stats.countries : '…'}</span> countries
          </div>
          <a
            href="https://www.z13labs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:text-chart-ink transition-colors"
          >
            Made by Z13LABS
          </a>
        </div>
      </header>

      <nav aria-label="Radio views" className="shrink-0 border-b border-chart-line/50 overflow-x-auto">
        <div className="grid grid-cols-5 sm:flex sm:min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-center min-h-11 gap-2 px-2 sm:px-4 py-2.5 sm:py-3 border-r border-chart-line/50 transition-colors text-[11px] tracking-[0.12em] uppercase whitespace-nowrap ${
                  active
                    ? 'text-chart-ink-bright bg-chart-ink/[0.06] ink-glow border-b-2 border-b-signal'
                    : 'text-chart-ink-dim hover:text-chart-ink'
                }`}
                title={tab.label}
              >
                <Icon size={12} className="hidden sm:block" />

                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <main id="radio-main" tabIndex={-1} className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {activeTab === 'search' && (
          <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-chart-line/50 bg-chart-bg/50 h-full overflow-y-auto">
            <SearchSidebar
              initialFilters={searchFilters}
              onRefreshToDiscovery={handleRefreshToDiscovery}
              totalStations={stats?.stations ?? 0}
            />
          </div>
        )}

        <div className={`flex-1 min-h-0 relative overflow-hidden ${activeTab === 'search' ? 'hidden lg:block' : ''}`}>
          {activeTab === 'discover' && <DiscoveryList filters={searchFilters} />}
          {activeTab === 'saved' && <BookmarkList />}
          {activeTab === 'map' && (
            <div className="atlas-view h-full flex flex-col overflow-y-auto">
              <section className="tuning-console shrink-0 px-4 py-4 sm:px-7 sm:py-6 border-b border-chart-line">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="hidden sm:block text-[11px] text-signal uppercase tracking-[0.18em] mb-2">The quiet end of the dial</p>
                    <h1 className="text-xl sm:text-3xl font-medium text-chart-ink-bright tracking-tight">Somewhere, someone is broadcasting.</h1>
                    <p className="hidden sm:block text-sm text-chart-ink-dim mt-2 leading-relaxed">Step outside your usual frequencies. Find a sound you weren’t looking for.</p>
                  </div>
                  <div className="shrink-0 sm:max-w-[260px]">
                    <button className="receiver-button w-full" onClick={() => void roulette.tuneNext()} disabled={!roulette.canTune}>
                      <Play size={14} /> Tune somewhere unexpected
                    </button>
                    <p className="text-[11px] text-chart-ink-dim mt-2 min-h-4" role="status">
                      {roulette.isFetching ? 'Finding quiet signals…' : roulette.error ? 'The directory is unavailable.' : roulette.empty ? 'No fresh signals in this sweep.' : 'Few directory clicks. No repeats on Next.'}
                    </p>
                    {(roulette.error || roulette.empty) && <button className="text-xs underline underline-offset-4 text-chart-ink py-2" onClick={roulette.refresh}>Try a fresh sweep</button>}
                  </div>
                </div>
                {linkError && <p role="alert" className="text-xs text-danger mt-3">{linkError}</p>}
              </section>
              <div className="relative flex-1 min-h-[180px]">
                <AtlasMap onStationSelect={(station) => { void playStation(station) }} />
              </div>
            </div>
          )}
          {activeTab === 'search' && <DiscoveryList filters={searchFilters} />}
          {activeTab === 'about' && (
            <div className="h-full min-h-0 p-4 sm:p-6 overflow-y-auto overscroll-contain pb-28">
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4 ink-glow">UNHEARD RADIO</h1>
                  <p className="text-xl text-chart-ink-dim mb-6">
                    your portal to the strange side of sound
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-lg leading-relaxed">
                    Welcome to the underground. While everyone else feeds you the same popular frequencies,
                    we dig deeper into the weird, wonderful, and completely overlooked corners of global radio.
                  </p>

                  <p className="leading-relaxed">
                    We explore stations with very little recent activity in the RadioBrowser directory: at most five clicks in 24 hours and fifty directory votes. Those counts help us find overlooked entries; they do not measure how many people are listening.
                  </p>

                  <p className="leading-relaxed">
                    Live radio, with room for the unexpected.
                  </p>

                  <p className="leading-relaxed">
                    Streams are community-listed and checked by RadioBrowser. A passed check is a useful starting point, but a station can still go offline. If a signal cannot be received, try the next one. Your saved stations stay in this browser; recent history lasts for this visit.
                  </p>
                </div>

                <div className="border-t border-chart-line/50 pt-6 mt-8">
                  <div className="text-sm text-chart-ink-dim space-y-2">
                    <p>
                      Made by{' '}
                      <a href="https://www.z13labs.com" target="_blank" rel="noopener noreferrer" className="text-chart-ink hover:text-chart-ink-dim underline">
                        Z13LABS
                      </a>
                    </p>
                    <p>Contact: hello@z13labs.com</p>
                    <a href="/privacy" className="block text-chart-ink hover:text-chart-ink-dim underline">
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <div className="relative z-50 shrink-0 border-t border-chart-line bg-chart-panel-2">
        <NowPlayingBar onMaximize={handleMaximizeStation} onNext={() => void roulette.tuneNext()} canNext={roulette.canTune} />
      </div>

      {fullscreenStation && (
        <FullscreenStation station={fullscreenStation} onClose={handleCloseFullscreen} />
      )}
    </div>
  )
}
