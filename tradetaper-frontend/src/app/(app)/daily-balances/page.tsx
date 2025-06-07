"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectSelectedAccount } from '@/store/features/accountSlice';
import { format, parseISO, isValid, isToday } from 'date-fns';
import { Trade, TradeStatus } from '@/types/trade';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FaInfoCircle, FaDownload, FaChevronDown, FaTimes } from 'react-icons/fa';

interface BalanceEntry {
  date: string;
  balance: number;
  dailyPnl: number;
  tradesCount: number;
  apiName: string;
}

export default function DailyBalancesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading, error } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  
  const [daysToShow, setDaysToShow] = useState('30');
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTrades(selectedAccountId || undefined));
    }
  }, [dispatch, isAuthenticated, selectedAccountId]);

  // Calculate daily balances from real trade data only
  const dailyBalances = useMemo(() => {
    // Return empty array if no trades exist - show only real data
    if (!trades || trades.length === 0) {
      return [];
    }

    const accountTrades = selectedAccountId 
      ? trades.filter(trade => trade.accountId === selectedAccountId && trade.status === TradeStatus.CLOSED)
      : trades.filter(trade => trade.status === TradeStatus.CLOSED);

    // Sort trades by exit date
    const sortedTrades = accountTrades
      .filter(trade => trade.exitDate)
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

    // Calculate starting balance - if no account selected, calculate from total P&L
    let currentBalance = selectedAccount?.balance || 10000; // Default starting balance
    
    if (!selectedAccount) {
      // Calculate total P&L and assume starting balance
      const totalPnL = sortedTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0);
      currentBalance = 10000 + totalPnL; // Current balance = starting + total P&L
    }

    // Work backwards from current balance to get starting balance
    for (let i = sortedTrades.length - 1; i >= 0; i--) {
      const trade = sortedTrades[i];
      currentBalance -= (trade.profitOrLoss || 0);
    }

    // Group trades by day
    const dailyGroups: { [date: string]: Trade[] } = {};
    sortedTrades.forEach(trade => {
      if (trade.exitDate) {
        try {
          const exitDate = parseISO(trade.exitDate);
          if (isValid(exitDate)) {
            const dayKey = format(exitDate, 'yyyy-MM-dd');
            if (!dailyGroups[dayKey]) {
              dailyGroups[dayKey] = [];
            }
            dailyGroups[dayKey].push(trade);
          }
        } catch {
          console.warn('Invalid date format:', trade.exitDate);
        }
      }
    });

    let runningBalance = currentBalance;
    const balanceHistory: BalanceEntry[] = [];
    const sortedDates = Object.keys(dailyGroups).sort().reverse(); // Most recent first

    // Add today if it's not in the data (show current balance)
    const today = format(new Date(), 'yyyy-MM-dd');
    if (!dailyGroups[today]) {
      const currentTotalBalance = selectedAccount?.balance || (10000 + sortedTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0));
      balanceHistory.push({
        date: today,
        balance: currentTotalBalance,
        dailyPnl: 0,
        tradesCount: 0,
        apiName: selectedAccount?.name || 'Trading Account'
      });
    }

    // Process historical data
    sortedDates.forEach(date => {
      if (date !== today) { // Skip today if we already added it
        const dayTrades = dailyGroups[date];
        const dailyPnl = dayTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0);
        const currentTotalBalance = selectedAccount?.balance || (10000 + sortedTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0));
        runningBalance = date === sortedDates[0] ? currentTotalBalance - dailyPnl : runningBalance - dailyPnl;
        
        balanceHistory.push({
          date,
          balance: runningBalance + dailyPnl,
          dailyPnl,
          tradesCount: dayTrades.length,
          apiName: selectedAccount?.name || 'Trading Account'
        });
      }
    });

    const daysCount = daysToShow === 'all' ? balanceHistory.length : parseInt(daysToShow);
    return balanceHistory.slice(0, daysCount);
  }, [trades, selectedAccountId, selectedAccount, daysToShow]);

  const formatDateDisplay = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return 'Today';
      }
      return format(date, 'dd.MM.yy');
    } catch {
      return dateString;
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const handleDownloadReport = () => {
    // TODO: Implement download functionality
    console.log('Download report clicked');
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading balance history..." />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-accent-red">Error loading balance history: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Daily Balances
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your daily account balance changes and performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleDownloadReport}
            className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaDownload className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-purple-500 dark:hover:bg-purple-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaInfoCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {showInfoBanner && (
        <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-800/50 p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100/80 dark:bg-blue-900/30 rounded-xl">
                <FaInfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Daily Balance Overview</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  This page provides a daily overview of your account balances. It shows the date, API used, realised P&L (Profit and Loss), and the current balance, with 
                  percentage changes indicating performance. Use this summary to track your daily trading results and account growth.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowInfoBanner(false)}
              className="p-2 rounded-xl hover:bg-blue-200/50 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 transition-colors duration-200"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left side - Days filter */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              <FaChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Time Range</label>
              <select 
                value={daysToShow}
                onChange={(e) => setDaysToShow(e.target.value)}
                className="appearance-none bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          {/* Right side - Download button */}
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FaDownload className="h-4 w-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Balance Table */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
        {dailyBalances.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaInfoCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No balance history available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No balance history available for the selected account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <tr className="border-b border-gray-200/30 dark:border-gray-700/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Realised P&L
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                {dailyBalances.map((day, index) => {
                  const previousBalance = index < dailyBalances.length - 1 ? dailyBalances[index + 1].balance : day.balance - day.dailyPnl;
                  const pnlPercentage = calculatePercentageChange(day.dailyPnl, previousBalance);
                  const balancePercentage = calculatePercentageChange(day.balance, previousBalance);
                  
                  return (
                    <tr key={day.date} className="group hover:bg-white/90 dark:hover:bg-gray-800/60 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDateDisplay(day.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                          {day.apiName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${day.dailyPnl > 0 ? 'text-green-600 dark:text-green-400' : day.dailyPnl < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                            {day.dailyPnl > 0 ? '+' : ''}${Math.abs(day.dailyPnl).toFixed(3)} USDT
                          </span>
                          {Math.abs(pnlPercentage) > 0.01 && (
                            <span className={`text-xs ${day.dailyPnl > 0 ? 'text-green-600 dark:text-green-400' : day.dailyPnl < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                              {day.dailyPnl > 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${day.balance > previousBalance ? 'text-green-600 dark:text-green-400' : day.balance < previousBalance ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                            +${day.balance.toFixed(3)} USDT
                          </span>
                          {Math.abs(balancePercentage) > 0.01 && (
                            <span className={`text-xs ${day.balance > previousBalance ? 'text-green-600 dark:text-green-400' : day.balance < previousBalance ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                              {day.balance > previousBalance ? '+' : ''}{balancePercentage.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 