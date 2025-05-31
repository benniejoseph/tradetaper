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
import { FaCalendarAlt, FaUndo, FaArrowLeft } from 'react-icons/fa';

// Define metric options centrally for consistency
const barChartMetricOptions: MetricOption[] = [
    { value: 'totalNetPnl', label: 'Net P&L', isCurrency: true },
    { value: 'closedTrades', label: 'Number of Trades' },
    { value: 'winRate', label: 'Win Rate', isPercentage: true },
    { value: 'averageWin', label: 'Average Win', isCurrency: true },
    { value: 'averageLoss', label: 'Average Loss', isCurrency: true }, // Note: value will be negative
    { value: 'expectancy', label: 'Expectancy', isCurrency: true },
    { value: 'maxDrawdown', label: 'Max Drawdown', isPercentage: true },
];

const pnlDistributionMetricOptions: MetricOption[] = [
    { value: 'closedTrades', label: 'Number of Trades' } // Only 'count' (mapped to closedTrades) makes sense here
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

  // NEW: Memoized calculation for Day of Week stats
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
        <div className="min-h-screen flex items-center justify-center text-center p-4 
                        bg-[var(--color-light-secondary)] text-[var(--color-text-dark-primary)] 
                        dark:bg-dark-primary dark:text-text-light-primary">
            Loading analytics data...
        </div>
    );
  }

  return (
      // Main page background handled by AppLayout
      <div className="min-h-screen p-4 md:p-8">
        <div className="container mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">Trade Analytics</h1>
            <Link href="/dashboard" className="flex items-center space-x-2 text-accent-green hover:text-accent-green-darker hover:underline transition-colors">
                <FaArrowLeft />
                <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Date Range Filter Section - Themed */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>
                <FaCalendarAlt className="mr-3 opacity-70" />
                Filter by Date Range 
                <span className="text-base font-normal text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary ml-2">(Exit/Entry Date)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 items-end">
              <div>
                <label htmlFor="analyticsDateFrom" className={labelClasses}>From</label>
                <input
                  type="date" name="analyticsDateFrom" id="analyticsDateFrom"
                  value={analyticsFilters.analyticsDateFrom || ''} onChange={handleDateFilterChange}
                  className={themedInputClasses}
                />
              </div>
              <div>
                <label htmlFor="analyticsDateTo" className={labelClasses}>To</label>
                <input
                  type="date" name="analyticsDateTo" id="analyticsDateTo"
                  value={analyticsFilters.analyticsDateTo || ''} onChange={handleDateFilterChange}
                  className={themedInputClasses}
                />
              </div>
              <div className="mt-2 sm:mt-0">
                <button
                    onClick={handleResetDateFilters}
                    className={resetButtonClasses}
                >
                    <FaUndo />
                    <span>Reset Dates</span>
                </button>
              </div>
            </div>
          </div>

          {error && 
            <div className="text-center text-accent-red py-6 text-lg bg-[var(--color-light-primary)] dark:bg-dark-secondary rounded-xl shadow-lg dark:shadow-card-modern p-4">
                Error fetching trades: {error}
            </div>}

          {filteredStats && (
            <div className={sectionContainerClasses}>
              <h2 className={sectionTitleClasses}>
                Performance Summary 
                <span className="text-base font-normal text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary ml-2">(Filtered)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                <StatCard title="Net P&L" value={filteredStats.totalNetPnl} isCurrency positiveIsGood={true} />
                <StatCard title="Win Rate" value={filteredStats.winRate} isPercentage positiveIsGood={true} />
                <StatCard title="Trades (Closed)" value={filteredStats.closedTrades} description={`(Total Filtered: ${filteredStats.totalTrades})`}/>
                <StatCard title="Avg Win" value={filteredStats.averageWin} isCurrency positiveIsGood={true} />
                <StatCard title="Avg Loss" value={filteredStats.averageLoss} isCurrency positiveIsGood={false}/>
                <StatCard title="Profit Factor" value={filteredStats.profitFactor} positiveIsGood={true}/>
                <StatCard title="Expectancy" value={filteredStats.expectancy} isCurrency positiveIsGood={true} />
                <StatCard title="Max Drawdown" value={filteredStats.maxDrawdown} isPercentage positiveIsGood={false} />
                <StatCard title="Commissions" value={filteredStats.totalCommissions} isCurrency />
              </div>
            </div>
          )}

          {/* P&L Calendar Section */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>
                <FaCalendarAlt className="mr-3 opacity-70" />
                Daily P&L Calendar
            </h2>
            <PnlCalendar dailyPnlData={dailyPnlData} />
          </div>

          {/* P&L Distribution Section */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>P&L Distribution 
                <span className="text-base font-normal text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary ml-2">(Number of Trades per P&L Bracket)</span>
            </h2>
            <BreakdownBarChart
              title=""
              data={pnlDistributionData}
              metricOptions={pnlDistributionMetricOptions} 
              initialMetricValue="closedTrades"
            />
          </div>

          {/* Breakdown by Strategy/Tag Section */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Analysis by Strategy/Tag</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-6">
              <div>
                <BreakdownBarChart
                    title="Strategy/Tag Performance Metrics"
                    data={statsByStrategy}
                    metricOptions={barChartMetricOptions}
                    initialMetricValue="totalNetPnl"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-light-primary mb-4 text-center">
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
            <StatsBreakdownTable title="Strategy/Tag Detailed Stats" data={statsByStrategy} groupingKeyHeader="Strategy/Tag"/>
          </div>

          {/* Breakdown by Asset Type Section */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Analysis by Asset Type</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-6">
              <div>
                <BreakdownBarChart
                    title="Asset Type Performance Metrics"
                    data={statsByAssetType}
                    metricOptions={barChartMetricOptions}
                    initialMetricValue="totalNetPnl"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-light-primary mb-4 text-center">
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
            <StatsBreakdownTable title="Asset Type Detailed Stats" data={statsByAssetType} groupingKeyHeader="Asset Type"/>
          </div>

          {/* Breakdown by Symbol Section */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Analysis by Symbol <span className="text-xs font-normal text-text-light-secondary ml-2">(Top 10 by Trade Count)</span></h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-6">
              <div>
                <BreakdownBarChart
                    title="Symbol Performance Metrics"
                    data={statsBySymbol}
                    metricOptions={barChartMetricOptions}
                    initialMetricValue="totalNetPnl"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-light-primary mb-4 text-center">
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
            <StatsBreakdownTable title="Symbol Detailed Stats" data={statsBySymbol} groupingKeyHeader="Symbol" />
          </div>

          {/* Breakdown by Day of the Week Section */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Analysis by Day of the Week</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-6">
                <div>
                    <BreakdownBarChart
                        title="Day of Week Performance Metrics"
                        data={statsByDayOfWeek}
                        metricOptions={barChartMetricOptions}
                        initialMetricValue="totalNetPnl"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-text-light-primary mb-4 text-center">
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
            <StatsBreakdownTable title="Day of Week Detailed Stats" data={statsByDayOfWeek} groupingKeyHeader="Day of Week" />
          </div>

          {/* Breakdown by Trade Duration Section */}
          <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Analysis by Trade Duration</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-6">
                <div>
                    <BreakdownBarChart
                        title="Trade Duration Performance Metrics"
                        data={statsByTradeDuration}
                        metricOptions={barChartMetricOptions}
                        initialMetricValue="totalNetPnl"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-text-light-primary mb-4 text-center">
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
            <StatsBreakdownTable title="Trade Duration Detailed Stats" data={statsByTradeDuration} groupingKeyHeader="Duration Bracket"/>
          </div>

          {tradesForAnalytics.length === 0 && !isLoading && (
            <div className="text-center py-10 bg-dark-secondary rounded-xl shadow-card-modern p-6">
                <p className="text-xl text-text-light-secondary">
                    {allTrades.length > 0 ? "No trades match the current date filters." : "No trades recorded yet to analyze."} 
                </p>
                {allTrades.length === 0 && (
                    <Link href="/trades/new" className="mt-6 inline-flex items-center space-x-2 bg-accent-green hover:bg-accent-green-darker text-dark-primary font-semibold py-2.5 px-5 rounded-lg transition-all duration-150 ease-in-out shadow-md hover:shadow-glow-green-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-accent-green">
                        <span>Log Your First Trade</span>
                    </Link>
                )}
            </div>
          )}

        </div>
      </div>
  );
}