"use client";
import React from 'react';
import { Check, X } from 'lucide-react';

interface ToggleChipProps {
  value?: boolean;
  onChange: (value: boolean | undefined) => void;
  label?: string;
  yesLabel?: string;
  noLabel?: string;
}

export const ToggleChip: React.FC<ToggleChipProps> = ({ 
  value, 
  onChange, 
  label,
  yesLabel = 'Yes',
  noLabel = 'No'
}) => {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange(value === true ? undefined : true)}
          className={`
            px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1
            ${value === true 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
              : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
            }
          `}
        >
          <Check className="w-3 h-3" />
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? undefined : false)}
          className={`
            px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1
            ${value === false 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
              : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
            }
          `}
        >
          <X className="w-3 h-3" />
          {noLabel}
        </button>
      </div>
    </div>
  );
};

export default ToggleChip;
