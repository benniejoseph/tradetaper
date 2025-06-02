"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  startOfWeek, endOfWeek, parseISO, formatISO, isSameMonth, 
  startOfDay, getISOWeek
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaTimesCircle, FaListAlt, FaCalendarAlt, FaDownload } from 'react-icons/fa';

import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { Trade, TradeStatus } from '@/types/trade';
import { selectSelectedAccountId, selectSelectedAccount } from '@/store/features/accountSlice';

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
  const selectedAccount = useSelector(selectSelectedAccount);

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
        dayData.pnlPercentage = dayData.pnl > 0 ? Infinity : -Infinity;
      }
    });
    return data;
  }, [trades, currentMonth, accountBalanceForCalc]);

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
  }, [monthlyTrades, accountBalanceForCalc]);
  
  if (tradesLoading && trades.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading calendar data...</p>
        </div>
      </div>
    );
  }

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const gridDays = Object.values(dailyDataForGrid);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Trading Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monthly view of your trading activity and performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaDownload className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaCalendarAlt className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Navigation & Summary */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
              aria-label="Previous month"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
              aria-label="Next month"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Period Toggle */}
          <div className="flex bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-xl">
            {['Monthly', 'Quarterly', 'Yearly'].map(period => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period as 'Monthly' | 'Quarterly' | 'Yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === period 
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3 p-4 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm rounded-xl border border-green-200/50 dark:border-green-800/50">
            <div className="p-2 bg-green-100/80 dark:bg-green-900/30 rounded-xl">
              <FaCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Wins</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {monthlySummaryStats.totalWins} (+${monthlySummaryStats.totalWinPnl.toFixed(2)})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-800/50">
            <div className="p-2 bg-red-100/80 dark:bg-red-900/30 rounded-xl">
              <FaTimesCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Losses</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {monthlySummaryStats.totalLosses} (-${Math.abs(monthlySummaryStats.totalLossPnl).toFixed(2)})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50">
            <div className="p-2 bg-blue-100/80 dark:bg-blue-900/30 rounded-xl">
              <FaListAlt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Trades</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {monthlySummaryStats.totalTrades}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Summary Cards */}
      {weeklySummaryStats.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Weekly Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {weeklySummaryStats.map((week, index) => (
              <div key={week.weekNumber} className="group p-4 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/80 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Week {index + 1}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{week.tradeCount} trades</span>
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {week.activeDays} active day{week.activeDays !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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