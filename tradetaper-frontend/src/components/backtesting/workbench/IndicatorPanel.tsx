'use client';

import React from 'react';
import { IndicatorConfig } from '@/utils/indicators';
import { FiBarChart2 } from 'react-icons/fi';
import { BsLayoutThreeColumns } from 'react-icons/bs';

interface IndicatorDef {
  key: keyof IndicatorConfig;
  label: string;
  color: string;
  description: string;
}

const INDICATORS: IndicatorDef[] = [
  { key: 'volume',    label: 'Volume',   color: '#10B981', description: 'Bar volume histogram' },
  { key: 'killZones', label: 'Sessions', color: '#8B5CF6', description: 'Market sessions: Asia / London / New York' },
];

interface IndicatorPanelProps {
  config:   IndicatorConfig;
  onChange: (config: IndicatorConfig) => void;
  isDark?:  boolean;
}

export default function IndicatorPanel({ config, onChange, isDark = true }: IndicatorPanelProps) {
  const toggle = (key: keyof IndicatorConfig) => {
    onChange({ ...config, [key]: !config[key] });
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[9px] font-semibold uppercase tracking-widest select-none mr-0.5 ${
        isDark ? 'text-slate-600' : 'text-gray-400'
      }`}>
        View
      </span>

      {INDICATORS.map(({ key, label, color, description }) => {
        const active = config[key];
        const Icon   = key === 'volume' ? FiBarChart2 : BsLayoutThreeColumns;

        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            title={description}
            className={`
              flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold
              transition-all duration-150 select-none whitespace-nowrap border
              ${active
                ? 'border-current'
                : isDark
                  ? 'text-slate-600 border-transparent hover:text-slate-400 hover:bg-white/5'
                  : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-200'
              }
            `}
            style={active ? {
              backgroundColor: `${color}15`,
              borderColor:     `${color}50`,
              color,
            } : {}}
          >
            <Icon className="w-2.5 h-2.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
