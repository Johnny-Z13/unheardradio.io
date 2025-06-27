import { useState, useEffect, useCallback } from 'react';
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

// Removed automatic bounds fitting to prevent zoom snapping

// Simplified loading component - loads all stations once, filters client-side based on zoom
function ProgressiveStationLoader({ onStationsChange }: { onStationsChange: (stations: RadioStation[]) => void }) {
  const [zoomLevel, setZoomLevel] = useState(2);
  
  const map = useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
    },
  });

  // Load all stations once
  const { data: allStations = [] } = useQuery<RadioStation[]>({
    queryKey: ['/api/stations', { limit: 2000 }],
    queryFn: () => fetchStations({ limit: 2000 }),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Filter stations based on zoom level to control density
  const getVisibleStations = useCallback((stations: RadioStation[], zoom: number) => {
    if (!stations.length) return [];
    
    // Calculate how many stations to show based on zoom
    let maxStations: number;
    if (zoom >= 10) maxStations = 2000;      // City level - show all
    else if (zoom >= 8) maxStations = 1000;  // Urban area
    else if (zoom >= 6) maxStations = 500;   // Regional
    else if (zoom >= 4) maxStations = 200;   // Country
    else if (zoom >= 2) maxStations = 100;   // Continental
    else maxStations = 50;                   // World level
    
    // Return subset of stations for current zoom level
    return stations.slice(0, maxStations);
  }, []);

  const visibleStations = getVisibleStations(allStations, zoomLevel);

  useEffect(() => {
    onStationsChange(visibleStations);
  }, [visibleStations, onStationsChange]);

  return null;
}

export function StationMap({ onStationSelect }: StationMapProps) {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const { playStation } = useAudioStore();
  
  const handleStationsChange = useCallback((newStations: RadioStation[]) => {
    setStations(newStations);
  }, []);

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

  // Debug logging
  console.log('Map Debug:', {
    totalStations: stations.length,
    validStations: validStations.length,
    sampleStation: stations[0],
    sampleValidStation: validStations[0]
  });

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
              {validStations.length} stations • Zoom to adjust density
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
          
          <ProgressiveStationLoader onStationsChange={handleStationsChange} />
          
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
      </div>
    </div>
  );
}