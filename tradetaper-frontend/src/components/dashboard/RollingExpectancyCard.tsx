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

interface RollingExpectancyCardProps {
  data: Array<{ date: string; expectancy: number; averageR: number }>;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  windowSize: number;
}

export default function RollingExpectancyCard({
  data,
  timeRange,
  onTimeRangeChange,
  windowSize,
}: RollingExpectancyCardProps) {
  const { theme } = useTheme();
  const rechartsTextFill = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const rechartsGridStroke = theme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <DashboardCard
      title={`Expectancy & Avg R (${windowSize} trades)`}
      icon={FaChartLine}
      showInfoIcon
      infoContent="Expectancy is average $ per trade; Avg R is average risk multiple. Improve by raising R:R, win rate, or reducing fees."
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
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
                yAxisId="left"
                stroke={rechartsTextFill}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={rechartsTextFill}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <ReferenceLine yAxisId="left" y={0} stroke={rechartsGridStroke} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                  border: theme === 'dark' ? '1px solid #1F2937' : '1px solid #E5E7EB',
                  borderRadius: '12px'
                }}
                labelStyle={{ color: rechartsTextFill, fontWeight: 'bold' }}
                formatter={(value: number, name: string) => {
                  if (name === 'expectancy') return [`$${value.toFixed(2)}`, 'Expectancy'];
                  return [value.toFixed(2), 'Avg R'];
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="expectancy"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="averageR"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Not enough trades for expectancy trend
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
