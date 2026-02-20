"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { FaTasks } from 'react-icons/fa';

interface TradeStatisticsCardProps {
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  avgTradesPerDay: number;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function TradeStatisticsCard({
  closedTrades,
  winningTrades,
  losingTrades,
  breakevenTrades,
  avgTradesPerDay,
  timeRange,
  onTimeRangeChange,
}: TradeStatisticsCardProps) {
  
  const data = [
    { name: 'Winning', value: winningTrades, color: '#10B981' }, // emerald-500
    { name: 'Losing', value: losingTrades, color: '#EF4444' }, // red-500
    { name: 'Breakeven', value: breakevenTrades, color: '#6B7280' }, // gray-500
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg text-xs">
          <p className="font-semibold" style={{ color: payload[0].payload.color }}>
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardCard 
      title="Trade Statistics" 
      icon={FaTasks}
      gridSpan="sm:col-span-1 lg:col-span-3" 
      showTimeRangeSelector 
      selectedTimeRange={timeRange} 
      onTimeRangeChange={onTimeRangeChange} 
      showInfoIcon
      infoContent="Counts of wins, losses, and breakevens plus activity rate. Improve by increasing quality setups and reducing avoidable losses."
    >
      <div className="flex flex-col sm:flex-row items-center justify-between h-full gap-4 px-2">
        {/* Donut Chart Section */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{closedTrades}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Total</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Winning</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{winningTrades}</span>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Losing</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">{losingTrades}</span>
            </div>
             <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Breakeven</span>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{breakevenTrades}</span>
            </div>
            <div className="bg-blue-50 dark:bg-emerald-900/10 p-2 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Avg / Day</span>
                <span className="text-lg font-bold text-blue-600 dark:text-emerald-400">{avgTradesPerDay.toFixed(1)}</span>
            </div>
        </div>
      </div>
    </DashboardCard>
  );
}
