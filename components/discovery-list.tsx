import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Scan } from '@/components/icons';
import { RadioStation, SearchFilters } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { StationCard } from './station-card';
import { FullscreenStation } from './fullscreen-station';
import { Button } from '@/components/ui/button';

export function DiscoveryList({ filters }: { filters: SearchFilters }) {
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null);
  const [randomSeed, setRandomSeed] = useState(() => Date.now().toString(36));
  const canRandomise = filters.listenerFilter !== 'high-to-low';
  const activeFilters = { ...filters, randomSeed: canRandomise ? randomSeed : undefined };
  const strict = filters.listenerFilter === 'zero' || filters.listenerFilter === 'low-to-high';
  const limit = 20;
  const query = useInfiniteQuery({
    queryKey: ['stations', activeFilters],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => fetchStations({ ...activeFilters, limit, offset: pageParam }, signal),
    getNextPageParam: (lastPage, pages) => lastPage.length === limit ? pages.length * limit : undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const seen = new Set<string>();
  const stations = (query.data?.pages.flat() || []).filter((station) => {
    if (seen.has(station.stationuuid)) return false;
    seen.add(station.stationuuid);
    return true;
  });

  return (
    <div className="h-full min-h-0 p-4 md:p-6 overflow-y-auto overscroll-contain">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl text-chart-ink-bright tracking-tight">{strict ? 'The quiet frequencies' : 'Explore the directory'}</h2>
          <p className="text-xs text-chart-ink-dim mt-2 leading-relaxed">
            {strict ? 'At most 5 clicks in 24 hours · at most 50 directory votes' : 'RadioBrowser directory activity'}
            <br />Clicks are not listener counts. {stations.length} stations loaded.
          </p>
        </div>
        {canRandomise && <Button onClick={() => setRandomSeed(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)} variant="outline" disabled={query.isFetching} className="min-h-11 rounded-none text-xs shrink-0"><Scan size={14} className="mr-2" />Fresh sweep</Button>}
      </div>
      {query.isPending && <div className="py-16 text-center text-chart-ink-dim" role="status"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />Finding signals…</div>}
      {!query.isPending && !query.error && stations.length === 0 && <div className="border border-chart-line p-6 text-sm text-chart-ink-dim leading-relaxed" role="status"><h3 className="text-chart-ink-bright mb-2">No signals in this selection</h3>Clear your search or adjust the country and genre in Filter. We keep the activity limits even when the result is empty.</div>}
      <div className="space-y-3">{stations.map((station) => <div key={station.stationuuid} data-station-id={station.stationuuid}><StationCard station={station} onMaximize={() => setFullscreenStation(station)} /></div>)}</div>
      {query.error && <div role="alert" className="my-5 border border-danger p-4 text-sm"><p className="text-danger">Could not load {stations.length ? 'more stations' : 'the station directory'}.</p><button className="underline py-3" onClick={() => void (stations.length ? query.fetchNextPage() : query.refetch())}>Retry loading stations</button></div>}
      {query.hasNextPage && !query.error && <div className="text-center mt-6"><Button onClick={() => void query.fetchNextPage()} disabled={query.isFetching} variant="outline" className="min-h-11 rounded-none">{query.isFetchingNextPage ? 'Loading…' : 'Load more stations'}</Button></div>}
      {fullscreenStation && <FullscreenStation station={fullscreenStation} onClose={() => setFullscreenStation(null)} />}
    </div>
  );
}
