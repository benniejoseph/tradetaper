"use client";
import React, { useEffect, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface HourlyData {
  hour: number;
  pnl: number;
  winRate: number;
  count: number;
}

interface Props {
  data: HourlyData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="font-bold text-white mb-2">{`${label}:00 - ${Number(label)+1}:00`}</p>
        <p className="text-emerald-400 text-sm">
          PnL: ${Number(payload[0].value).toFixed(2)}
        </p>
        <p className="text-amber-400 text-sm">
          Win Rate: {Number(payload[1].value).toFixed(1)}%
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Trades: {payload[0].payload.count}
        </p>
      </div>
    );
  }
  return null;
};

export default function HourlyPerformanceChart({ data }: Props) {
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
    ? { top: 12, right: 8, left: -8, bottom: 0 }
    : { top: 20, right: 30, left: 20, bottom: 5 };

  const formatPnlTick = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value}`;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={chartMargins}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis 
            dataKey="hour" 
            stroke="#94a3b8"
            tick={{ fontSize: isMobile ? 10 : 11 }}
            interval={isMobile ? 3 : 0}
            tickFormatter={(val) => `${val}:00`}
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke="#10b981" 
            tick={{ fontSize: isMobile ? 10 : 11 }}
            tickFormatter={formatPnlTick}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#f59e0b"
            hide={isMobile}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          {!isMobile && <Legend />}
          <Bar yAxisId="left" dataKey="pnl" name="Net PnL" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="winRate" 
            name="Win Rate" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={{ r: isMobile ? 2 : 3, fill: '#f59e0b' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
