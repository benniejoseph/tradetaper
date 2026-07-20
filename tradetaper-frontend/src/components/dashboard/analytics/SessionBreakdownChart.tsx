"use client";
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface SessionData {
  session: string;
  pnl: number;
  winRate: number;
  count: number;
}

interface Props {
  data: SessionData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="font-bold text-white mb-2">{label}</p>
        <p className="text-emerald-400 text-sm">
          PnL: ${Number(data.pnl).toFixed(2)}
        </p>
        <p className="text-amber-400 text-sm">
          Win Rate: {Number(data.winRate).toFixed(1)}%
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Trades: {data.count}
        </p>
      </div>
    );
  }
  return null;
};

export default function SessionBreakdownChart({ data }: Props) {
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

  // Filter out unknown if empty to clean up chart
  const cleanData = data.filter(d => d.count > 0);
  const chartMargins = isMobile
    ? { top: 12, right: 8, left: -8, bottom: 0 }
    : { top: 20, right: 30, left: 20, bottom: 5 };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={cleanData}
          margin={chartMargins}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            tick={{ fontSize: isMobile ? 10 : 11 }}
            tickFormatter={(val) => {
              const abs = Math.abs(Number(val));
              if (abs >= 1000) return `$${(Number(val) / 1000).toFixed(1)}k`;
              return `$${val}`;
            }}
          />
          <YAxis
            dataKey="session"
            type="category"
            stroke="#94a3b8"
            width={isMobile ? 64 : 80}
            tick={{ fontSize: isMobile ? 10 : 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {!isMobile && <Legend />}
          <ReferenceLine x={0} stroke="#475569" />
          <Bar dataKey="pnl" name="Session PnL" radius={[0, 4, 4, 0]}>
            {cleanData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
