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

  const summary = useMemo(() => {
    const activeDays = heatmapValues.length;
    const totalTrades = heatmapValues.reduce((sum, day) => sum + day.count, 0);
    const totalPnl = heatmapValues.reduce((sum, day) => sum + day.totalPnl, 0);
    const winningDays = heatmapValues.filter(day => day.totalPnl > 0).length;
    const losingDays = heatmapValues.filter(day => day.totalPnl < 0).length;
    return { activeDays, totalTrades, totalPnl, winningDays, losingDays };
  }, [heatmapValues]);

  return (
    <div className="relative p-4 sm:p-5 h-full flex flex-col rounded-2xl bg-gradient-to-b from-white via-white/90 to-emerald-50/40 dark:from-[#050505] dark:via-black dark:to-emerald-950/20 border border-emerald-500/10 dark:border-emerald-400/10 shadow-lg overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.12),transparent_45%)]"></div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>

      {/* Summary strip */}
      <div className="relative z-10 mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-white/70 dark:bg-black/60 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
          Last 12 months
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-black/60 px-3 py-1 text-[11px] font-medium">
          {summary.activeDays} active days
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-black/60 px-3 py-1 text-[11px] font-medium">
          {summary.totalTrades} trades
        </span>
        <span className={`inline-flex items-center gap-2 rounded-full border border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-black/60 px-3 py-1 text-[11px] font-semibold ${
          summary.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-500 dark:text-red-300'
        }`}>
          Net P&L <CurrencyAmount amount={summary.totalPnl} className="inline" />
        </span>
      </div>

      {/* Calendar content */}
      <div className="relative z-10 flex-1 flex justify-center">
        <div className="w-full max-w-[1400px]">
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
            gutterSize={4}
          />
        </div>
      </div>
        
      {/* Legend */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            {summary.winningDays} winning days
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            {summary.losingDays} losing days
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-md bg-gray-100 dark:bg-[#141414] border border-gray-200/60 dark:border-gray-800" title="No trades"></div>
            <div className="h-3 w-3 rounded-md bg-red-200 dark:bg-red-900/40" title="Low loss"></div>
            <div className="h-3 w-3 rounded-md bg-red-400 dark:bg-red-700/60" title="Medium loss"></div>
            <div className="h-3 w-3 rounded-md bg-red-600 dark:bg-red-500/80" title="High loss"></div>
            <div className="h-3 w-3 rounded-md bg-emerald-200 dark:bg-emerald-900/40" title="Low profit"></div>
            <div className="h-3 w-3 rounded-md bg-emerald-400 dark:bg-emerald-700/60" title="Medium profit"></div>
            <div className="h-3 w-3 rounded-md bg-emerald-600 dark:bg-emerald-500" title="High profit"></div>
          </div>
          <span className="text-[11px]">More</span>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar-heatmap { width: 100%; }
        .react-calendar-heatmap rect { rx: 4px; }
        .react-calendar-heatmap text { font-size: 10px; fill: #9CA3AF; font-weight: 500; }
        .react-calendar-heatmap rect { transition: transform 120ms ease, filter 120ms ease, stroke 120ms ease; }
        .react-calendar-heatmap rect:hover { stroke: rgba(16, 185, 129, 0.8); stroke-width: 1; filter: drop-shadow(0 0 6px rgba(16,185,129,0.35)); transform: scale(1.06); }
        .react-calendar-heatmap rect.color-scale-red-4:hover { stroke: rgba(239, 68, 68, 0.9); filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.35)); }
        
        .color-empty { fill: #f3f4f6; }
        .dark .color-empty { fill: #141414; }

        .color-scale-green-1 { fill: #d1fae5; }
        .color-scale-green-2 { fill: #6ee7b7; }
        .color-scale-green-3 { fill: #34d399; }
        .color-scale-green-4 { fill: #10b981; }

        .dark .color-scale-green-1 { fill: rgba(16, 185, 129, 0.2); }
        .dark .color-scale-green-2 { fill: rgba(16, 185, 129, 0.4); }
        .dark .color-scale-green-3 { fill: rgba(16, 185, 129, 0.6); }
        .dark .color-scale-green-4 { fill: rgba(16, 185, 129, 0.95); }

        .color-scale-red-1 { fill: #fee2e2; }
        .color-scale-red-2 { fill: #fca5a5; }
        .color-scale-red-3 { fill: #f87171; }
        .color-scale-red-4 { fill: #ef4444; }

        .dark .color-scale-red-1 { fill: rgba(239, 68, 68, 0.2); }
        .dark .color-scale-red-2 { fill: rgba(239, 68, 68, 0.4); }
        .dark .color-scale-red-3 { fill: rgba(239, 68, 68, 0.6); }
        .dark .color-scale-red-4 { fill: rgba(239, 68, 68, 0.95); }
      `}</style>
    </div>
  );
} 
