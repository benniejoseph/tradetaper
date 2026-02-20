"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { FaChartLine } from 'react-icons/fa';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { useTheme } from 'next-themes';

interface RollingReturnCardProps {
  data: Array<{ date: string; value: number }>;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  windowSize: number;
  windowOptions?: number[];
  onWindowSizeChange?: (size: number) => void;
}

export default function RollingReturnCard({
  data,
  timeRange,
  onTimeRangeChange,
  windowSize,
  windowOptions = [10, 20, 30, 50],
  onWindowSizeChange,
}: RollingReturnCardProps) {
  const { theme } = useTheme();
  const rechartsTextFill = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const rechartsGridStroke = theme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <DashboardCard
      title={`Rolling Return (${windowSize} trades)`}
      icon={FaChartLine}
      showInfoIcon
      infoContent="Return over the last N trades. Improve by stabilizing setups, avoiding big drawdowns, and increasing trade quality."
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
      headerContent={
        onWindowSizeChange ? (
          <div className="flex items-center bg-gray-100/80 dark:bg-[#141414]/80 p-0.5 rounded-lg backdrop-blur-sm">
            {windowOptions.map(option => (
              <button
                key={option}
                onClick={() => onWindowSizeChange(option)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${
                  windowSize === option
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
      gridSpan="sm:col-span-2 lg:col-span-3"
    >
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke={rechartsGridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke={rechartsTextFill}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={rechartsTextFill}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <ReferenceLine y={0} stroke={rechartsGridStroke} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                  border: theme === 'dark' ? '1px solid #1F2937' : '1px solid #E5E7EB',
                  borderRadius: '12px'
                }}
                labelStyle={{ color: rechartsTextFill, fontWeight: 'bold' }}
                itemStyle={{ color: '#10B981' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
              />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Not enough trades for rolling return
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
