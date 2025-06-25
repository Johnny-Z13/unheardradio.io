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
      limit: 50,
      offset: 0,
    };
    
    onFiltersChange(filters);
  }, [search, country, genre, obscurity, onFiltersChange]);

  const popularGenres = [
    'Ambient', 'Experimental', 'Field Recording', 'Drone', 'Numbers Station', 'Lo-Fi'
  ];

  return (
    <aside className={`${
      isCollapsed ? 'w-0 md:w-0' : 'w-full md:w-80'
    } bg-radio-gray border-r border-crt-dim transition-all duration-300 overflow-hidden md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto flex-shrink-0`}>
      
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed top-20 left-4 z-50 w-10 h-10 bg-radio-gray border border-crt-green text-crt-green flex items-center justify-center"
      >
        <Search className="w-4 h-4" />
      </button>

      <div className={`${isCollapsed ? 'hidden' : 'block'} p-4 md:p-6 space-y-4 md:space-y-6`}>
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-crt-green font-serif">Signal Scanner</h2>
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-400">Stations Indexed</div>
            <div className="text-lg text-crt-green font-bold">{totalStations.toLocaleString()}</div>
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

        {/* Bookmarks */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-crt-dim">
          <button className="w-full px-3 md:px-4 py-2 border border-crt-dim text-crt-green hover:bg-crt-green hover:text-radio-black transition-all duration-200 relative group text-sm">
            <Radio className="inline-block w-4 h-4 mr-2" />
            <span>{bookmarkCount} Saved</span>
            <div className="absolute inset-0 bg-crt-green opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
        </div>

        {/* Vintage radio imagery - hidden on mobile */}
        <div className="mt-6 md:mt-8 space-y-4 hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
            alt="Vintage radio control panel"
            className="w-full h-24 md:h-32 object-cover opacity-60 border border-crt-dim"
          />
          <div className="text-xs text-gray-500 font-serif italic">
            "Discovering hidden frequencies from around the world..."
          </div>
        </div>
      </div>
    </aside>
  );
}
