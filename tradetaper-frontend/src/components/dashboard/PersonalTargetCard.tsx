"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { FaBullseye } from 'react-icons/fa';

interface PersonalTargetCardProps {
  currentAmount: number;
  goalAmount: number;
  progress: number;
  onUpdateTarget: () => void;
}

export default function PersonalTargetCard({
  currentAmount,
  goalAmount,
  progress,
  onUpdateTarget,
}: PersonalTargetCardProps) {
  return (
    <DashboardCard 
      title="Personal Target" 
      icon={FaBullseye}
      showInfoIcon={true} 
      gridSpan="sm:col-span-1 lg:col-span-2"
    >
      <div className="space-y-4">
        <div className="flex items-baseline space-x-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            <CurrencyAmount amount={currentAmount} />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            / <CurrencyAmount amount={goalAmount} className="inline" />
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gradient-to-r from-emerald-100 to-emerald-200 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>$0</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {progress.toFixed(1)}%
            </span>
            <span>${goalAmount.toLocaleString()}</span>
          </div>
        </div>
        
        <AnimatedButton 
          onClick={onUpdateTarget}
          variant="gradient"
          size="lg"
          fullWidth
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          ripple
          glow
        >
          Update Target
        </AnimatedButton>
      </div>
    </DashboardCard>
  );
}
