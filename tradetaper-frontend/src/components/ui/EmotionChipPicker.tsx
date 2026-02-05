"use client";
import React from 'react';

interface EmotionChipPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

const emotions = [
  { value: 'Calm', emoji: '😌', color: 'emerald' },
  { value: 'Confident', emoji: '💪', color: 'blue' },
  { value: 'Anxious', emoji: '😰', color: 'yellow' },
  { value: 'FOMO', emoji: '😤', color: 'orange' },
  { value: 'Greedy', emoji: '🤑', color: 'amber' },
  { value: 'Fearful', emoji: '😨', color: 'red' },
  { value: 'Revenge', emoji: '😡', color: 'red' },
  { value: 'Neutral', emoji: '😐', color: 'gray' },
];

export const EmotionChipPicker: React.FC<EmotionChipPickerProps> = ({ value, onChange, label }) => {
  return (
    <div className="space-y-1.5">
      {label && <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>}
      <div className="flex flex-wrap gap-1.5">
        {emotions.map((emotion) => (
          <button
            key={emotion.value}
            type="button"
            onClick={() => onChange(value === emotion.value ? '' : emotion.value)}
            className={`
              px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150
              flex items-center gap-1
              ${value === emotion.value 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105' 
                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }
            `}
            title={emotion.value}
          >
            <span className="text-sm">{emotion.emoji}</span>
            <span className="hidden sm:inline">{emotion.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmotionChipPicker;
