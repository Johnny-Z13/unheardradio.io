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
  const [peaks, setPeaks] = useState<number[]>([]);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const lastUpdateTime = useRef<number>(0);

  // Initialize audio context and analyser
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isPlaying && currentStation && !analyserRef.current) {
      // Small delay to ensure audio element is ready
      timeoutId = setTimeout(() => {
        try {
          const activeAudio = document.getElementById('main-audio-player') as HTMLAudioElement;
          
          if (activeAudio && activeAudio.src && !activeAudio.paused) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Ensure audio context is running
            if (audioContext.state === 'suspended') {
              audioContext.resume();
            }
            
            const source = audioContext.createMediaElementSource(activeAudio);
            const analyser = audioContext.createAnalyser();
            
            // Optimized settings for real-time visualization
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.1;
            analyser.minDecibels = -80;
            analyser.maxDecibels = -20;
            
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            analyserRef.current = analyser;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
            
            console.log('Audio visualizer connected to stream');
          }
        } catch (error) {
          console.log('Web Audio API setup failed:', error);
        }
      }, 500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentStation]);

  // Enhanced animation loop for EQ-style visualization
  useEffect(() => {
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastUpdateTime.current;
      lastUpdateTime.current = currentTime;

      if (analyserRef.current && dataArrayRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        const bars: number[] = [];
        const newPeaks: number[] = [];
        const dataLength = dataArrayRef.current.length;
        
        for (let i = 0; i < barCount; i++) {
          // Group frequency bins for each bar
          const binStart = Math.floor((i / barCount) * dataLength);
          const binEnd = Math.floor(((i + 1) / barCount) * dataLength);
          
          // Average the frequency data for this bar
          let sum = 0;
          for (let j = binStart; j < binEnd; j++) {
            sum += dataArrayRef.current[j];
          }
          const average = sum / (binEnd - binStart);
          
          // Normalize to 0-1 range with amplification for visibility
          let normalizedValue = (average / 255) * 3; // Triple amplification
          normalizedValue = Math.min(normalizedValue, 1.0);
          
          // Ensure minimum visibility when audio is playing
          normalizedValue = Math.max(normalizedValue, 0.02);
          
          // Peak tracking
          const currentPeak = peaks[i] || 0;
          const newPeak = Math.max(normalizedValue, currentPeak * 0.88);
          
          bars.push(normalizedValue);
          newPeaks.push(newPeak);
        }
        
        setAudioData(bars);
        setPeaks(newPeaks);
        
      } else if (isPlaying) {
        // Enhanced fallback with realistic EQ behavior
        const bars: number[] = [];
        const newPeaks: number[] = [];
        const time = currentTime * 0.003;
        
        for (let i = 0; i < barCount; i++) {
          // Simulate realistic frequency spectrum
          let intensity = 0;
          
          if (i < barCount * 0.15) {
            // Bass - slower, deeper movements
            intensity = 0.3 + Math.sin(time * 0.8 + i * 0.3) * 0.4;
          } else if (i < barCount * 0.4) {
            // Low-mid - moderate movement
            intensity = 0.25 + Math.sin(time * 1.2 + i * 0.4) * 0.35;
          } else if (i < barCount * 0.7) {
            // High-mid - more active
            intensity = 0.2 + Math.sin(time * 1.6 + i * 0.5) * 0.45;
          } else {
            // Treble - quick, sparkly movement
            intensity = 0.15 + Math.sin(time * 2.4 + i * 0.8) * 0.4;
          }
          
          // Add some randomness for realism
          intensity += (Math.random() - 0.5) * 0.15;
          intensity = Math.max(0.05, Math.min(intensity * volume, 1.0));
          
          const currentPeak = peaks[i] || 0;
          const newPeak = Math.max(intensity, currentPeak * 0.95);
          
          bars.push(intensity);
          newPeaks.push(newPeak);
        }
        
        setAudioData(bars);
        setPeaks(newPeaks);
      } else {
        // Decay to silence
        const bars = audioData.map(val => val * 0.9);
        const newPeaks = peaks.map(val => val * 0.85);
        
        setAudioData(bars);
        setPeaks(newPeaks);
      }
      
      if (isPlaying || audioData.some(val => val > 0.02)) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying || audioData.some(val => val > 0.02)) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, volume, barCount, audioData, peaks]);

  return (
    <div 
      className={`flex items-end justify-center ${compact ? 'space-x-0.5' : 'space-x-1'}`}
      style={{ height }}
    >
      {audioData.map((intensity, i) => {
        const barHeight = Math.max(2, intensity * height);
        const peakHeight = Math.max(2, (peaks[i] || 0) * height);
        
        return (
          <div key={i} className="relative flex flex-col justify-end" style={{ height }}>
            {/* Peak indicator */}
            {peaks[i] > intensity + 0.1 && (
              <div
                className={`${compact ? 'w-1' : 'w-1.5'} h-0.5 rounded-full bg-accent-cyan absolute`}
                style={{
                  bottom: `${peakHeight - 2}px`,
                  transition: 'bottom 0.05s ease-out'
                }}
              />
            )}
            
            {/* Main frequency bar */}
            <div
              className={`${compact ? 'w-1' : 'w-1.5'} rounded-sm ${
                isPlaying
                  ? intensity > 0.7
                    ? 'bg-gradient-to-t from-vdu-green to-accent-cyan'
                    : intensity > 0.4
                    ? 'bg-vdu-green'
                    : intensity > 0.1
                    ? 'bg-vdu-green-dim'
                    : 'bg-vdu-green-dim opacity-30'
                  : 'bg-radio-dark opacity-20'
              }`}
              style={{
                height: `${barHeight}px`,
                transition: isPlaying ? 'height 0.05s ease-out' : 'height 0.2s ease-out',
                boxShadow: intensity > 0.5 ? '0 0 4px rgba(0, 255, 255, 0.3)' : 'none'
              }}
            />
          </div>
        );
      })}
    </div>
  );
}