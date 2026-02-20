"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { FaChartLine } from 'react-icons/fa';
import { DashboardStats } from '@/utils/analytics';

interface TradeExpectancyCardProps {
  stats: DashboardStats | null;
}

export default function TradeExpectancyCard({ stats }: TradeExpectancyCardProps) {
  const expectancy = stats?.expectancy || 0;

  return (
    <DashboardCard
      title="Trade Expectancy"
      icon={FaChartLine}
      gridSpan="sm:col-span-1 lg:col-span-2"
      showInfoIcon
      infoContent="Average $ per trade based on win rate and average win/loss. Improve by increasing average win or reducing average loss."
    >
      <div className="flex items-center justify-between">
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
    </DashboardCard>
  );
}
