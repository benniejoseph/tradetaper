/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/analytics/page.tsx
"use client";
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades, setAnalyticsDateFilters, resetAnalyticsDateFilters } from '@/store/features/tradesSlice';
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
// import { Trade } from '@/types/trade'; // Already likely imported or not directly needed here


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

  useEffect(() => {
    if (isAuthenticated && allTrades.length === 0) {
      dispatch(fetchTrades());
    }
  }, [dispatch, isAuthenticated, allTrades.length]);

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
        closedTrades: bucket.count, // Use 'closedTrades' as the key for count
        // Fill other DashboardStats fields for type compatibility
        totalTrades: bucket.count, openTrades: 0, winningTrades: 0, losingTrades: 0, breakevenTrades: 0,
        totalNetPnl: 0, totalCommissions: 0, winRate: 0, lossRate: 0, averageWin: 0, averageLoss: 0,
        profitFactor: 0, expectancy: 0, maxDrawdown: 0,
      }));
    }
    return [];
  }, [tradesForAnalytics]);

  if (isLoading && allTrades.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading analytics data...</div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto space-y-12">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Trade Analytics</h1>
            <Link href="/dashboard" className="text-blue-400 hover:underline">
                Back to Dashboard
            </Link>
          </div>

          {/* Date Range Filter Section */}
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Filter by Date Range (Based on Exit/Entry Date)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="analyticsDateFrom" className="block text-sm font-medium text-gray-400">From</label>
                <input
                  type="date" name="analyticsDateFrom" id="analyticsDateFrom"
                  value={analyticsFilters.analyticsDateFrom || ''} onChange={handleDateFilterChange}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="analyticsDateTo" className="block text-sm font-medium text-gray-400">To</label>
                <input
                  type="date" name="analyticsDateTo" id="analyticsDateTo"
                  value={analyticsFilters.analyticsDateTo || ''} onChange={handleDateFilterChange}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <button
                    onClick={handleResetDateFilters}
                    className="w-full px-4 py-2 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none mt-5 sm:mt-0"
                >
                    Reset Date Filters
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-center">Error fetching trades: {error}</p>}

          {filteredStats && (
            <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Filtered Performance Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

          <PnlCalendar dailyPnlData={dailyPnlData} />
          <BreakdownBarChart
            title="P&L Distribution"
            data={pnlDistributionData}
            metricOptions={pnlDistributionMetricOptions} // Specific options for this chart
            initialMetricValue="closedTrades" // This is the count
          />


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <BreakdownBarChart
                title="Breakdown by Strategy/Tag"
                data={statsByStrategy}
                metricOptions={barChartMetricOptions}
                initialMetricValue="totalNetPnl"
            />
            <BreakdownPieChart
                title="Trades by Strategy/Tag"
                data={statsByStrategy}
                dataKeyForValue="closedTrades"
            />
          </div>
          <StatsBreakdownTable title="Performance by Strategy/Tag" data={statsByStrategy} groupingKeyHeader="Strategy/Tag"/>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mt-0 lg:mt-12"> {/* Adjusted mt for Pie chart */}
            <BreakdownBarChart
                title="Breakdown by Asset Type"
                data={statsByAssetType}
                metricOptions={barChartMetricOptions}
                initialMetricValue="totalNetPnl"
            />
            <BreakdownPieChart
                title="Trades by Asset Type"
                data={statsByAssetType}
                dataKeyForValue="closedTrades"
            />
          </div>
          <StatsBreakdownTable title="Performance by Asset Type" data={statsByAssetType} groupingKeyHeader="Asset Type"/>


          <StatsBreakdownTable title="Performance by Symbol" data={statsBySymbol} groupingKeyHeader="Symbol" />
          <StatsBreakdownTable title="Performance by Day of Week (Exit Day)" data={statsByDayOfWeek} groupingKeyHeader="Day of Week" />
          <StatsBreakdownTable title="Performance by Trade Duration" data={statsByTradeDuration} groupingKeyHeader="Duration Bucket" />
        </div>
      </div>
  );
}