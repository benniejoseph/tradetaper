"use client";
import React from 'react';

interface StarRatingProps {
  value?: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
  size?: 'sm' | 'md';
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  value = 0, 
  onChange, 
  max = 5, 
  label,
  size = 'sm' 
}) => {
  const starSize = size === 'sm' ? 'text-lg' : 'text-xl';
  
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>}
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1 === value ? 0 : i + 1)}
            className={`${starSize} transition-all duration-150 hover:scale-110 ${
              i < value 
                ? 'text-amber-400 drop-shadow-sm' 
                : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{value}/{max}</span>}
    </div>
  );
};

export default StarRating;
