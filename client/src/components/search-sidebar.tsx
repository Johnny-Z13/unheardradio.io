import { useState, useEffect, useMemo } from 'react';
import { Search, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { fetchCountries, fetchGenres } from '@/lib/radio-api';
import { SearchFilters, Country, Genre } from '@/types/radio';
import { useBookmarks } from '@/hooks/use-bookmarks';

interface SearchSidebarProps {
  onFiltersChange: (filters: SearchFilters) => void;
  totalStations: number;
}

export function SearchSidebar({ onFiltersChange, totalStations }: SearchSidebarProps) {
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
  
  const { data: genres = [] } = useQuery<Genre[]>({
    queryKey: ['/api/genres'],
    queryFn: () => fetchGenres(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  return (
    <aside className="w-full md:w-80 bg-radio-dark md:border-r border-b md:border-b-0 border-vdu-green-dim overflow-y-auto flex-shrink-0 h-auto md:h-full">
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-vdu-green tracking-tight">FILTERS</h2>
          <div className="text-right">
            <div className="text-xs text-muted font-medium">INDEXED</div>
            <div className="text-sm md:text-lg text-vdu-green font-black">{totalStations.toLocaleString()}</div>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-radio-black border-vdu-green-dim text-vdu-green placeholder-gray-500 focus:border-vdu-green pr-10"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
        </div>

        {/* Listener Count Filter */}
        <div className="space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-vdu-green uppercase tracking-wide">Listener Count</h3>
          <RadioGroup value={listenerFilter} onValueChange={(value) => setListenerFilter(value as any)}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" className="border-vdu-green-dim text-vdu-green" />
                <Label htmlFor="all" className="text-xs text-gray-300 cursor-pointer">All stations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zero" id="zero" className="border-vdu-green-dim text-vdu-green" />
                <Label htmlFor="zero" className="text-xs text-vdu-green cursor-pointer font-medium">0 listeners only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one" id="one" className="border-vdu-green-dim text-vdu-green" />
                <Label htmlFor="one" className="text-xs text-vdu-green cursor-pointer font-medium">Exactly 1 listener</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2-10" id="2-10" className="border-vdu-green-dim text-vdu-green" />
                <Label htmlFor="2-10" className="text-xs text-gray-300 cursor-pointer">2-10 listeners</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="under100" id="under100" className="border-vdu-green-dim text-vdu-green" />
                <Label htmlFor="under100" className="text-xs text-gray-300 cursor-pointer">Under 100 listeners</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Location Filter */}
        <div className="space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-vdu-green uppercase tracking-wide">Location</h3>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green text-sm">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent className="bg-radio-black border-vdu-green-dim">
              <SelectItem value="all">All Countries</SelectItem>
              {countries.slice(0, 50).map((c) => (
                <SelectItem key={c.iso_3166_1} value={c.name} className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20">
                  {c.name} ({c.stationcount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genre Filter */}
        <div className="space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-vdu-green uppercase tracking-wide">Genre</h3>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-full bg-radio-black border-vdu-green-dim text-vdu-green focus:border-vdu-green text-sm">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent className="bg-radio-black border-vdu-green-dim max-h-60 overflow-y-auto">
              <SelectItem value="all" className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20">All Genres</SelectItem>
              {genres.slice(0, 100).map((g) => (
                <SelectItem key={g.name} value={g.name} className="text-vdu-green hover:bg-vdu-green hover:bg-opacity-20">
                  {g.name} ({g.stationcount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>



        {/* Quick Filter Buttons */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-vdu-green-dim">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setListenerFilter('zero')}
              className={`px-3 py-2 text-xs border transition-colors ${
                listenerFilter === 'zero'
                  ? 'border-vdu-green text-vdu-green bg-vdu-green bg-opacity-20'
                  : 'border-vdu-green-dim text-gray-300 hover:border-vdu-green hover:text-vdu-green'
              }`}
            >
              Zero Listeners
            </button>
            <button 
              onClick={() => setListenerFilter('one')}
              className={`px-3 py-2 text-xs border transition-colors ${
                listenerFilter === 'one'
                  ? 'border-vdu-green text-vdu-green bg-vdu-green bg-opacity-20'
                  : 'border-vdu-green-dim text-gray-300 hover:border-vdu-green hover:text-vdu-green'
              }`}
            >
              1 Listener
            </button>
          </div>
        </div>


      </div>
    </aside>
  );
}
