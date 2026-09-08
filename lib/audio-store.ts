import { create } from 'zustand';
import { RadioStation, AudioState } from '@/types/radio';
import { trackStationClick } from './radio-api';
import { createPlaybackController, type PlayResult, type PlaybackStatus } from './playback-controller';

interface AudioStore extends AudioState {
  status: PlaybackStatus;
  history: RadioStation[];
  historyIndex: number;
  playPrevious: () => void;
  attempted: RadioStation[];
  armStation: (station: RadioStation) => void;
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
  playStation: (station: RadioStation, fromHistory?: boolean) => Promise<PlayResult>;
  togglePlay: () => void;
  stop: () => void;
  initializeAudio: () => void;
  initializeAudioContext: () => void;
  getFrequencyData: () => Uint8Array | null;
  cleanup: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => {
  let historyNavigation = false;
  const controller = createPlaybackController({
    getAudio: () => {
      if (!get().audio) get().initializeAudio();
      return get().audio!;
    },
    prepare: () => get().initializeAudioContext(),
    onState: ({ status, error }) => set({ status, error, isPlaying: status === 'playing', isLoading: status === 'loading' }),
    onStarted: (station) => {
      void trackStationClick(station.stationuuid);
      set(({ history }) => historyNavigation && history.some((s) => s.stationuuid === station.stationuuid)
        ? { historyIndex: history.findIndex((s) => s.stationuuid === station.stationuuid) }
        : { history: [station, ...history.filter((s) => s.stationuuid !== station.stationuuid)].slice(0, 10), historyIndex: 0 });
    },
  });
  return ({
  status: 'idle',
  history: [],
  historyIndex: 0,
  playPrevious: () => {
    const { history, historyIndex, currentStation } = get();
    const index = history[historyIndex]?.stationuuid === currentStation?.stationuuid ? historyIndex + 1 : historyIndex;
    if (history[index]) void get().playStation(history[index], true);
  },
  attempted: [],
  armStation: (station) => {
    controller.pause();
    set({ currentStation: station, status: 'ready', error: null, isLoading: false, isPlaying: false });
  },
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
    
    set({ audio });
  },

  playStation: async (station, fromHistory = false) => {
    historyNavigation = fromHistory;
    if (get().currentStation?.stationuuid === station.stationuuid && get().isPlaying) {
      controller.pause();
      return 'paused';
    }
    set(({ attempted }) => ({
      currentStation: station,
      ...(fromHistory ? { historyIndex: Math.max(0, get().history.findIndex((s) => s.stationuuid === station.stationuuid)) } : {}),
      attempted: attempted.some((s) => s.stationuuid === station.stationuuid) ? attempted : [...attempted, station],
    }));
    return controller.play(station);
  },

  togglePlay: () => {
    if (get().isPlaying || get().isLoading) {
      controller.pause();
    } else if (get().currentStation) {
      void get().playStation(get().currentStation!);
    }
  },

  stop: () => {
    controller.pause();
    set({ currentStation: null, status: 'idle', isPlaying: false, isLoading: false, error: null });
  },

  initializeAudioContext: () => {
    try {
      const { audio, audioSource, analyser, frequencyData } = get();
      if (!audio) return;

      const existingContext = get().audioContext;
      if (existingContext && existingContext.state !== 'closed') {
        if (existingContext.state === 'suspended') {
          void existingContext.resume().catch(() => {});
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
        void audioContext.resume().catch(() => {});
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
    controller.cancel();
    const { audio, audioContext, audioSource, analyser } = get();
    
    // Clean up audio element and all its event listeners
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
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
      status: 'idle',
      isPlaying: false,
      isLoading: false,
      error: null
    });
  },
});
});
