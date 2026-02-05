"use client";
import React from 'react';

interface ChipSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; emoji?: string }[];
  label?: string;
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'gray';
}

const colorMap = {
  blue: 'bg-blue-500 shadow-blue-500/30',
  purple: 'bg-purple-500 shadow-purple-500/30',
  emerald: 'bg-emerald-500 shadow-emerald-500/30',
  amber: 'bg-amber-500 shadow-amber-500/30',
  gray: 'bg-gray-500 shadow-gray-500/30',
};

export const ChipSelector: React.FC<ChipSelectorProps> = ({ 
  value, 
  onChange, 
  options, 
  label,
  color = 'blue'
}) => {
  return (
    <div className="space-y-1.5">
      {label && <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>}
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`
              px-2 py-1 rounded-lg text-xs font-bold transition-all duration-150
              ${value === option.value 
                ? `${colorMap[color]} text-white shadow-lg scale-105` 
                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }
            `}
          >
            {option.emoji && <span className="mr-1">{option.emoji}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChipSelector;
