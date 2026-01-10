"use client";
import React from 'react';
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
        <p className="text-blue-400 text-sm">
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
  // Filter out unknown if empty to clean up chart
  const cleanData = data.filter(d => d.count > 0);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={cleanData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `$${val}`} />
          <YAxis dataKey="session" type="category" stroke="#94a3b8" width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
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
