import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '@/lib/audio-store';

interface AudioVisualizerProps {
  height?: number;
  barCount?: number;
  compact?: boolean;
}

export function AudioVisualizer({ height = 32, barCount = 40, compact = false }: AudioVisualizerProps) {
  const { isPlaying, volume, currentStation } = useAudioStore();
  const [audioData, setAudioData] = useState<number[]>([]);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize audio context and analyser
  useEffect(() => {
    if (isPlaying && currentStation) {
      try {
        // Try to get audio context from the audio element
        const audioElements = document.querySelectorAll('audio');
        const activeAudio = Array.from(audioElements).find(audio => !audio.paused);
        
        if (activeAudio && !analyserRef.current) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaElementSource(activeAudio);
          const analyser = audioContext.createAnalyser();
          
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch (error) {
        // Fallback to animated visualization if Web Audio API fails
        console.log('Web Audio API not available, using animated visualization');
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentStation]);

  // Animation loop for real-time audio analysis
  useEffect(() => {
    const animate = () => {
      if (analyserRef.current && dataArrayRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Process frequency data into bar heights
        const bars: number[] = [];
        const step = Math.floor(dataArrayRef.current.length / barCount);
        
        for (let i = 0; i < barCount; i++) {
          const start = i * step;
          const end = start + step;
          let sum = 0;
          for (let j = start; j < end && j < dataArrayRef.current.length; j++) {
            sum += dataArrayRef.current[j];
          }
          const average = sum / step;
          bars.push(average / 255); // Normalize to 0-1
        }
        
        setAudioData(bars);
      } else if (isPlaying) {
        // Fallback animated visualization
        const bars: number[] = [];
        for (let i = 0; i < barCount; i++) {
          const baseHeight = 0.1 + Math.sin(Date.now() * 0.005 + i * 0.2) * 0.3;
          const randomVariation = Math.random() * 0.4;
          bars.push(Math.max(0.05, baseHeight + randomVariation) * volume);
        }
        setAudioData(bars);
      } else {
        // Silent state
        setAudioData(new Array(barCount).fill(0.05));
      }
      
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animate();
    } else {
      setAudioData(new Array(barCount).fill(0.05));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, volume, barCount]);

  return (
    <div 
      className={`flex items-end justify-center space-x-1 ${compact ? 'space-x-0.5' : 'space-x-1'}`}
      style={{ height }}
    >
      {audioData.map((intensity, i) => (
        <div
          key={i}
          className={`${compact ? 'w-1' : 'w-1.5'} rounded-full transition-all duration-100 ${
            isPlaying
              ? intensity > 0.6
                ? 'bg-vdu-green-bright'
                : intensity > 0.3
                ? 'bg-vdu-green'
                : 'bg-vdu-green-dim'
              : 'bg-radio-dark opacity-50'
          }`}
          style={{
            height: `${Math.max(4, intensity * height)}px`,
            transition: isPlaying ? 'height 0.1s ease-out' : 'height 0.3s ease-out'
          }}
        />
      ))}
    </div>
  );
}