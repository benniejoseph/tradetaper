/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId } from '@/store/features/mt5AccountsSlice';
import {
  calculateDashboardStats,
  calculateEquityCurveData,
  calculateDrawdownSeriesFromEquityCurve,
  calculateRollingReturns,
  calculateRollingProfitFactor,
  calculateRollingExpectancy,
} from '@/utils/analytics';
import { Trade, TradeStatus } from '@/types/trade';
import { format as formatDateFns, subDays, isAfter, parseISO, format } from 'date-fns';
import { FaChartLine, FaPlus, FaListOl, FaCalendarAlt, FaCalendarDay } from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';

import WinRateCard from '@/components/dashboard/WinRateCard';
import TradingCostsCard from '@/components/dashboard/TradingCostsCard';
import TradeStatisticsCard from '@/components/dashboard/TradeStatisticsCard';
import PerformanceStatsCard from '@/components/dashboard/PerformanceStatsCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import TradesCalendarHeatmap from '@/components/dashboard/TradesCalendarHeatmap';
import TradingActivityModal from '@/components/dashboard/TradingActivityModal';
import TopTradesByReturn from '@/components/dashboard/TopPairsTraded';
import DashboardPnlCalendar from '@/components/dashboard/DashboardPnlCalendar';
import HourlyPerformanceChart from '@/components/dashboard/analytics/HourlyPerformanceChart';
import SessionBreakdownChart from '@/components/dashboard/analytics/SessionBreakdownChart';
import HoldingTimeScatter from '@/components/dashboard/analytics/HoldingTimeScatter';
import TraderScoreRadar from '@/components/dashboard/visuals/TraderScoreRadar';
import AccountHealthGauge from '@/components/dashboard/visuals/AccountHealthGauge';
import PairsPerformanceTable from '@/components/dashboard/PairsPerformanceTable';
import AdvancedPerformanceChart from '@/components/dashboard/AdvancedPerformanceChart';
import { FaBrain, FaClock, FaHourglassHalf, FaGlobeAmericas, FaChartPie, FaTachometerAlt } from 'react-icons/fa';
import LongShortAnalysisCard from '@/components/dashboard/LongShortAnalysisCard';
import { FeatureGate } from '@/components/common/FeatureGate';
import DrawdownCurveCard from '@/components/dashboard/DrawdownCurveCard';
import RollingReturnCard from '@/components/dashboard/RollingReturnCard';
import RollingProfitFactorCard from '@/components/dashboard/RollingProfitFactorCard';
import RollingExpectancyCard from '@/components/dashboard/RollingExpectancyCard';
import MaeMfeScatterCard from '@/components/dashboard/MaeMfeScatterCard';

const timeRangeDaysMapping: { [key: string]: number } = {
  '7d': 7, '1M': 30, '3M': 90, '1Y': 365, 'All': Infinity,
};

interface ChartDataPoint {
  date: string;
  pnl: number;
  netPnl: number;
  mae: number;
}

interface PairStats {
  symbol: string;
  returnDollar: number;
  profitFactor: number;
  mae: number;
  winPercent: number;
  returnLoss: number;
  tradesCount: number;
}

export default function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading, lastFetchKey, lastFetchAt, lastFetchIncludeTags } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);

  const [timeRange, setTimeRange] = useState('All');
  const [rollingWindowSize, setRollingWindowSize] = useState(20);
  const [isTradingActivityModalOpen, setIsTradingActivityModalOpen] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{ date: string; count: number; totalPnl: number } | null>(null);
  const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (false && isAuthenticated && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/advanced${selectedAccountId ? `?accountId=${selectedAccountId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) {
            console.warn('Analytics endpoint returned error:', res.status);
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data) setAnalyticsData(data);
        })
        .catch(err => console.error('Failed to fetch analytics', err));
    }
  }, [isAuthenticated, token, selectedAccountId]);

  useEffect(() => {
    if (isAuthenticated) {
      const currentAccountId = selectedAccountId || selectedMT5AccountId;
      const limit = 500;
      const fetchKey = `account:${currentAccountId || 'all'}:page:1:limit:${limit}`;
      const isFresh = lastFetchAt && Date.now() - lastFetchAt < 60_000;
      if (trades.length > 0 && lastFetchKey === fetchKey && isFresh && !lastFetchIncludeTags) return;
      dispatch(fetchTrades({ accountId: currentAccountId || undefined, limit, includeTags: false }));
    }
  }, [dispatch, isAuthenticated, selectedAccountId, selectedMT5AccountId, lastFetchKey, lastFetchAt, lastFetchIncludeTags, trades.length]);

  const filteredTrades = useMemo(() => {
    const days = timeRangeDaysMapping[timeRange];
    if (days === Infinity || !trades || trades.length === 0) return trades || [];
    const cutOffDate = subDays(new Date(), days);
    return trades.filter(trade => {
      const tradeDateString = trade.status === TradeStatus.CLOSED && trade.exitDate ? trade.exitDate : trade.entryDate;
      if (!tradeDateString) return false;
      try {
        return isAfter(parseISO(tradeDateString), cutOffDate);
      } catch {
        return false;
      }
    });
  }, [trades, timeRange]);

  const pairsPerformance = useMemo((): PairStats[] => {
    if (!filteredTrades) return [];
    const closedTrades = filteredTrades.filter(t => t.status === TradeStatus.CLOSED);
    const symbolGroups: { [symbol: string]: Trade[] } = {};

    closedTrades.forEach(trade => {
      if (!symbolGroups[trade.symbol]) {
        symbolGroups[trade.symbol] = [];
      }
      symbolGroups[trade.symbol].push(trade);
    });

    const pairStats: PairStats[] = Object.entries(symbolGroups)
      .map(([symbol, symbolTrades]) => {
        const totalPnl = symbolTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
        const wins = symbolTrades.filter(t => (t.profitOrLoss || 0) > 0);
        const losses = symbolTrades.filter(t => (t.profitOrLoss || 0) < 0);

        const totalWins = wins.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
        const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0));

        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
        const winPercent = symbolTrades.length > 0 ? (wins.length / symbolTrades.length) * 100 : 0;

        const mae = losses.reduce((sum, t) => sum + Math.abs(t.profitOrLoss || 0) * 0.3, 0);

        return {
          symbol: symbol,
          returnDollar: totalPnl,
          profitFactor,
          mae: -mae,
          winPercent,
          returnLoss: totalLosses > 0 ? -totalLosses : 0,
          tradesCount: symbolTrades.length,
        };
      })
      .filter(stat => stat.tradesCount >= 1)
      .sort((a, b) => b.returnDollar - a.returnDollar)
      .slice(0, 10);

    return pairStats;
  }, [filteredTrades]);

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!filteredTrades) return [];
    const closedTrades = filteredTrades
      .filter(t => t.status === TradeStatus.CLOSED && t.exitDate)
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

    if (closedTrades.length === 0) return [];

    let cumulativePnl = 0;
    let cumulativeNetPnl = 0;
    const dataPoints: ChartDataPoint[] = [];

    const dailyGroups: { [key: string]: Trade[] } = {};
    closedTrades.forEach(trade => {
      const dateKey = format(parseISO(trade.exitDate!), 'yyyy-MM-dd');
      if (!dailyGroups[dateKey]) {
        dailyGroups[dateKey] = [];
      }
      dailyGroups[dateKey].push(trade);
    });

    Object.entries(dailyGroups).forEach(([date, dayTrades]) => {
      const dayPnl = dayTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
      const dayCommissions = dayTrades.reduce((sum, t) => sum + (t.commission || 0), 0);

      cumulativePnl += dayPnl;
      cumulativeNetPnl += (dayPnl - dayCommissions);

      const dayMAE = dayTrades.reduce((mae, trade) => {
        if ((trade.profitOrLoss || 0) < 0) {
          return mae + Math.abs(trade.profitOrLoss || 0) * 0.3;
        }
        return mae;
      }, 0);

      dataPoints.push({
        date: format(parseISO(date), 'MMM dd'),
        pnl: cumulativePnl,
        netPnl: cumulativeNetPnl,
        mae: -dayMAE,
      });
    });

    return dataPoints;
  }, [filteredTrades]);

  const closedTradesSorted = useMemo(() => {
    if (!filteredTrades) return [];
    return filteredTrades
      .filter(t => t.status === TradeStatus.CLOSED && t.exitDate && t.profitOrLoss !== undefined)
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());
  }, [filteredTrades]);

  const dashboardStats = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) return calculateDashboardStats(filteredTrades);
    return null;
  }, [filteredTrades]);

  const equityCurve = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) {
      const curveData = calculateEquityCurveData(filteredTrades);
      if (curveData && Array.isArray(curveData) && curveData.length > 0) {
        return curveData.map(point => ({ ...point, date: formatDateFns(new Date(point.date), 'MMM dd') }));
      }
    }
    return [{ date: formatDateFns(new Date(), 'MMM dd'), value: 0 }];
  }, [filteredTrades]);

  const drawdownSeries = useMemo(() => {
    return calculateDrawdownSeriesFromEquityCurve(equityCurve).map(point => ({
      date: point.date,
      drawdownPct: point.drawdownPct,
    }));
  }, [equityCurve]);

  const rollingReturns = useMemo(() => {
    const initialBalance = equityCurve[0]?.value || 0;
    return calculateRollingReturns(closedTradesSorted, rollingWindowSize, initialBalance)
      .map(point => ({
        ...point,
        date: formatDateFns(new Date(point.date), 'MMM dd'),
      }));
  }, [closedTradesSorted, rollingWindowSize, equityCurve]);

  const rollingProfitFactor = useMemo(() => {
    return calculateRollingProfitFactor(closedTradesSorted, rollingWindowSize)
      .map(point => ({
        ...point,
        date: formatDateFns(new Date(point.date), 'MMM dd'),
      }));
  }, [closedTradesSorted, rollingWindowSize]);

  const rollingExpectancy = useMemo(() => {
    return calculateRollingExpectancy(closedTradesSorted, rollingWindowSize)
      .map(point => ({
        ...point,
        date: formatDateFns(new Date(point.date), 'MMM dd'),
      }));
  }, [closedTradesSorted, rollingWindowSize]);

  const maeMfePipsData = useMemo(() => {
    return closedTradesSorted
      .map(trade => {
        if (typeof trade.maePips !== 'number' || typeof trade.mfePips !== 'number') return null;
        const mae = trade.maePips > 0 ? -trade.maePips : trade.maePips;
        const mfe = Math.abs(trade.mfePips);
        return {
          id: trade.id,
          mae,
          mfe,
          pnl: trade.profitOrLoss || 0,
        };
      })
      .filter((point): point is { id: string; mae: number; mfe: number; pnl: number } => Boolean(point));
  }, [closedTradesSorted]);

  const maeMfePriceData = useMemo(() => {
    return closedTradesSorted
      .map(trade => {
        if (typeof trade.maePrice !== 'number' || typeof trade.mfePrice !== 'number') return null;
        const mae = trade.maePrice > 0 ? -trade.maePrice : trade.maePrice;
        const mfe = Math.abs(trade.mfePrice);
        return {
          id: trade.id,
          mae,
          mfe,
          pnl: trade.profitOrLoss || 0,
        };
      })
      .filter((point): point is { id: string; mae: number; mfe: number; pnl: number } => Boolean(point));
  }, [closedTradesSorted]);

  const numberOfTradingDays = useMemo(() => {
    if (!dashboardStats || dashboardStats.closedTrades === 0 || !filteredTrades) return 1;
    const closedTrades = filteredTrades.filter((t: Trade) => t.status === TradeStatus.CLOSED && t.exitDate);
    const uniqueDays = new Set(closedTrades.map((t: Trade) => new Date(t.exitDate!).toDateString()));
    return uniqueDays.size || 1;
  }, [filteredTrades, dashboardStats]);

  const avgFeesPerDay = (dashboardStats?.totalCommissions || 0) / numberOfTradingDays;
  const avgTradesPerDay = (dashboardStats?.closedTrades || 0) / numberOfTradingDays;

  const { minEquity, maxEquity } = useMemo(() => {
    if (!equityCurve || equityCurve.length === 0) return { minEquity: 0, maxEquity: 0 };
    const values = equityCurve.map(p => p.value);
    return { minEquity: Math.min(...values), maxEquity: Math.max(...values) };
  }, [equityCurve]);

  const minBalance = minEquity;
  const maxBalance = maxEquity;
  const currentBalance = dashboardStats?.currentBalance || 0;
  const gaugeMax = Math.max(maxBalance, currentBalance);
  const gaugeMin = Math.min(minBalance, currentBalance);

  const handleHeatmapDateClick = (dateData: { date: string; count: number; totalPnl: number }, tradesForDate: Trade[]) => {
    setSelectedDateData(dateData);
    setSelectedDateTrades(tradesForDate);
    setIsTradingActivityModalOpen(true);
  };

  if (tradesLoading && trades.length === 0 && !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <AnimatedCard variant="glass" hoverEffect="pulse" className="text-center backdrop-blur-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Deep performance breakdowns and patterns.</p>
          </div>
        </div>

        {analyticsData?.radarMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Trader Score Breakdown" icon={FaChartPie}>
              <TraderScoreRadar data={analyticsData.radarMetrics} />
            </DashboardCard>
            <DashboardCard title="Account Health" icon={FaTachometerAlt}>
              <AccountHealthGauge
                balance={currentBalance}
                equity={equityCurve[equityCurve.length - 1]?.value || currentBalance}
                minBalance={gaugeMin}
                maxBalance={gaugeMax}
                minEquity={gaugeMin}
                maxEquity={gaugeMax}
              />
            </DashboardCard>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <WinRateCard
            winRate={dashboardStats?.winRate || 0}
            averageRR={dashboardStats?.averageRR || 0}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <TradingCostsCard
            totalCommissions={dashboardStats?.totalCommissions || 0}
            closedTrades={dashboardStats?.closedTrades || 0}
            totalNetPnl={dashboardStats?.totalNetPnl || 0}
            avgFeesPerDay={avgFeesPerDay}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <TradeStatisticsCard
            closedTrades={dashboardStats?.closedTrades || 0}
            winningTrades={dashboardStats?.winningTrades || 0}
            losingTrades={dashboardStats?.losingTrades || 0}
            breakevenTrades={dashboardStats?.breakevenTrades || 0}
            avgTradesPerDay={avgTradesPerDay}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <DrawdownCurveCard
            data={drawdownSeries}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <PerformanceStatsCard
            trades={filteredTrades || []}
            currentBalance={dashboardStats?.currentBalance || 0}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <RollingReturnCard
            data={rollingReturns}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            windowSize={rollingWindowSize}
            onWindowSizeChange={setRollingWindowSize}
          />

          <RollingProfitFactorCard
            data={rollingProfitFactor}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            windowSize={rollingWindowSize}
          />

          <RollingExpectancyCard
            data={rollingExpectancy}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            windowSize={rollingWindowSize}
          />

          <MaeMfeScatterCard
            pipsData={maeMfePipsData}
            priceData={maeMfePriceData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <DashboardCard title="Top Performing Trades" icon={FaListOl} gridSpan="lg:col-span-3" showInfoIcon>
            <TopTradesByReturn trades={filteredTrades || []} topN={5} />
          </DashboardCard>

          <LongShortAnalysisCard trades={filteredTrades || []} />

          <DashboardCard title="P&L Calendar" icon={FaCalendarDay} gridSpan="lg:col-span-6" showInfoIcon>
            <DashboardPnlCalendar trades={filteredTrades || []} />
          </DashboardCard>

          <div className="lg:col-span-6 contents">
            <FeatureGate feature="advancedAnalytics" blur={true} className="lg:col-span-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:col-span-6 w-full">
                <div className="lg:col-span-6">
                  <AdvancedPerformanceChart data={chartData} />
                </div>

                <div className="lg:col-span-6">
                  <PairsPerformanceTable data={pairsPerformance} />
                </div>

                {analyticsData && (
                  <>
                    <div className="lg:col-span-6 flex items-center gap-2 mt-4 mb-2">
                      <FaBrain className="text-indigo-500 w-5 h-5" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Market Intelligence</h2>
                    </div>

                    <DashboardCard title="Performance by Hour" icon={FaClock} gridSpan="lg:col-span-6">
                      <HourlyPerformanceChart data={analyticsData.hourlyPerformance} />
                    </DashboardCard>

                    <DashboardCard title="Session Performance" icon={FaGlobeAmericas} gridSpan="lg:col-span-3">
                      <SessionBreakdownChart data={analyticsData.sessionPerformance} />
                    </DashboardCard>

                    <DashboardCard title="Holding Time vs PnL" icon={FaHourglassHalf} gridSpan="lg:col-span-3">
                      <HoldingTimeScatter data={analyticsData.holdingTimeAnalysis} />
                    </DashboardCard>
                  </>
                )}

                <DashboardCard title="Trading Activity Heatmap" icon={FaCalendarAlt} gridSpan="lg:col-span-6">
                  <TradesCalendarHeatmap trades={filteredTrades || []} onDateClick={handleHeatmapDateClick} />
                </DashboardCard>
              </div>
            </FeatureGate>
          </div>
        </div>

        {(!filteredTrades || filteredTrades.length === 0) && !tradesLoading && (
          <div className="text-center py-16 bg-gradient-to-br from-emerald-50/80 to-white/80 dark:from-emerald-950/20 dark:to-black/80 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50">
            <div className="max-w-md mx-auto space-y-4">
              <FaChartLine className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No trades recorded yet</h3>
              <AnimatedButton
                onClick={() => { window.location.href = '/journal/new'; }}
                variant="gradient"
                size="lg"
                icon={<FaPlus className="w-4 h-4" />}
                iconPosition="left"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                ripple
              >
                Log Your First Trade
              </AnimatedButton>
            </div>
          </div>
        )}

        <TradingActivityModal
          isOpen={isTradingActivityModalOpen}
          onClose={() => setIsTradingActivityModalOpen(false)}
          selectedDate={selectedDateData}
          tradesForDate={selectedDateTrades}
        />
      </div>
    </div>
  );
}
