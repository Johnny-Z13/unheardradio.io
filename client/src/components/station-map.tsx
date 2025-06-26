import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Radio, Users, Globe } from 'lucide-react';
import { RadioStation } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { useAudioStore } from '@/lib/audio-store';
import { Button } from '@/components/ui/button';
import { getObscurityBadge } from '@/lib/radio-api';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
const defaultIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjMDBGRjAwIi8+Cjwvc3ZnPgo=',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

interface StationMapProps {
  onStationSelect?: (station: RadioStation) => void;
}

function MapBounds({ stations }: { stations: RadioStation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (stations && stations.length > 0) {
      const validStations = stations.filter(s => 
        s && 
        typeof s.geo_lat === 'number' && 
        typeof s.geo_long === 'number' &&
        s.geo_lat !== 0 && 
        s.geo_long !== 0 &&
        !isNaN(s.geo_lat) &&
        !isNaN(s.geo_long) &&
        Math.abs(s.geo_lat) <= 90 && 
        Math.abs(s.geo_long) <= 180
      );
      
      if (validStations.length > 0 && map) {
        try {
          const bounds = validStations.map(station => [station.geo_lat, station.geo_long] as [number, number]);
          map.fitBounds(bounds, { padding: [20, 20] });
        } catch (error) {
          console.warn('Error fitting map bounds:', error);
        }
      }
    }
  }, [stations, map]);
  
  return null;
}

export function StationMap({ onStationSelect }: StationMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const { playStation } = useAudioStore();
  
  const {
    data: stations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/stations', { country: selectedCountry, limit: 500 }],
    queryFn: () => fetchStations({ country: selectedCountry, limit: 500 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter stations with valid coordinates
  const validStations = stations.filter(station => 
    station && 
    typeof station.geo_lat === 'number' && 
    typeof station.geo_long === 'number' &&
    station.geo_lat !== 0 && 
    station.geo_long !== 0 && 
    !isNaN(station.geo_lat) &&
    !isNaN(station.geo_long) &&
    Math.abs(station.geo_lat) <= 90 && 
    Math.abs(station.geo_long) <= 180
  );

  const handlePlayStation = async (station: RadioStation) => {
    try {
      await playStation(station);
    } catch (error) {
      console.error('Failed to play station:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-vdu-green mx-auto mb-4" />
          <p className="text-vdu-green">Loading global transmissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">Map Signal Lost</div>
          <p className="text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load station locations'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Map Header */}
      <div className="p-3 md:p-4 bg-radio-black border-b border-vdu-green-dim">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg md:text-xl font-bold text-vdu-green font-serif truncate">Global Radio Map</h2>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              {validStations.length} stations • Zoom and click to explore
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
        {validStations.length > 0 ? (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className="w-full h-full bg-radio-black"
            style={{ height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapBounds stations={validStations} />
            
            {validStations.map((station) => {
              try {
                // Additional safety check for marker positioning
                if (!station || 
                    typeof station.geo_lat !== 'number' || 
                    typeof station.geo_long !== 'number' ||
                    isNaN(station.geo_lat) ||
                    isNaN(station.geo_long)) {
                  return null;
                }
                
                const position: [number, number] = [station.geo_lat, station.geo_long];
                const obscurityBadge = getObscurityBadge(station);
                
                return (
                  <Marker
                    key={station.stationuuid}
                    position={position}
                    icon={defaultIcon}
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
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-vdu-green-dim mx-auto mb-4" />
              <p className="text-vdu-green text-lg mb-2">No stations with location data</p>
              <p className="text-sm text-muted max-w-md mx-auto">
                The loaded stations don't have valid GPS coordinates for mapping.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}