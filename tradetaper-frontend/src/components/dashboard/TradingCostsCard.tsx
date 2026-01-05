"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { FaFileInvoiceDollar } from 'react-icons/fa';

interface TradingCostsCardProps {
  totalCommissions: number;
  closedTrades: number;
  totalNetPnl: number;
  avgFeesPerDay: number;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function TradingCostsCard({
  totalCommissions,
  closedTrades,
  totalNetPnl,
  avgFeesPerDay,
  timeRange,
  onTimeRangeChange,
}: TradingCostsCardProps) {
  const avgFeesPerTrade = closedTrades ? totalCommissions / closedTrades : 0;
  const pnlToFeesRatio = totalCommissions !== 0 ? totalNetPnl / totalCommissions : 0;

  const costItems = [
    { label: 'Total Commissions', value: totalCommissions, color: 'text-gray-900 dark:text-white', isRatio: false },
    { label: 'Avg Fees per Trade', value: avgFeesPerTrade, color: 'text-gray-900 dark:text-white', isRatio: false },
    { label: 'P&L to Fees Ratio', value: pnlToFeesRatio, color: pnlToFeesRatio < 1 && totalCommissions !== 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400', isRatio: true },
    { label: 'Avg Fees per Day', value: avgFeesPerDay, color: 'text-gray-900 dark:text-white', isRatio: false },
  ];

  return (
    <DashboardCard 
      title="Trading Costs" 
      icon={FaFileInvoiceDollar}
      gridSpan="sm:col-span-1 lg:col-span-3" 
      showTimeRangeSelector 
      selectedTimeRange={timeRange} 
      onTimeRangeChange={onTimeRangeChange} 
      showInfoIcon
    >
      <div className="space-y-4">
        {costItems.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className={`text-sm font-bold ${item.color}`}>
              {item.isRatio ? (typeof item.value === 'number' ? item.value.toFixed(2) : '0.00') : <CurrencyAmount amount={item.value} className="inline" />}
            </span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
