import React from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Upload } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  currentTime: number;
  duration: number;
  onSeek: (val: number) => void;
  fileName: string | null;
  onFileSelect: () => void;
}

const formatTime = (time: number) => {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  currentTime,
  duration,
  onSeek,
  fileName,
  onFileSelect
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800 p-4 pb-8 md:pb-4 flex flex-col gap-4 z-10 w-full shadow-2xl">
      {/* Progress Bar */}
      <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-between">
        
        {/* Track Info & Upload */}
        <div className="flex items-center gap-4 w-1/3 truncate">
           <button 
            onClick={onFileSelect}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors border border-slate-700"
          >
            <Upload size={14} />
            <span className="hidden md:inline">Carregar Áudio</span>
          </button>
          <div className="flex flex-col truncate">
            <span className="text-slate-200 text-sm font-semibold truncate">{fileName || "Nenhum arquivo"}</span>
            <span className="text-slate-500 text-xs">Arquivo Local</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-6 justify-center w-1/3">
           <button className="text-slate-500 hover:text-slate-300 transition-colors">
            <SkipBack size={20} />
          </button>
          <button 
            onClick={onPlayPause}
            className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1"/>}
          </button>
          <button className="text-slate-500 hover:text-slate-300 transition-colors">
            <SkipForward size={20} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-2 w-1/3 group">
            <button 
              onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
              className="text-slate-400 hover:text-indigo-400"
            >
             {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="w-24 h-1.5 bg-slate-700 rounded-full relative overflow-hidden">
                <input 
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-75"
                  style={{ width: `${volume * 100}%` }}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;