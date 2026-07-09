import { RadioStation, Country, Genre, SearchFilters } from "@/types/radio";

export async function fetchStations(filters: SearchFilters = {}): Promise<RadioStation[]> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.country) params.append('country', filters.country);
  if (filters.genre) params.append('genre', filters.genre);
  if (filters.listenerFilter) params.append('listenerFilter', filters.listenerFilter);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  if (filters.randomSeed) params.append('randomSeed', filters.randomSeed);
  
  const response = await fetch(`/api/stations?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch stations');
  }
  
  return response.json();
}

export async function fetchStationByUuid(stationUuid: string): Promise<RadioStation | null> {
  const response = await fetch(`/api/stations/${stationUuid}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error('Failed to fetch station');
  }

  return response.json();
}

export async function fetchCountries(): Promise<Country[]> {
  const response = await fetch('/api/countries');
  if (!response.ok) {
    throw new Error('Failed to fetch countries');
  }
  
  return response.json();
}

export async function fetchGenres(): Promise<Genre[]> {
  const response = await fetch('/api/genres');
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  
  return response.json();
}

export async function trackStationClick(stationUuid: string): Promise<void> {
  try {
    await fetch(`/api/stations/${stationUuid}/click`, {
      method: 'POST',
    });
  } catch (error) {
    console.warn('Failed to track station click:', error);
  }
}

export function getObscurityBadge(station: RadioStation): { text: string; color: string } {
  const clicks = station.clickcount || 0;
  
  if (clicks === 0) {
    return { text: 'PHANTOM', color: 'signal' };
  } else if (clicks < 5) {
    return { text: 'ULTRA RARE', color: 'chart-ink-bright' };
  } else if (clicks < 50) {
    return { text: 'RARE', color: 'chart-ink' };
  } else if (clicks < 500) {
    return { text: 'HIDDEN GEM', color: 'chart-ink' };
  } else {
    return { text: 'DISCOVERED', color: 'chart-ink-dim' };
  }
}

export function generateStationDescription(station: RadioStation): string {
  // Generate informative description based on station data
  const parts = [];
  
  if (station.tags) {
    const primaryGenre = station.tags.split(',')[0].trim();
    parts.push(`${primaryGenre} radio station`);
  } else {
    parts.push('Radio station');
  }
  
  if (station.language && station.language !== 'unknown') {
    parts.push(`broadcasting in ${station.language}`);
  }
  
  const listeners = parseInt(String(station.clickcount || 0)) || 0;
  if (listeners === 0) {
    parts.push('with zero listeners - completely undiscovered');
  } else if (listeners < 10) {
    parts.push(`with ${listeners} listener${listeners === 1 ? '' : 's'} - extremely obscure`);
  } else if (listeners < 50) {
    parts.push(`with ${listeners} listeners - very obscure`);
  }
  
  return parts.join(' ');
}

export function getTimeOnAir(station: RadioStation): string {
  if (!station.lastchangetime) return 'Unknown';
  
  const lastChange = new Date(station.lastchangetime);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) return 'Less than a day';
  if (diffInDays < 30) return `${diffInDays} days`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months`;
  return `${Math.floor(diffInDays / 365)} years`;
}

export function getStationPopularity(station: RadioStation): string {
  const clicks = station.clickcount || 0;
  const trend = station.clicktrend || 0;
  
  if (clicks === 0) return 'Undiscovered';
  if (clicks < 10) return 'Ultra rare';
  if (clicks < 100) return 'Rare find';
  if (clicks < 1000) return 'Underground';
  
  const trendText = trend > 0 ? ' (trending up)' : trend < 0 ? ' (trending down)' : '';
  return `Popular${trendText}`;
}

export function getStreamQuality(station: RadioStation): { quality: string; color: string } {
  const bitrate = station.bitrate || 0;
  
  if (bitrate >= 320) return { quality: 'STUDIO', color: 'chart-ink-bright' };
  if (bitrate >= 256) return { quality: 'HIGH', color: 'chart-ink' };
  if (bitrate >= 192) return { quality: 'GOOD', color: 'chart-ink' };
  if (bitrate >= 128) return { quality: 'STANDARD', color: 'chart-ink-dim' };
  if (bitrate > 0) return { quality: 'LOW', color: 'chart-ink-dim' };
  return { quality: 'UNKNOWN', color: 'chart-ink-dim' };
}
