import { useState, useEffect } from 'react';
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
  const [listenerFilter, setListenerFilter] = useState<'all' | 'zero' | 'under10' | 'under50'>('all');
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

  useEffect(() => {
    const filters: SearchFilters = {
      search: search || undefined,
      country: country === 'all' ? undefined : country || undefined,
      genre: genre === 'all' ? undefined : genre || undefined,
      listenerFilter: listenerFilter !== 'all' ? listenerFilter : undefined,
      limit: 50,
      offset: 0,
    };
    
    onFiltersChange(filters);
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
            className="w-full bg-radio-black border-crt-dim text-crt-green placeholder-gray-500 focus:border-crt-green pr-10"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
        </div>

        {/* Obscurity Filters */}
        <div className="space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-amber uppercase tracking-wide">Obscurity Index</h3>
          <RadioGroup value={obscurity} onValueChange={setObscurity}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ultra" id="ultra" className="border-crt-green text-crt-green" />
              <Label htmlFor="ultra" className="text-xs md:text-sm">Ultra Rare (&lt;5 listeners)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rare" id="rare" className="border-crt-green text-crt-green" />
              <Label htmlFor="rare" className="text-xs md:text-sm">Rare (&lt;50 listeners)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hidden" id="hidden" className="border-crt-green text-crt-green" />
              <Label htmlFor="hidden" className="text-xs md:text-sm">Hidden Gems (&lt;500 listeners)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Location Filter */}
        <div className="space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-amber uppercase tracking-wide">Signal Origin</h3>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full bg-radio-black border-crt-dim text-crt-green focus:border-crt-green text-sm">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.iso_3166_1} value={c.name}>
                  {c.name} ({c.stationcount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genre Filter */}
        <div className="space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-amber uppercase tracking-wide">Genre</h3>
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-1 md:gap-2">
            {popularGenres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(genre === g ? 'all' : g)}
                className={`px-2 md:px-3 py-1 text-xs border transition-colors ${
                  genre === g
                    ? 'border-crt-green text-crt-green bg-crt-green bg-opacity-20'
                    : 'border-crt-dim hover:border-crt-green hover:text-crt-green'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-full bg-radio-black border-crt-dim text-crt-green focus:border-crt-green text-sm">
              <SelectValue placeholder="More genres..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((g) => (
                <SelectItem key={g.name} value={g.name}>
                  {g.name} ({g.stationcount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listener Count Filter */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-crt-dim">
          <h3 className="text-sm font-bold text-crt-green mb-3 md:mb-4 tracking-wide">OBSCURITY LEVEL</h3>
          
          <RadioGroup value={listenerFilter} onValueChange={(value) => setListenerFilter(value as any)}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" className="border-crt-dim text-crt-green" />
                <Label htmlFor="all" className="text-xs text-muted cursor-pointer">All stations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zero" id="zero" className="border-crt-dim text-crt-green" />
                <Label htmlFor="zero" className="text-xs text-crt-green cursor-pointer font-medium">Zero listeners only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="under10" id="under10" className="border-crt-dim text-crt-green" />
                <Label htmlFor="under10" className="text-xs text-muted cursor-pointer">Under 10 listeners</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="under50" id="under50" className="border-crt-dim text-crt-green" />
                <Label htmlFor="under50" className="text-xs text-muted cursor-pointer">Under 50 listeners</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Bookmarks */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-crt-dim">
          <button className="w-full px-3 md:px-4 py-2 border border-crt-dim text-crt-green hover:bg-crt-green hover:text-radio-black transition-all duration-200 relative group text-sm">
            <Radio className="inline-block w-4 h-4 mr-2" />
            <span>{bookmarkCount} Saved</span>
            <div className="absolute inset-0 bg-crt-green opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
        </div>


      </div>
    </aside>
  );
}
