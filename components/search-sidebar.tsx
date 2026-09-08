import { useMemo, useState, useRef } from 'react';
import { Search as SearchIcon, Rescan } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchCountries, fetchGenres } from '@/lib/radio-api';
import { SearchFilters, Country, Genre } from '@/types/radio';

interface SearchSidebarProps {
  onRefreshToDiscovery: (filters: SearchFilters) => void;
  totalStations: number;
  initialFilters: SearchFilters;
}

export function SearchSidebar({ onRefreshToDiscovery, totalStations, initialFilters }: SearchSidebarProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [country, setCountry] = useState(initialFilters.country || '');
  const [genre, setGenre] = useState(initialFilters.genre || '');
  const [listenerFilter, setListenerFilter] = useState<'all' | 'zero' | 'hide-zero' | 'high-to-low' | 'low-to-high'>(initialFilters.listenerFilter || 'all');
  const searchInput = useRef<HTMLInputElement>(null);

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['/api/countries'],
    queryFn: () => fetchCountries(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: rawGenres = [] } = useQuery<Genre[]>({
    queryKey: ['/api/genres'],
    queryFn: () => fetchGenres(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter and sort genres to show music categories, not technical specs
  const genres = useMemo(() => {
    const musicGenres = rawGenres.filter(genre => {
      const name = genre.name.toLowerCase();
      
      // Exclude obvious technical/frequency data but keep music genres
      const isNotTechnical = !name.includes('kbit') && 
        !name.includes('kbps') && 
        !name.includes('http') &&
        !name.match(/^\d+\.\d+ fm$/) && // Exact frequency like "101.3 fm"
        !name.match(/^\d+ am$/) && // Exact frequency like "570 am"
        genre.stationcount >= 3; // Has some station count
      
      return isNotTechnical;
    });
    
    // Sort by station count descending
    return musicGenres.sort((a, b) => b.stationcount - a.stationcount).slice(0, 100);
  }, [rawGenres]);

  const buildFilters = (): SearchFilters => ({
    search: search || undefined,
    country: country === 'all' ? undefined : country || undefined,
    genre: genre === 'all' ? undefined : genre || undefined,
    listenerFilter: listenerFilter !== 'all' ? listenerFilter : undefined,
    limit: 50,
    offset: 0,
  });

  const handleRefresh = () => {
    onRefreshToDiscovery(buildFilters());
  };

  return (
    <aside className="w-full lg:w-80 bg-chart-panel overflow-y-auto flex-shrink-0 h-auto lg:h-full">
      <div className="p-3 space-y-3">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[22px] leading-none text-chart-ink-bright ink-glow tracking-[0.05em]">// FILTERS</h2>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="bg-chart-ink-bright text-chart-bg hover:bg-chart-ink text-[10px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 h-auto rounded-none"
          >
            <Rescan size={12} className="mr-1.5" />
            APPLY
          </Button>
        </div>
        
        <div className="border-t border-b border-chart-line/50 py-2 flex items-baseline justify-between">
          <span className="text-[10px] tracking-[0.15em] uppercase text-chart-ink-dim">// Indexed</span>
          <span className="font-display text-[20px] leading-none text-chart-ink-bright">{totalStations.toLocaleString()}</span>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Input
            ref={searchInput}
            aria-label="Search stations"
            type="search"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRefresh(); }}
            placeholder="Search stations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-chart-bg border-chart-line text-chart-ink placeholder-gray-500 focus:border-chart-ink-dim pr-8 h-11 text-sm"
          />
          {search ? <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); searchInput.current?.focus(); }} className="absolute right-1 top-0 h-11 w-11 text-chart-ink">×</button> : <SearchIcon size={12} className="absolute right-3 top-4 text-chart-ink-dim" />}
        </div>

        {/* Listener Count Filter - Compact Layout */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-chart-ink-dim uppercase tracking-[0.15em]">// DIRECTORY&nbsp;ACTIVITY</h3>
          <Select value={listenerFilter} onValueChange={(value) => setListenerFilter(value as NonNullable<SearchFilters['listenerFilter']>)}>
            <SelectTrigger aria-label="Directory activity" className="w-full bg-chart-bg border-chart-line text-chart-ink focus:border-chart-ink-dim h-11 text-xs">
              <SelectValue placeholder="Recent clicks" />
            </SelectTrigger>
            <SelectContent className="bg-chart-bg border-chart-line backdrop-blur-none">
              <SelectItem value="all">All directory activity</SelectItem>
              <SelectItem value="zero" className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs font-bold bg-chart-bg">Zero recent clicks</SelectItem>
              <SelectItem value="hide-zero" className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs bg-chart-bg">Active directory entries</SelectItem>
              <SelectItem value="high-to-low" className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs bg-chart-bg">Most clicked (wider directory)</SelectItem>
              <SelectItem value="low-to-high" className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs bg-chart-bg">Deep cuts (≤5 clicks, ≤50 votes)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location and Genre Filters - Compact Grid */}
        <div className="grid grid-cols-1 gap-2">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-chart-ink-dim uppercase tracking-[0.15em]">// LOCATION</h3>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger aria-label="Country" className="w-full bg-chart-bg border-chart-line text-chart-ink focus:border-chart-ink-dim h-11 text-xs">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent className="bg-chart-bg border-chart-line max-h-48 overflow-y-auto backdrop-blur-none">
                <SelectItem value="all" className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs bg-chart-bg">All Countries</SelectItem>
                {countries.slice(0, 50).map((c) => (
                  <SelectItem key={c.iso_3166_1} value={c.name} className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs bg-chart-bg">
                    {c.name} ({c.stationcount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-chart-ink-dim uppercase tracking-[0.15em]">// GENRE</h3>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger aria-label="Genre" className="w-full bg-chart-bg border-chart-line text-chart-ink focus:border-chart-ink-dim h-11 text-xs">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent className="bg-chart-bg border-chart-line max-h-48 overflow-y-auto backdrop-blur-none">
                <SelectItem value="all" className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs bg-chart-bg">All Genres</SelectItem>
                {genres.slice(0, 100).map((g) => (
                  <SelectItem key={g.name} value={g.name} className="text-chart-ink hover:bg-chart-ink/[0.06] text-xs bg-chart-bg">
                    {g.name} ({g.stationcount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-3 pt-3 border-t border-chart-line/50">
          <p className="text-[10px] tracking-[0.05em] uppercase text-chart-ink-dim leading-relaxed">
            Set filters · press <span className="text-chart-ink-bright">APPLY</span> · returns to SCAN feed
          </p>
        </div>


      </div>
    </aside>
  );
}
