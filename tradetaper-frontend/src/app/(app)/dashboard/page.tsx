/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectSelectedAccount, selectAvailableAccounts, updateAccountThunk } from '@/store/features/accountSlice';
import {  fetchMT5Accounts, 
  selectMT5Accounts, 
  selectSelectedMT5AccountId,
  updateMT5Account
} from '@/store/features/mt5AccountsSlice';
import { calculateDashboardStats, calculateEquityCurveData } from '@/utils/analytics';
import { Trade, TradeStatus } from '@/types/trade';
import { format as formatDateFns, subDays, isAfter, parseISO, format, isValid } from 'date-fns';
import { FaChartLine, FaPlus, FaListOl, FaCalendarAlt, FaCalendarDay } from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';

// Dashboard Components
import QuickActionCards from '@/components/dashboard/QuickActionCards';
import PortfolioBalanceCard from '@/components/dashboard/PortfolioBalanceCard';
import PersonalTargetCard from '@/components/dashboard/PersonalTargetCard';
import TotalReturnCard from '@/components/dashboard/TotalReturnCard';
import EquityCurveCard from '@/components/dashboard/EquityCurveCard';
import WinRateCard from '@/components/dashboard/WinRateCard';
import TradingCostsCard from '@/components/dashboard/TradingCostsCard';
import TradeStatisticsCard from '@/components/dashboard/TradeStatisticsCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import SetTargetModal from '@/components/dashboard/SetTargetModal';
import TradesCalendarHeatmap from '@/components/dashboard/TradesCalendarHeatmap';
import TradingActivityModal from '@/components/dashboard/TradingActivityModal';
import TopTradesByReturn from '@/components/dashboard/TopPairsTraded';
import DashboardPnlCalendar from '@/components/dashboard/DashboardPnlCalendar';
import KillZoneBanner from '@/components/dashboard/KillZoneBanner';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
import HourlyPerformanceChart from '@/components/dashboard/analytics/HourlyPerformanceChart';
import SessionBreakdownChart from '@/components/dashboard/analytics/SessionBreakdownChart';
import HoldingTimeScatter from '@/components/dashboard/analytics/HoldingTimeScatter';
import TraderScoreRadar from '@/components/dashboard/visuals/TraderScoreRadar';
import AccountHealthGauge from '@/components/dashboard/visuals/AccountHealthGauge';
import PairsPerformanceTable from '@/components/dashboard/PairsPerformanceTable';
import AdvancedPerformanceChart from '@/components/dashboard/AdvancedPerformanceChart';
import { FaBrain, FaClock, FaHourglassHalf, FaGlobeAmericas, FaChartPie, FaTachometerAlt } from 'react-icons/fa';

// Time range mapping
const timeRangeDaysMapping: { [key: string]: number } = {
  '7d': 7, '1M': 30, '3M': 90, '1Y': 365, 'All': Infinity,
};

// Types for new components
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

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Account data
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  const allRegularAccounts = useSelector(selectAvailableAccounts);
  const allMT5Accounts = useSelector(selectMT5Accounts);
  
  // State
  const [timeRange, setTimeRange] = useState('All');
  const [isSetTargetModalOpen, setIsSetTargetModalOpen] = useState(false);
  const [isTradingActivityModalOpen, setIsTradingActivityModalOpen] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{date: string; count: number; totalPnl: number} | null>(null);
  const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null); // Use proper type in real app
  const { token } = useSelector((state: RootState) => state.auth);

  // Fetch Advanced Analytics
  useEffect(() => {
    if (isAuthenticated && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/advanced${selectedAccountId ? `?accountId=${selectedAccountId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setAnalyticsData(data))
      .catch(err => console.error("Failed to fetch analytics", err));
    }
  }, [isAuthenticated, token, selectedAccountId]);

  // Fetch trades
  useEffect(() => {
    if (isAuthenticated) {
      const currentAccountId = selectedAccountId || selectedMT5AccountId;
      // Fetch sufficient history for accurate analytics
      dispatch(fetchTrades({ accountId: currentAccountId || undefined, limit: 2000 }));
    }
  }, [dispatch, isAuthenticated, selectedAccountId, selectedMT5AccountId]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    const days = timeRangeDaysMapping[timeRange];
    if (days === Infinity || !trades || trades.length === 0) return trades || [];
    const cutOffDate = subDays(new Date(), days);
    return trades.filter(trade => {
      const tradeDateString = trade.status === TradeStatus.CLOSED && trade.exitDate ? trade.exitDate : trade.entryDate;
      if (!tradeDateString) return false;
      try {
        return isAfter(parseISO(tradeDateString), cutOffDate);
      } catch { return false; }
    });
  }, [trades, timeRange]);

  // Calculate pairs performance (Migrated from OverviewPage)
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
        
        // Simulated MAE calculation
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

  // Calculate chart data (Migrated from OverviewPage)
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!filteredTrades) return [];
    const closedTrades = filteredTrades
      .filter(t => t.status === TradeStatus.CLOSED && t.exitDate)
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

    if (closedTrades.length === 0) return [];

    let cumulativePnl = 0;
    let cumulativeNetPnl = 0;
    const dataPoints: ChartDataPoint[] = [];

    // Group trades by day for better visualization
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
      
      // Calculate simulated MAE (since we don't have tick data)
      // We'll use a negative value based on losing trades as a proxy
      const dayMAE = dayTrades.reduce((mae, trade) => {
        if ((trade.profitOrLoss || 0) < 0) {
          return mae + Math.abs(trade.profitOrLoss || 0) * 0.3; // Simulate MAE as 30% worse than final loss
        }
        return mae;
      }, 0);

      dataPoints.push({
        date: format(parseISO(date), 'MMM dd'),
        pnl: cumulativePnl,
        netPnl: cumulativeNetPnl,
        mae: -dayMAE, // Negative because MAE represents adverse movement
      });
    });

    return dataPoints;
  }, [filteredTrades]);

  // Stats
  const dashboardStats = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) return calculateDashboardStats(filteredTrades);
    return null;
  }, [filteredTrades]);

  // Target calculations
  const { personalTargetCurrent, isAllAccountsSelected } = useMemo(() => {
    const isAllAccounts = !selectedAccountId && !selectedMT5AccountId;
    if (isAllAccounts) {
      const regularTargetSum = allRegularAccounts.reduce((sum: number, acc: any) => sum + (acc.target || 0), 0);
      return {
        personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
        isAllAccountsSelected: true
      };
    }
    return {
      personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
      isAllAccountsSelected: false
    };
  }, [selectedAccountId, selectedMT5AccountId, dashboardStats?.totalNetPnl]);

  const personalTargetGoal = useMemo(() => {
    if (selectedAccountId && selectedAccount) {
       return (selectedAccount as any).target || 1000;
    }
    if (selectedMT5AccountId) {
       const mt5Acc = allMT5Accounts.find(a => a.id === selectedMT5AccountId);
       return mt5Acc?.target || 1000;
    }
    // For All Accounts, sum of targets? or just use a default/aggregate
    // Currently dashboard uses a single gauge, so maybe sum is appropriate, 
    // or just return 0 if not applicable.
    // Let's assume for now 1000 * count or something, but 'dashboardStats' doesn't have a target field.
    // Better to default to 1000 if not selected.
    return 1000; 
  }, [selectedAccountId, selectedAccount, selectedMT5AccountId, allMT5Accounts, dashboardStats]);

  // Equity curve
  const equityCurve = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) {
      const curveData = calculateEquityCurveData(filteredTrades);
      if (curveData && Array.isArray(curveData) && curveData.length > 0) {
        return curveData.map(point => ({...point, date: formatDateFns(new Date(point.date), 'MMM dd')}));
      }
    }
    return [{ date: formatDateFns(new Date(), 'MMM dd'), value: 0 }]; 
  }, [filteredTrades]);

  // Calculate True Current Balance (based on All Trades logic)
  // Calculate True Current Balance
  const trueCurrentBalance = useMemo(() => {
    // Helper to calculate balance for a single manual account
    const getManualBalance = (acc: any) => {
      const accTrades = trades?.filter(t => t.accountId === acc.id) || [];
      const accPnl = accTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
      return (Number(acc.balance) || 0) + accPnl;
    };

    // Helper to calculate balance for a single MT5 account
    const getMT5Balance = (acc: any) => {
       const rawBalance = Number(acc.balance) || 0;
       // We need trades for this account to subtract commissions
       // Assuming 'trades' contains all trades if we are in 'All' mode, or trades for this account
       const accTrades = trades?.filter(t => t.accountId === acc.id) || [];
       const totalCommissions = accTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
       return rawBalance - Math.abs(totalCommissions);
    };

    if (selectedAccountId) {
       // Manual Account Selected
       if (!selectedAccount) return 0;
       return getManualBalance(selectedAccount);
    }

    if (selectedMT5AccountId) {
       // MT5 Account Selected
       const mt5Acc = allMT5Accounts.find(a => a.id === selectedMT5AccountId);
       if (!mt5Acc) return 0;
       return getMT5Balance(mt5Acc);
    }

    // All Accounts Selected (Aggregate)
    let total = 0;
    
    // Sum Manual Accounts
    allRegularAccounts.forEach(acc => {
      total += getManualBalance(acc);
    });

    // Sum MT5 Accounts
    allMT5Accounts.forEach(acc => {
      total += getMT5Balance(acc);
    });

    return total;
  }, [selectedAccountId, selectedMT5AccountId, selectedAccount, allMT5Accounts, allRegularAccounts, trades]);

  // Shift Equity Curve to match Balance
  const shiftedEquityCurve = useMemo(() => {
     if (!equityCurve || equityCurve.length === 0) return [];
     // The equity curve is cumulative PnL for the period.
     // We want it to be a Balance curve.
     // End of curve should match trueCurrentBalance (approx).
     // Warning: dashboardStats.totalNetPnl might differ slightly from equityCurve[last] due to calculation differences?
     // Let's assume equityCurve[last].value IS totalNetPnl.
     
     const lastPnl = equityCurve[equityCurve.length - 1]?.value || 0;
     const offset = trueCurrentBalance - lastPnl;
     
     return equityCurve.map(point => ({
       ...point,
       value: point.value + offset
     }));
  }, [equityCurve, trueCurrentBalance]);

  // Period metrics
  const periodMetrics = useMemo(() => {
    const totalNetPnlForPeriod = dashboardStats?.totalNetPnl || 0;
    
    // We need to fetch the MT5 account details if an MT5 ID is selected
    // This requires us to access the mt5Accounts list from store
    
    // Let's defer strict calculation to the return/render or a better useMemo block 
    // once we have the account object.
    
    // For now, let's keep existing logic but warn it's PnL-based.
    // Wait, the user WANTS it fixed.
    
    const initialBalanceForPeriod = shiftedEquityCurve[0]?.value || 0;
    const currentBalance = trueCurrentBalance;
    
    let balancePercentageChange = 0;
    if (initialBalanceForPeriod && currentBalance) {
      balancePercentageChange = ((currentBalance - initialBalanceForPeriod) / initialBalanceForPeriod) * 100;
    }
    let roiPercentage = 0;
    // ROI is typically on INITIAL balance
    if (initialBalanceForPeriod && totalNetPnlForPeriod) {
      roiPercentage = (totalNetPnlForPeriod / initialBalanceForPeriod) * 100;
    }
    return { balancePercentageChange, roiPercentage, initialBalanceForPeriod };
  }, [shiftedEquityCurve, trueCurrentBalance, dashboardStats]);

  const personalTargetProgress = useMemo(() => {
    if (personalTargetGoal === 0) return 0;
    return (personalTargetCurrent / personalTargetGoal) * 100;
  }, [personalTargetCurrent, personalTargetGoal]);

  // Trading days calculations
  const numberOfTradingDays = useMemo(() => {
    if (!dashboardStats || dashboardStats.closedTrades === 0 || !filteredTrades) return 1;
    const closedTrades = filteredTrades.filter((t: Trade) => t.status === TradeStatus.CLOSED && t.exitDate);
    const uniqueDays = new Set(closedTrades.map((t: Trade) => new Date(t.exitDate!).toDateString()));
    return uniqueDays.size || 1;
  }, [filteredTrades, dashboardStats]);

  const avgFeesPerDay = (dashboardStats?.totalCommissions || 0) / numberOfTradingDays;
  const avgTradesPerDay = (dashboardStats?.closedTrades || 0) / numberOfTradingDays;

  // Min/Max for Gauge
  const { minEquity, maxEquity } = useMemo(() => {
     if (!equityCurve || equityCurve.length === 0) return { minEquity: 0, maxEquity: 0 };
     const values = equityCurve.map(p => p.value);
     return { minEquity: Math.min(...values), maxEquity: Math.max(...values) };
  }, [equityCurve]);
  
  // Balance approximation (using equity for now as we don't track separate balance history per se)
  // In a real scenario, we'd have a separate balance curve.
  const minBalance = minEquity;
  const maxBalance = maxEquity;
  const currentBalance = dashboardStats?.currentBalance || 0;
  // Ensure max is at least current
  const gaugeMax = Math.max(maxBalance, currentBalance);
  const gaugeMin = Math.min(minBalance, currentBalance);

  // Handlers
  const handleSaveTarget = async (newGoal: number) => {
    if (isAllAccountsSelected) {
      alert('When "All Accounts" is selected, please set targets for individual accounts.');
      setIsSetTargetModalOpen(false);
      return;
    }

    try {
      if (selectedAccountId && selectedAccount) {
        await dispatch(updateAccountThunk({ id: (selectedAccount as any).id, target: newGoal })).unwrap();
        setIsSetTargetModalOpen(false);
      } else if (selectedMT5AccountId) {
        await dispatch(updateMT5Account({ id: selectedMT5AccountId, data: { target: newGoal } })).unwrap();
        setIsSetTargetModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to update target:', error);
    }
  };

  const handleHeatmapDateClick = (dateData: {date: string; count: number; totalPnl: number}, tradesForDate: Trade[]) => {
    setSelectedDateData(dateData);
    setSelectedDateTrades(tradesForDate);
    setIsTradingActivityModalOpen(true);
  };



  // Handle Loading state
  if (tradesLoading && trades.length === 0 && !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <AnimatedCard variant="glass" hoverEffect="pulse" className="text-center backdrop-blur-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your trading dashboard...</p>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="space-y-8 relative z-10">
        
        {/* Quick Action Cards */}
        <QuickActionCards />



        {/* AI Analysis Section */}
        <AIInsightsCard />

        {/* Visual Analytics Row (Radar & Gauge) */}
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
                    minEquity={gaugeMin} // Using same range for simplicity unless distinct data exists
                    maxEquity={gaugeMax}
                 />
             </DashboardCard>
          </div>
        )}

        {/* Kill Zone Status Banner */}
        <KillZoneBanner />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          
          {/* Portfolio Balance */}
          <PortfolioBalanceCard
            currentBalance={trueCurrentBalance}
            balancePercentageChange={periodMetrics.balancePercentageChange}
            initialBalance={periodMetrics.initialBalanceForPeriod || 0}
            totalNetPnl={dashboardStats?.totalNetPnl || 0}
            equityCurve={shiftedEquityCurve}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Personal Target */}
          <PersonalTargetCard
            currentAmount={personalTargetCurrent}
            goalAmount={personalTargetGoal}
            progress={personalTargetProgress}
            onUpdateTarget={() => setIsSetTargetModalOpen(true)}
          />

          {/* Total Return */}
          <TotalReturnCard
            stats={dashboardStats}
            roiPercentage={periodMetrics.roiPercentage}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Equity Curve */}
          <EquityCurveCard
            equityCurve={equityCurve}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Win Rate */}
          <WinRateCard
            winRate={dashboardStats?.winRate || 0}
            averageRR={dashboardStats?.averageRR || 0}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Trading Costs */}
          <TradingCostsCard
            totalCommissions={dashboardStats?.totalCommissions || 0}
            closedTrades={dashboardStats?.closedTrades || 0}
            totalNetPnl={dashboardStats?.totalNetPnl || 0}
            avgFeesPerDay={avgFeesPerDay}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Trade Statistics */}
          <TradeStatisticsCard
            closedTrades={dashboardStats?.closedTrades || 0}
            winningTrades={dashboardStats?.winningTrades || 0}
            losingTrades={dashboardStats?.losingTrades || 0}
            breakevenTrades={dashboardStats?.breakevenTrades || 0}
            avgTradesPerDay={avgTradesPerDay}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Top Trades */}
          <DashboardCard title="Top Performing Trades" icon={FaListOl} gridSpan="lg:col-span-3" showInfoIcon>
            <TopTradesByReturn trades={filteredTrades || []} topN={5} />
          </DashboardCard>

          {/* Advanced Performance Chart */}
          <div className="lg:col-span-6">
            <AdvancedPerformanceChart data={chartData} />
          </div>

          {/* Pairs Performance Table */}
          <div className="lg:col-span-6">
            <PairsPerformanceTable data={pairsPerformance} />
          </div>

          {/* Calendar */}
          <DashboardCard title="P&L Calendar" icon={FaCalendarDay} gridSpan="lg:col-span-6" showInfoIcon>
            <DashboardPnlCalendar trades={filteredTrades || []} />
          </DashboardCard>
          
          {/* --- DEEP DIVE ANALYTICS SECTION --- */}
          {analyticsData && (
            <>
              <div className="lg:col-span-6 flex items-center gap-2 mt-4 mb-2">
                 <FaBrain className="text-indigo-500 w-5 h-5" />
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deep Dive Analytics</h2>
              </div>

              {/* Hourly Performance */}
              <DashboardCard title="Performance by Hour" icon={FaClock} gridSpan="lg:col-span-6">
                 <HourlyPerformanceChart data={analyticsData.hourlyPerformance} />
              </DashboardCard>

              {/* Session Breakdown */}
              <DashboardCard title="Session Performance" icon={FaGlobeAmericas} gridSpan="lg:col-span-3">
                 <SessionBreakdownChart data={analyticsData.sessionPerformance} />
              </DashboardCard>

              {/* Holding Time Analysis */}
              <DashboardCard title="Holding Time vs PnL" icon={FaHourglassHalf} gridSpan="lg:col-span-3">
                 <HoldingTimeScatter data={analyticsData.holdingTimeAnalysis} />
              </DashboardCard>
            </>
          )}
          
          {/* Trading Activity Heatmap */}
          <DashboardCard title="Trading Activity Heatmap" icon={FaCalendarAlt} gridSpan="lg:col-span-6">
            <TradesCalendarHeatmap trades={filteredTrades || []} onDateClick={handleHeatmapDateClick} />
          </DashboardCard>
        </div>

        {/* No Trades Message */}
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

        {/* Modals */}
        <SetTargetModal 
          isOpen={isSetTargetModalOpen}
          onClose={() => setIsSetTargetModalOpen(false)}
          currentGoal={personalTargetGoal}
          onSave={handleSaveTarget}
        />
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