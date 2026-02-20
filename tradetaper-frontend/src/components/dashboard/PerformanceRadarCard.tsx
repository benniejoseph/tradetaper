"use client";

import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { FaChartPie } from 'react-icons/fa';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { DashboardStats } from '@/utils/analytics';

interface PerformanceRadarCardProps {
  stats: DashboardStats | null;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const scoreFromTarget = (value: number, target: number) => {
  if (target <= 0) return 0;
  return clamp((value / target) * 100);
};

export default function PerformanceRadarCard({ stats }: PerformanceRadarCardProps) {
  const metrics = useMemo(() => {
    if (!stats) return null;

    const avgWinLoss = stats.averageLoss !== 0 ? Math.abs(stats.averageWin / stats.averageLoss) : 0;
    const expectancyRatio = stats.averageWin > 0 ? stats.expectancy / stats.averageWin : 0;

    return [
      { metric: 'Win %', value: scoreFromTarget(stats.winRate, 60), raw: `${stats.winRate.toFixed(0)}%` },
      { metric: 'Profit Factor', value: scoreFromTarget(stats.profitFactor, 2), raw: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2) },
      { metric: 'Avg Win/Loss', value: scoreFromTarget(avgWinLoss, 2), raw: avgWinLoss ? avgWinLoss.toFixed(2) : '0.00' },
      { metric: 'Expectancy', value: scoreFromTarget(expectancyRatio, 0.5), raw: stats.expectancy.toFixed(2) },
      { metric: 'Avg R', value: scoreFromTarget(stats.averageRR, 2), raw: stats.averageRR.toFixed(2) },
      { metric: 'Drawdown', value: clamp(100 - (stats.maxDrawdown / 20) * 100), raw: `${stats.maxDrawdown.toFixed(1)}%` },
    ];
  }, [stats]);

  const overallScore = useMemo(() => {
    if (!metrics || metrics.length === 0) return 0;
    const total = metrics.reduce((sum, item) => sum + item.value, 0);
    return total / metrics.length;
  }, [metrics]);

  return (
    <DashboardCard
      title="Performance Balance"
      icon={FaChartPie}
      gridSpan="lg:col-span-6"
      showInfoIcon
      infoContent="Composite radar score of key performance metrics. Improve by raising win rate, profit factor, and average R while keeping drawdown low."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-center">
        <div className="h-[220px]">
          {metrics ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={metrics} outerRadius="70%">
                <PolarGrid stroke="#2a2a2a" strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [`${value.toFixed(0)}`, 'Score']}
                  contentStyle={{ background: '#0b0b0b', border: '1px solid #1f2937', borderRadius: 8, color: '#e5e7eb' }}
                />
                <Radar
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">No trade data yet</div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-[#0A0A0A] p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Your Trader Score</div>
          <div className="text-3xl font-bold text-emerald-500 mt-1">
            {overallScore.toFixed(1)}
          </div>
          <div className="mt-3 space-y-2 text-xs text-gray-500 dark:text-gray-400">
            {metrics?.map(item => (
              <div key={item.metric} className="flex items-center justify-between">
                <span>{item.metric}</span>
                <span className="text-gray-700 dark:text-gray-200 font-semibold">{item.raw}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
