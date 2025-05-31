"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  startOfWeek, endOfWeek, parseISO, formatISO, isSameMonth, 
  startOfDay, getISOWeek
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaTimesCircle, FaListAlt } from 'react-icons/fa'; // Icons for summary

import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { Trade, TradeStatus } from '@/types/trade';
import { selectSelectedAccountId, selectSelectedAccount } from '@/store/features/accountSlice'; // Import selectSelectedAccount

// Types for aggregated data
interface DailyAggregatedData {
  date: string; // YYYY-MM-DD
  pnl: number;
  tradeCount: number;
  rMultipleSum: number;
  commissionSum: number;
  trades: Trade[];
  isCurrentMonth: boolean;
  pnlPercentage?: number; // Added for daily P&L percentage
}

interface MonthlySummaryStats {
  totalWins: number;
  totalWinPnl: number;
  totalLosses: number;
  totalLossPnl: number;
  totalTrades: number;
}

interface WeeklySummaryStatData {
  weekNumber: number;
  pnl: number;
  tradeCount: number;
  activeDays: number;
  pnlPercentage?: number; // Added for weekly P&L percentage
}

// const STATIC_ACCOUNT_BALANCE = 6578.98; // Removed static balance

export default function CalendarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading } = useSelector((state: RootState) => state.trades);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedAccount = useSelector(selectSelectedAccount); // Get the full selected account object

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedPeriod, setSelectedPeriod] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');

  useEffect(() => {
    dispatch(fetchTrades(selectedAccountId || undefined)); 
  }, [dispatch, selectedAccountId]);

  const accountBalanceForCalc = useMemo(() => selectedAccount?.balance || 0, [selectedAccount]);

  const monthlyTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter(trade => 
      trade.exitDate && isSameMonth(parseISO(trade.exitDate), currentMonth) && trade.status === TradeStatus.CLOSED
    );
  }, [trades, currentMonth]);

  const dailyDataForGrid = useMemo(() => {
    const data: { [key: string]: DailyAggregatedData } = {};
    if (!trades) return data;

    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
    const daysToDisplay = eachDayOfInterval({ start: gridStart, end: gridEnd });

    daysToDisplay.forEach(day => {
      const dateKey = formatISO(day, { representation: 'date' });
      data[dateKey] = {
        date: dateKey, pnl: 0, tradeCount: 0, rMultipleSum: 0,
        commissionSum: 0, trades: [], isCurrentMonth: isSameMonth(day, currentMonth),
      };
    });

    trades.forEach(trade => {
      if (trade.status === TradeStatus.CLOSED && trade.exitDate && trade.profitOrLoss !== undefined) {
        try {
          const dayOfTrade = startOfDay(parseISO(trade.exitDate));
          const dateKey = formatISO(dayOfTrade, { representation: 'date' });
          if (data[dateKey]) {
            data[dateKey].pnl += trade.profitOrLoss || 0;
            data[dateKey].tradeCount += 1;
            data[dateKey].rMultipleSum += trade.rMultiple || 0;
            data[dateKey].commissionSum += trade.commission || 0;
            data[dateKey].trades.push(trade);
          }
        } catch (error) {
          console.error("Error processing trade for calendar grid:", trade, error);
        }
      }
    });

    Object.values(data).forEach(dayData => {
      if (dayData.tradeCount > 0 && accountBalanceForCalc > 0) {
        dayData.pnlPercentage = (dayData.pnl / accountBalanceForCalc) * 100;
      } else if (dayData.tradeCount > 0 && dayData.pnl !== 0) {
        dayData.pnlPercentage = dayData.pnl > 0 ? Infinity : -Infinity; // P&L with zero/invalid balance
      }
    });
    return data;
  }, [trades, currentMonth, accountBalanceForCalc]); // Added accountBalanceForCalc dependency

  const monthlySummaryStats: MonthlySummaryStats = useMemo(() => {
    const stats: MonthlySummaryStats = { totalWins: 0, totalWinPnl: 0, totalLosses: 0, totalLossPnl: 0, totalTrades: 0 };
    monthlyTrades.forEach(trade => {
      stats.totalTrades++;
      if (trade.profitOrLoss && trade.profitOrLoss > 0) {
        stats.totalWins++;
        stats.totalWinPnl += trade.profitOrLoss;
      } else if (trade.profitOrLoss && trade.profitOrLoss < 0) {
        stats.totalLosses++;
        stats.totalLossPnl += trade.profitOrLoss;
      }
    });
    return stats;
  }, [monthlyTrades]);

  const weeklySummaryStats: WeeklySummaryStatData[] = useMemo(() => {
    if (!monthlyTrades || monthlyTrades.length === 0) return [];
    const weeklyDataAgg: { [week: number]: { pnl: number; tradeCount: number; days: Set<string> } } = {};

    monthlyTrades.forEach(trade => {
      if (trade.exitDate) {
        try {
          const tradeDate = parseISO(trade.exitDate);
          const weekNumber = getISOWeek(tradeDate);
          if (!weeklyDataAgg[weekNumber]) {
            weeklyDataAgg[weekNumber] = { pnl: 0, tradeCount: 0, days: new Set() };
          }
          weeklyDataAgg[weekNumber].pnl += trade.profitOrLoss || 0;
          weeklyDataAgg[weekNumber].tradeCount += 1;
          weeklyDataAgg[weekNumber].days.add(formatISO(startOfDay(tradeDate), { representation: 'date' }));
        } catch (error) {
          console.error("Error processing trade for weekly summary:", trade, error);
        }
      }
    });

    return Object.entries(weeklyDataAgg).map(([week, data]) => {
      let pnlPercentage;
      if (accountBalanceForCalc > 0) {
        pnlPercentage = (data.pnl / accountBalanceForCalc) * 100;
      } else if (data.pnl !== 0) {
        pnlPercentage = data.pnl > 0 ? Infinity : -Infinity;
      }
      return {
        weekNumber: parseInt(week),
        pnl: data.pnl,
        tradeCount: data.tradeCount,
        activeDays: data.days.size,
        pnlPercentage: pnlPercentage
      };
    }).sort((a, b) => a.weekNumber - b.weekNumber);
  }, [monthlyTrades, accountBalanceForCalc]); // Added accountBalanceForCalc dependency
  
  if (tradesLoading && trades.length === 0) {
    return <div className="p-8 text-center">Loading calendar data...</div>;
  }

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const gridDays = Object.values(dailyDataForGrid);

  // Placeholder for the rest of the UI
  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-100 dark:bg-dark-primary min-h-screen">
      {/* Month Navigation & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-dark-secondary rounded-lg shadow">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-accent-green"
            aria-label="Previous month"
          >
            <FaChevronLeft className="h-5 w-5 text-gray-600 dark:text-text-light-secondary" />
          </button>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-text-light-primary">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-accent-green"
            aria-label="Next month"
          >
            <FaChevronRight className="h-5 w-5 text-gray-600 dark:text-text-light-secondary" />
          </button>
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <FaCheckCircle />
            <span>Win: {monthlySummaryStats.totalWins} (${monthlySummaryStats.totalWinPnl.toFixed(2)})</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <FaTimesCircle />
            <span>Loss: {monthlySummaryStats.totalLosses} (${Math.abs(monthlySummaryStats.totalLossPnl).toFixed(2)})</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-text-light-secondary">
            <FaListAlt />
            <span>Trades: {monthlySummaryStats.totalTrades}</span>
          </div>
        </div>
      </div>

      {/* Period Toggle Placeholder */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-dark-secondary" role="group">
          {['Monthly', 'Quarterly', 'Yearly'].map(period => (
            <button
              key={period}
              type="button"
              onClick={() => setSelectedPeriod(period as 'Monthly' | 'Quarterly' | 'Yearly')}
              className={`px-4 py-2 text-sm font-medium border border-gray-200 dark:border-dark-border 
                          ${selectedPeriod === period 
                            ? 'bg-accent-green text-white ring-1 ring-accent-green z-10'
                            : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-dark-secondary dark:hover:bg-dark-hover dark:text-text-light-secondary'}
                          first:rounded-l-md last:rounded-r-md focus:z-10 focus:ring-1 focus:ring-accent-green`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {weeklySummaryStats.map((week, index) => (
          <div key={week.weekNumber} className="p-3.5 bg-white dark:bg-dark-secondary rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-baseline mb-1">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-text-light-primary">Week {index + 1}</h4>
              <span className="text-xs text-gray-500 dark:text-text-light-secondary">{week.tradeCount} trades</span>
            </div>
            <div className="flex items-baseline space-x-2">
                <p className={`text-lg font-bold ${week.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {week.pnl >= 0 ? '+' : ''}${Math.abs(week.pnl).toFixed(2)}
                </p>
                {week.pnlPercentage !== undefined && (
                <span className={`text-xs font-medium ${week.pnl >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {week.pnlPercentage === Infinity ? '(+∞%)' : 
                     week.pnlPercentage === -Infinity ? '(-∞%)' : 
                     week.pnlPercentage !== undefined ? `(${week.pnlPercentage >= 0 ? '+' : ''}${week.pnlPercentage.toFixed(2)}%)` : ''}
                </span>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-text-light-secondary mt-1">{week.activeDays} day{week.activeDays === 1 ? '' : 's'}</p>
          </div>
        ))}
        {weeklySummaryStats.length === 0 && !tradesLoading && (
           <div className="col-span-full text-center py-4 text-gray-500 dark:text-text-light-secondary">
             No trades in this month to summarize by week.
           </div>
        )}
      </div>

      {/* Main Calendar Grid Implementation */}
      <div className="bg-white dark:bg-dark-secondary shadow-lg rounded-lg overflow-hidden">
        {/* Header Row for Week Day Labels */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-dark-border">
          {weekDayLabels.map(label => (
            <div key={label} className="py-3 text-center text-xs font-medium text-gray-500 dark:text-text-light-secondary uppercase tracking-wider">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {gridDays.map((dayData) => {
            const { date, pnl, tradeCount, rMultipleSum, commissionSum, isCurrentMonth: isDayInCurrentMonth, pnlPercentage } = dayData;
            const dayNumber = format(parseISO(date), 'd');
            
            let cellBgClass = 'bg-white dark:bg-dark-secondary';
            let pnlTextClass = 'text-gray-800 dark:text-text-light-primary';
            let rMultipleTextClass = 'text-gray-500 dark:text-text-light-secondary';
            const mainTextOpacity = isDayInCurrentMonth ? 'opacity-100' : 'opacity-40';

            if (isDayInCurrentMonth && tradeCount > 0) {
              if (pnl > 0) {
                cellBgClass = 'bg-green-50 dark:bg-green-900/25';
                pnlTextClass = 'text-green-600 dark:text-green-300';
                rMultipleTextClass = 'text-green-600 dark:text-green-400';
              } else if (pnl < 0) {
                cellBgClass = 'bg-red-50 dark:bg-red-900/25';
                pnlTextClass = 'text-red-600 dark:text-red-300';
                rMultipleTextClass = 'text-red-600 dark:text-red-400';
              }
            }

            return (
              <div 
                key={date}
                className={`p-1.5 border-r border-b border-gray-200 dark:border-dark-border min-h-[100px] md:min-h-[130px] flex flex-col justify-between ${cellBgClass} ${mainTextOpacity}`}
              >
                {/* Top part: Day number and trade count */}
                <div className="flex justify-between items-start text-xs">
                  <span className={`font-medium ${isDayInCurrentMonth ? 'text-gray-700 dark:text-text-light-primary' : 'text-gray-400 dark:text-gray-500'}`}>{dayNumber}</span>
                  {isDayInCurrentMonth && tradeCount > 0 && (
                    <span className="text-gray-500 dark:text-text-light-secondary">{tradeCount} trade{tradeCount === 1 ? '' : 's'}</span>
                  )}
                </div>

                {/* Middle part: P&L info (only if trades exist and in current month) */}
                {isDayInCurrentMonth && tradeCount > 0 && (
                  <div className={`text-center my-1 ${mainTextOpacity}`}> 
                    <p className={`font-semibold text-sm ${pnlTextClass}`}>{pnl >=0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}</p>
                    {pnlPercentage !== undefined && (
                         <p className={`text-xs ${pnlTextClass} ${pnl !== 0 ? 'opacity-80' : 'opacity-0'}`}>{pnlPercentage === Infinity ? '+∞%' : 
                          pnlPercentage === -Infinity ? '-∞%' : 
                          pnlPercentage !== undefined ? `${pnlPercentage >=0 ? '+' : ''}${pnlPercentage.toFixed(1)}%` : ''}</p>
                    )}
                  </div>
                )}
                
                {/* Bottom part: R-multiple and Commission (only if trades exist and in current month) */}
                {isDayInCurrentMonth && tradeCount > 0 && (
                  <div className={`text-xxs space-y-0.5 ${mainTextOpacity}`}>
                    <p className={`${rMultipleTextClass}`}>{rMultipleSum >= 0 ? '+' : ''}{rMultipleSum.toFixed(1)}R</p>
                    <p className="text-gray-500 dark:text-text-light-secondary">Comm: ${commissionSum.toFixed(2)}</p>
                  </div>
                )}

                {/* If no trades and not in current month, could show a more empty state or rely on opacity */}
                {!isDayInCurrentMonth && tradeCount === 0 && <div className="flex-grow"></div>} 
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
} 