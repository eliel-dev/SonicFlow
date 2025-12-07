import React, { useRef, useEffect } from 'react';
import { VisualizerMode } from '../types';
import { drawVisualizer, VisualizerState } from '../utils/drawUtils';

interface VisualizerCanvasProps {
  analyser: AnalyserNode | null;
  mode: VisualizerMode;
  sensitivity: number;
}

const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ analyser, mode, sensitivity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Store visualizer state (particles, thresholds) between frames
  const visualizerStateRef = useRef<VisualizerState>({
    particles: [],
    explosions: [],
    beatThreshold: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configure analyser
    analyser.fftSize = 2048; // Higher resolution
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      // Handle resizing dynamically
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      // Get data based on mode (TimeDomain vs Frequency)
      if (mode === VisualizerMode.WAVE) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        analyser.getByteFrequencyData(dataArray);
      }

      // Draw with state
      drawVisualizer(
        ctx, 
        canvas.width, 
        canvas.height, 
        mode, 
        dataArray, 
        bufferLength,
        visualizerStateRef.current,
        sensitivity
      );

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, mode, sensitivity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block"
      style={{ filter: 'contrast(1.2) brightness(1.1)' }} // Slight CSS boost
    />
  );
};

export default VisualizerCanvas;