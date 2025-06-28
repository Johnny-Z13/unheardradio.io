import { create } from 'zustand';
import { RadioStation, AudioState } from '@/types/radio';
import { trackStationClick } from './radio-api';

interface AudioStore extends AudioState {
  audio: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  setCurrentStation: (station: RadioStation | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  playStation: (station: RadioStation) => Promise<void>;
  togglePlay: () => void;
  stop: () => void;
  initializeAudio: () => void;
  initializeAudioContext: () => void;
  cleanup: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  currentStation: null,
  isPlaying: false,
  volume: 0.75,
  isLoading: false,
  error: null,
  audio: null,
  audioContext: null,

  setCurrentStation: (station) => set({ currentStation: station }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => {
    set({ volume });
    const { audio } = get();
    if (audio) {
      audio.volume = volume;
    }
  },
  setError: (error) => set({ error }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  initializeAudio: () => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audio.id = 'main-audio-player';
    
    audio.addEventListener('loadstart', () => {
      set({ isLoading: true, error: null });
    });
    
    audio.addEventListener('canplay', () => {
      set({ isLoading: false });
    });
    
    audio.addEventListener('play', () => {
      set({ isPlaying: true });
    });
    
    audio.addEventListener('pause', () => {
      set({ isPlaying: false });
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      const errorMessage = 'Failed to load radio stream. This station may be offline.';
      set({ error: errorMessage, isLoading: false, isPlaying: false });
    });
    
    audio.addEventListener('ended', () => {
      set({ isPlaying: false });
    });
    
    set({ audio });
  },

  playStation: async (station) => {
    const { audio, currentStation, isPlaying } = get();
    
    if (!audio) {
      get().initializeAudio();
      return;
    }
    
    // If same station is playing, just pause/play
    if (currentStation?.stationuuid === station.stationuuid && isPlaying) {
      audio.pause();
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      // Stop current playback
      audio.pause();
      audio.currentTime = 0;
      
      // Set new station
      set({ currentStation: station });
      
      // Initialize audio context for visualizer on first play
      get().initializeAudioContext();
      
      // Track click for RadioBrowser
      await trackStationClick(station.stationuuid);
      
      // Try resolved URL first, then fallback to main URL
      const streamUrl = station.url_resolved || station.url;
      audio.src = streamUrl;
      audio.volume = get().volume;
      
      await audio.play();
      set({ isLoading: false });
      
    } catch (error) {
      console.error('Error playing station:', error);
      
      // Try fallback URL if available and different
      if (station.url_resolved && station.url_resolved !== station.url) {
        try {
          audio.src = station.url;
          await audio.play();
          set({ isLoading: false });
          return;
        } catch (fallbackError) {
          console.error('Fallback URL also failed:', fallbackError);
        }
      }
      
      set({ 
        error: 'Failed to play station. This stream may be unavailable.',
        isLoading: false,
        isPlaying: false 
      });
    }
  },

  togglePlay: () => {
    const { audio, isPlaying } = get();
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error('Error resuming playback:', error);
        set({ error: 'Failed to resume playback', isPlaying: false });
      });
    }
  },

  stop: () => {
    const { audio } = get();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    set({ currentStation: null, isPlaying: false });
  },

  initializeAudioContext: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      set({ audioContext });
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      console.log('Audio context initialized for visualizer');
    } catch (error) {
      console.log('Failed to initialize audio context:', error);
    }
  },

  cleanup: () => {
    const { audio, audioContext } = get();
    
    // Clean up audio element and all its event listeners
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // This removes all event listeners
      audio.remove();
    }
    
    // Clean up audio context
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (error) {
        console.log('Error closing audio context:', error);
      }
    }
    
    // Reset all state
    set({
      audio: null,
      audioContext: null,
      currentStation: null,
      isPlaying: false,
      isLoading: false,
      error: null
    });
  },
}));
