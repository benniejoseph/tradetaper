"use client";

import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { FaPercentage, FaChartLine, FaInfoCircle } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DashboardStats } from '@/utils/analytics';

interface TradeWinExpectancyBlockProps {
  stats: DashboardStats | null;
}

export default function TradeWinExpectancyBlock({ stats }: TradeWinExpectancyBlockProps) {
  const data = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Wins', value: stats.winningTrades, color: '#10B981' },
      { name: 'Breakeven', value: stats.breakevenTrades, color: '#94A3B8' },
      { name: 'Losses', value: stats.losingTrades, color: '#EF4444' },
    ].filter(item => item.value > 0);
  }, [stats]);

  const winRate = stats?.winRate || 0;
  const expectancy = stats?.expectancy || 0;

  return (
    <DashboardCard
      title="Trade Quality"
      icon={FaChartLine}
      gridSpan="lg:col-span-6"
      showInfoIcon
      infoContent="Win % and Expectancy together give a quick read on trade quality. Improve by increasing average win and reducing average loss."
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-[#0A0A0A] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FaPercentage className="w-3.5 h-3.5" />
            </span>
            Trade Win %
            <FaInfoCircle className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div>
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
        </div>

        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-[#0A0A0A] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FaChartLine className="w-3.5 h-3.5" />
            </span>
            Trade Expectancy
            <FaInfoCircle className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <div className={`text-2xl font-bold ${expectancy >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {expectancy >= 0 ? '$' : '-$'}{Math.abs(expectancy).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per trade</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FaChartLine className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
