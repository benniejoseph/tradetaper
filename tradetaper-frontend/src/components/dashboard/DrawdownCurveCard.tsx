"use client";

import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { FaChartLine } from 'react-icons/fa';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { useTheme } from 'next-themes';

interface DrawdownCurveCardProps {
  data: Array<{ date: string; drawdownPct: number }>;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function DrawdownCurveCard({
  data,
  timeRange,
  onTimeRangeChange,
}: DrawdownCurveCardProps) {
  const { theme } = useTheme();
  const rechartsTextFill = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const rechartsGridStroke = theme === 'dark' ? '#374151' : '#E5E7EB';

  const chartData = useMemo(
    () => data.map(point => ({ ...point, value: -Math.abs(point.drawdownPct) })),
    [data]
  );

  return (
    <DashboardCard
      title="Drawdown Curve"
      icon={FaChartLine}
      showInfoIcon
      infoContent="Shows peak-to-trough declines. Improve by lowering position size, cutting losers faster, and avoiding clustered losses."
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
      gridSpan="sm:col-span-2 lg:col-span-3"
    >
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `${Math.abs(value).toFixed(0)}%`}
              />
              <ReferenceLine y={0} stroke={rechartsGridStroke} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                  border: theme === 'dark' ? '1px solid #1F2937' : '1px solid #E5E7EB',
                  borderRadius: '12px'
                }}
                labelStyle={{ color: rechartsTextFill, fontWeight: 'bold' }}
                itemStyle={{ color: '#EF4444' }}
                formatter={(value: number) => [`${Math.abs(value).toFixed(2)}%`, 'Drawdown']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#EF4444"
                fill="url(#drawdownFill)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No drawdown data for this period
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
