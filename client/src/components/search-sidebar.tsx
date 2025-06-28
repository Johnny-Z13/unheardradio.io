import { useState, useEffect, useMemo } from 'react';
import { Search, Radio, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { fetchCountries, fetchGenres } from '@/lib/radio-api';
import { SearchFilters, Country, Genre } from '@/types/radio';
import { useBookmarks } from '@/hooks/use-bookmarks';

interface SearchSidebarProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onRefreshToDiscovery: (filters: SearchFilters) => void;
  totalStations: number;
}

export function SearchSidebar({ onFiltersChange, onRefreshToDiscovery, totalStations }: SearchSidebarProps) {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [genre, setGenre] = useState('');
  const [listenerFilter, setListenerFilter] = useState<'all' | 'zero' | 'one' | '2-10' | 'under100'>('all');
  const [obscurity, setObscurity] = useState('rare');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { bookmarkCount } = useBookmarks();
  
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
    console.log('Raw genres count:', rawGenres.length);
    
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
    
    console.log('Filtered genres count:', musicGenres.length);
    
    // Sort by station count descending
    const sortedGenres = musicGenres.sort((a, b) => b.stationcount - a.stationcount).slice(0, 100);
    console.log('Top 5 genres:', sortedGenres.slice(0, 5).map(g => g.name));
    
    return sortedGenres;
  }, [rawGenres]);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filters: SearchFilters = {
        search: search || undefined,
        country: country === 'all' ? undefined : country || undefined,
        genre: genre === 'all' ? undefined : genre || undefined,
        listenerFilter: listenerFilter !== 'all' ? listenerFilter : undefined,
        limit: 50,
        offset: 0,
      };
      
      onFiltersChange(filters);
    }, search ? 500 : 0); // Debounce search by 500ms, immediate for other filters

    return () => clearTimeout(timeoutId);
  }, [search, country, genre, listenerFilter, obscurity, onFiltersChange]);

  const popularGenres = [
    'Ambient', 'Experimental', 'Field Recording', 'Drone', 'Numbers Station', 'Lo-Fi'
  ];

  const handleRefresh = () => {
    const currentFilters: SearchFilters = {
      search: search || undefined,
      country: country === 'all' ? undefined : country || undefined,
      genre: genre === 'all' ? undefined : genre || undefined,
      listenerFilter: listenerFilter !== 'all' ? listenerFilter : undefined,
      limit: 50,
      offset: 0,
    };
    onRefreshToDiscovery(currentFilters);
  };

  return (
    <aside className="w-full md:w-80 bg-radio-dark md:border-r border-b md:border-b-0 border-vdu-green-dim overflow-y-auto flex-shrink-0 h-auto md:h-full">
      <div className="p-3 space-y-3">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-vdu-green tracking-tight">FILTERS</h2>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="bg-vdu-green text-radio-black hover:bg-vdu-green-bright text-xs font-bold px-3 py-1 h-auto"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            APPLY
          </Button>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-muted font-medium">STATIONS INDEXED</div>
          <div className="text-sm text-vdu-green font-black">{totalStations.toLocaleString()}</div>
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
          <Search className="absolute right-2 top-2 h-3 w-3 text-gray-500" />
        </div>

        {/* Listener Count Filter - Compact Layout */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-vdu-green uppercase tracking-wide">Audience Size</h3>
          <Select value={listenerFilter} onValueChange={(value) => setListenerFilter(value as any)}>
            <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green h-8 text-xs">
              <SelectValue placeholder="All listener counts" />
            </SelectTrigger>
            <SelectContent className="bg-radio-black border-vdu-green-dim">
              <SelectItem value="all" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs">All stations</SelectItem>
              <SelectItem value="zero" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs font-bold">0 listeners ✓</SelectItem>
              <SelectItem value="under100" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs">Under 100 listeners ✓</SelectItem>
              <SelectItem value="one" className="text-gray-500 hover:bg-gray-700 hover:bg-opacity-20 text-xs">Exactly 1 listener (no data)</SelectItem>
              <SelectItem value="2-10" className="text-gray-500 hover:bg-gray-700 hover:bg-opacity-20 text-xs">2-10 listeners (no data)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location and Genre Filters - Compact Grid */}
        <div className="grid grid-cols-1 gap-2">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-vdu-green uppercase tracking-wide">Location</h3>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green h-8 text-xs">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent className="bg-radio-black border-vdu-green-dim max-h-48 overflow-y-auto">
                <SelectItem value="all" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs">All Countries</SelectItem>
                {countries.slice(0, 50).map((c) => (
                  <SelectItem key={c.iso_3166_1} value={c.name} className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs">
                    {c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name} ({c.stationcount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-vdu-green uppercase tracking-wide">Genre</h3>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green h-8 text-xs">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent className="bg-radio-black border-vdu-green-dim max-h-48 overflow-y-auto">
                <SelectItem value="all" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs">All Genres</SelectItem>
                {genres.slice(0, 100).map((g) => (
                  <SelectItem key={g.name} value={g.name} className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20 text-xs">
                    {g.name} ({g.stationcount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-3 pt-3 border-t border-vdu-green-dim">
          <p className="text-xs text-gray-400 leading-relaxed">
            Set filters and click <span className="text-vdu-green font-bold">APPLY</span> to search the discovery feed with your criteria.
          </p>
        </div>


      </div>
    </aside>
  );
}
