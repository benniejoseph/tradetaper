"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfDay,
  formatISO,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaEllipsisH } from 'react-icons/fa'; // Added FaEllipsisH
import { Trade, TradeStatus } from '@/types/trade';

interface DailyPnlInfo {
  pnl: number;
  tradeCount: number;
  trades: Trade[]; // Store trades for the selected day
}

interface PnlByDay {
  [key: string]: DailyPnlInfo; // Key is 'YYYY-MM-DD'
}

interface DashboardPnlCalendarProps {
  trades: Trade[];
}

export default function DashboardPnlCalendar({ trades: allTrades }: DashboardPnlCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  const dailyPnlData: PnlByDay = useMemo(() => {
    const data: PnlByDay = {};
    if (!allTrades) return data;

    allTrades.forEach(trade => {
      if (trade.status === TradeStatus.CLOSED && trade.exitDate && trade.profitOrLoss !== undefined) {
        try {
          const dateKey = formatISO(startOfDay(parseISO(trade.exitDate)), { representation: 'date' });
          if (!data[dateKey]) {
            data[dateKey] = { pnl: 0, tradeCount: 0, trades: [] };
          }
          data[dateKey].pnl += trade.profitOrLoss;
          data[dateKey].tradeCount += 1;
          data[dateKey].trades.push(trade);
        } catch (error) {
          console.error("Error processing trade for P&L calendar:", trade, error);
        }
      }
    });
    return data;
  }, [allTrades]);

  // Effect to select the latest day with trades in the current month if no date is selected initially
  useEffect(() => {
    const today = startOfDay(new Date());
    if (isSameDay(selectedDate, today) && !dailyPnlData[formatISO(today, { representation: 'date' })]){
        const monthDays = Object.keys(dailyPnlData)
            .map(dateStr => parseISO(dateStr))
            .filter(date => isSameMonth(date, currentMonth))
            .sort((a,b) => b.getTime() - a.getTime());
        if(monthDays.length > 0) {
            setSelectedDate(monthDays[0]);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyPnlData, currentMonth]); // Only run when data or month changes, not selectedDate itself


  const daysInGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Adjusted to match image: solid green/red, blue for selected
  const getDayClass = (day: Date, pnlInfo: DailyPnlInfo | undefined): string => {
    const isSelected = isSameDay(day, selectedDate);
    // Exact colors from image would be needed for perfect match. Using Tailwind defaults for now.
    if (isSelected) return 'bg-blue-500 text-white'; // Selected day: Blue
    if (!isSameMonth(day, currentMonth)) return 'text-gray-400 dark:text-gray-500'; // Days not in month: Dimmed text, no bg
    
    if (pnlInfo) {
      if (pnlInfo.pnl > 0) return 'bg-green-500 text-white'; // Win day: Green
      if (pnlInfo.pnl < 0) return 'bg-red-500 text-white';   // Loss day: Red
    }
    // Default for days in month with no P&L or zero P&L (e.g., no trades, or breakeven)
    // Image shows these as plain, similar to out-of-month days. Let's use a very subtle background or just text.
    return 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50'; 
  };

  const weekDayHeaders = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const selectedDayStats = dailyPnlData[formatISO(selectedDate, { representation: 'date' })];

  const selectedDayMetrics = useMemo(() => {
    if (!selectedDayStats || selectedDayStats.tradeCount === 0) {
      return {
        winRate: 0,
        totalReturn: 0,
        returnOnWinners: 0,
        returnOnLosers: 0,
        winTradesCount: 0,
        lossTradesCount: 0,
        breakevenTradesCount: 0,
      };
    }
    const trades = selectedDayStats.trades;
    let winTradesCount = 0;
    let lossTradesCount = 0;
    let breakevenTradesCount = 0;
    let positivePnlSum = 0;
    let negativePnlSum = 0;

    trades.forEach(trade => {
      if (trade.profitOrLoss && trade.profitOrLoss > 0) {
        winTradesCount++;
        positivePnlSum += trade.profitOrLoss;
      } else if (trade.profitOrLoss && trade.profitOrLoss < 0) {
        lossTradesCount++;
        negativePnlSum += trade.profitOrLoss;
      } else {
        breakevenTradesCount++;
      }
    });

    const totalClosedTrades = winTradesCount + lossTradesCount + breakevenTradesCount;
    const winRate = totalClosedTrades > 0 ? (winTradesCount / totalClosedTrades) * 100 : 0;
    
    return {
      winRate,
      totalReturn: selectedDayStats.pnl,
      returnOnWinners: positivePnlSum,
      returnOnLosers: negativePnlSum, // This will be a negative value
      winTradesCount,
      lossTradesCount,
      breakevenTradesCount,
      totalTrades: totalClosedTrades, // Match total count with calculation
    };
  }, [selectedDayStats]);

  // Basic classes for the new structure
  const calendarContainerClasses = "p-2.5 rounded-lg bg-[var(--color-light-secondary)] dark:bg-dark-primary"; // Slightly reduced padding
  const statsContainerClasses = "p-3 rounded-lg bg-[var(--color-light-secondary)] dark:bg-dark-primary md:ml-4 mt-4 md:mt-0";
  const monthNavButtonClasses = "px-3 py-1.5 text-xs font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-[var(--color-text-dark-primary)] dark:text-text-light-primary flex items-center focus:outline-none focus:ring-1 focus:ring-blue-500";
  const iconButtonClasses = "p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary focus:outline-none focus:ring-1 focus:ring-blue-500";
  
  return (
    <div className="flex flex-col md:flex-row text-[var(--color-text-dark-primary)] dark:text-text-light-primary min-h-[300px] max-h-[320px] md:max-h-[300px]">
      {/* Left Column: Calendar */}
      <div className={`flex-grow md:w-2/3 ${calendarContainerClasses} flex flex-col`}>
        <div className="flex justify-between items-center mb-2.5 px-0.5">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className={iconButtonClasses} aria-label="Previous month">
            <FaChevronLeft className="h-3 w-3" />
          </button>
          <button className={monthNavButtonClasses} aria-label="Select month and year">
            <FaCalendarAlt className="h-3.5 w-3.5 mr-1.5 opacity-70" />
            {format(currentMonth, 'MMMM yyyy')}
          </button>
          <div className="flex items-center">
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className={iconButtonClasses} aria-label="Next month">
              <FaChevronRight className="h-3 w-3" />
            </button>
            <button className={`${iconButtonClasses} ml-1`} aria-label="More options">
                <FaEllipsisH className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {weekDayHeaders.map(header => <div key={header}>{header}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-0.5 flex-grow">
          {daysInGrid.map((day) => {
            const dayKey = formatISO(day, { representation: 'date' });
            const pnlInfo = dailyPnlData[dayKey];
            const dayClass = getDayClass(day, pnlInfo);
            const isCurrentCalendarMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={dayKey}
                onClick={() => { 
                  setSelectedDate(day);
                  // Optionally, if day is not in current month, switch month
                  // if (!isSameMonth(day, currentMonth)) setCurrentMonth(startOfMonth(day)); 
                }}
                className={`h-7 w-full rounded-sm flex items-center justify-center text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 p-0.5
                            ${dayClass}
                            ${!isCurrentCalendarMonth && !isSameDay(day, selectedDate) ? 'opacity-50 text-gray-400 dark:text-gray-600' : ''}`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Daily Stats */}
      <div className={`md:w-1/3 ${statsContainerClasses} flex flex-col text-xs`}>
        <h4 className="text-sm font-semibold mb-2.5 border-b border-[var(--color-light-border)] dark:border-gray-700 pb-1.5">
          {format(selectedDate, 'dd MMMM yyyy')}
        </h4>
        {selectedDayStats ? (
          <div className="space-y-1.5 flex-grow">
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Total trades</span><span>{selectedDayMetrics.totalTrades}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Winrate</span><span className={selectedDayMetrics.winRate >= 50 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>{selectedDayMetrics.winRate.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Return</span><span className={selectedDayMetrics.totalReturn >= 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>${selectedDayMetrics.totalReturn.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Return on winners</span><span className="text-green-500 font-semibold">${selectedDayMetrics.returnOnWinners.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Return on losers</span><span className="text-red-500 font-semibold">${selectedDayMetrics.returnOnLosers.toFixed(2)}</span></div>
            
            <div className="pt-1 pb-0.5">
              {/* Win/Loss Percentage Bar - refined text and padding */}
              <div className="flex h-4 text-[0.6rem] font-semibold rounded-sm overflow-hidden">
                <div style={{ width: `${selectedDayMetrics.winRate}%` }} className="bg-green-500 flex items-center justify-center text-white whitespace-nowrap overflow-hidden px-1 shadow-sm">
                  L {selectedDayMetrics.winRate.toFixed(0)}%
                </div>
                <div style={{ width: `${Math.max(0, 100 - selectedDayMetrics.winRate)}%` }} className="bg-red-500 flex items-center justify-center text-white whitespace-nowrap overflow-hidden px-1 shadow-sm">
                  S {Math.max(0, 100 - selectedDayMetrics.winRate).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-1.5 border-t border-[var(--color-light-border)] dark:border-gray-700"><span className="text-gray-600 dark:text-gray-400">Win trades</span><span className="text-green-500 font-semibold">{selectedDayMetrics.winTradesCount}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Loss trades</span><span className="text-red-500 font-semibold">{selectedDayMetrics.lossTradesCount}</span></div>
            {selectedDayMetrics.breakevenTradesCount > 0 && (
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Breakeven trades</span><span>{selectedDayMetrics.breakevenTradesCount}</span></div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full py-6">
            <FaCalendarAlt className="w-10 h-10 mb-2 opacity-30"/>
            <p className="font-medium">No trades on {format(selectedDate, 'dd MMM')}</p>
            <p className="mt-0.5 text-center">Select another day or adjust filters to view P&L details.</p>
          </div>
        )}
      </div>
    </div>
  );
} 