/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/journal/page.tsx
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades, fetchTradesSummary, deleteTrade, setCurrentTrade } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectAvailableAccounts, selectSelectedAccount, fetchAccounts } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId, fetchMT5Accounts, selectMT5Accounts } from '@/store/features/mt5AccountsSlice';
import Link from 'next/link';
import { calculateDashboardStats, DashboardStats } from '@/utils/analytics';
import { Trade, TradeStatus } from '@/types/trade';
import { 
  FaPlus, FaCalendarAlt, FaSearch, FaDownload, FaThList, FaThLarge, 
  FaStar as FaStarSolid, FaRegStar as FaStarOutline, FaFilter,
  FaCog, FaShareAlt, FaBell, FaSync, FaArrowUp, FaArrowDown,
  FaChartLine, FaBookOpen, FaEye, FaEdit, FaTrash, FaInfoCircle
} from 'react-icons/fa';
import TradesTable from '@/components/journal/TradesTable';
import { useRouter } from 'next/navigation';
import { parseISO, isAfter, isBefore, subMonths, subWeeks, subDays, endOfDay, isValid, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDebounce } from '@/hooks/useDebounce';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import TradeActionModal from '@/components/trades/TradeActionModal';
import LivePositionsPanel from '@/components/trades/LivePositionsPanel';

export default function JournalPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { trades: allTrades, isLoading, error, lastFetchKey, lastFetchAt, lastFetchIncludeTags, total, summary } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  const manualAccounts = useSelector(selectAvailableAccounts);
  const mt5Accounts = useSelector(selectMT5Accounts);
  const [isTradeActionOpen, setIsTradeActionOpen] = useState(false);
  const selectedMT5Account = useMemo(
    () => mt5Accounts.find(acc => acc.id === selectedMT5AccountId),
    [mt5Accounts, selectedMT5AccountId]
  );
  const hasMT5Accounts = mt5Accounts.length > 0;

  // State for filters and UI
  const [activePositionFilter, setActivePositionFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [activeTimeFilter, setActiveTimeFilter] = useState<'all' | '1m' | '7d' | '1d'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerStartDate, setPickerStartDate] = useState<Date | null>(null);
  const [pickerEndDate, setPickerEndDate] = useState<Date | null>(null);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAccounts());
      dispatch(fetchMT5Accounts());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [
    selectedAccountId,
    selectedMT5AccountId,
    activePositionFilter,
    activeTimeFilter,
    customDateRange,
    debouncedSearchQuery,
    showOnlyStarred,
  ]);

  const dateRange = useMemo(() => {
    if (customDateRange.from || customDateRange.to) {
      return {
        from: customDateRange.from ? customDateRange.from.toISOString() : undefined,
        to: customDateRange.to ? endOfDay(customDateRange.to).toISOString() : undefined,
      };
    }
    if (activeTimeFilter === 'all') return { from: undefined, to: undefined };
    const now = new Date();
    const from =
      activeTimeFilter === '1m'
        ? subMonths(now, 1)
        : activeTimeFilter === '7d'
          ? subWeeks(now, 1)
          : activeTimeFilter === '1d'
            ? subDays(now, 1)
            : undefined;
    return {
      from: from ? from.toISOString() : undefined,
      to: now.toISOString(),
    };
  }, [customDateRange, activeTimeFilter]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const currentAccountId = selectedAccountId || selectedMT5AccountId;
    const status =
      activePositionFilter === 'all'
        ? undefined
        : activePositionFilter === 'open'
          ? TradeStatus.OPEN
          : TradeStatus.CLOSED;

    dispatch(
      fetchTrades({
        accountId: currentAccountId || undefined,
        page,
        limit,
        includeTags: true,
        status,
        search: debouncedSearchQuery || undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        isStarred: showOnlyStarred || undefined,
      }),
    );
  }, [
    dispatch,
    isAuthenticated,
    selectedAccountId,
    selectedMT5AccountId,
    page,
    limit,
    activePositionFilter,
    debouncedSearchQuery,
    dateRange,
    showOnlyStarred,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const currentAccountId = selectedAccountId || selectedMT5AccountId;
    const status =
      activePositionFilter === 'all'
        ? undefined
        : activePositionFilter === 'open'
          ? TradeStatus.OPEN
          : TradeStatus.CLOSED;
    dispatch(
      fetchTradesSummary({
        accountId: currentAccountId || undefined,
        status,
        search: debouncedSearchQuery || undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        isStarred: showOnlyStarred || undefined,
      }),
    );
  }, [
    dispatch,
    isAuthenticated,
    selectedAccountId,
    selectedMT5AccountId,
    activePositionFilter,
    debouncedSearchQuery,
    dateRange,
    showOnlyStarred,
  ]);

  // Merge and normalize accounts
  const allAccounts = useMemo(() => {
    const formattedMT5 = mt5Accounts.map(acc => ({
      id: acc.id,
      name: acc.accountName,
      balance: Number(acc.balance) || 0,
      currency: acc.currency || 'USD',
      createdAt: acc.createdAt || '',
      updatedAt: acc.updatedAt || '',
      type: 'MT5'
    }));

    const formattedManual = manualAccounts.map(acc => ({
      ...acc,
      type: 'Manual'
    }));

    // Prioritize MT5 accounts if there are overlaps, and deduplicate by ID
    const merged = [...formattedMT5, ...formattedManual];
    const seen = new Set();
    return merged.filter(acc => {
      if (seen.has(acc.id)) return false;
      seen.add(acc.id);
      return true;
    });
  }, [manualAccounts, mt5Accounts]);

  const filteredTrades = allTrades;

  const headerStats = useMemo(() => {
    if (summary) {
      return {
        winRate: summary.winRate || 0,
        longTrades: 0,
        shortTrades: 0,
        totalPnl: summary.netPnL || 0,
        monthlyPnl: 0,
        winningTradesCount: summary.winningTrades || 0,
        losingTradesCount: summary.losingTrades || 0,
      };
    }
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
  }, [filteredTrades, summary]);

  const footerStats = useMemo(() => {
    if (summary) {
      return {
        totalNetPnl: summary.netPnL || 0,
        totalTrades: summary.totalTrades || 0,
        totalCommissions: summary.totalCommissions || 0,
        averageWin: summary.averageWin || 0,
        averageLoss: summary.averageLoss || 0,
        averageRR: summary.averageRMultiple || 0,
        totalTradedValue: summary.totalTradedValue || 0,
      };
    }
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
  }, [filteredTrades, summary]);

  const handleRowClick = (trade: Trade) => {
    dispatch(setCurrentTrade(trade));
    router.push(`/journal/view/${trade.id}`);
  };

  const handleEditTrade = (tradeId: string) => {
    router.push(`/journal/edit/${tradeId}`);
  };

  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      dispatch(deleteTrade(tradeId));
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



  return (
    <>
    <div className="space-y-8">
      {/* Compact Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
             <FaBookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">Trading Journal</h1>
            <p className="text-[10px] text-zinc-500 font-medium">Last updated: {format(new Date(), 'MMM dd, HH:mm')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowOnlyStarred(!showOnlyStarred)}
            className={`p-2 rounded-lg border border-zinc-200 dark:border-white/5 transition-all hover:scale-105 ${
              showOnlyStarred 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200' 
                : 'bg-white dark:bg-white/5 text-zinc-400 hover:text-yellow-500'
            }`}>
            {showOnlyStarred ? <FaStarSolid className="w-4 h-4" /> : <FaStarOutline className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => setIsTradeActionOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all hover:scale-105">
            <FaPlus className="w-3 h-3" />
            <span>New Trade</span>
          </button>
        </div>
      </div>

      {hasMT5Accounts && (
        <LivePositionsPanel
          accountId={selectedMT5Account?.id}
          accountName={selectedMT5Account?.accountName}
          isMT5={Boolean(selectedMT5Account)}
        />
      )}

      {/* Compact Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Monthly PnL */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Monthly P&L</span>
            <div className={`text-lg font-black ${headerStats.monthlyPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
               <CurrencyAmount amount={headerStats.monthlyPnl} className="inline" showSign />
            </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-xl p-3 shadow-sm flex flex-col justify-between">
             <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Win Rate</span>
             <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-zinc-900 dark:text-white">{headerStats.winRate.toFixed(1)}%</span>
                <span className="text-[9px] text-zinc-400 font-medium">({headerStats.winningTradesCount}W / {headerStats.losingTradesCount}L)</span>
             </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-xl p-3 shadow-sm flex flex-col justify-between lg:col-span-1">
             <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Net Balance</span>
             <span className="text-lg font-black text-zinc-900 dark:text-white">
                <CurrencyAmount amount={footerStats.totalNetPnl} className="inline" />
             </span>
        </div>

        {/* Avg R:R */}
         <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-xl p-3 shadow-sm flex flex-col justify-between">
             <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Avg R:R</span>
             <span className="text-lg font-black text-zinc-900 dark:text-white">{footerStats.averageRR.toFixed(2)}R</span>
        </div>

        {/* Total Trades */}
         <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-xl p-3 shadow-sm flex flex-col justify-between">
             <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Trades</span>
             <span className="text-lg font-black text-zinc-900 dark:text-white">{footerStats.totalTrades}</span>
        </div>

        {/* Commissions */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-xl p-3 shadow-sm flex flex-col justify-between">
             <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Commissions</span>
             <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400"><CurrencyAmount amount={footerStats.totalCommissions} /></span>
        </div>
      </div>

      {/* Compact Filters Toolbar */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-xl p-2 shadow-sm flex flex-wrap gap-2 items-center justify-between">
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Status Filter */}
            <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-lg">
              {(['all', 'open', 'closed'] as const).map(pos => (
                <button 
                  key={pos}
                  onClick={() => setActivePositionFilter(pos)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                    activePositionFilter === pos 
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                  }`}>
                  {pos}
                </button>
              ))}
            </div>

            {/* Time Filter */}
             <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-lg">
              {(['all', '1d', '7d', '1m'] as const).map(time => (
                <button 
                  key={time}
                  onClick={() => setActiveTimeFilter(time)}
                   className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                    activeTimeFilter === time 
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                  }`}>
                  {time === 'all' ? 'All' : time.toUpperCase()}
                </button>
              ))}
              <button 
                onClick={() => setIsDatePickerOpen(true)}
                className="px-2 py-1 text-zinc-400 hover:text-emerald-500 transition-colors">
                <FaCalendarAlt className="w-3 h-3" />
              </button>
            </div>
         </div>

         {/* Search */}
         <div className="relative w-full md:w-auto md:min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search symbol, notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-400"
            />
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
              return filteredTrades.length === 0 && total === 0 && (
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
            totalItems={total}
            currentPage={page}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
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
              { label: 'Total Value', value: footerStats.totalTradedValue, color: 'text-gray-900 dark:text-white', isAmount: true, info: 'Total volume traded (Entry Price × Quantity)' },
              { label: 'Avg Win', value: footerStats.averageWin, color: 'text-green-600 dark:text-green-400', isAmount: true, showSign: true },
              { label: 'Avg Loss', value: footerStats.averageLoss, color: 'text-red-600 dark:text-red-400', isAmount: true, showSign: true },
              { label: 'Avg R:R', value: `${footerStats.averageRR.toFixed(2)}R`, color: 'text-gray-900 dark:text-white', isAmount: false },
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors duration-200 min-w-0">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
                  {stat.info && (
                    <span title={stat.info} className="cursor-help text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <FaInfoCircle size={12} />
                    </span>
                  )}
                </div>
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

    <TradeActionModal
      isOpen={isTradeActionOpen}
      onClose={() => setIsTradeActionOpen(false)}
    />
    </>
  );
}
