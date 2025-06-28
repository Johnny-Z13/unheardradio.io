import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Create custom green marker icon
const greenIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.3 12.5 28.5 12.5 28.5S25 20.8 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#00FF00" stroke="#008800" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#008800"/>
    </svg>
  `),
  iconRetinaUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="50" height="82" viewBox="0 0 50 82" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 0C11.2 0 0 11.2 0 25c0 16.6 25 57 25 57S50 41.6 50 25C50 11.2 38.8 0 25 0z" fill="#00FF00" stroke="#008800" stroke-width="2"/>
      <circle cx="25" cy="25" r="12" fill="#008800"/>
    </svg>
  `),
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StationMapProps {
  onStationSelect?: (station: RadioStation) => void;
}

function StationLoader({ onStationsChange, onLoadingChange }: { 
  onStationsChange: (stations: RadioStation[]) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const { data: allStations = [], isLoading, error } = useQuery({
    queryKey: ['/api/stations', { limit: 5000 }],
    queryFn: () => fetchStations({ limit: 5000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (allStations.length > 0) {
      // Filter stations with valid coordinates
      const validStations = allStations.filter(station => 
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
      
      // Call with delay to prevent blocking UI
      setTimeout(() => {
        onStationsChange(validStations);
      }, 100);
    }
  }, [allStations, onStationsChange]);

  return null;
}

// Separate component for station markers to handle popup closing
function StationMarker({ 
  station, 
  position, 
  obscurityBadge, 
  onPlay, 
  onSelect 
}: {
  station: RadioStation;
  position: [number, number];
  obscurityBadge: { text: string; color: string };
  onPlay: (station: RadioStation, markerRef?: any) => void;
  onSelect?: (station: RadioStation) => void;
}) {
  const markerRef = useRef<any>(null);

  const handlePlayClick = () => {
    onPlay(station, markerRef.current);
  };

  return (
    <Marker ref={markerRef} position={position} icon={greenIcon}>
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
              onClick={handlePlayClick}
              size="sm"
              className="flex-1 bg-vdu-green text-radio-black hover:bg-vdu-green-bright text-xs"
            >
              <Radio className="w-3 h-3 mr-1" />
              Play
            </Button>
            {onSelect && (
              <Button
                onClick={() => onSelect(station)}
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
}

export function StationMap({ onStationSelect }: StationMapProps) {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const { playStation } = useAudioStore();
  
  const handleStationsChange = useCallback((newStations: RadioStation[]) => {
    // Throttle station updates to prevent UI blocking
    requestAnimationFrame(() => {
      setStations(newStations);
    });
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoadingStations(loading);
  }, []);

  // Memoize filtered stations to prevent re-filtering on every render
  const validStations = useMemo(() => {
    const filtered = stations.filter(station => 
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
    
    // Limit to 1000 markers to prevent browser freeze
    return filtered.slice(0, 1000);
  }, [stations]);

  const handlePlayStation = async (station: RadioStation, markerRef?: any) => {
    try {
      await playStation(station);
      // Close the popup after starting playback
      if (markerRef && markerRef.closePopup) {
        markerRef.closePopup();
      }
    } catch (error) {
      console.error('Failed to play station:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Map Header */}
      <div className="px-3 py-2 bg-radio-black border-b border-vdu-green-dim">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <h2 className="text-sm md:text-base font-bold text-vdu-green font-serif">Global Radio Map</h2>
            <span className="text-xs text-gray-400">
              {isLoadingStations ? (
                <span className="flex items-center">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Loading stations...
                </span>
              ) : (
                `${validStations.length} stations mapped by location`
              )}
            </span>
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
          
          <StationLoader onStationsChange={handleStationsChange} onLoadingChange={handleLoadingChange} />
          
          {validStations.map((station, index) => {
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
                <StationMarker 
                  key={station.stationuuid} 
                  station={station} 
                  position={position} 
                  obscurityBadge={obscurityBadge}
                  onPlay={handlePlayStation}
                  onSelect={onStationSelect}
                />
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