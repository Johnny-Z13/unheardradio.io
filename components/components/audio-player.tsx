import { useEffect } from 'react';
import { useAudioStore } from '@/lib/audio-store';

export function AudioPlayer() {
  const initializeAudio = useAudioStore((state) => state.initializeAudio);

  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  return null; // This component just manages the audio element
}
