export enum VisualizerMode {
  BARS = 'BARS',
  WAVE = 'WAVE',
  CIRCULAR = 'CIRCULAR',
  PARTICLES = 'PARTICLES',
  ORB = 'ORB',
  BEAT_PARTICLES = 'BEAT_PARTICLES'
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}