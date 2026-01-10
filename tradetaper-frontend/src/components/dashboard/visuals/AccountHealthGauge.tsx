"use client";
import React from 'react';

interface GaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  colorClass?: string;
}

const LinearGauge = ({ label, value, min, max, colorClass = "bg-indigo-500" }: GaugeProps) => {
  const range = max - min;
  const percentage = range === 0 ? 100 : Math.min(100, Math.max(0, ((value - min) / range) * 100));

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">
            ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      {/* Bar Container */}
      <div className="relative h-2.5 w-full bg-slate-100 dark:bg-emerald-900/40 rounded-full overflow-visible">
         {/* Fill Bar */}
         <div 
            className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorClass}`} 
            style={{ width: `${percentage}%` }}
         >
            {/* Knob/Dot at the end */}
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white dark:bg-[#064e3b] border-2 border-emerald-500 rounded-full shadow-lg translate-x-1/2 transform z-10`}></div>
         </div>
      </div>

      <div className="flex justify-between mt-1 text-xs text-slate-400">
        <span className="text-rose-400 font-medium">Min ${min.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span className="text-emerald-400 font-medium">${max.toLocaleString(undefined, { maximumFractionDigits: 0 })} Max</span>
      </div>
    </div>
  );
};

interface Props {
  balance: number;
  equity: number;
  minBalance: number;
  maxBalance: number;
  minEquity: number;
  maxEquity: number;
}

export default function AccountHealthGauge({ 
  balance, equity, minBalance, maxBalance, minEquity, maxEquity 
}: Props) {
  return (
    <div className="w-full p-4 bg-white dark:bg-[#022c22] rounded-xl">
      <LinearGauge 
        label="Balance" 
        value={balance} 
        min={minBalance} 
        max={maxBalance} 
        colorClass="from-emerald-500 to-emerald-600"
      />
      <LinearGauge 
        label="Equity" 
        value={equity} 
        min={minEquity} 
        max={maxEquity} 
        colorClass="from-teal-500 to-teal-600"
      />
    </div>
  );
}
