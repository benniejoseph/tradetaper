"use client";

import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { FaPercentage } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DashboardStats } from '@/utils/analytics';

interface TradeWinRateCompactCardProps {
  stats: DashboardStats | null;
}

export default function TradeWinRateCompactCard({ stats }: TradeWinRateCompactCardProps) {
  const data = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Wins', value: stats.winningTrades, color: '#10B981' },
      { name: 'Breakeven', value: stats.breakevenTrades, color: '#94A3B8' },
      { name: 'Losses', value: stats.losingTrades, color: '#EF4444' },
    ].filter(item => item.value > 0);
  }, [stats]);

  const winRate = stats?.winRate || 0;

  return (
    <DashboardCard
      title="Trade Win %"
      icon={FaPercentage}
      gridSpan="sm:col-span-1 lg:col-span-2"
      showInfoIcon
      infoContent="Win rate with breakdown of wins, breakevens, and losses. Improve with better filtering and higher quality setups."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{winRate.toFixed(2)}%</div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{stats?.winningTrades || 0}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">{stats?.breakevenTrades || 0}</span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">{stats?.losingTrades || 0}</span>
          </div>
        </div>

        <div className="h-24 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={2} stroke="none">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
