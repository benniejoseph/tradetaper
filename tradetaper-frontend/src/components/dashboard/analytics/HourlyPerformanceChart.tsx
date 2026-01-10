"use client";
import React from 'react';
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
        <p className="text-blue-400 text-sm">
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
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis 
            dataKey="hour" 
            stroke="#94a3b8"
            tickFormatter={(val) => `${val}:00`}
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke="#10b981" 
            tickFormatter={(val) => `$${val}`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#3b82f6"
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
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
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
