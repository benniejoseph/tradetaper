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

    if (value.totalPnl > 0) return `color-scale-green-${intensityLevel}`;
    if (value.totalPnl < 0) return `color-scale-red-${intensityLevel}`;
    return `color-scale-neutral-${intensityLevel}`;
  };

  return (
    <div className="p-1 sm:p-3 h-full flex flex-col rounded-lg min-h-[180px] sm:min-h-[200px]">
      <CalendarHeatmap
        startDate={oneYearAgo}
        endDate={today}
        values={heatmapValues}
        classForValue={classForValue}
        showWeekdayLabels={true}
        monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
        onClick={(valueArg) => {
          const value = valueArg as (CustomHeatmapValue & ReactCalendarHeatmapValue<string>) | undefined;
          if (value && value.date && value.totalPnl !== undefined && value.count > 0 && onDateClick) {
            const tradesForDate = getTradesForDate(value.date);
            onDateClick(value, tradesForDate);
          }
        }}
        gutterSize={2}
      />
    </div>
  );
} 