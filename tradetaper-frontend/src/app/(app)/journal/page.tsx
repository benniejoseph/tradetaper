/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/trades/page.tsx
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades, deleteTrade, setCurrentTrade, /*fetchTradeById*/ } from '@/store/features/tradesSlice'; // fetchTradeById might not be needed here directly
import { selectSelectedAccountId, selectAvailableAccounts, selectSelectedAccount } from '@/store/features/accountSlice'; // Changed selectAccounts to selectAvailableAccounts
import Link from 'next/link';
// import TradeFiltersComponent from '@/components/trades/TradeFiltersComponent'; // Will be replaced
import { calculateDashboardStats, DashboardStats } from '@/utils/analytics'; // Import calculateDashboardStats and its return type
import { Trade, TradeStatus } from '@/types/trade'; // TradeStatus needed for filtering
// import StatCard from '@/components/analytics/StatCard'; 
import { FaPlus, FaCalendarAlt, FaSearch, FaDownload, FaThList, FaThLarge, FaStar as FaStarSolid, FaRegStar as FaStarOutline } from 'react-icons/fa'; // Added new icons
import TradesTable from '@/components/journal/TradesTable'; // Import TradesTable
import TradePreviewDrawer from '@/components/journal/TradePreviewDrawer'; // Import TradePreviewDrawer
import { useRouter } from 'next/navigation'; // For navigation on edit
import { parseISO, isAfter, isBefore, subMonths, subWeeks, subDays, endOfDay, isValid, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'; // Added/Ensured date-fns imports, added isValid and format
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Import CSS

// Placeholder components - to be created
// const TradePreviewDrawer = ({ trade, isOpen, onClose }) => null; 

export default function JournalPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter(); // Initialize router
  const { trades: allTrades, isLoading, error /*, filters: currentTradeFilters*/ } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedAccount = useSelector(selectSelectedAccount); // For balance
  const accounts = useSelector(selectAvailableAccounts); // Changed selectAccounts to selectAvailableAccounts

  // State for new filters as per design
  const [activePositionFilter, setActivePositionFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [activeTimeFilter, setActiveTimeFilter] = useState<'all' | '1m' | '7d' | '1d'>('all');
  const [selectedTradeForPreview, setSelectedTradeForPreview] = useState<Trade | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // State for date picker modal
  const [pickerStartDate, setPickerStartDate] = useState<Date | null>(null);
  const [pickerEndDate, setPickerEndDate] = useState<Date | null>(null);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false); // New state for starred filter

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTrades(selectedAccountId || undefined)); 
    }
  }, [dispatch, isAuthenticated, selectedAccountId]);

  const filteredTrades = useMemo(() => {
    let tradesToFilter = allTrades;

    // 1. Filter by selected account (already done if fetchTrades is account-specific, but good for client-side consistency)
    if (selectedAccountId) {
        tradesToFilter = tradesToFilter.filter(trade => trade.accountId === selectedAccountId);
    }
    
    // 2. Apply position filter (Open/Closed/All)
    if (activePositionFilter === 'open') {
      tradesToFilter = tradesToFilter.filter(trade => trade.status === TradeStatus.OPEN);
    } else if (activePositionFilter === 'closed') {
      tradesToFilter = tradesToFilter.filter(trade => trade.status === TradeStatus.CLOSED);
    }

    // 3. Apply active time filter (1m, 7d, 1d, all)
    const now = new Date();
    let cutOffDate: Date | null = null;

    switch (activeTimeFilter) {
      case '1m':
        cutOffDate = subMonths(now, 1);
        break;
      case '7d':
        cutOffDate = subWeeks(now, 1);
        break;
      case '1d': // Trades within the last 24 hours
        cutOffDate = subDays(now, 1);
        break;
      case 'all':
      default:
        cutOffDate = null; 
        break;
    }

    if (cutOffDate) {
      tradesToFilter = tradesToFilter.filter(trade => {
        if (!trade.entryDate) return false;
        try {
          const entryD = parseISO(trade.entryDate);
          return isValid(entryD) && isAfter(entryD, cutOffDate!);
        } catch {
          return false; 
        }
      });
    }

    // 4. Apply custom date range filter (from calendar picker - placeholder logic)
    // This should ideally override or work with activeTimeFilter if a custom range is set.
    // For now, let's assume if customDateRange.from is set, it takes precedence or is an AND condition.
    if (customDateRange.from) {
      tradesToFilter = tradesToFilter.filter(trade => {
        if (!trade.entryDate) return false;
        try {
          const entryD = parseISO(trade.entryDate);
          return isValid(entryD) && !isBefore(entryD, customDateRange.from!);
        } catch { return false; }
      });
    }
    if (customDateRange.to) {
      tradesToFilter = tradesToFilter.filter(trade => {
        if (!trade.entryDate) return false;
        try {
          const entryD = parseISO(trade.entryDate);
          const toDateEndOfDay = endOfDay(customDateRange.to!); 
          return isValid(entryD) && !isAfter(entryD, toDateEndOfDay);
        } catch { return false; }
      });
    }
    
    // 5. Apply search query filter
    if (searchQuery.trim() !== '') {
      const lowerSearchQuery = searchQuery.toLowerCase();
      tradesToFilter = tradesToFilter.filter(trade => 
        trade.symbol.toLowerCase().includes(lowerSearchQuery) ||
        (trade.notes && trade.notes.toLowerCase().includes(lowerSearchQuery)) ||
        (trade.setupDetails && trade.setupDetails.toLowerCase().includes(lowerSearchQuery))
        // Add other fields to search if needed (e.g., tags, account name after mapping)
      );
    }

    // 6. Apply starred filter
    if (showOnlyStarred) {
      tradesToFilter = tradesToFilter.filter(trade => trade.isStarred === true);
    }

    return tradesToFilter.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()); // Sort by newest first

  }, [allTrades, selectedAccountId, activePositionFilter, activeTimeFilter, customDateRange, searchQuery, showOnlyStarred]); // Added showOnlyStarred to dependencies

  const headerStats = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) {
      return { winRate: 0, longTrades: 0, shortTrades: 0, totalPnl: 0, monthlyPnl: 0, winningTradesCount: 0, losingTradesCount: 0 }; // Added counts
    }
    const closedTrades = filteredTrades.filter(t => t.status === TradeStatus.CLOSED && typeof t.profitOrLoss === 'number');
    const winningTrades = closedTrades.filter(t => t.profitOrLoss! > 0);
    const losingTrades = closedTrades.filter(t => t.profitOrLoss! < 0); // Calculate losing trades
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const longTrades = filteredTrades.filter(t => t.direction === 'Long').length;
    const shortTrades = filteredTrades.filter(t => t.direction === 'Short').length;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);

    // Calculate Monthly P&L
    const now = new Date();
    const startOfMonthDate = startOfMonth(now);
    const endOfMonthDate = endOfMonth(now); // Or use now for progress up to today

    const monthlyClosedTrades = closedTrades.filter(trade => {
        if (!trade.exitDate) return false; // only closed trades with an exit date
        try {
            const exitD = parseISO(trade.exitDate);
            return isValid(exitD) && isWithinInterval(exitD, { start: startOfMonthDate, end: endOfMonthDate });
        } catch {
            return false;
        }
    });
    const monthlyPnl = monthlyClosedTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);

    return { winRate, longTrades, shortTrades, totalPnl, monthlyPnl, winningTradesCount: winningTrades.length, losingTradesCount: losingTrades.length }; // Added counts
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
      totalTrades: dashboardCalculatedStats.totalTrades, // This is the count of filteredTrades
      totalCommissions: dashboardCalculatedStats.totalCommissions,
      averageWin: dashboardCalculatedStats.averageWin,
      averageLoss: dashboardCalculatedStats.averageLoss, // Will be negative
      averageRR: dashboardCalculatedStats.averageRR,
      totalTradedValue,
    };
  }, [filteredTrades]);

  const addNewTradeButtonClasses = `flex items-center space-x-2 bg-accent-green hover:bg-accent-green-darker text-dark-primary \
                                font-semibold py-2.5 px-5 rounded-lg transition-all duration-150 ease-in-out \
                                shadow-md hover:shadow-glow-green-sm focus:outline-none focus:ring-2 \
                                focus:ring-offset-2 focus:ring-offset-[var(--color-light-secondary)] dark:focus:ring-offset-dark-primary \
                                focus:ring-accent-green`;

  const handleRowClick = (trade: Trade) => { // Uncommented and implemented
    setSelectedTradeForPreview(trade);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => { 
    setIsPreviewOpen(false);
    setSelectedTradeForPreview(null);
  };

  const handleEditTrade = (tradeId: string) => {
    router.push(`/journal/edit/${tradeId}`);
    setIsPreviewOpen(false); // Close drawer after initiating edit
  };

  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      dispatch(deleteTrade(tradeId));
      setIsPreviewOpen(false); // Close drawer after initiating delete
    }
  };

  const handleApplyDateRange = () => {
    setCustomDateRange({ from: pickerStartDate || undefined, to: pickerEndDate || undefined });
    // Optionally, set activeTimeFilter to 'all' or a 'custom' state if using custom range
    // setActiveTimeFilter('all'); // Or some other indicator that custom range is active
    setIsDatePickerOpen(false);
  };

  const handleClearDateRange = () => {
    setPickerStartDate(null);
    setPickerEndDate(null);
    setCustomDateRange({});
    // setIsDatePickerOpen(false); // Optionally close, or let user close manually
  };

  return (
      <div className="min-h-screen w-full p-4 md:p-8 text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
        <div className="w-full space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">Journal</h1>
            <div className="flex items-center space-x-4">
              {/* Placeholder for "Last updated" - assuming this comes from somewhere or is static */}
              <span className="text-sm text-gray-500 dark:text-gray-400">Last updated: {format(new Date(), 'MMM dd, hh:mm a')}</span>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"><FaCalendarAlt /></button>
                <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setShowOnlyStarred(!showOnlyStarred)}>
                  {showOnlyStarred ? <FaStarSolid className="text-yellow-400" /> : <FaStarOutline />}
                </button>
                {/* Placeholder for other icons from design */}
                <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"> {/* View icon */}
                  <FaThList /> 
                </button>
                <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"> {/* Settings/Cog icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774a1.125 1.125 0 01.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.326.457.233 1.07-.12 1.45l-.773.773a1.125 1.125 0 01-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.019-.397-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.457.326-1.07.233-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.149-.893z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Progress Monthly Card - Updated with Sparkline Placeholder */}
            <div className="bg-[var(--color-light-secondary)] dark:bg-dark-secondary p-4 rounded-lg shadow flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress monthly</h3>
              <p className="text-2xl font-semibold mt-1 text-[var(--color-text-dark-primary)] dark:text-text-light-primary">${headerStats.monthlyPnl.toFixed(2)}</p>
              <div className="mt-2 h-16 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                {/* SVG Sparkline Placeholder - Upward trend */}
                <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M 0 25 Q 15 20, 25 15 T 50 10 T 75 8 T 100 5" stroke="#3b82f6" fill="none" strokeWidth="2"/>
                </svg>
              </div>
              {/* Optional: Footer for comparison can be added here based on design */}
            </div>

            {/* Balance Card - Updated */}
            <div className="bg-[var(--color-light-secondary)] dark:bg-dark-secondary p-4 rounded-lg shadow flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
              <p className="text-2xl font-semibold mt-1 text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                ${selectedAccount?.balance !== undefined ? selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
              </p>
              <div className="mt-2 h-16 bg-gray-100 dark:bg-gray-700/50 rounded flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                {/* Placeholder for sparkline or trend icon */}
                <span>Account: {selectedAccount?.name || 'All'}</span>
              </div>
              <div className="flex justify-between text-xs mt-1 text-gray-400 dark:text-gray-500">
                {/* <span>vs last period</span> <span>+Y%</span> */}
              </div>
            </div>

            {/* Win Rate Card - Updated with separate W/L bars */}
            <div className="bg-[var(--color-light-secondary)] dark:bg-dark-secondary p-4 rounded-lg shadow flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</h3>
              <p className="text-2xl font-semibold mt-1 text-[var(--color-text-dark-primary)] dark:text-text-light-primary">{headerStats.winRate.toFixed(1)}%</p>
              <div className="mt-2 h-16 flex flex-col justify-around text-xs px-2">
                {/* Wins Bar */}
                <div className="flex items-center">
                  <span className="text-green-500 w-8">W {headerStats.winningTradesCount}</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden ml-2">
                    <div className="bg-green-500 h-full" style={{ width: `${headerStats.winningTradesCount + headerStats.losingTradesCount > 0 ? (headerStats.winningTradesCount / (headerStats.winningTradesCount + headerStats.losingTradesCount)) * 100 : 0}%` }}></div>
                  </div>
                </div>
                {/* Losses Bar */}
                <div className="flex items-center">
                  <span className="text-red-500 w-8">L {headerStats.losingTradesCount}</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden ml-2">
                    <div className="bg-red-500 h-full" style={{ width: `${headerStats.winningTradesCount + headerStats.losingTradesCount > 0 ? (headerStats.losingTradesCount / (headerStats.winningTradesCount + headerStats.losingTradesCount)) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
              {/* Optional: Footer for total closed trades */}
            </div>

            {/* Long/Short Ratio Card - Updated */}
            <div className="bg-[var(--color-light-secondary)] dark:bg-dark-secondary p-4 rounded-lg shadow flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Long / Short Trades</h3>
              <p className="text-2xl font-semibold mt-1 text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                {headerStats.longTrades} L / {headerStats.shortTrades} S
              </p>
              <div className="mt-2 h-16 bg-gray-100 dark:bg-gray-700/50 rounded flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 px-2">
                {headerStats.longTrades + headerStats.shortTrades > 0 ? (
                  <div className="w-full h-3 flex rounded overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${(headerStats.longTrades / (headerStats.longTrades + headerStats.shortTrades)) * 100}%` }}
                      title={`Long: ${headerStats.longTrades}`}
                    ></div>
                    <div 
                      className="bg-purple-500 h-full"
                      style={{ width: `${(headerStats.shortTrades / (headerStats.longTrades + headerStats.shortTrades)) * 100}%` }}
                      title={`Short: ${headerStats.shortTrades}`}
                    ></div>
                  </div>
                ) : (
                  <span className="text-center">No trades</span>
                )}
              </div>
               <div className="flex justify-between text-xs mt-1 text-gray-400 dark:text-gray-500">
                <span>Total Trades: {headerStats.longTrades + headerStats.shortTrades}</span>
              </div>
            </div>
          </div>
          
          {/* Filters and Controls Section */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-[var(--color-light-primary)] dark:bg-dark-secondary rounded-lg shadow mb-6 gap-4">
            <div className="flex items-center gap-2 overflow-x-auto flex-wrap">
                {(['all', 'open', 'closed'] as const).map(pos => (
                    <button key={pos} onClick={() => setActivePositionFilter(pos)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activePositionFilter === pos ? 'bg-accent-blue text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                        {pos.charAt(0).toUpperCase() + pos.slice(1)} Positions
                    </button>
                ))}
                <div className="h-6 border-l border-[var(--color-light-border)] dark:border-dark-border mx-2 self-center"></div>
                {(['all', '1m', '7d', '1d'] as const).map(time => (
                     <button key={time} onClick={() => setActiveTimeFilter(time)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTimeFilter === time ? 'bg-accent-blue text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                        {time === 'all' ? 'All time' : time === '1m' ? '1 month' : time}
                    </button>
                ))}
                <button onClick={() => setIsDatePickerOpen(true)} className="p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
                    <FaCalendarAlt className="h-5 w-5" />
                </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <button className="p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700"><FaThList className="h-5 w-5" /></button>
                <button className="p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700"><FaDownload className="h-5 w-5" /></button>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search symbol, notes..." 
                        className="pl-8 pr-2 py-1.5 text-sm rounded-md border border-[var(--color-light-border)] dark:border-dark-border bg-transparent focus:ring-accent-blue focus:border-accent-blue" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary" />
                </div>
                <Link href="/journal/new" className={addNewTradeButtonClasses}>
                    <FaPlus />
                    <span>Log Trade</span>
                </Link>
            </div>
          </div>
          
          {/* 
            The old Filtered Performance Snapshot section has been commented out.
            It can be removed completely or its elements can be integrated elsewhere if needed.
          */}

          {isLoading && <p className="text-center py-10">Loading trades...</p>}
          {error && <p className="text-center text-accent-red py-10">Error fetching trades: {error}</p>}

          {!isLoading && !error && filteredTrades.length === 0 && (
            <div className="text-center py-10 bg-[var(--color-light-primary)] dark:bg-dark-secondary rounded-xl shadow-lg dark:shadow-card-modern">
                <p className="text-xl">
                    {/* Check if any trades exist at all for the user vs. no trades for selected account after filtering */}
                    {allTrades.length > 0 ? "No trades match the current filters for this account." : "No trades recorded yet for this account."}
                </p>
                {/* Show log first trade button if NO trades for this account, even if other accounts have trades */}
                {filteredTrades.length === 0 && allTrades.filter(t => t.accountId === selectedAccountId).length === 0 && (
                    <Link href="/journal/new" className={`mt-6 inline-flex ${addNewTradeButtonClasses}`}>
                        <FaPlus />
                        <span>Log Your First Trade</span>
                    </Link>
                )}
            </div>
          )}

          {!isLoading && filteredTrades.length > 0 && (
            <div className="space-y-5">
              <TradesTable 
                trades={filteredTrades} 
                accounts={accounts} 
                onRowClick={handleRowClick} 
                isLoading={isLoading} 
              />
            </div>
          )}

           <TradePreviewDrawer 
            trade={selectedTradeForPreview} 
            isOpen={isPreviewOpen} 
            onClose={handleClosePreview} 
            onEdit={handleEditTrade} 
            onDelete={handleDeleteTrade} 
          />

           <div className="mt-8 p-4 bg-[var(--color-light-primary)] dark:bg-dark-secondary rounded-lg shadow-md">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3 text-sm">
                    <div className="text-center">
                        <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Total P&L:</p>
                        <p className={`font-semibold ${footerStats.totalNetPnl > 0 ? 'text-accent-green' : footerStats.totalNetPnl < 0 ? 'text-accent-red' : ''}`}>
                            {footerStats.totalNetPnl.toLocaleString(undefined, {style: 'currency', currency: 'USD', signDisplay: 'always'})}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Total Trades:</p>
                        <p className="font-semibold">{footerStats.totalTrades}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Commissions:</p>
                        <p className="font-semibold">{footerStats.totalCommissions.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Total Value:</p>
                        <p className="font-semibold">{footerStats.totalTradedValue.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Avg Win:</p>
                        <p className={`font-semibold ${footerStats.averageWin > 0 ? 'text-accent-green' : ''}`}>
                            {footerStats.averageWin.toLocaleString(undefined, {style: 'currency', currency: 'USD', signDisplay: 'always'})}
                        </p>
                    </div>
                     <div className="text-center">
                        <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Avg Loss:</p>
                        <p className={`font-semibold ${footerStats.averageLoss < 0 ? 'text-accent-red' : ''}`}>
                            {/* Avg Loss is negative, toLocaleString currency handles sign or use Math.abs if only magnitude needed */}
                            {footerStats.averageLoss.toLocaleString(undefined, {style: 'currency', currency: 'USD', signDisplay: 'always'})}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Avg R:R:</p>
                        <p className="font-semibold">{footerStats.averageRR.toFixed(2)}R</p>
                    </div>
                </div>
           </div>

          {/* Date Picker Modal */}
          {isDatePickerOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary p-6 rounded-lg shadow-xl space-y-4 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-center mb-4">Select Date Range</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">From:</label>
                        <DatePicker
                            selected={pickerStartDate || undefined}
                            onChange={(date) => setPickerStartDate(date)}
                            selectsStart
                            startDate={pickerStartDate || undefined}
                            endDate={pickerEndDate || undefined}
                            isClearable
                            placeholderText="Start date"
                            className="w-full p-2 border border-[var(--color-light-border)] dark:border-dark-border rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">To:</label>
                        <DatePicker
                            selected={pickerEndDate || undefined}
                            onChange={(date) => setPickerEndDate(date)}
                            selectsEnd
                            startDate={pickerStartDate || undefined}
                            endDate={pickerEndDate || undefined}
                            minDate={pickerStartDate || undefined}
                            isClearable
                            placeholderText="End date"
                            className="w-full p-2 border border-[var(--color-light-border)] dark:border-dark-border rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={handleClearDateRange}
                    className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors">
                    Clear
                  </button>
                  <button 
                    onClick={() => setIsDatePickerOpen(false)} 
                    className="px-4 py-2 text-sm rounded-md bg-gray-500 hover:bg-gray-600 text-white transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={handleApplyDateRange} 
                    className="px-4 py-2 text-sm rounded-md bg-accent-blue hover:bg-accent-blue-darker text-white transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}