import { RadioStation, Country, Genre, SearchFilters } from "@/types/radio";

export async function fetchStations(filters: SearchFilters = {}, signal?: AbortSignal): Promise<RadioStation[]> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.country) params.append('country', filters.country);
  if (filters.genre) params.append('genre', filters.genre);
  if (filters.listenerFilter) params.append('listenerFilter', filters.listenerFilter);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  if (filters.randomSeed) params.append('randomSeed', filters.randomSeed);
  if (filters.farFromVisitor) params.append('farFromVisitor', 'true');
  if (filters.atlasMode) params.append('atlasMode', 'true');
  
  const response = await fetch(`/api/stations?${params}`, { signal });
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
  const clicks = station.clickcount;
  if (station.activityKnown === false || !Number.isFinite(clicks)) return { text: 'ACTIVITY UNKNOWN', color: 'chart-ink-dim' };
  return { text: clicks === 0 ? 'QUIET FREQUENCY' : clicks <= 5 ? 'LOW ACTIVITY' : 'ON THE DIAL', color: 'chart-ink' };
}

export function generateStationDescription(station: RadioStation): string {
  return [station.tags?.split(',')[0]?.trim(), 'radio', station.language ? `in ${station.language}` : '', station.country ? `from ${station.country}` : ''].filter(Boolean).join(' ');
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
