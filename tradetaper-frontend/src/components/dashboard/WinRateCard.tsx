"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { FaPercentage } from 'react-icons/fa';
import { 
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis 
} from 'recharts';

interface WinRateCardProps {
  winRate: number;
  averageRR: number;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function WinRateCard({
  winRate,
  averageRR,
  timeRange,
  onTimeRangeChange,
}: WinRateCardProps) {
  const winrateChartData = [
    { name: 'Winrate', value: parseFloat(winRate.toFixed(1)), fill: '#10B981' }
  ];

  return (
    <DashboardCard 
      title="Win Rate Analysis" 
      icon={FaPercentage}
      showInfoIcon  
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
      gridSpan="sm:col-span-2 lg:col-span-3"
    >
      <div className="flex flex-col items-center justify-center space-y-4 h-full pb-4">
        <div className="relative w-56 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="80%"
              outerRadius="110%"
              barSize={20}
              data={winrateChartData} 
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar 
                dataKey='value' 
                cornerRadius={10}
                angleAxisId={0}
                fill="url(#winrateGradient)"
              />
              <defs>
                <linearGradient id="winrateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Win Rate
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm px-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk-Reward Ratio</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{averageRR.toFixed(2)}</span>
          </div>
          <div className="relative h-3 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((averageRR / 5) * 100, 100)}%`}}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
            <span>0</span>
            <span>2.5</span>
            <span>5</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
