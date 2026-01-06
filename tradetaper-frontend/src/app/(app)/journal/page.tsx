/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/journal/page.tsx
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades, deleteTrade, setCurrentTrade } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectAvailableAccounts, selectSelectedAccount, fetchAccounts } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId, fetchMT5Accounts, selectMT5Accounts } from '@/store/features/mt5AccountsSlice';
import Link from 'next/link';
import { calculateDashboardStats, DashboardStats } from '@/utils/analytics';
import { Trade, TradeStatus } from '@/types/trade';
import { 
  FaPlus, FaCalendarAlt, FaSearch, FaDownload, FaThList, FaThLarge, 
  FaStar as FaStarSolid, FaRegStar as FaStarOutline, FaFilter,
  FaCog, FaShareAlt, FaBell, FaSync, FaArrowUp, FaArrowDown,
  FaChartLine, FaBookOpen, FaEye, FaEdit, FaTrash
} from 'react-icons/fa';
import TradesTable from '@/components/journal/TradesTable';
import TradePreviewDrawer from '@/components/journal/TradePreviewDrawer';
import { useRouter } from 'next/navigation';
import { parseISO, isAfter, isBefore, subMonths, subWeeks, subDays, endOfDay, isValid, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { applyAllFilters } from '@/utils/tradeFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';

export default function JournalPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { trades: allTrades, isLoading, error } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  const manualAccounts = useSelector(selectAvailableAccounts);
  const mt5Accounts = useSelector(selectMT5Accounts);

  // State for filters and UI
  const [activePositionFilter, setActivePositionFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [activeTimeFilter, setActiveTimeFilter] = useState<'all' | '1m' | '7d' | '1d'>('all');
  const [selectedTradeForPreview, setSelectedTradeForPreview] = useState<Trade | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerStartDate, setPickerStartDate] = useState<Date | null>(null);
  const [pickerEndDate, setPickerEndDate] = useState<Date | null>(null);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch accounts first
      dispatch(fetchAccounts());
      dispatch(fetchMT5Accounts());
      
      // Get the actual selected account ID (could be MT5 or regular account)
      const currentAccountId = selectedAccountId || selectedMT5AccountId;
      dispatch(fetchTrades({ accountId: currentAccountId || undefined, limit: 1000 })); 
    }
  }, [dispatch, isAuthenticated, selectedAccountId, selectedMT5AccountId]);

  // Merge and normalize accounts
  const allAccounts = useMemo(() => {
    const formattedManual = manualAccounts.map(acc => ({
      ...acc,
      type: 'Manual'
    }));
    
    const formattedMT5 = mt5Accounts.map(acc => ({
      id: acc.id,
      name: acc.accountName,
      balance: acc.balance || 0,
      currency: acc.currency || 'USD',
      createdAt: acc.createdAt || '',
      updatedAt: acc.updatedAt || '',
      type: 'MT5'
    }));

    return [...formattedManual, ...formattedMT5];
  }, [manualAccounts, mt5Accounts]);

  const filteredTrades = useMemo(() => {
    // Use the currently selected account (MT5 or regular)
    const currentAccountId = selectedAccountId || selectedMT5AccountId;
    
    // When no account is selected ("All Accounts"), show all trades
    // When a specific account is selected, only show trades for that account
    return applyAllFilters(allTrades, {
      accountId: currentAccountId, // null means show all trades
      positionFilter: activePositionFilter,
      timeFilter: activeTimeFilter,
      customDateRange,
      searchQuery: debouncedSearchQuery,
      showOnlyStarred
    });
  }, [allTrades, selectedAccountId, selectedMT5AccountId, activePositionFilter, activeTimeFilter, customDateRange, debouncedSearchQuery, showOnlyStarred]);

  const headerStats = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) {
      return { winRate: 0, longTrades: 0, shortTrades: 0, totalPnl: 0, monthlyPnl: 0, winningTradesCount: 0, losingTradesCount: 0 };
    }
    const closedTrades = filteredTrades.filter(t => t.status === TradeStatus.CLOSED && typeof t.profitOrLoss === 'number');
    const winningTrades = closedTrades.filter(t => t.profitOrLoss! > 0);
    const losingTrades = closedTrades.filter(t => t.profitOrLoss! < 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const longTrades = filteredTrades.filter(t => t.direction === 'Long').length;
    const shortTrades = filteredTrades.filter(t => t.direction === 'Short').length;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);

    const now = new Date();
    const startOfMonthDate = startOfMonth(now);
    const endOfMonthDate = endOfMonth(now);

    const monthlyClosedTrades = closedTrades.filter(trade => {
        if (!trade.exitDate) return false;
        try {
            const exitD = parseISO(trade.exitDate);
            return isValid(exitD) && isWithinInterval(exitD, { start: startOfMonthDate, end: endOfMonthDate });
        } catch {
            return false;
        }
    });
    const monthlyPnl = monthlyClosedTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);

    return { winRate, longTrades, shortTrades, totalPnl, monthlyPnl, winningTradesCount: winningTrades.length, losingTradesCount: losingTrades.length };
  }, [filteredTrades]);

  const footerStats = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) {
      return {
        totalNetPnl: 0,
        totalTrades: 0,
        totalCommissions: 0,
        averageWin: 0,
        averageLoss: 0,
        averageRR: 0,
        totalTradedValue: 0,
      };
    }
    const dashboardCalculatedStats = calculateDashboardStats(filteredTrades);
    
    const totalTradedValue = filteredTrades.reduce((sum, trade) => {
      if (trade.entryPrice && trade.quantity) {
        return sum + (Math.abs(trade.entryPrice * trade.quantity));
      }
      return sum;
    }, 0);

    return {
      totalNetPnl: dashboardCalculatedStats.totalNetPnl,
      totalTrades: dashboardCalculatedStats.totalTrades,
      totalCommissions: dashboardCalculatedStats.totalCommissions,
      averageWin: dashboardCalculatedStats.averageWin,
      averageLoss: dashboardCalculatedStats.averageLoss,
      averageRR: dashboardCalculatedStats.averageRR,
      totalTradedValue,
    };
  }, [filteredTrades]);

  const handleRowClick = (trade: Trade) => {
    setSelectedTradeForPreview(trade);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => { 
    setIsPreviewOpen(false);
    setSelectedTradeForPreview(null);
  };

  const handleEditTrade = (tradeId: string) => {
    router.push(`/journal/edit/${tradeId}`);
    setIsPreviewOpen(false);
  };

  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      dispatch(deleteTrade(tradeId));
      setIsPreviewOpen(false);
    }
  };

  const handleApplyDateRange = () => {
    setCustomDateRange({ from: pickerStartDate || undefined, to: pickerEndDate || undefined });
    setIsDatePickerOpen(false);
  };

  const handleClearDateRange = () => {
    setPickerStartDate(null);
    setPickerEndDate(null);
    setCustomDateRange({});
  };

  if (isLoading && allTrades.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading your trading journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            Trading Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track and analyze your trading performance • Last updated: {format(new Date(), 'MMM dd, hh:mm a')}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowOnlyStarred(!showOnlyStarred)}
            className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
              showOnlyStarred 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                : 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {showOnlyStarred ? <FaStarSolid /> : <FaStarOutline />}
          </button>
          
          <button className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaDownload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Progress Card */}
        <div className="group relative bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Progress</h3>
              <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
                <FaChartLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className={`text-3xl font-bold mb-4 ${
              headerStats.monthlyPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {headerStats.monthlyPnl >= 0 ? '+' : ''}<CurrencyAmount amount={headerStats.monthlyPnl} className="inline" />
            </p>
            <div className="h-8 flex items-center">
              <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <path d="M 0 25 Q 15 20, 25 15 T 50 10 T 75 8 T 100 5" stroke="url(#sparklineGradient)" fill="none" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>

          {/* Balance Card */}
        <div className="group relative bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-emerald-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Balance</h3>
              <div className="p-2 bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 rounded-xl">
                <FaBookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {(() => {
                if (!selectedAccount) return (selectedAccountId || selectedMT5AccountId ? 'N/A' : <CurrencyAmount amount={footerStats.totalNetPnl} className="inline" />);
                
                const displayBalance = selectedAccount.type === 'MT5'
                  ? selectedAccount.balance
                  : selectedAccount.balance + footerStats.totalNetPnl;
                  
                return <CurrencyAmount amount={displayBalance} className="inline" />;
              })()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedAccount?.name || 'All Accounts'}
              {selectedAccount && (
                <span className="block text-xs mt-1">
                  Base: <CurrencyAmount amount={selectedAccount.balance} className="inline" /> 
                  {selectedAccount.type !== 'MT5' && (
                    <> + P&L: <CurrencyAmount amount={footerStats.totalNetPnl} className="inline" showSign /></>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="group relative bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/5 to-emerald-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</h3>
              <div className="p-2 bg-gradient-to-r from-emerald-700/20 to-emerald-800/20 rounded-xl">
                <FaArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {headerStats.winRate.toFixed(1)}%
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 dark:text-green-400">Wins: {headerStats.winningTradesCount}</span>
                <span className="text-red-600 dark:text-red-400">Losses: {headerStats.losingTradesCount}</span>
              </div>
              <div className="w-full bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${headerStats.winRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Long/Short Ratio Card */}
        <div className="group relative bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Direction Split</h3>
              <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl">
                <FaArrowDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {headerStats.longTrades}L / {headerStats.shortTrades}S
            </p>
            {headerStats.longTrades + headerStats.shortTrades > 0 && (
              <div className="w-full h-3 flex rounded-xl overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-500" 
                  style={{ width: `${(headerStats.longTrades / (headerStats.longTrades + headerStats.shortTrades)) * 100}%` }}
                ></div>
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-full transition-all duration-500"
                  style={{ width: `${(headerStats.shortTrades / (headerStats.longTrades + headerStats.shortTrades)) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Position Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Status:</span>
            <div className="flex bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 p-1 rounded-xl">
              {(['all', 'open', 'closed'] as const).map(pos => (
                <button 
                  key={pos}
                  onClick={() => setActivePositionFilter(pos)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activePositionFilter === pos 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  }`}>
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Period:</span>
            <div className="flex bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 p-1 rounded-xl">
              {(['all', '1d', '7d', '1m'] as const).map(time => (
                <button 
                  key={time}
                  onClick={() => setActiveTimeFilter(time)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTimeFilter === time 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  }`}>
                  {time === 'all' ? 'All time' : time === '1m' ? '1 month' : time}
                </button>
              ))}
              <button 
                onClick={() => setIsDatePickerOpen(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-200">
                <FaCalendarAlt className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-3 ml-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search trades..." 
                className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <Link 
              href="/journal/new" 
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
              <FaPlus className="w-4 h-4" />
              <span>Log Trade</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading trades...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">Error fetching trades: {error}</p>
        </div>
      )}

      {/* No Trades State */}
      {!isLoading && !error && filteredTrades.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <FaBookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {allTrades.length > 0 ? "No trades match your filters" : "No trades recorded yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {allTrades.length > 0 
                  ? "Try adjusting your filters to see more trades."
                  : "Start building your trading journal by logging your first trade."
                }
              </p>
            </div>
            {/* Only show "Log Your First Trade" if no trades exist for the current context */}
            {(() => {
              const currentAccountId = selectedAccountId || selectedMT5AccountId;
              const accountTrades = currentAccountId ? allTrades.filter(t => t.accountId === currentAccountId) : allTrades;
              return filteredTrades.length === 0 && accountTrades.length === 0 && (
                <Link 
                  href="/journal/new" 
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                  <FaPlus className="w-4 h-4" />
                  <span>Log Your First Trade</span>
                </Link>
              );
            })()}
          </div>
        </div>
      )}

      {/* Trades Table */}
      {!isLoading && filteredTrades.length > 0 && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
          <TradesTable 
            trades={filteredTrades} 
            accounts={allAccounts} 
            onRowClick={handleRowClick} 
            isLoading={isLoading} 
          />
        </div>
      )}

      {/* Footer Stats */}
      {!isLoading && filteredTrades.length > 0 && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {[
              { label: 'Total P&L', value: footerStats.totalNetPnl, color: footerStats.totalNetPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400', isAmount: true, showSign: true },
              { label: 'Total Trades', value: footerStats.totalTrades, color: 'text-gray-900 dark:text-white', isAmount: false },
              { label: 'Commissions', value: footerStats.totalCommissions, color: 'text-gray-900 dark:text-white', isAmount: true },
              { label: 'Total Value', value: footerStats.totalTradedValue, color: 'text-gray-900 dark:text-white', isAmount: true },
              { label: 'Avg Win', value: footerStats.averageWin, color: 'text-green-600 dark:text-green-400', isAmount: true, showSign: true },
              { label: 'Avg Loss', value: footerStats.averageLoss, color: 'text-red-600 dark:text-red-400', isAmount: true, showSign: true },
              { label: 'Avg R:R', value: `${footerStats.averageRR.toFixed(2)}R`, color: 'text-gray-900 dark:text-white', isAmount: false },
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors duration-200 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 truncate">{stat.label}</p>
                <div className={`text-base lg:text-lg font-bold ${stat.color} truncate`}>
                  {stat.isAmount ? (
                    <>{stat.showSign && typeof stat.value === 'number' && stat.value >= 0 ? '+' : ''}<CurrencyAmount amount={typeof stat.value === 'number' ? stat.value : 0} className="inline" /></>
                  ) : (
                    stat.value
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade Preview Drawer */}
      <TradePreviewDrawer 
        trade={selectedTradeForPreview} 
        isOpen={isPreviewOpen} 
        onClose={handleClosePreview} 
        onEdit={handleEditTrade} 
        onDelete={handleDeleteTrade} 
      />

      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/30 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 space-y-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-center bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Select Date Range
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From:</label>
                <DatePicker
                  selected={pickerStartDate || undefined}
                  onChange={(date) => setPickerStartDate(date)}
                  selectsStart
                  startDate={pickerStartDate || undefined}
                  endDate={pickerEndDate || undefined}
                  isClearable
                  placeholderText="Start date"
                  className="w-full p-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-r from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To:</label>
                <DatePicker
                  selected={pickerEndDate || undefined}
                  onChange={(date) => setPickerEndDate(date)}
                  selectsEnd
                  startDate={pickerStartDate || undefined}
                  endDate={pickerEndDate || undefined}
                  minDate={pickerStartDate || undefined}
                  isClearable
                  placeholderText="End date"
                  className="w-full p-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-r from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={handleClearDateRange}
                className="px-6 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-200">
                Clear
              </button>
              <button 
                onClick={() => setIsDatePickerOpen(false)} 
                className="px-6 py-2.5 text-sm font-medium rounded-xl bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200">
                Cancel
              </button>
              <button 
                onClick={handleApplyDateRange} 
                className="px-6 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}