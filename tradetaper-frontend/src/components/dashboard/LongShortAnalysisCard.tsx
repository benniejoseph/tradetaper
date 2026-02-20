"use client";

import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { FaBalanceScale } from 'react-icons/fa';
import { Trade, TradeDirection, TradeStatus } from '@/types/trade';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';

interface LongShortAnalysisCardProps {
  trades: Trade[];
}

export default function LongShortAnalysisCard({ trades }: LongShortAnalysisCardProps) {
  
  const stats = useMemo(() => {
    const longTrades = trades.filter(t => t.direction === TradeDirection.LONG && t.status === TradeStatus.CLOSED);
    const shortTrades = trades.filter(t => t.direction === TradeDirection.SHORT && t.status === TradeStatus.CLOSED);

    const calculateStats = (subset: Trade[]) => {
      const count = subset.length;
      if (count === 0) return { count: 0, winRate: 0, pnl: 0, avgPnl: 0 };
      
      const wins = subset.filter(t => (t.profitOrLoss || 0) > 0).length;
      const pnl = subset.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
      
      return {
        count,
        winRate: (wins / count) * 100,
        pnl,
        avgPnl: pnl / count
      };
    };

    return {
      long: calculateStats(longTrades),
      short: calculateStats(shortTrades)
    };
  }, [trades]);

  const totalTrades = stats.long.count + stats.short.count;
  const longPercent = totalTrades > 0 ? (stats.long.count / totalTrades) * 100 : 0;
  const shortPercent = totalTrades > 0 ? (stats.short.count / totalTrades) * 100 : 0;

  return (
    <DashboardCard 
      title="Long vs Short Analysis" 
      icon={FaBalanceScale}
      gridSpan="lg:col-span-3"
      showInfoIcon
      infoContent="Compares performance by direction. Improve by focusing on the side with stronger edge and reducing bias-driven trades."
    >
      <div className="space-y-6">
        
        {/* Distribution Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Longs ({stats.long.count})</span>
            <span>Shorts ({stats.short.count})</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${longPercent}%` }} 
            />
            <div 
              className="h-full bg-orange-500 transition-all duration-500" 
              style={{ width: `${shortPercent}%` }} 
            />
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Long Stats */}
          <div className="space-y-3 p-3 bg-blue-50/50 dark:bg-emerald-900/10 rounded-xl border border-blue-100 dark:border-emerald-800/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Long</h4>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Net P&L</div>
              <div className={`text-base font-bold ${stats.long.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <CurrencyAmount amount={stats.long.pnl} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.long.winRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Short Stats */}
          <div className="space-y-3 p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Short</h4>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Net P&L</div>
              <div className={`text-base font-bold ${stats.short.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                 <CurrencyAmount amount={stats.short.pnl} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.short.winRate.toFixed(1)}%
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardCard>
  );
}
