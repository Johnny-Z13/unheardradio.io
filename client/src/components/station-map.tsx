import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Radio, Users, Globe } from 'lucide-react';
import { RadioStation } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { useAudioStore } from '@/lib/audio-store';
import { Button } from '@/components/ui/button';
import { getObscurityBadge } from '@/lib/radio-api';
import 'leaflet/dist/leaflet.css';

// Import Leaflet's default marker icons
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Use Leaflet's default icon (should be set up by the import above)

interface StationMapProps {
  onStationSelect?: (station: RadioStation) => void;
}

// Removed automatic bounds fitting to prevent zoom snapping

// Progressive loader - load stations in chunks to prevent browser freeze
function StationLoader({ onStationsChange }: { onStationsChange: (stations: RadioStation[]) => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load a reasonable number of stations for the map (reduced from 50,000 to 5,000)
  const { data: allStations = [] } = useQuery<RadioStation[]>({
    queryKey: ['/api/stations', { limit: 5000 }],
    queryFn: () => fetchStations({ limit: 5000 }),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    refetchOnWindowFocus: false,
    enabled: !isLoaded, // Only fetch once
  });

  useEffect(() => {
    if (allStations.length > 0 && !isLoaded) {
      // Use setTimeout to prevent blocking the UI thread
      setTimeout(() => {
        onStationsChange(allStations);
        setIsLoaded(true);
      }, 100);
    }
  }, [allStations, onStationsChange, isLoaded]);

  return null;
}

export function StationMap({ onStationSelect }: StationMapProps) {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const { playStation } = useAudioStore();
  
  const handleStationsChange = useCallback((newStations: RadioStation[]) => {
    setStations(newStations);
  }, []);

  // Memoize filtered stations to prevent re-filtering on every render
  const validStations = useMemo(() => stations.filter(station => 
    station && 
    typeof station.geo_lat === 'number' && 
    typeof station.geo_long === 'number' &&
    station.geo_lat !== 0 && 
    station.geo_long !== 0 && 
    !isNaN(station.geo_lat) &&
    !isNaN(station.geo_long) &&
    Math.abs(station.geo_lat) <= 90 && 
    Math.abs(station.geo_long) <= 180
  ), [stations]);





  const handlePlayStation = async (station: RadioStation) => {
    try {
      await playStation(station);
    } catch (error) {
      console.error('Failed to play station:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Map Header */}
      <div className="p-3 md:p-4 bg-radio-black border-b border-vdu-green-dim">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg md:text-xl font-bold text-vdu-green font-serif truncate">Global Radio Map</h2>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              {validStations.length} stations with coordinates • {stations.length} total loaded
            </p>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2 text-xs text-gray-400 flex-shrink-0">
            <Globe className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{stations.length} total</span>
            <span className="sm:hidden">{stations.length}</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          className="w-full h-full bg-radio-black"
          style={{ height: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          
          <StationLoader onStationsChange={handleStationsChange} />
          
          {validStations.map((station, index) => {
              try {
                // Additional safety check for marker positioning
                if (!station || 
                    typeof station.geo_lat !== 'number' || 
                    typeof station.geo_long !== 'number' ||
                    isNaN(station.geo_lat) ||
                    isNaN(station.geo_long)) {
                  console.log('Skipping station due to invalid coordinates:', station);
                  return null;
                }

                // Debug first few markers
                if (index < 3) {
                  console.log(`Rendering marker ${index}:`, {
                    name: station.name,
                    lat: station.geo_lat,
                    lng: station.geo_long,
                    position: [station.geo_lat, station.geo_long]
                  });
                }
                
                const position: [number, number] = [station.geo_lat, station.geo_long];
                const obscurityBadge = getObscurityBadge(station);
                
                return (
                  <Marker
                    key={station.stationuuid}
                    position={position}
                  >
                    <Popup className="custom-popup" maxWidth={300}>
                      <div className="bg-radio-black text-vdu-green p-3 rounded border border-vdu-green-dim">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-sm leading-tight pr-2">{station.name}</h3>
                          <span 
                            className={`px-2 py-1 rounded text-xs font-mono ${obscurityBadge.color}`}
                          >
                            {obscurityBadge.text}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-300 mb-3">
                          <div className="flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            {station.country}, {station.state}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {station.clickcount} clicks • {station.votes} votes
                          </div>
                          {station.tags && (
                            <div className="text-gray-400 truncate">
                              {station.tags.split(',').slice(0, 3).join(', ')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handlePlayStation(station)}
                            size="sm"
                            className="flex-1 bg-vdu-green text-radio-black hover:bg-vdu-green-bright text-xs"
                          >
                            <Radio className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                          {onStationSelect && (
                            <Button
                              onClick={() => onStationSelect(station)}
                              variant="outline"
                              size="sm"
                              className="border-vdu-green text-vdu-green hover:bg-vdu-green hover:text-radio-black text-xs"
                            >
                              Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              } catch (error) {
                console.warn('Error rendering station marker:', error, station);
                return null;
              }
            })}
        </MapContainer>
      </div>
    </div>
  );
}