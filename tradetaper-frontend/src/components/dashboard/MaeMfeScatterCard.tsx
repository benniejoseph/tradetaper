"use client";

import React, { useEffect, useMemo, useState } from 'react';
import DashboardCard from './DashboardCard';
import { FaChartLine } from 'react-icons/fa';
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

interface MaeMfePoint {
  id: string;
  mae: number;
  mfe: number;
  pnl: number;
}

interface MaeMfeScatterCardProps {
  pipsData: MaeMfePoint[];
  priceData: MaeMfePoint[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

type MaeMfeUnit = 'pips' | 'price';

export default function MaeMfeScatterCard({
  pipsData,
  priceData,
  timeRange,
  onTimeRangeChange,
}: MaeMfeScatterCardProps) {
  const hasPips = pipsData.length > 0;
  const hasPrice = priceData.length > 0;
  const initialUnit: MaeMfeUnit = hasPips ? 'pips' : 'price';
  const [unit, setUnit] = useState<MaeMfeUnit>(initialUnit);

  useEffect(() => {
    if (unit === 'pips' && !hasPips && hasPrice) setUnit('price');
    if (unit === 'price' && !hasPrice && hasPips) setUnit('pips');
  }, [unit, hasPips, hasPrice]);

  const activeData = useMemo(() => {
    return unit === 'pips' ? pipsData : priceData;
  }, [unit, pipsData, priceData]);

  const formatValue = (value: number) => (unit === 'pips' ? value.toFixed(1) : value.toFixed(2));
  const unitLabel = unit === 'pips' ? 'pips' : 'price';
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as MaeMfePoint;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="font-bold text-white mb-1">Trade Excursion</p>
          <p className="text-gray-300 text-sm">MAE ({unitLabel}): {formatValue(point.mae)}</p>
          <p className="text-gray-300 text-sm">MFE ({unitLabel}): {formatValue(point.mfe)}</p>
          <p className={`${point.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} text-sm`}>
            PnL: ${Number(point.pnl).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardCard
      title="MAE vs MFE"
      icon={FaChartLine}
      showInfoIcon
      infoContent="MAE is max adverse move; MFE is max favorable move. Improve by tightening entries, better stop placement, and letting winners run."
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
      headerContent={
        hasPips && hasPrice ? (
          <div className="flex items-center bg-gray-100/80 dark:bg-[#141414]/80 p-0.5 rounded-lg backdrop-blur-sm">
            {(['pips', 'price'] as MaeMfeUnit[]).map(option => (
              <button
                key={option}
                onClick={() => setUnit(option)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${
                  unit === option
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/5'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null
      }
      gridSpan="sm:col-span-2 lg:col-span-6"
    >
      <div className="h-72">
        {activeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                type="number"
                dataKey="mae"
                name={`MAE (${unitLabel})`}
                stroke="#94a3b8"
                tickFormatter={(value) => formatValue(value)}
              />
              <YAxis
                type="number"
                dataKey="mfe"
                name={`MFE (${unitLabel})`}
                stroke="#94a3b8"
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine x={0} stroke="#475569" />
              <ReferenceLine y={0} stroke="#475569" />
              <Scatter name="Trades" data={activeData} fill="#8884d8">
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${entry.id}-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No MAE/MFE data available yet
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
