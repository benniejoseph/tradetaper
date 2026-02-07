"use client";

import React, { useMemo, useState } from 'react';
import CalendarHeatmap, { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import { Trade, TradeStatus } from '@/types/trade';
import {
  parseISO,
  startOfDay,
  subYears,
  formatISO,
  format as formatDate
} from 'date-fns';
import 'react-calendar-heatmap/dist/styles.css';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { FaCalendarAlt, FaChartLine, FaExchangeAlt, FaTimes } from 'react-icons/fa';

// This interface now matches what we put into `values` for CalendarHeatmap
interface CustomHeatmapValue {
  date: string; // YYYY-MM-DD
  count: number; // Number of trades
  totalPnl: number;
}

interface TradesCalendarHeatmapProps {
  trades: Trade[];
  onDateClick?: (dateData: CustomHeatmapValue, tradesForDate: Trade[]) => void;
}

export default function TradesCalendarHeatmap({ trades, onDateClick }: TradesCalendarHeatmapProps) {
  const today = startOfDay(new Date());
  const oneYearAgo = subYears(today, 1);
  // Remove internal modal state - modal will be handled at parent level

  const heatmapValues: CustomHeatmapValue[] = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }
    const dailyData: { [key: string]: { count: number; totalPnl: number } } = {};
    trades.forEach(trade => {
      const tradeDateString = trade.status === TradeStatus.CLOSED && trade.exitDate ? trade.exitDate : trade.entryDate;
      if (!tradeDateString) return;
      try {
        const date = formatISO(startOfDay(parseISO(tradeDateString)), { representation: 'date' });
        const pnl = trade.profitOrLoss || 0;
        if (!dailyData[date]) {
          dailyData[date] = { count: 0, totalPnl: 0 };
        }
        dailyData[date].count += 1;
        dailyData[date].totalPnl += pnl;
      } catch (error) {
        console.error("Error processing trade date for heatmap:", tradeDateString, error);
      }
    });
    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      totalPnl: data.totalPnl,
    }));
  }, [trades]);

  // Helper function to get trades for a specific date
  const getTradesForDate = (date: string): Trade[] => {
    return trades.filter(trade => {
      const tradeDateString = trade.status === TradeStatus.CLOSED && trade.exitDate ? trade.exitDate : trade.entryDate;
      if (!tradeDateString) return false;
      try {
        const tradeDate = formatISO(startOfDay(parseISO(tradeDateString)), { representation: 'date' });
        return tradeDate === date;
      } catch (error) {
        return false;
      }
    });
  };

  // The value passed to callbacks will have at least date and count from the library,
  // and we add totalPnl. So we cast it to our richer type after checking.
  type HeatmapCallbackArg = ReactCalendarHeatmapValue<string> | undefined;

  const classForValue = (valueArg: HeatmapCallbackArg) => {
    const value = valueArg as (CustomHeatmapValue & ReactCalendarHeatmapValue<string>) | undefined;
    if (!value || !value.date || value.count === 0 || value.totalPnl === undefined) {
      return 'color-empty';
    }
    let intensityLevel = Math.min(Math.ceil(value.count / 2), 4);
    if (value.count === 1) intensityLevel = 1;
    if (value.count === 0) intensityLevel = 0;

    if (value.totalPnl > 0) return `color-scale-green-${Math.min(intensityLevel, 4)}`;
    if (value.totalPnl < 0) return `color-scale-red-${Math.min(intensityLevel, 4)}`;
    return `color-scale-neutral-${Math.min(intensityLevel, 4)}`;
  };

  return (
    <div className="relative p-2 sm:p-4 h-full flex flex-col rounded-xl bg-white dark:bg-black border border-gray-100 dark:border-gray-800 shadow-sm">
      
      {/* Calendar content */}
      <div className="relative z-10 flex-1">
        <CalendarHeatmap
          startDate={oneYearAgo}
          endDate={today}
          values={heatmapValues}
          classForValue={classForValue}
          showWeekdayLabels={true}
          monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
          titleForValue={(value: any) => value && value.date ? `${value.date}: ${value.count} trades, $${value.totalPnl?.toFixed(2)}` : ''}
          onClick={(valueArg) => {
            const value = valueArg as (CustomHeatmapValue & ReactCalendarHeatmapValue<string>) | undefined;
            if (value && value.date && value.totalPnl !== undefined && value.count > 0 && onDateClick) {
              const tradesForDate = getTradesForDate(value.date);
              onDateClick(value, tradesForDate);
            }
          }}
          gutterSize={3}
        />
      </div>
        
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" title="No Trades"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" title="Low Profit"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/60" title="Medium Profit"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" title="High Profit"></div>
        </div>
        <span>More</span>
      </div>

      <style jsx global>{`
        .react-calendar-heatmap rect { rx: 2px; }
        .react-calendar-heatmap text { font-size: 10px; fill: #9CA3AF; }
        
        .color-empty { fill: #f3f4f6; }
        .dark .color-empty { fill: #1f2937; }

        .color-scale-green-1 { fill: #d1fae5; }
        .color-scale-green-2 { fill: #6ee7b7; }
        .color-scale-green-3 { fill: #34d399; }
        .color-scale-green-4 { fill: #10b981; }

        .dark .color-scale-green-1 { fill: rgba(16, 185, 129, 0.2); }
        .dark .color-scale-green-2 { fill: rgba(16, 185, 129, 0.4); }
        .dark .color-scale-green-3 { fill: rgba(16, 185, 129, 0.6); }
        .dark .color-scale-green-4 { fill: rgba(16, 185, 129, 0.9); }

        .color-scale-red-1 { fill: #fee2e2; }
        .color-scale-red-2 { fill: #fca5a5; }
        .color-scale-red-3 { fill: #f87171; }
        .color-scale-red-4 { fill: #ef4444; }

        .dark .color-scale-red-1 { fill: rgba(239, 68, 68, 0.2); }
        .dark .color-scale-red-2 { fill: rgba(239, 68, 68, 0.4); }
        .dark .color-scale-red-3 { fill: rgba(239, 68, 68, 0.6); }
        .dark .color-scale-red-4 { fill: rgba(239, 68, 68, 0.9); }
      `}</style>
    </div>
  );
} 