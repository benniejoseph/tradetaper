/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/analytics/page.tsx
"use client";
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades, setAnalyticsDateFilters, resetAnalyticsDateFilters } from '@/store/features/tradesSlice';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
// import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PnlCalendar from '@/components/analytics/PnlCalendar';
import StatsBreakdownTable from '@/components/analytics/StatsBreakdownTable';
import StatCard from '@/components/analytics/StatCard';
import BreakdownBarChart, { MetricOption, PlottableMetric } from '@/components/analytics/BreakdownBarChart';
import BreakdownPieChart from '@/components/analytics/BreakdownPieChart';
import {
    aggregatePnlByDay,
    calculateStatsByStrategyTag,
    calculateStatsByAssetType,
    calculateStatsBySymbol,
    calculateDashboardStats,
    calculateStatsByDayOfWeek,
    calculateStatsByTradeDuration,
    calculatePnlDistribution,
    DashboardStats,
    StatsByTag,
    PnlDistributionBucket,
} from '@/utils/analytics';
import Link from 'next/link';
import { addDays, subDays, differenceInDays, format as formatDateFns } from 'date-fns';
import { 
  FaCalendarAlt, FaUndo, FaArrowLeft, FaChartBar, FaChartPie, 
  FaCog, FaDownload, FaShareAlt, FaFilter, FaExpand,
  FaDollarSign, FaPercentage, FaClock, FaTags, FaGlobe,
  FaCalendarDay, FaChartLine, FaTrophy, FaArrowUp
} from 'react-icons/fa';

// Define metric options centrally for consistency
const barChartMetricOptions: MetricOption[] = [
    { value: 'totalNetPnl', label: 'Net P&L', isCurrency: true },
    { value: 'closedTrades', label: 'Number of Trades' },
    { value: 'winRate', label: 'Win Rate', isPercentage: true },
    { value: 'averageWin', label: 'Average Win', isCurrency: true },
    { value: 'averageLoss', label: 'Average Loss', isCurrency: true },
    { value: 'expectancy', label: 'Expectancy', isCurrency: true },
    { value: 'maxDrawdown', label: 'Max Drawdown', isPercentage: true },
];

const pnlDistributionMetricOptions: MetricOption[] = [
    { value: 'closedTrades', label: 'Number of Trades' }
];

export default function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    trades: allTrades,
    isLoading,
    error,
    analyticsFilters
  } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);

  // --- THEME HELPER CLASSES ---
  const labelClasses = "block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-1";
  
  const formElementBaseStructuralClasses = "block w-full rounded-lg shadow-sm p-2.5 transition-colors duration-150 ease-in-out border";
  const formElementThemeClasses = `bg-[var(--color-light-secondary)] border-[var(--color-light-border)] text-[var(--color-text-dark-primary)] dark:bg-dark-primary dark:border-gray-700 dark:text-text-light-primary`;
  const inputFocusClasses = "focus:ring-2 focus:ring-accent-green focus:border-accent-green focus:outline-none";
  const themedInputClasses = `${formElementBaseStructuralClasses} ${formElementThemeClasses} ${inputFocusClasses}`;
  
  const sectionContainerClasses = "bg-[var(--color-light-primary)] dark:bg-dark-secondary p-6 rounded-xl shadow-lg dark:shadow-card-modern";
  const sectionTitleClasses = "text-2xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary mb-6 border-b border-[var(--color-light-border)] dark:border-dark-primary pb-3 flex items-center";
  
  const resetButtonClasses = `w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-colors duration-150 ease-in-out 
                                     border hover:border-accent-red hover:text-accent-red 
                                     bg-transparent text-[var(--color-text-dark-secondary)] border-[var(--color-light-border)] 
                                     dark:bg-dark-primary dark:text-text-light-secondary dark:border-gray-600 
                                     focus:outline-none focus:ring-2 focus:ring-accent-red 
                                     focus:ring-offset-2 focus:ring-offset-[var(--color-light-primary)] dark:focus:ring-offset-dark-secondary`;
  // --- END THEME HELPER CLASSES ---

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTrades(selectedAccountId || undefined));
    }
  }, [dispatch, isAuthenticated, selectedAccountId]);

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setAnalyticsDateFilters({ [e.target.name]: e.target.value }));
  };

  const handleResetDateFilters = () => {
    dispatch(resetAnalyticsDateFilters());
  };

  const tradesForAnalytics = useMemo(() => {
    if (!analyticsFilters.analyticsDateFrom && !analyticsFilters.analyticsDateTo) {
      return allTrades;
    }
    return allTrades.filter(trade => {
      const tradeDateStr = trade.exitDate || trade.entryDate;
      if (!tradeDateStr) return false;
      const tradeDate = new Date(tradeDateStr);
      let match = true;
      if (analyticsFilters.analyticsDateFrom) {
        match = match && tradeDate >= new Date(analyticsFilters.analyticsDateFrom);
      }
      if (analyticsFilters.analyticsDateTo) {
        const toDate = new Date(analyticsFilters.analyticsDateTo);
        toDate.setHours(23, 59, 59, 999);
        match = match && tradeDate <= toDate;
      }
      return match;
    });
  }, [allTrades, analyticsFilters]);

  const filteredStats: DashboardStats | null = useMemo(() => {
    return tradesForAnalytics.length > 0 ? calculateDashboardStats(tradesForAnalytics) : null;
  }, [tradesForAnalytics]);

  const dailyPnlData = useMemo(() => {
    return tradesForAnalytics.length > 0 ? aggregatePnlByDay(tradesForAnalytics) : {};
  }, [tradesForAnalytics]);

  const statsByStrategy = useMemo(() => {
    return tradesForAnalytics.length > 0 ? calculateStatsByStrategyTag(tradesForAnalytics) : [];
  }, [tradesForAnalytics]);

  const statsByAssetType = useMemo(() => {
    return tradesForAnalytics.length > 0 ? calculateStatsByAssetType(tradesForAnalytics) : [];
  }, [tradesForAnalytics]);

  const statsBySymbol = useMemo(() => {
    return tradesForAnalytics.length > 0 ? calculateStatsBySymbol(tradesForAnalytics) : [];
  }, [tradesForAnalytics]);

  const statsByDayOfWeek = useMemo(() => {
    return tradesForAnalytics.length > 0 ? calculateStatsByDayOfWeek(tradesForAnalytics) : [];
  }, [tradesForAnalytics]);

  const statsByTradeDuration = useMemo(() => {
    return tradesForAnalytics.length > 0 ? calculateStatsByTradeDuration(tradesForAnalytics) : [];
  }, [tradesForAnalytics]);

  const pnlDistributionData = useMemo(() => {
    if (tradesForAnalytics.length > 0) {
      const distribution = calculatePnlDistribution(tradesForAnalytics, 12);
      return distribution.map(bucket => ({
        tag: bucket.name,
        closedTrades: bucket.count,
        totalTrades: bucket.count,
        openTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        totalNetPnl: 0,
        totalCommissions: 0,
        winRate: 0,
        lossRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        expectancy: 0,
        maxDrawdown: 0,
        currentBalance: 0,
        averageRR: 0,
        largestWin: 0,
        largestLoss: 0,
      }));
    }
    return [];
  }, [tradesForAnalytics]);

  if (isLoading && allTrades.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Trade Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Deep insights into your trading performance and patterns
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105">
            <FaArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaDownload className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-purple-500 dark:hover:bg-purple-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaShareAlt className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-orange-500 dark:hover:bg-orange-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaCog className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Range Filter Section */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              <FaCalendarAlt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Date Range Filter</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Filter analytics by trade exit/entry date</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {tradesForAnalytics.length} trade{tradesForAnalytics.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
            <input
              type="date" 
              name="analyticsDateFrom" 
              value={analyticsFilters.analyticsDateFrom || ''} 
              onChange={handleDateFilterChange}
              className="w-full p-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
            <input
              type="date" 
              name="analyticsDateTo" 
              value={analyticsFilters.analyticsDateTo || ''} 
              onChange={handleDateFilterChange}
              className="w-full p-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleResetDateFilters}
              className="w-full flex items-center justify-center space-x-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-red-500 dark:hover:bg-red-500 text-gray-600 dark:text-gray-400 hover:text-white py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105">
              <FaUndo className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">Error fetching trades: {error}</p>
        </div>
      )}

      {/* Performance Summary */}
      {filteredStats && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl">
                <FaTrophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Summary</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Key metrics for filtered trades</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredStats.closedTrades} closed trades
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <FaDollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Net P&L</span>
              </div>
              <p className={`text-lg font-bold ${filteredStats.totalNetPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {filteredStats.totalNetPnl >= 0 ? '+' : ''}${filteredStats.totalNetPnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <FaPercentage className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Win Rate</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {filteredStats.winRate.toFixed(1)}%
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <FaChartBar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Trades</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {filteredStats.closedTrades}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total: {filteredStats.totalTrades}
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <FaArrowUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Profit Factor</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {filteredStats.profitFactor?.toFixed(2) || 'N/A'}
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <FaDollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Expectancy</span>
              </div>
              <p className={`text-lg font-bold ${filteredStats.expectancy >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {filteredStats.expectancy >= 0 ? '+' : ''}${filteredStats.expectancy.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* P&L Calendar Section */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
            <FaCalendarDay className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Daily P&L Calendar</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visual representation of daily profit and loss</p>
          </div>
        </div>
        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
          <PnlCalendar dailyPnlData={dailyPnlData} />
        </div>
      </div>

      {/* P&L Distribution Section */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl">
            <FaChartBar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">P&L Distribution</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Number of trades per P&L bracket</p>
          </div>
        </div>
        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
          <BreakdownBarChart
            title=""
            data={pnlDistributionData}
            metricOptions={pnlDistributionMetricOptions} 
            initialMetricValue="closedTrades"
          />
        </div>
      </div>

      {/* Strategy/Tag Analysis */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
            <FaTags className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Strategy & Tag Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance breakdown by trading strategies</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <BreakdownBarChart
              title="Strategy Performance Metrics"
              data={statsByStrategy}
              metricOptions={barChartMetricOptions}
              initialMetricValue="totalNetPnl"
            />
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
              Trade Count Distribution
            </h3>
            <BreakdownPieChart
              title="Trade Count Distribution by Strategy/Tag"
              data={statsByStrategy}
              dataKeyForValue="closedTrades"
              valueFormatter={(value) => `${value} trade${value !== 1 ? 's' : ''}`}
            />
          </div>
        </div>
        
        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
          <StatsBreakdownTable title="Strategy/Tag Detailed Stats" data={statsByStrategy} groupingKeyHeader="Strategy/Tag"/>
        </div>
      </div>

      {/* Asset Type Analysis */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl">
            <FaGlobe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Asset Type Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance breakdown by asset categories</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <BreakdownBarChart
              title="Asset Type Performance Metrics"
              data={statsByAssetType}
              metricOptions={barChartMetricOptions}
              initialMetricValue="totalNetPnl"
            />
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
              Trade Count Distribution
            </h3>
            <BreakdownPieChart
              title="Trade Count Distribution by Asset Type"
              data={statsByAssetType}
              dataKeyForValue="closedTrades"
              valueFormatter={(value) => `${value} trade${value !== 1 ? 's' : ''}`}
            />
          </div>
        </div>
        
        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
          <StatsBreakdownTable title="Asset Type Detailed Stats" data={statsByAssetType} groupingKeyHeader="Asset Type"/>
        </div>
      </div>

      {/* Symbol Analysis */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl">
            <FaChartLine className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Symbol Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Top 10 symbols by trade count</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <BreakdownBarChart
              title="Symbol Performance Metrics"
              data={statsBySymbol}
              metricOptions={barChartMetricOptions}
              initialMetricValue="totalNetPnl"
            />
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
              Trade Count Distribution
            </h3>
            <BreakdownPieChart
              title="Trade Count Distribution by Symbol"
              data={statsBySymbol}
              dataKeyForValue="closedTrades"
              valueFormatter={(value) => `${value} trade${value !== 1 ? 's' : ''}`}
            />
          </div>
        </div>
        
        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
          <StatsBreakdownTable title="Symbol Detailed Stats" data={statsBySymbol} groupingKeyHeader="Symbol" />
        </div>
      </div>

      {/* Day of Week Analysis */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl">
            <FaCalendarAlt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Day of Week Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance patterns by weekday</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <BreakdownBarChart
              title="Day of Week Performance Metrics"
              data={statsByDayOfWeek}
              metricOptions={barChartMetricOptions}
              initialMetricValue="totalNetPnl"
            />
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
              Trade Count Distribution
            </h3>
            <BreakdownPieChart
              title="Trade Count by Day of Week"
              data={statsByDayOfWeek}
              dataKeyForValue="closedTrades"
              valueFormatter={(value) => `${value} trade${value !== 1 ? 's' : ''}`}
            />
          </div>
        </div>
        
        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
          <StatsBreakdownTable title="Day of Week Detailed Stats" data={statsByDayOfWeek} groupingKeyHeader="Day of Week" />
        </div>
      </div>

      {/* Trade Duration Analysis */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-xl">
            <FaClock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trade Duration Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance by how long trades were held</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <BreakdownBarChart
              title="Trade Duration Performance Metrics"
              data={statsByTradeDuration}
              metricOptions={barChartMetricOptions}
              initialMetricValue="totalNetPnl"
            />
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
              Trade Count by Duration
            </h3>
            <BreakdownPieChart
              title="Trade Count by Duration Bracket"
              data={statsByTradeDuration}
              dataKeyForValue="closedTrades"
              valueFormatter={(value) => `${value} trade${value !== 1 ? 's' : ''}`}
            />
          </div>
        </div>
        
        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
          <StatsBreakdownTable title="Trade Duration Detailed Stats" data={statsByTradeDuration} groupingKeyHeader="Duration Bracket"/>
        </div>
      </div>

      {/* No Data State */}
      {tradesForAnalytics.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
              <FaChartBar className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {allTrades.length > 0 ? "No trades match the current filters" : "No trades to analyze"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {allTrades.length > 0 
                  ? "Try adjusting your date filters to see more data."
                  : "Start trading and logging trades to see analytics here."
                }
              </p>
            </div>
            {allTrades.length === 0 && (
              <Link 
                href="/journal/new" 
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                <span>Log Your First Trade</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}