"use client";

import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { FaChartLine } from 'react-icons/fa';
import { Trade, TradeStatus } from '@/types/trade';

interface PerformanceStatsCardProps {
  trades: Trade[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  currentBalance?: number;
}

export default function PerformanceStatsCard({
  trades,
  timeRange,
  onTimeRangeChange,
  currentBalance = 0,
}: PerformanceStatsCardProps) {
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED);
    if (closedTrades.length === 0) return null;

    const sortedTrades = [...closedTrades].sort((a, b) =>
      new Date(a.exitDate || 0).getTime() - new Date(b.exitDate || 0).getTime()
    );

    // Streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentStreak = 0;
    let currentStreakType: 'win' | 'loss' | 'flat' = 'flat';

    sortedTrades.forEach(trade => {
      const pnl = trade.profitOrLoss || 0;
      const type: 'win' | 'loss' | 'flat' = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'flat';
      if (type === 'flat') {
        currentStreak = 0;
        currentStreakType = 'flat';
        return;
      }
      if (type === currentStreakType) {
        currentStreak += 1;
      } else {
        currentStreakType = type;
        currentStreak = 1;
      }
      if (type === 'win') maxWinStreak = Math.max(maxWinStreak, currentStreak);
      if (type === 'loss') maxLossStreak = Math.max(maxLossStreak, currentStreak);
    });

    // Rolling return (last N trades)
    const windowSize = 20;
    const totalPnl = sortedTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
    const estimatedInitialBalance = currentBalance - totalPnl;
    const baseInitial = estimatedInitialBalance > 0 ? estimatedInitialBalance : 1;

    const cumulativePnl: number[] = [];
    sortedTrades.forEach((trade, idx) => {
      const pnl = trade.profitOrLoss || 0;
      cumulativePnl[idx] = (cumulativePnl[idx - 1] || 0) + pnl;
    });

    const rollingReturns: number[] = [];
    for (let i = windowSize - 1; i < sortedTrades.length; i++) {
      const startIndex = i - windowSize + 1;
      const pnlBeforeWindow = cumulativePnl[startIndex - 1] || 0;
      const pnlEnd = cumulativePnl[i] || 0;
      const startEquity = baseInitial + pnlBeforeWindow;
      const endEquity = baseInitial + pnlEnd;
      const base = startEquity > 0 ? startEquity : 1;
      rollingReturns.push(((endEquity - startEquity) / base) * 100);
    }

    const latestRollingReturn = rollingReturns.length > 0 ? rollingReturns[rollingReturns.length - 1] : 0;
    const avgRollingReturn = rollingReturns.length > 0
      ? rollingReturns.reduce((sum, v) => sum + v, 0) / rollingReturns.length
      : 0;

    // Std dev of trade returns (percent)
    let mean = 0;
    let m2 = 0;
    let count = 0;
    sortedTrades.forEach((trade, idx) => {
      const pnl = trade.profitOrLoss || 0;
      const equityBefore = baseInitial + (cumulativePnl[idx - 1] || 0);
      const ret = equityBefore > 0 ? (pnl / equityBefore) * 100 : 0;
      count += 1;
      const delta = ret - mean;
      mean += delta / count;
      const delta2 = ret - mean;
      m2 += delta * delta2;
    });
    const variance = count > 1 ? m2 / (count - 1) : 0;
    const stdDev = Math.sqrt(variance);

    return {
      maxWinStreak,
      maxLossStreak,
      latestRollingReturn,
      avgRollingReturn,
      stdDev,
      windowSize,
    };
  }, [trades, currentBalance]);

  if (!stats) {
     return (
        <DashboardCard 
            title="Trade Consistency" 
            icon={FaChartLine}
            gridSpan="sm:col-span-2 lg:col-span-3"
            showTimeRangeSelector
            selectedTimeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
        >
            <div className="h-48 flex items-center justify-center text-gray-400">
                No closed trades in this period
            </div>
        </DashboardCard>
     )
  }

  return (
    <DashboardCard 
      title="Trade Consistency" 
      icon={FaChartLine}
      gridSpan="sm:col-span-2 lg:col-span-3"
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
      showInfoIcon
      infoContent="Streaks, rolling returns, and return volatility. Improve by stabilizing setups and reducing large loss swings."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-[200px]">
        <div className="col-span-2 lg:col-span-1 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between">
          <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70 font-medium uppercase tracking-wider">Max Win Streak</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.maxWinStreak}
          </div>
          <div className="text-[11px] text-emerald-700/60 dark:text-emerald-300/60 mt-2">Longest consecutive wins</div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 bg-red-50/70 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 flex flex-col justify-between">
          <div className="text-xs text-red-600/70 dark:text-red-400/70 font-medium uppercase tracking-wider">Max Loss Streak</div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
            {stats.maxLossStreak}
          </div>
          <div className="text-[11px] text-red-400/60 mt-2">Longest consecutive losses</div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 bg-white/70 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex flex-col justify-between">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rolling Return ({stats.windowSize})</div>
          <div className={`text-3xl font-bold mt-2 ${stats.latestRollingReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {stats.latestRollingReturn.toFixed(2)}%
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Avg: {stats.avgRollingReturn.toFixed(2)}%</div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 bg-white/70 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex flex-col justify-between">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Return Std Dev</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {stats.stdDev.toFixed(2)}%
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Lower = more consistent</div>
        </div>
      </div>
    </DashboardCard>
  );
}
