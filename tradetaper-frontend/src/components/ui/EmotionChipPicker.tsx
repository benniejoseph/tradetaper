"use client";
import React from 'react';
import { 
  Smile, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  DollarSign, 
  ShieldAlert, 
  Flame, 
  Minus,
  Frown,
  Activity,
  ThumbsUp,
  Clock,
  Coffee,
  Battery,
  Sun,
  Heart,
  Layers,
  PauseCircle,
  FastForward,
  EyeOff,
  Crosshair
} from 'lucide-react';

interface EmotionChipPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

const emotions = [
  { value: 'Calm', icon: Smile, color: 'emerald' },
  { value: 'Confident', icon: TrendingUp, color: 'blue' },
  { value: 'Anxious', icon: AlertCircle, color: 'yellow' },
  { value: 'Fearful', icon: ShieldAlert, color: 'red' },
  { value: 'Greedy', icon: DollarSign, color: 'amber' },
  { value: 'Frustrated', icon: Frown, color: 'red' },
  { value: 'Overconfident', icon: ThumbsUp, color: 'orange' },
  { value: 'Impatient', icon: Clock, color: 'orange' },
  { value: 'FOMO', icon: Zap, color: 'orange' },
  { value: 'Revenge Trading', icon: Flame, color: 'red' },
  { value: 'Bored', icon: Coffee, color: 'gray' },
  { value: 'Fatigued', icon: Battery, color: 'gray' },
  { value: 'Excited', icon: Zap, color: 'emerald' },
  { value: 'Nervous', icon: Activity, color: 'yellow' },
  { value: 'Hopeful', icon: Sun, color: 'blue' },
  { value: 'Disappointed', icon: Frown, color: 'gray' },
  { value: 'Relieved', icon: Heart, color: 'emerald' },
  { value: 'Overwhelmed', icon: Layers, color: 'red' },
  { value: 'Hesitant', icon: PauseCircle, color: 'yellow' },
  { value: 'Rushed', icon: FastForward, color: 'orange' },
  { value: 'Distracted', icon: EyeOff, color: 'gray' },
  { value: 'Focused', icon: Crosshair, color: 'blue' },
];

export const EmotionChipPicker: React.FC<EmotionChipPickerProps> = ({ value, onChange, label }) => {
  return (
    <div className="space-y-1.5">
      {label && <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>}
      <div className="flex flex-wrap gap-1">
        {emotions.map((emotion) => {
          const Icon = emotion.icon;
          return (
            <button
              key={emotion.value}
              type="button"
              onClick={() => onChange(value === emotion.value ? '' : emotion.value)}
              className={`
                px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                flex items-center gap-1.5
                ${value === emotion.value 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }
              `}
              title={emotion.value}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{emotion.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmotionChipPicker;
