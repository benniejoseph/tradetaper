"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { FaArrowUp, FaInfoCircle } from 'react-icons/fa';

interface DashboardStats {
  totalNetPnl?: number;
  averageWin?: number;
  averageLoss?: number;
  largestWin?: number;
  largestLoss?: number;
  profitFactor?: number;
}

interface TotalReturnCardProps {
  stats: DashboardStats | null;
  roiPercentage: number;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function TotalReturnCard({
  stats,
  roiPercentage,
  timeRange,
  onTimeRangeChange,
}: TotalReturnCardProps) {
  const returnItems = [
    { label: 'Average Win', value: stats?.averageWin, isPositive: true },
    { label: 'Average Loss', value: stats?.averageLoss, isPositive: false },
    { label: 'Largest Win', value: stats?.largestWin, isPositive: true },
    { label: 'Largest Loss', value: stats?.largestLoss, isPositive: false },
  ];

  return (
    <DashboardCard 
      title="Total Return" 
      icon={FaArrowUp}
      showInfoIcon 
      showTimeRangeSelector 
      selectedTimeRange={timeRange} 
      onTimeRangeChange={onTimeRangeChange}
      gridSpan="sm:col-span-1 lg:col-span-2" 
    >
      <div className="space-y-4">
        <div className="flex items-baseline space-x-3">
          <div className={`text-3xl font-bold ${
            (stats?.totalNetPnl || 0) >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {(stats?.totalNetPnl || 0) >= 0 ? '+' : ''}<CurrencyAmount amount={stats?.totalNetPnl || 0} className="inline" />
          </div>
          <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
            roiPercentage >= 0 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {roiPercentage === Infinity ? '∞' : (roiPercentage || 0).toFixed(2)}%
          </span>
        </div>
        
        <div className="space-y-3">
          {returnItems.map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className={`text-sm font-semibold ${
                item.isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {item.value !== undefined && item.value !== null ? 
                  <>{item.isPositive && item.value > 0 ? '+' : ''}<CurrencyAmount amount={Math.abs(item.value)} className="inline" /></> : 'N/A'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center">
            <FaInfoCircle className="mr-2 flex-shrink-0" />
            Profit factor: {stats?.profitFactor?.toFixed(2) || 'N/A'}
            {stats?.profitFactor && (
              <span className="ml-1">
                {stats.profitFactor >= 1 
                  ? ` • You earn $${stats.profitFactor.toFixed(2)} per $1 lost` 
                  : ` • You lose $${(1/stats.profitFactor).toFixed(2)} per $1 earned`}
              </span>
            )}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
