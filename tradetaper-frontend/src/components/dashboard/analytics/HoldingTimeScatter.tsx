"use client";
import React, { useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface HoldingData {
  id: string;
  durationMinutes: number;
  pnl: number;
  isWin: boolean;
}

interface Props {
  data: HoldingData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="font-bold text-white mb-1">Trade Duration</p>
        <p className="text-gray-300 text-sm">
          Time: {data.durationMinutes} min
        </p>
        <p className={`${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} text-sm`}>
          PnL: ${Number(data.pnl).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function HoldingTimeScatter({ data }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
    updateIsMobile();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateIsMobile);
      return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }

    mediaQuery.addListener(updateIsMobile);
    return () => mediaQuery.removeListener(updateIsMobile);
  }, []);

  const chartMargins = isMobile
    ? { top: 12, right: 8, bottom: 12, left: -8 }
    : { top: 20, right: 20, bottom: 20, left: 20 };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={chartMargins}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis 
            type="number" 
            dataKey="durationMinutes" 
            name="Duration" 
            unit="m" 
            stroke="#94a3b8" 
            tick={{ fontSize: isMobile ? 10 : 11 }}
            tickCount={isMobile ? 5 : 8}
          />
          <YAxis 
            type="number" 
            dataKey="pnl" 
            name="PnL" 
            unit="$" 
            stroke="#94a3b8" 
            tick={{ fontSize: isMobile ? 10 : 11 }}
            tickFormatter={(value) => {
              const abs = Math.abs(Number(value));
              if (abs >= 1000) return `${value < 0 ? '-' : ''}$${(abs / 1000).toFixed(1)}k`;
              return `$${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine y={0} stroke="#475569" />
          <Scatter name="Trades" data={data} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isWin ? '#10b981' : '#ef4444'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
