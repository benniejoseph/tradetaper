"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
import { format, parseISO, isValid } from 'date-fns';
import { Trade, TradeStatus, TradeDirection } from '@/types/trade';
import { 
  FaChevronDown, FaCaretUp, FaCaretDown, FaCalendarDay, 
  FaChartLine, FaArrowUp, FaArrowDown, FaDollarSign,
  FaPercentage, FaExchangeAlt, FaCog, FaDownload, FaFilter,
  FaSortAmountDown, FaSortAmountUp
} from 'react-icons/fa';

interface DayStats {
  date: string;
  totalNetPnl: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  longTrades: number;
  shortTrades: number;
  totalCommissions: number;
  winRate: number;
  trades: Trade[];
}

export default function DailyStatsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading, error } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRange, setSelectedRange] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTrades(selectedAccountId || undefined));
    }
  }, [dispatch, isAuthenticated, selectedAccountId]);

  // Group trades by day and calculate stats
  const dailyStats = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const accountTrades = selectedAccountId 
      ? trades.filter(trade => trade.accountId === selectedAccountId)
      : trades;

    const dailyGroups: { [date: string]: Trade[] } = {};

    accountTrades.forEach(trade => {
      if (trade.entryDate) {
        try {
          const entryDate = parseISO(trade.entryDate);
          if (isValid(entryDate)) {
            const dayKey = format(entryDate, 'yyyy-MM-dd');
            if (!dailyGroups[dayKey]) {
              dailyGroups[dayKey] = [];
            }
            dailyGroups[dayKey].push(trade);
          }
        } catch {
          console.warn('Invalid date format:', trade.entryDate);
        }
      }
    });

    // Calculate stats for each day
    const dailyStatsArray: DayStats[] = Object.entries(dailyGroups).map(([date, dayTrades]) => {
      const closedTrades = dayTrades.filter(t => t.status === TradeStatus.CLOSED);
      const longTrades = dayTrades.filter(t => t.direction === TradeDirection.LONG);
      const shortTrades = dayTrades.filter(t => t.direction === TradeDirection.SHORT);
      const winningTrades = closedTrades.filter(t => (t.profitOrLoss || 0) > 0);
      const totalNetPnl = closedTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
      const totalCommissions = dayTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

      return {
        date,
        totalNetPnl,
        totalTrades: dayTrades.length,
        openTrades: dayTrades.filter(t => t.status === TradeStatus.OPEN).length,
        closedTrades: closedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: closedTrades.length - winningTrades.length,
        longTrades: longTrades.length,
        shortTrades: shortTrades.length,
        totalCommissions,
        winRate,
        trades: dayTrades,
      };
    });

    return dailyStatsArray;
  }, [trades, selectedAccountId]);

  const sortedDailyStats = useMemo(() => {
    return [...dailyStats].sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.date.localeCompare(a.date);
      } else {
        return a.date.localeCompare(b.date);
      }
    });
  }, [dailyStats, sortOrder]);

  const formatDateHeader = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM dd yyyy');
    } catch {
      return dateString;
    }
  };

  const calculatePnlPercentage = (dayStats: DayStats) => {
    // Calculate percentage based on total position value of the day
    const totalPositionValue = dayStats.trades.reduce((sum, trade) => {
      if (trade.entryPrice && trade.quantity) {
        return sum + Math.abs(trade.entryPrice * trade.quantity);
      }
      return sum;
    }, 0);
    
    if (totalPositionValue === 0) return 0;
    return (dayStats.totalNetPnl / totalPositionValue) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading daily stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">Error loading daily stats: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Daily Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your daily trading performance and patterns
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaDownload className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-purple-500 dark:hover:bg-purple-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaFilter className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-orange-500 dark:hover:bg-orange-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaCog className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              <FaCalendarDay className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Sort</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize your view</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Date Range Filter */}
            <div className="relative">
              <select 
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="appearance-none bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70">
                <option value="all">All Time</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort Order */}
            <div className="relative">
              <select 
                value={sortOrder === 'asc' ? 'time_asc' : 'time_desc'}
                onChange={(e) => setSortOrder(e.target.value === 'time_asc' ? 'asc' : 'desc')}
                className="appearance-none bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70">
                <option value="time_desc">Newest First</option>
                <option value="time_asc">Oldest First</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {sortOrder === 'desc' ? 
                  <FaSortAmountDown className="h-3 w-3 text-gray-400" /> : 
                  <FaSortAmountUp className="h-3 w-3 text-gray-400" />
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Stats Cards */}
      {sortedDailyStats.length === 0 ? (
        <div className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
              <FaCalendarDay className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No trading data available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start trading to see your daily statistics here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDailyStats.map(dayStats => {
            const pnlPercentage = calculatePnlPercentage(dayStats);
            const isPositive = dayStats.totalNetPnl > 0;
            const isNegative = dayStats.totalNetPnl < 0;
            const longPercentage = dayStats.totalTrades > 0 ? Math.round((dayStats.longTrades / dayStats.totalTrades) * 100) : 0;
            const shortPercentage = dayStats.totalTrades > 0 ? Math.round((dayStats.shortTrades / dayStats.totalTrades) * 100) : 0;

            return (
              <div key={dayStats.date} className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
                        <FaCalendarDay className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {formatDateHeader(dayStats.date)}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {dayStats.totalTrades} trade{dayStats.totalTrades !== 1 ? 's' : ''} executed
                        </p>
                      </div>
                    </div>

                    {/* P&L Badge */}
                    <div className={`px-4 py-2 rounded-xl font-semibold text-lg ${
                      isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                      isNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                      'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400'
                    }`}>
                      {isPositive ? '+' : ''}${dayStats.totalNetPnl.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                      {Math.abs(pnlPercentage) > 0.01 && (
                        <span className="ml-2 text-sm opacity-80">
                          ({isPositive ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {/* Total Trades */}
                    <div className="text-center p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <FaExchangeAlt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Trades</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dayStats.totalTrades}
                        </span>
                        <div className="flex space-x-1">
                          {dayStats.winningTrades > 0 && (
                            <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                              <FaCaretUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">{dayStats.winningTrades}</span>
                            </div>
                          )}
                          {dayStats.losingTrades > 0 && (
                            <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg">
                              <FaCaretDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                              <span className="text-xs font-medium text-red-600 dark:text-red-400">{dayStats.losingTrades}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Win Rate */}
                    <div className="text-center p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <FaPercentage className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Win Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {dayStats.winRate.toFixed(1)}%
                      </div>
                    </div>

                    {/* Long vs Short */}
                    <div className="text-center p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <FaArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Long/Short</span>
                      </div>
                      <div className="text-lg font-semibold">
                        <span className="text-blue-600 dark:text-blue-400">{longPercentage}%</span>
                        <span className="mx-1 text-gray-400">:</span>
                        <span className="text-orange-600 dark:text-orange-400">{shortPercentage}%</span>
                      </div>
                    </div>

                    {/* Commission */}
                    <div className="text-center p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <FaDollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Fees</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${Math.abs(dayStats.totalCommissions).toFixed(2)}
                      </div>
                    </div>

                    {/* Performance Indicator */}
                    <div className="text-center p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <FaChartLine className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</span>
                      </div>
                      <div className="flex items-center justify-center">
                        {isPositive ? (
                          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                            <FaArrowUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Profitable</span>
                          </div>
                        ) : isNegative ? (
                          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                            <FaArrowDown className="w-4 h-4" />
                            <span className="text-sm font-medium">Loss</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                            <span className="text-sm font-medium">Breakeven</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 