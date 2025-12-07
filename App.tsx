import React, { useState, useRef, useEffect } from 'react';
import { VisualizerMode } from './types';
import VisualizerCanvas from './components/VisualizerCanvas';
import Controls from './components/Controls';
import { Music, BarChart3, Activity, Disc, Sparkles, Circle, Zap, Sliders } from 'lucide-react';

const STORAGE_KEYS = {
  VOLUME: 'sonicflow_volume',
  MODE: 'sonicflow_mode',
  SENSITIVITY: 'sonicflow_sensitivity'
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Load initial state from localStorage or use defaults
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return saved !== null ? parseFloat(saved) : 0.8;
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [mode, setMode] = useState<VisualizerMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODE);
    return (saved as VisualizerMode) || VisualizerMode.BARS;
  });

  const [sensitivity, setSensitivity] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SENSITIVITY);
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  
  // Audio API Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Audio Logic
  useEffect(() => {
    // Cleanup previous URL to avoid memory leaks
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
    localStorage.setItem(STORAGE_KEYS.SENSITIVITY, sensitivity.toString());
  }, [volume, mode, sensitivity]);

  // Sync volume to audio element when audioUrl changes (new file loaded) or volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [audioUrl, volume]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setAudioUrl(url);
      setIsPlaying(false);
      
      // Reset logic for new file
      if (audioRef.current) {
        audioRef.current.load(); // Reload audio element with new source
        audioRef.current.volume = volume; // Ensure volume is applied
      }
    }
  };

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }

    if (audioRef.current && !sourceNodeRef.current && audioContextRef.current) {
      // Connect nodes: Source (Audio Tag) -> Analyser -> Destination (Speakers)
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Smoothing makes the bars look less jittery
      analyserRef.current.smoothingTimeConstant = 0.85; 

      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const togglePlay = async () => {
    if (!file || !audioRef.current) return;

    // Ensure Audio Context is active on user interaction
    setupAudioContext();

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error("Playback failed", err);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}
      <input 
        type="file" 
        accept="audio/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Main Visualizer Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {analyserRef.current && audioUrl ? (
          <VisualizerCanvas 
            analyser={analyserRef.current} 
            mode={mode} 
            sensitivity={sensitivity}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 animate-pulse">
            <Music size={64} className="mb-4 text-slate-700" />
            <p className="text-xl font-light">Selecione uma faixa para iniciar</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors font-medium shadow-lg shadow-indigo-500/20"
            >
              Escolher Arquivo
            </button>
          </div>
        )}

        {/* Sensitivity Control (Top Right) */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2 group z-20">
            <div className="bg-slate-900/50 backdrop-blur-md p-2 rounded-lg border border-slate-700/50 flex flex-col items-center gap-2 shadow-lg transition-opacity hover:opacity-100 opacity-60">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">
                    <Sliders size={12} />
                    <span>Sensibilidade</span>
                </div>
                <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={sensitivity} 
                    onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    title={`Sensibilidade: ${sensitivity.toFixed(1)}x`}
                />
            </div>
        </div>

        {/* Mode Switcher Overlay */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-max max-w-full overflow-x-auto bg-slate-900/50 backdrop-blur-md p-1.5 rounded-full border border-slate-700/50 flex gap-1 shadow-lg no-scrollbar z-10">
          <ModeButton 
            active={mode === VisualizerMode.BARS} 
            onClick={() => setMode(VisualizerMode.BARS)} 
            icon={<BarChart3 size={18} />} 
            label="Barras"
          />
           <ModeButton 
            active={mode === VisualizerMode.WAVE} 
            onClick={() => setMode(VisualizerMode.WAVE)} 
            icon={<Activity size={18} />} 
            label="Onda"
          />
          <ModeButton 
            active={mode === VisualizerMode.CIRCULAR} 
            onClick={() => setMode(VisualizerMode.CIRCULAR)} 
            icon={<Disc size={18} />} 
            label="Circular"
          />
           <ModeButton 
            active={mode === VisualizerMode.ORB} 
            onClick={() => setMode(VisualizerMode.ORB)} 
            icon={<Circle size={18} />} 
            label="Orbe"
          />
           <ModeButton 
            active={mode === VisualizerMode.PARTICLES} 
            onClick={() => setMode(VisualizerMode.PARTICLES)} 
            icon={<Sparkles size={18} />} 
            label="Grade"
          />
           <ModeButton 
            active={mode === VisualizerMode.BEAT_PARTICLES} 
            onClick={() => setMode(VisualizerMode.BEAT_PARTICLES)} 
            icon={<Zap size={18} />} 
            label="Partículas"
          />
        </div>
      </div>

      {/* Controls */}
      <Controls
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        fileName={file?.name || null}
        onFileSelect={() => fileInputRef.current?.click()}
      />
    </div>
  );
};

const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
      ${active 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'}
    `}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default App;