// src/components/backtesting/workbench/ReplayControls.tsx
'use client';

import React from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaStepForward, 
  FaStepBackward, 
  FaForward 
} from 'react-icons/fa';

interface ReplayControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNextCandle: () => void;
  onPrevCandle: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentDate?: string;
  totalCandles: number;
  currentCandleIndex: number;
}

export default function ReplayControls({
  isPlaying,
  onPlayPause,
  onNextCandle,
  onPrevCandle,
  speed,
  onSpeedChange,
  currentDate,
  totalCandles,
  currentCandleIndex,
}: ReplayControlsProps) {
  
  const progress = totalCandles > 0 ? (currentCandleIndex / totalCandles) * 100 : 0;

  return (
    <div className="glass-card p-4 rounded-xl flex items-center justify-between gap-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-md sticky bottom-4 mx-auto max-w-4xl shadow-2xl z-40">
      
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onPrevCandle}
          disabled={isPlaying}
          className="p-3 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          title="Previous Candle"
        >
          <FaStepBackward />
        </button>

        <button 
          onClick={onPlayPause}
          className={`
            p-4 rounded-full flex items-center justify-center transition-all shadow-lg
            ${isPlaying 
              ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/50' 
              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-emerald-500/20'
            }
          `}
        >
          {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
        </button>

        <button 
          onClick={onNextCandle}
          disabled={isPlaying}
          className="p-3 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          title="Next Candle"
        >
          <FaStepForward />
        </button>
      </div>

      {/* Progress & Speed */}
      <div className="flex-1 flex flex-col gap-2">
         <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>{currentDate || 'No Data'}</span>
            <span>{currentCandleIndex} / {totalCandles} Candles</span>
         </div>
         {/* Progress Bar */}
         <div className="h-1.5 bg-slate-800 rounded-full w-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
            />
         </div>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-2 border-l border-white/10 pl-4">
        <FaForward className="text-slate-500 text-xs" />
        <select 
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-transparent text-slate-300 text-sm font-medium focus:outline-none cursor-pointer hover:text-white"
        >
            <option value={1000}>1x</option>
            <option value={500}>2x</option>
            <option value={200}>5x</option>
            <option value={50}>10x</option>
        </select>
      </div>

    </div>
  );
}
