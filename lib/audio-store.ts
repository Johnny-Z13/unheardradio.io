import { create } from 'zustand';
import { RadioStation, AudioState } from '@/types/radio';
import { trackStationClick } from './radio-api';

interface AudioStore extends AudioState {
  audio: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  audioSource: MediaElementAudioSourceNode | null;
  analyser: AnalyserNode | null;
  frequencyData: Uint8Array<ArrayBuffer> | null;
  setCurrentStation: (station: RadioStation | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  playStation: (station: RadioStation) => Promise<'playing' | 'blocked' | 'failed'>;
  togglePlay: () => void;
  stop: () => void;
  initializeAudio: () => void;
  initializeAudioContext: () => void;
  getFrequencyData: () => Uint8Array | null;
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
  audioSource: null,
  analyser: null,
  frequencyData: null,

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
      set({ isPlaying: true, isLoading: false, error: null });
    });
    
    audio.addEventListener('pause', () => {
      set({ isPlaying: false });
    });
    
    audio.addEventListener('error', () => {
      const errorMessage = 'Failed to load radio stream. This station may be offline.';
      set({ error: errorMessage, isLoading: false, isPlaying: false });
    });
    
    audio.addEventListener('ended', () => {
      set({ isPlaying: false });
    });
    
    set({ audio });
  },

  playStation: async (station) => {
    let { audio, currentStation, isPlaying } = get();
    
    if (!audio) {
      get().initializeAudio();
      // Get the audio element after initialization
      audio = get().audio;
      if (!audio) {
        console.warn('Failed to initialize audio element');
        return 'failed';
      }
    }
    
    // If same station is playing, just pause/play
    if (currentStation?.stationuuid === station.stationuuid && isPlaying) {
      audio.pause();
      return 'playing';
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
      
      // Try resolved URL first, then fallback to main URL
      const streamUrl = station.url_resolved || station.url;
      audio.src = streamUrl;
      audio.volume = get().volume;

      // Start playback before doing any network bookkeeping. In particular,
      // iOS/iPadOS only preserves a tap's media permission for the current
      // task; awaiting the click-tracking request first loses that gesture.
      void trackStationClick(station.stationuuid);
      await playWithTimeout(audio);
      set({ isLoading: false });
      return 'playing';
      
    } catch (playError) {
      // Safari blocks unprompted playback. Keep the selected station armed so
      // the visible player can start it with one explicit tap.
      if (playError instanceof DOMException && playError.name === 'NotAllowedError') {
        set({
          error: 'Tap play to receive this signal.',
          isLoading: false,
          isPlaying: false,
        });
        return 'blocked';
      }

      // Try fallback URL if available and different
      if (station.url_resolved && station.url_resolved !== station.url) {
        try {
          audio.src = station.url;
          await playWithTimeout(audio);
          set({ isLoading: false });
          return 'playing';
        } catch { /* stream fallback unavailable */ }
      }
      
      set({ 
        error: 'Failed to play station. This stream may be unavailable.',
        isLoading: false,
        isPlaying: false 
      });
      return 'failed';
    }
  },

  togglePlay: () => {
    const { audio, isPlaying, currentStation } = get();

    if (isPlaying) {
      audio?.pause();
      return;
    }

    // If the current station changed since the audio element last loaded a
    // stream, start it properly.
    const expectedSrc = currentStation ? (currentStation.url_resolved || currentStation.url) : null;
    if (currentStation && (!audio || audio.src !== expectedSrc)) {
      const loadedFallback = audio && currentStation ? audio.src === currentStation.url : false;
      if (!loadedFallback) {
        get().playStation(currentStation);
        return;
      }
    }

    if (!audio) return;

    // A blocked boot-time autoplay can leave the media element wired through
    // a suspended AudioContext. Resume both from this explicit user gesture;
    // otherwise the element reports `playing` while the analyser/output graph
    // remains silent until another station is selected.
    const audioContext = get().audioContext;
    if (audioContext?.state === 'suspended') {
      void audioContext.resume().catch(() => {
        set({ error: 'Failed to activate audio output', isPlaying: false });
      });
    }
    audio.play().catch(() => {
      set({ error: 'Failed to resume playback', isPlaying: false });
    });
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
      const { audio, audioSource, analyser, frequencyData } = get();
      if (!audio) return;

      const existingContext = get().audioContext;
      if (existingContext && existingContext.state !== 'closed') {
        if (existingContext.state === 'suspended') {
          existingContext.resume();
        }
        if (audioSource && analyser && frequencyData) return;
      }

      if (audioSource && analyser && frequencyData) {
        return;
      }

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = existingContext && existingContext.state !== 'closed'
        ? existingContext
        : new AudioContextCtor();
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const source = audioContext.createMediaElementSource(audio);
      const nextAnalyser = audioContext.createAnalyser();
      nextAnalyser.fftSize = 512;
      nextAnalyser.smoothingTimeConstant = 0.35;
      nextAnalyser.minDecibels = -90;
      nextAnalyser.maxDecibels = -10;

      source.connect(nextAnalyser);
      nextAnalyser.connect(audioContext.destination);

      set({
        audioContext,
        audioSource: source,
        analyser: nextAnalyser,
        frequencyData: new Uint8Array(new ArrayBuffer(nextAnalyser.frequencyBinCount)),
      });
      
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  },

  getFrequencyData: () => {
    const { analyser, frequencyData, isPlaying } = get();
    if (!isPlaying || !analyser || !frequencyData) return null;

    analyser.getByteFrequencyData(frequencyData);
    return frequencyData;
  },

  cleanup: () => {
    const { audio, audioContext, audioSource, analyser } = get();
    
    // Clean up audio element and all its event listeners
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // This removes all event listeners
      audio.remove();
    }
    
    // Clean up audio context
    try {
      audioSource?.disconnect();
      analyser?.disconnect();
    } catch (error) {
      console.warn('Error disconnecting audio graph:', error);
    }

    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
    }
    
    // Reset all state
    set({
      audio: null,
      audioContext: null,
      audioSource: null,
      analyser: null,
      frequencyData: null,
      currentStation: null,
      isPlaying: false,
      isLoading: false,
      error: null
    });
  },
}));

function playWithTimeout(audio: HTMLAudioElement, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error('Stream timed out')), timeoutMs)
    const onPlaying = () => finish()
    const onError = () => finish(new Error('Stream failed'))
    const finish = (error?: Error) => {
      window.clearTimeout(timeout)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('error', onError)
      if (error) reject(error)
      else resolve()
    }

    audio.addEventListener('playing', onPlaying, { once: true })
    audio.addEventListener('error', onError, { once: true })
    audio.play().catch((error) => finish(error))
  })
}
