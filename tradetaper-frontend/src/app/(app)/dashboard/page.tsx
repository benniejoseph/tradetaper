/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectSelectedAccount, selectAvailableAccounts, updateAccountThunk } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId, selectMT5Accounts } from '@/store/features/mt5AccountsSlice';
import { calculateDashboardStats, calculateEquityCurveData } from '@/utils/analytics';
import { Trade, TradeStatus } from '@/types/trade';
import { format as formatDateFns, subDays, isAfter, parseISO } from 'date-fns';
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

// Time range mapping
const timeRangeDaysMapping: { [key: string]: number } = {
  '7d': 7, '1M': 30, '3M': 90, '1Y': 365, 'All': Infinity,
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Account data
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  const allRegularAccounts = useSelector(selectAvailableAccounts);
  
  // State
  const [timeRange, setTimeRange] = useState('All');
  const [isSetTargetModalOpen, setIsSetTargetModalOpen] = useState(false);
  const [isTradingActivityModalOpen, setIsTradingActivityModalOpen] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{date: string; count: number; totalPnl: number} | null>(null);
  const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[]>([]);

  // Fetch trades
  useEffect(() => {
    if (isAuthenticated) {
      const currentAccountId = selectedAccountId || selectedMT5AccountId;
      dispatch(fetchTrades({ accountId: currentAccountId || undefined }));
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

  // Stats
  const dashboardStats = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) return calculateDashboardStats(filteredTrades);
    return null;
  }, [filteredTrades]);

  // Target calculations
  const { personalTargetCurrent, personalTargetGoal, isAllAccountsSelected } = useMemo(() => {
    const isAllAccounts = !selectedAccountId && !selectedMT5AccountId;
    if (isAllAccounts) {
      const regularTargetSum = allRegularAccounts.reduce((sum: number, acc: any) => sum + (acc.target || 0), 0);
      return {
        personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
        personalTargetGoal: regularTargetSum > 0 ? regularTargetSum : 1000,
        isAllAccountsSelected: true
      };
    }
    return {
      personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
      personalTargetGoal: (selectedAccount as any)?.target || 1000,
      isAllAccountsSelected: false
    };
  }, [selectedAccountId, selectedMT5AccountId, selectedAccount, allRegularAccounts, dashboardStats?.totalNetPnl]);

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

  // Period metrics
  const periodMetrics = useMemo(() => {
    const initialBalanceForPeriod = equityCurve[0]?.value;
    const currentBalance = dashboardStats?.currentBalance;
    const totalNetPnlForPeriod = dashboardStats?.totalNetPnl;
    let balancePercentageChange = 0;
    if (initialBalanceForPeriod && currentBalance) {
      balancePercentageChange = ((currentBalance - initialBalanceForPeriod) / initialBalanceForPeriod) * 100;
    }
    let roiPercentage = 0;
    if (initialBalanceForPeriod && totalNetPnlForPeriod) {
      roiPercentage = (totalNetPnlForPeriod / initialBalanceForPeriod) * 100;
    }
    return { balancePercentageChange, roiPercentage, initialBalanceForPeriod };
  }, [equityCurve, dashboardStats]);

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

  // Handlers
  const handleSaveTarget = async (newGoal: number) => {
    if (isAllAccountsSelected) {
      alert('When "All Accounts" is selected, please set targets for individual accounts.');
      setIsSetTargetModalOpen(false);
      return;
    }
    if (selectedAccount) {
      try {
        await dispatch(updateAccountThunk({ id: (selectedAccount as any).id, target: newGoal })).unwrap();
        setIsSetTargetModalOpen(false);
      } catch (error) {
        console.error('Failed to update target:', error);
      }
    }
  };

  const handleHeatmapDateClick = (dateData: {date: string; count: number; totalPnl: number}, tradesForDate: Trade[]) => {
    setSelectedDateData(dateData);
    setSelectedDateTrades(tradesForDate);
    setIsTradingActivityModalOpen(true);
  };

  // Loading state
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

        {/* Kill Zone Status Banner */}
        <KillZoneBanner />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          
          {/* Portfolio Balance */}
          <PortfolioBalanceCard
            currentBalance={dashboardStats?.currentBalance || 0}
            balancePercentageChange={periodMetrics.balancePercentageChange}
            initialBalance={periodMetrics.initialBalanceForPeriod || 0}
            totalNetPnl={dashboardStats?.totalNetPnl || 0}
            equityCurve={equityCurve}
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

          {/* Calendar */}
          <DashboardCard title="P&L Calendar" icon={FaCalendarDay} gridSpan="lg:col-span-3" showInfoIcon>
            <DashboardPnlCalendar trades={filteredTrades || []} />
          </DashboardCard>
          
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