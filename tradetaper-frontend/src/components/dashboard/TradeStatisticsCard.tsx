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

export default function TradeStatisticsCard({
  closedTrades,
  winningTrades,
  losingTrades,
  breakevenTrades,
  avgTradesPerDay,
  timeRange,
  onTimeRangeChange,
}: TradeStatisticsCardProps) {
  const statItems = [
    { label: 'Total Trades', value: closedTrades, color: 'text-gray-900 dark:text-white' },
    { label: 'Winning Trades', value: winningTrades, color: 'text-green-600 dark:text-green-400' },
    { label: 'Losing Trades', value: losingTrades, color: 'text-red-600 dark:text-red-400' },
    { label: 'Breakeven Trades', value: breakevenTrades, color: 'text-gray-900 dark:text-white' },
    { label: 'Avg Trades per Day', value: avgTradesPerDay.toFixed(2), color: 'text-gray-900 dark:text-white' },
  ];

  return (
    <DashboardCard 
      title="Trade Statistics" 
      icon={FaTasks}
      gridSpan="sm:col-span-1 lg:col-span-3" 
      showTimeRangeSelector 
      selectedTimeRange={timeRange} 
      onTimeRangeChange={onTimeRangeChange} 
      showInfoIcon
    >
      <div className="space-y-4">
        {statItems.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
