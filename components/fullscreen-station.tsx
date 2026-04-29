import { useEffect } from 'react';
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { getObscurityBadge, generateStationDescription, getTimeOnAir, getStationPopularity, getStreamQuality } from '@/lib/radio-api';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
import { Close, Log, LogOn, Send, MapPin } from './icons';
import { getBand, getStationId, getCoords, getOrigin, getRate, getUptime } from '@/lib/station-format';

interface FullscreenStationProps {
  station: RadioStation;
  onClose: () => void;
}

export function FullscreenStation({ station, onClose }: FullscreenStationProps) {
  const {
    currentStation,
    isPlaying,
    volume,
    setVolume,
    isLoading,
    error
  } = useAudioStore();
  
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
  const isCurrentlyPlaying = isCurrentStation && isPlaying;
  
  const obscurityBadge = getObscurityBadge(station);
  const description = generateStationDescription(station);
  const timeOnAir = getTimeOnAir(station);
  const popularity = getStationPopularity(station);
  const streamQuality = getStreamQuality(station);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBookmark = () => {
    toggleBookmark(station);
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden w-screen h-screen">
      {/* Waterfall spectrogram backdrop */}
      <div className="absolute inset-x-0 top-0 h-60 opacity-50 pointer-events-none">
        <AudioVisualizer mode="waterfall" height={240} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, hsl(var(--background)) 100%)' }} />
      </div>

      {/* Top bar with controls */}
      <div className="relative z-10 flex items-center justify-between p-6 border-b border-vdu-green-dim">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-vdu-green text-radio-black flex items-center justify-center font-black text-xl">
            U
          </div>
          <div>
            <h1 className="text-2xl font-black text-vdu-green tracking-tight">UNHEARD RADIO</h1>
            <p className="text-sm text-muted font-medium">Fullscreen Mode</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="w-12 h-12 bg-radio-dark border-2 border-vdu-green-dim text-vdu-green hover:border-vdu-green hover:text-vdu-green-bright flex items-center justify-center transition-colors"
          >
            <Close size={18} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 p-2 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
          {/* Station info header */}
          <div className="text-center mb-3">
            <h2 className="text-2xl md:text-3xl font-black text-vdu-green tracking-tight mb-1 uppercase">
              {station.name}
            </h2>
            <p className="text-sm md:text-base text-muted font-medium mb-2">
              Broadcasting from {station.country}
            </p>
            
            {/* Status indicators */}
            <div className="flex items-center justify-center space-x-2 mb-2">
              {isCurrentStation && (
                <div className="inline-flex items-center space-x-1 px-2 py-1 bg-accent-cyan text-radio-black text-xs font-black">
                  <div className="w-1 h-1 bg-radio-black animate-pulse" />
                  <span>NOW PLAYING</span>
                </div>
              )}
              <div className={`px-2 py-1 text-xs font-black text-radio-black ${
                obscurityBadge.color === 'signal-blue' ? 'bg-vdu-green-bright' :
                obscurityBadge.color === 'crt-green' ? 'bg-vdu-green' :
                obscurityBadge.color === 'tape-orange' ? 'bg-accent-cyan' :
                'bg-vdu-green-dim'
              }`}>
                {obscurityBadge.text}
              </div>
            </div>
          </div>

          {/* Trace visualizer (smaller, integrated with metadata) */}
          <div className="mb-3 max-w-md mx-auto">
            <AudioVisualizer mode="trace" height={36} />
          </div>

          {/* Comprehensive metadata grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 w-full flex-1 min-h-0">
            {/* Location & Broadcasting */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <MapPin size={12} className="text-vdu-green" />
                <h3 className="text-xs font-black text-vdu-green">LOCATION</h3>
              </div>
              <div className="space-y-0.5 text-xs">
                <div>
                  <span className="text-vdu-green-dim font-bold">Country:</span>
                  <span className="ml-2 text-muted">{station.country}</span>
                </div>
                {station.state && station.state !== station.country && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">State:</span>
                    <span className="ml-2 text-muted">{station.state}</span>
                  </div>
                )}
                <div>
                  <span className="text-vdu-green-dim font-bold">Language:</span>
                  <span className="ml-2 text-muted">{station.language || 'Unknown'}</span>
                </div>
                {station.geo_lat && station.geo_long && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Coordinates:</span>
                    <span className="ml-2 text-accent-cyan text-xs">
                      {station.geo_lat.toFixed(3)}°, {station.geo_long.toFixed(3)}°
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Popularity & Metrics */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <h3 className="text-xs font-black text-vdu-green">METRICS</h3>
              </div>
              <div className="space-y-0.5 text-xs">
                <div>
                  <span className="text-vdu-green-dim font-bold">Listeners:</span>
                  <span className="ml-2 text-muted">{station.clickcount || 0}</span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Popularity:</span>
                  <span className="ml-2 text-muted">{popularity}</span>
                </div>
                {station.votes > 0 && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Votes:</span>
                    <span className="ml-2 text-accent-cyan">★ {station.votes}</span>
                  </div>
                )}
                {station.clicktrend !== 0 && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Trend:</span>
                    <span className={`ml-2 ${station.clicktrend > 0 ? 'text-vdu-green' : 'text-accent-cyan'}`}>
                      {station.clicktrend > 0 ? '↗ Rising' : '↘ Falling'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <h3 className="text-xs font-black text-vdu-green">TECHNICAL</h3>
              </div>
              <div className="space-y-0.5 text-xs">
                <div>
                  <span className="text-vdu-green-dim font-bold">Bitrate:</span>
                  <span className="ml-2 text-muted">
                    {station.bitrate ? `${station.bitrate} kbps` : 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Codec:</span>
                  <span className="ml-2 text-muted">{station.codec || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Quality:</span>
                  <span className={`ml-2 font-bold text-${streamQuality.color}`}>
                    {streamQuality.quality}
                  </span>
                </div>
                {station.hls === 1 && (
                  <div className="text-accent-cyan">✓ HLS Stream</div>
                )}
                {station.ssl_error === 0 && (
                  <div className="text-vdu-green">✓ Secure SSL</div>
                )}
              </div>
            </div>

            {/* Broadcasting Info */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <h3 className="text-xs font-black text-vdu-green">BROADCAST</h3>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-vdu-green-dim font-bold">Genre:</span>
                  <span className="ml-2 text-muted">
                    {station.tags ? station.tags.split(',')[0] : 'Various'}
                  </span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">On Air:</span>
                  <span className="ml-2 text-muted">{timeOnAir}</span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Status:</span>
                  <span className={`ml-2 ${station.lastcheckok === 1 ? 'text-vdu-green' : 'text-accent-cyan'}`}>
                    {station.lastcheckok === 1 ? 'Online' : 'Unverified'}
                  </span>
                </div>
                {station.lastchecktime && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Last Check:</span>
                    <span className="ml-2 text-muted text-xs">
                      {new Date(station.lastchecktime).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Website & Organization */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <MapPin size={12} className="text-vdu-green" />
                <h3 className="text-xs font-black text-vdu-green">WEBSITE</h3>
              </div>
              <div className="space-y-0.5 text-xs">
                {station.homepage ? (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Homepage:</span>
                    <div className="mt-1">
                      <a 
                        href={station.homepage} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-accent-cyan hover:text-vdu-green underline break-all text-xs"
                      >
                        {station.homepage.replace(/^https?:\/\//, '').slice(0, 25)}...
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Homepage:</span>
                    <span className="ml-2 text-muted">Not available</span>
                  </div>
                )}
                {station.favicon && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Logo:</span>
                    <span className="ml-2 text-vdu-green">Available</span>
                  </div>
                )}
                <div>
                  <span className="text-vdu-green-dim font-bold">Stream URL:</span>
                  <div className="mt-1 text-xs text-muted break-all">
                    {station.url.slice(0, 30)}...
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Data */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <h3 className="text-xs font-black text-vdu-green">HISTORY</h3>
              </div>
              <div className="space-y-0.5 text-xs">
                {station.lastchangetime && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Last Updated:</span>
                    <div className="mt-1 text-muted text-xs">
                      {new Date(station.lastchangetime).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {station.clicktimestamp && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">Last Played:</span>
                    <div className="mt-1 text-muted text-xs">
                      {new Date(station.clicktimestamp).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-vdu-green-dim font-bold">Station ID:</span>
                  <div className="mt-1 text-accent-cyan text-xs font-mono">
                    {station.stationuuid.slice(0, 8)}...
                  </div>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Country Code:</span>
                  <span className="ml-2 text-muted">{station.countrycode || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Content & Tags */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <h3 className="text-xs font-black text-vdu-green">CONTENT</h3>
              </div>
              <div className="space-y-0.5 text-xs">
                <div>
                  <span className="text-vdu-green-dim font-bold">Primary Genre:</span>
                  <span className="ml-2 text-muted">
                    {station.tags ? station.tags.split(',')[0].trim() : 'Various'}
                  </span>
                </div>
                {station.tags && station.tags.includes(',') && (
                  <div>
                    <span className="text-vdu-green-dim font-bold">All Tags:</span>
                    <div className="mt-1 text-xs text-muted">
                      {station.tags.split(',').slice(1, 3).map(tag => tag.trim()).join(', ')}
                      {station.tags.split(',').length > 3 && '...'}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-vdu-green-dim font-bold">Discovery:</span>
                  <span className="ml-2 text-accent-cyan">Obscure Signal</span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Network:</span>
                  <span className="ml-2 text-muted">Independent</span>
                </div>
              </div>
            </div>

            {/* Stream Details */}
            <div className="bg-radio-dark p-2 border border-vdu-green-dim">
              <div className="flex items-center space-x-1 mb-1">
                <h3 className="text-xs font-black text-vdu-green">STREAM</h3>
              </div>
              <div className="space-y-0.5 text-xs">
                <div>
                  <span className="text-vdu-green-dim font-bold">Protocol:</span>
                  <span className="ml-2 text-muted">
                    {station.url.startsWith('https') ? 'HTTPS' : 'HTTP'}
                  </span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Format:</span>
                  <span className="ml-2 text-muted">
                    {station.url.includes('.m3u') ? 'Playlist' : 'Direct Stream'}
                  </span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Reliability:</span>
                  <span className={`ml-2 ${station.lastcheckok === 1 ? 'text-vdu-green' : 'text-accent-cyan'}`}>
                    {station.lastcheckok === 1 ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div>
                  <span className="text-vdu-green-dim font-bold">Access:</span>
                  <span className="ml-2 text-vdu-green">Public</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-2 mt-1">
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-1 px-3 py-1 border font-bold text-xs transition-all ${
                isBookmarked(station.stationuuid)
                  ? 'border-vdu-green bg-vdu-green text-radio-black'
                  : 'border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green'
              }`}
            >
              {isBookmarked(station.stationuuid) ? <LogOn size={12} /> : <Log size={12} />}
              <span>{isBookmarked(station.stationuuid) ? 'SAVED' : 'SAVE'}</span>
            </button>
            
            <ShareMenu
              station={station}
              iconClassName="flex items-center space-x-1 px-3 py-1 border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all font-bold text-xs"
              trigger={<><Send size={12} /><span>SEND</span></>}
            />

            {station.homepage && (
              <a
                href={station.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1 border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all font-bold text-xs"
              >
                <MapPin size={12} />
                <span>SITE</span>
              </a>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-3 p-3 bg-radio-dark border border-accent-cyan text-center">
              <p className="text-xs text-accent-cyan font-bold">⚠ {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}