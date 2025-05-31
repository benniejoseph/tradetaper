"use client";

import React, { useMemo } from 'react';
import CalendarHeatmap, { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import { Tooltip as ReactTooltip } from 'react-tooltip'; // react-tooltip v5+ exports Tooltip directly
import { Trade, TradeStatus } from '@/types/trade';
import {
  format as formatDateFns,
  parseISO,
  startOfDay,
  subYears,
  formatISO
} from 'date-fns';
import 'react-calendar-heatmap/dist/styles.css';
import 'react-tooltip/dist/react-tooltip.css'; // Import react-tooltip CSS if not already global

// This interface now matches what we put into `values` for CalendarHeatmap
interface CustomHeatmapValue {
  date: string; // YYYY-MM-DD
  count: number; // Number of trades
  totalPnl: number;
}

interface TradesCalendarHeatmapProps {
  trades: Trade[];
}

export default function TradesCalendarHeatmap({ trades }: TradesCalendarHeatmapProps) {
  const today = startOfDay(new Date());
  const oneYearAgo = subYears(today, 1);

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

  // The value passed to callbacks will have at least date and count from the library,
  // and we add totalPnl. So we cast it to our richer type after checking.
  type HeatmapCallbackArg = ReactCalendarHeatmapValue<string> | undefined;

  // Let TypeScript infer the return type here, as it needs to be compatible with HTML data attributes
  const getTooltipDataAttrs = (valueArg: HeatmapCallbackArg) => {
    const value = valueArg as (CustomHeatmapValue & ReactCalendarHeatmapValue<string>) | undefined;
    if (!value || !value.date || value.totalPnl === undefined || value.count === 0) {
        return undefined; // Return undefined if no tooltip needed
    }
    return {
      'data-tooltip-id': 'heatmap-tooltip',
      'data-tooltip-content': `${formatDateFns(parseISO(value.date), 'MMM d, yyyy')}: ${value.count} trade(s), P&L: $${value.totalPnl.toFixed(2)}`
    };
  };

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
        tooltipDataAttrs={getTooltipDataAttrs}
        showWeekdayLabels={true}
        // weekdayLabels={['S', 'M', 'T', 'W', 'T', 'F', 'S']}
        monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
        onClick={(valueArg) => {
          const value = valueArg as (CustomHeatmapValue & ReactCalendarHeatmapValue<string>) | undefined;
          if (value && value.date && value.totalPnl !== undefined) {
            alert(`Date: ${value.date}\nCount: ${value.count}\nP&L: ${value.totalPnl.toFixed(2)}`);
          }
        }}
        gutterSize={2}
      />
      <ReactTooltip 
        id="heatmap-tooltip" 
        place="top"
        className="!bg-dark-secondary !dark:!bg-light-secondary !text-text-light-primary !dark:!text-text-dark-primary !text-xs !px-2 !py-1 !rounded-md !opacity-90 custom-tooltip-style shadow-lg"
        style={{ border: '1px solid var(--color-light-border)'}}
      />
    </div>
  );
} 