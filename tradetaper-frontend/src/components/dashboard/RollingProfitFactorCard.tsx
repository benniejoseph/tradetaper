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

interface RollingProfitFactorCardProps {
  data: Array<{ date: string; value: number }>;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  windowSize: number;
  gridSpan?: string;
}

export default function RollingProfitFactorCard({
  data,
  timeRange,
  onTimeRangeChange,
  windowSize,
  gridSpan = "sm:col-span-2 lg:col-span-3",
}: RollingProfitFactorCardProps) {
  const { theme } = useTheme();
  const rechartsTextFill = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const rechartsGridStroke = theme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <DashboardCard
      title={`Profit Factor Trend (${windowSize} trades)`}
      icon={FaChartLine}
      showInfoIcon
      infoContent="Gross profit divided by gross loss over the last N trades. Improve by cutting losers faster or increasing average win size."
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
      gridSpan={gridSpan}
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
                tickFormatter={(value) => value.toFixed(1)}
              />
              <ReferenceLine y={1} stroke={rechartsGridStroke} strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                  border: theme === 'dark' ? '1px solid #1F2937' : '1px solid #E5E7EB',
                  borderRadius: '12px'
                }}
                labelStyle={{ color: rechartsTextFill, fontWeight: 'bold' }}
                itemStyle={{ color: '#3B82F6' }}
                formatter={(value: number) => [value.toFixed(2), 'Profit Factor']}
              />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Not enough trades for profit factor trend
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
