"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { FaWallet } from 'react-icons/fa';
import { 
  ResponsiveContainer, LineChart, Line, Tooltip, Area 
} from 'recharts';
import { useTheme } from 'next-themes';

interface PortfolioBalanceCardProps {
  currentBalance: number;
  balancePercentageChange: number;
  initialBalance: number;
  totalNetPnl: number;
  equityCurve: Array<{ date: string; value: number }>;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function PortfolioBalanceCard({
  currentBalance,
  balancePercentageChange,
  initialBalance,
  totalNetPnl,
  equityCurve,
  timeRange,
  onTimeRangeChange,
}: PortfolioBalanceCardProps) {
  const { theme } = useTheme();
  const rechartsTextFill = theme === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <DashboardCard 
      title="Portfolio Balance" 
      icon={FaWallet}
      showTimeRangeSelector 
      selectedTimeRange={timeRange} 
      onTimeRangeChange={onTimeRangeChange} 
      gridSpan="sm:col-span-1 lg:col-span-2"
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline space-x-3">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              <CurrencyAmount amount={currentBalance} />
            </div>
            <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
              balancePercentageChange >= 0 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {balancePercentageChange === Infinity ? '∞' : (balancePercentageChange || 0).toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Initial: <CurrencyAmount amount={initialBalance} className="inline" /> • 
            Net P&L: <CurrencyAmount amount={totalNetPnl} className="inline" />
          </p>
        </div>

        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityCurve} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)'
                }} 
                labelStyle={{color: rechartsTextFill, fontWeight: 'bold'}}
                itemStyle={{color: '#10B981'}}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, 'Balance']}
              />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={false} />
              <Area type="monotone" dataKey="value" stroke="none" fillOpacity={1} fill="url(#balanceGradient)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
