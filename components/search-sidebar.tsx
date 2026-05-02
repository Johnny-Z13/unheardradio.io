import { useMemo, useState } from 'react';
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
}

export function SearchSidebar({ onRefreshToDiscovery, totalStations }: SearchSidebarProps) {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [genre, setGenre] = useState('');
  const [listenerFilter, setListenerFilter] = useState<'all' | 'zero' | 'hide-zero' | 'high-to-low' | 'low-to-high'>('low-to-high');

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
    <aside className="w-full lg:w-80 bg-radio-dark overflow-y-auto flex-shrink-0 h-auto lg:h-full">
      <div className="p-3 space-y-3">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[22px] leading-none text-vdu-green-bright phosphor tracking-[0.05em]">// FILTERS</h2>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="bg-vdu-green-bright text-radio-black hover:bg-vdu-green text-[10px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 h-auto rounded-none"
          >
            <Rescan size={12} className="mr-1.5" />
            APPLY
          </Button>
        </div>
        
        <div className="border-t border-b border-hairline py-2 flex items-baseline justify-between">
          <span className="text-[10px] tracking-[0.15em] uppercase text-vdu-green-dim">// Indexed</span>
          <span className="font-display text-[20px] leading-none text-vdu-green-bright">{totalStations.toLocaleString()}</span>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-radio-black border-vdu-green-dim text-vdu-green placeholder-gray-500 focus:border-vdu-green pr-8 h-8 text-sm"
          />
          <SearchIcon size={12} className="absolute right-2.5 top-2.5 text-vdu-green-dim" />
        </div>

        {/* Listener Count Filter - Compact Layout */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-vdu-green-dim uppercase tracking-[0.15em]">// AUDIENCE&nbsp;SIZE</h3>
          <Select value={listenerFilter} onValueChange={(value) => setListenerFilter(value as any)}>
            <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green h-8 text-xs">
              <SelectValue placeholder="All listener counts" />
            </SelectTrigger>
            <SelectContent className="bg-black border-vdu-green-dim backdrop-blur-none">
              <SelectItem value="zero" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs font-bold bg-black">Zero listeners only</SelectItem>
              <SelectItem value="hide-zero" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs bg-black">Hide zero listeners</SelectItem>
              <SelectItem value="high-to-low" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs bg-black">Listeners high to low</SelectItem>
              <SelectItem value="low-to-high" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs bg-black">Listeners low to high</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location and Genre Filters - Compact Grid */}
        <div className="grid grid-cols-1 gap-2">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-vdu-green-dim uppercase tracking-[0.15em]">// LOCATION</h3>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green h-8 text-xs">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent className="bg-black border-vdu-green-dim max-h-48 overflow-y-auto backdrop-blur-none">
                <SelectItem value="all" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs bg-black">All Countries</SelectItem>
                {countries.slice(0, 50).map((c) => (
                  <SelectItem key={c.iso_3166_1} value={c.name} className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs bg-black">
                    {c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name} ({c.stationcount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-vdu-green-dim uppercase tracking-[0.15em]">// GENRE</h3>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green h-8 text-xs">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent className="bg-black border-vdu-green-dim max-h-48 overflow-y-auto backdrop-blur-none">
                <SelectItem value="all" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs bg-black">All Genres</SelectItem>
                {genres.slice(0, 100).map((g) => (
                  <SelectItem key={g.name} value={g.name} className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs bg-black">
                    {g.name} ({g.stationcount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-3 pt-3 border-t border-hairline">
          <p className="text-[10px] tracking-[0.05em] uppercase text-vdu-green-dim leading-relaxed">
            Set filters · press <span className="text-vdu-green-bright">APPLY</span> · returns to SCAN feed
          </p>
        </div>


      </div>
    </aside>
  );
}
