export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  lastchangetime: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  lastchecktime: string;
  lastcheckoktime: string;
  lastlocalchecktime: string;
  clicktimestamp: string;
  clickcount: number;
  clicktrend: number;
  ssl_error: number;
  geo_lat: number;
  geo_long: number;
}

export interface Country {
  name: string;
  iso_3166_1: string;
  stationcount: number;
}

export interface Genre {
  name: string;
  stationcount: number;
}

export interface SearchFilters {
  search?: string;
  country?: string;
  genre?: string;
  listenerFilter?: 'all' | 'zero' | 'hide-zero' | 'high-to-low' | 'low-to-high';
  limit?: number;
  offset?: number;
  randomSeed?: string;
  farFromVisitor?: boolean;
  atlasMode?: boolean;
  bookmarkedOnly?: boolean;
}

export interface AudioState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  isLoading: boolean;
  error: string | null;
}
