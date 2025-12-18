/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectSelectedAccount, selectAvailableAccounts, updateAccountThunk } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId, selectSelectedMT5Account, selectMT5Accounts } from '@/store/features/mt5AccountsSlice';
import Link from 'next/link';
import { calculateDashboardStats, calculateEquityCurveData } from '@/utils/analytics';
import { useTheme } from 'next-themes';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { AnimatedCard, MetricCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton, FloatingActionButton } from '@/components/ui/AnimatedButton';
import { Trade, TradeStatus } from '@/types/trade';
import { format as formatDateFns, subDays, isAfter, parseISO } from 'date-fns';
import { 
    FaDollarSign, FaChartLine as FaReturnIcon, FaPercentage, 
    FaCrosshairs, FaBullseye, FaFileInvoiceDollar, FaTasks, FaInfoCircle, 
    FaDotCircle, FaChartLine, FaPlus, FaBookOpen, FaCalendarAlt, FaListOl,
    FaChartPie, FaExchangeAlt, FaSync, FaCog, FaShareAlt, FaBell, FaCalendarDay,
    FaRocket, FaArrowUp, FaWallet, FaEye
} from 'react-icons/fa';
import { CurrencyAmount } from '@/components/common/CurrencyAmount'; 
import { 
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
    Tooltip, Area, ComposedChart, CartesianGrid, Legend,
    RadialBarChart, RadialBar, PolarAngleAxis 
} from 'recharts'; 
import SetTargetModal from '@/components/dashboard/SetTargetModal';
import TradesCalendarHeatmap from '@/components/dashboard/TradesCalendarHeatmap';
import TradingActivityModal from '@/components/dashboard/TradingActivityModal';
import TopTradesByReturn from '@/components/dashboard/TopPairsTraded';
import DashboardPnlCalendar from '@/components/dashboard/DashboardPnlCalendar';
import KillZonesWidget from '@/components/dashboard/KillZonesWidget';
import PremiumDiscountWidget from '@/components/dashboard/PremiumDiscountWidget';
import PowerOfThreeWidget from '@/components/dashboard/PowerOfThreeWidget';
import React from 'react';

// Define time range options and their corresponding days
const timeRangeDaysMapping: { [key: string]: number } = {
  '7d': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'All': Infinity, // Special case for all trades
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading } = useSelector((state: RootState) => state.trades);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Account data
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  const selectedMT5Account = useSelector(selectSelectedMT5Account);
  const allRegularAccounts = useSelector(selectAvailableAccounts);
  const allMT5Accounts = useSelector(selectMT5Accounts);
  
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('All'); // Default to 'All'
  const [isSetTargetModalOpen, setIsSetTargetModalOpen] = useState(false);
  
  // Trading Activity Modal State
  const [isTradingActivityModalOpen, setIsTradingActivityModalOpen] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{date: string; count: number; totalPnl: number} | null>(null);
  const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[]>([]);

  // Target calculation moved after dashboardStats is computed

  const handleSaveTarget = async (newGoal: number) => {
    if (isAllAccountsSelected) {
      // For "All Accounts", we can either:
      // 1. Set target for all accounts proportionally
      // 2. Show a message that targets should be set individually
      // For now, let's show a message
      alert('When "All Accounts" is selected, please set targets for individual accounts in Settings → Manage Accounts');
      setIsSetTargetModalOpen(false);
      return;
    }

    // Update the selected account's target
    if (selectedAccount) {
      try {
        await dispatch(updateAccountThunk({
          id: selectedAccount.id,
          target: newGoal
        })).unwrap();
        setIsSetTargetModalOpen(false);
      } catch (error) {
        console.error('Failed to update target:', error);
        alert('Failed to update target. Please try again.');
      }
    } else {
      alert('No account selected to update target');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Get the actual selected account ID (could be MT5 or regular account)
      const currentAccountId = selectedAccountId || selectedMT5AccountId;
      console.log('Dashboard fetchTrades - accountId:', currentAccountId, 'authenticated:', isAuthenticated);
      dispatch(fetchTrades({ accountId: currentAccountId || undefined }));
    }
  }, [dispatch, isAuthenticated, selectedAccountId, selectedMT5AccountId]);

  // Debug logging for trades data
  useEffect(() => {
    console.log('Dashboard trades data:', {
      tradesCount: trades?.length || 0,
      trades: trades,
      isLoading: tradesLoading,
      selectedAccountId,
      selectedMT5AccountId
    });
  }, [trades, tradesLoading, selectedAccountId, selectedMT5AccountId]);

  const filteredTrades = useMemo(() => {
    const days = timeRangeDaysMapping[timeRange];
    if (days === Infinity || !trades || trades.length === 0) {
      console.log('Dashboard filteredTrades - using all trades or empty:', { 
        timeRange, 
        days, 
        tradesLength: trades?.length 
      });
      return trades || [];
    }
    const cutOffDate = subDays(new Date(), days);
    const filtered = trades.filter(trade => {
      // Use exitDate for closed trades, entryDate for open/pending trades
      const tradeDateString = trade.status === TradeStatus.CLOSED && trade.exitDate ? trade.exitDate : trade.entryDate;
      if (!tradeDateString) return false; // Should not happen if data is clean
      try {
        const tradeDate = parseISO(tradeDateString); // Ensure date is parsed correctly
        return isAfter(tradeDate, cutOffDate);
      } catch (error) {
        console.error("Error parsing trade date:", tradeDateString, error);
        return false;
      }
    });
    console.log('Dashboard filteredTrades - filtered result:', {
      timeRange,
      originalCount: trades.length,
      filteredCount: filtered.length,
      cutOffDate: cutOffDate.toISOString()
    });
    return filtered;
  }, [trades, timeRange]);

  const dashboardStats = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) {
      const stats = calculateDashboardStats(filteredTrades);
      console.log('Dashboard calculateDashboardStats result:', stats);
      return stats;
    }
    console.log('Dashboard no stats - no trades:', { filteredTradesLength: filteredTrades?.length });
    return null;
  }, [filteredTrades]);

  // Calculate current target and goal based on account selection - now using computed dashboardStats
  const { personalTargetCurrent, personalTargetGoal, isAllAccountsSelected } = useMemo(() => {
    const isAllAccounts = !selectedAccountId && !selectedMT5AccountId;
    
    if (isAllAccounts) {
      // Calculate cumulative target for all accounts
      const regularTargetSum = allRegularAccounts.reduce((sum, acc) => sum + (acc.target || 0), 0);
      const mt5TargetSum = 0; // MT5 accounts don't have targets in this implementation
      const totalTarget = regularTargetSum + mt5TargetSum;
      
      return {
        personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
        personalTargetGoal: totalTarget > 0 ? totalTarget : 1000, // Default if no targets set
        isAllAccountsSelected: true
      };
    } else {
      // Use selected account's target (only regular accounts have targets)
      const targetValue = selectedAccount?.target || 1000; // MT5 accounts don't have target
      return {
        personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
        personalTargetGoal: targetValue,
        isAllAccountsSelected: false
      };
    }
  }, [selectedAccountId, selectedMT5AccountId, selectedAccount, allRegularAccounts, dashboardStats?.totalNetPnl]);

  const equityCurve = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) {
      const curveData = calculateEquityCurveData(filteredTrades);
      if (curveData && Array.isArray(curveData) && curveData.length > 0) {
        return curveData.map(point => ({...point, date: formatDateFns(new Date(point.date), 'MMM dd')}));
      }
    }
    // Default: a single point at today with value 0 if no trades or no curve data
    return [{ date: formatDateFns(new Date(), 'MMM dd'), value: 0 }]; 
  }, [filteredTrades]);

  const periodMetrics = useMemo(() => {
    const initialBalanceForPeriod = equityCurve[0]?.value;
    const currentBalance = dashboardStats?.currentBalance;
    const totalNetPnlForPeriod = dashboardStats?.totalNetPnl;

    let balancePercentageChange = 0;
    if (initialBalanceForPeriod !== undefined && initialBalanceForPeriod !== 0 && currentBalance !== undefined) {
      balancePercentageChange = ((currentBalance - initialBalanceForPeriod) / initialBalanceForPeriod) * 100;
    } else if (currentBalance !== undefined && currentBalance > 0 && initialBalanceForPeriod === 0) {
      balancePercentageChange = Infinity; // Represent as effectively infinite growth from 0
    }

    let roiPercentage = 0;
    if (initialBalanceForPeriod !== undefined && initialBalanceForPeriod !== 0 && totalNetPnlForPeriod !== undefined) {
      roiPercentage = (totalNetPnlForPeriod / initialBalanceForPeriod) * 100;
    } else if (totalNetPnlForPeriod !== undefined && totalNetPnlForPeriod > 0 && initialBalanceForPeriod === 0){
        roiPercentage = Infinity; // Infinite ROI if PNL > 0 and initial was 0
    }

    return {
      balancePercentageChange,
      roiPercentage,
      initialBalanceForPeriod
    };
  }, [equityCurve, dashboardStats]);

  // Handler for heatmap date clicks
  const handleHeatmapDateClick = (dateData: {date: string; count: number; totalPnl: number}, tradesForDate: Trade[]) => {
    setSelectedDateData(dateData);
    setSelectedDateTrades(tradesForDate);
    setIsTradingActivityModalOpen(true);
  };

  const personalTargetProgress = useMemo(() => {
    if (personalTargetGoal === 0) return 0;
    // personalTargetCurrent is now updated by useEffect
    return (personalTargetCurrent / personalTargetGoal) * 100;
  }, [personalTargetCurrent, personalTargetGoal]);

  const averageRRDisplay = dashboardStats?.averageRR?.toFixed(2) || '0.00';

  const winrateChartData = useMemo(() => [
    { name: 'Winrate', value: parseFloat((dashboardStats?.winRate || 0).toFixed(1)), fill: '#10B981' }
  ], [dashboardStats?.winRate]);

  const numberOfTradingDays = useMemo(() => {
    if (!dashboardStats || dashboardStats.closedTrades === 0 || !filteredTrades) return 1;
    const closedTradesWithExitDate = filteredTrades.filter(trade => trade.status === TradeStatus.CLOSED && trade.exitDate);
    if (closedTradesWithExitDate.length === 0) return 1; 
    const uniqueDays = new Set(closedTradesWithExitDate.map(trade => {
        try { return new Date(trade.exitDate!).toDateString(); } catch { return null; }
    }).filter(Boolean));
    return uniqueDays.size > 0 ? uniqueDays.size : 1;
  }, [filteredTrades, dashboardStats]);

  const avgFeesPerDay = (dashboardStats?.totalCommissions && numberOfTradingDays) ? (dashboardStats.totalCommissions / numberOfTradingDays) : 0;
  const avgTradesPerDay = (dashboardStats?.closedTrades && numberOfTradingDays) ? (dashboardStats.closedTrades / numberOfTradingDays) : 0;
  
  const rechartsTextFill = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const rechartsGridStroke = theme === 'dark' ? '#374151' : '#E5E7EB';
  
  const handleOpenSetTargetModal = () => setIsSetTargetModalOpen(true);
  const handleCloseSetTargetModal = () => setIsSetTargetModalOpen(false);

  if (tradesLoading && trades.length === 0 && !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <AnimatedCard variant="glass" hoverEffect="pulse" className="text-center backdrop-blur-xl bg-white/10 dark:bg-black/10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading your trading dashboard...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="space-y-8 relative z-10">
        {/* Welcome Header with Animation */}
        <AnimatedCard 
          variant="glass" 
          hoverEffect="glow" 
          className="text-center space-y-4 bg-white/5 dark:bg-black/5 backdrop-blur-xl border border-gray-200/10 dark:border-emerald-600/10"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'Trader'}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Here&apos;s your trading performance overview. Track your progress and optimize your strategy.
          </p>
        </AnimatedCard>

        {/* Quick Action Cards - Now with stunning animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedCard 
            variant="gradient" 
            hoverEffect="lift" 
            delay={0.1}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white overflow-hidden"
            onClick={() => { window.location.href = '/journal/new'; }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FaPlus className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Quick Action</div>
                  <div className="text-lg font-semibold">Log Trade</div>
                </div>
              </div>
              <p className="text-emerald-100">Record a new trade with all the details</p>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </AnimatedCard>

          <AnimatedCard 
            variant="gradient" 
            hoverEffect="lift" 
            delay={0.2}
            className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white overflow-hidden"
            onClick={() => window.location.href = '/trades'}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FaBookOpen className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">View All</div>
                  <div className="text-lg font-semibold">Journal</div>
                </div>
              </div>
              <p className="text-emerald-100">Review your complete trading journal</p>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </AnimatedCard>

          <AnimatedCard 
            variant="gradient" 
            hoverEffect="lift" 
            delay={0.3}
            className="bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white overflow-hidden"
            onClick={() => window.location.href = '/analytics'}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FaChartLine className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Deep Dive</div>
                  <div className="text-lg font-semibold">Analytics</div>
                </div>
              </div>
              <p className="text-emerald-100">Advanced performance insights</p>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </AnimatedCard>
        </div>

        {/* ICT Widgets Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <KillZonesWidget />
            <PremiumDiscountWidget />
            <PowerOfThreeWidget />
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          
          {/* Balance Card */}
          <DashboardCard 
          title="Portfolio Balance" 
          icon={FaWallet}
          showTimeRangeSelector 
          selectedTimeRange={timeRange} 
          onTimeRangeChange={setTimeRange} 
          gridSpan="sm:col-span-1 lg:col-span-2"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline space-x-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  <CurrencyAmount amount={dashboardStats?.currentBalance || 0} />
                </div>
                <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                  periodMetrics.balancePercentageChange >= 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {periodMetrics.balancePercentageChange === Infinity ? '∞' : (periodMetrics.balancePercentageChange || 0).toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Initial: <CurrencyAmount amount={periodMetrics.initialBalanceForPeriod || 0} className="inline" /> • 
                Net P&L: <CurrencyAmount amount={dashboardStats?.totalNetPnl || 0} className="inline" />
              </p>
              </div>

            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityCurve} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                        <Tooltip
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)'
                    }} 
                    labelStyle={{color: rechartsTextFill, fontWeight: 'bold'}}
                    itemStyle={{color: '#10B981'}}
                    formatter={(value: number, name: string) => [`$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, name]}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={false} />
                  <Area type="monotone" dataKey="value" stroke="none" fillOpacity={1} fill="url(#balanceGradient)" />
                    </LineChart>
                    </ResponsiveContainer>
            </div>
          </div>
        </DashboardCard>

        {/* Personal Target Card */}
        <DashboardCard 
          title="Personal Target" 
          icon={FaBullseye}
          showInfoIcon={true} 
          gridSpan="sm:col-span-1 lg:col-span-2"
        >
          <div className="space-y-4">
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                <CurrencyAmount amount={personalTargetCurrent} />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / <CurrencyAmount amount={personalTargetGoal} className="inline" />
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-gradient-to-r from-emerald-100 to-emerald-200 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(personalTargetProgress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>-$1,000</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {personalTargetProgress.toFixed(1)}%
                </span>
                <span>+$1,000</span>
              </div>
            </div>
            
            <AnimatedButton 
              onClick={handleOpenSetTargetModal}
              variant="gradient"
              size="lg"
              fullWidth
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              ripple
              glow
            >
              Update Target
            </AnimatedButton>
          </div>
        </DashboardCard>
        
        {/* Return Card */}
        <DashboardCard 
          title="Total Return" 
          icon={FaArrowUp}
          showInfoIcon 
          showTimeRangeSelector 
          selectedTimeRange={timeRange} 
          onTimeRangeChange={setTimeRange}
          gridSpan="sm:col-span-1 lg:col-span-2" 
        >
          <div className="space-y-4">
            <div className="flex items-baseline space-x-3">
              <div className={`text-3xl font-bold ${
                (dashboardStats?.totalNetPnl || 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(dashboardStats?.totalNetPnl || 0) >= 0 ? '+' : ''}<CurrencyAmount amount={dashboardStats?.totalNetPnl || 0} className="inline" />
              </div>
              <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                periodMetrics.roiPercentage >= 0 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {periodMetrics.roiPercentage === Infinity ? '∞' : (periodMetrics.roiPercentage || 0).toFixed(2)}%
              </span>
            </div>
            
            <div className="space-y-3">
              {[ 
                { label: 'Average Win', value: dashboardStats?.averageWin, isPositive: true },
                { label: 'Average Loss', value: dashboardStats?.averageLoss, isPositive: false },
                { label: 'Largest Win', value: dashboardStats?.largestWin, isPositive: true },
                { label: 'Largest Loss', value: dashboardStats?.largestLoss, isPositive: false },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className={`text-sm font-semibold ${
                    item.isPositive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {item.value !== undefined && item.value !== null ? 
                      <>{item.isPositive && item.value > 0 ? '+' : ''}<CurrencyAmount amount={Math.abs(item.value)} className="inline" /></> : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center">
                <FaInfoCircle className="mr-2 flex-shrink-0" />
                Profit factor: {dashboardStats?.profitFactor?.toFixed(2) || 'N/A'}
                {dashboardStats?.profitFactor && (
                  <span className="ml-1">
                    {dashboardStats.profitFactor >= 1 
                      ? ` • You earn $${dashboardStats.profitFactor.toFixed(2)} per $1 lost` 
                      : ` • You lose $${(1/dashboardStats.profitFactor).toFixed(2)} per $1 earned`}
                  </span>
                )}
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Account Balance Chart */}
        <DashboardCard 
          title="Equity Curve" 
          icon={FaChartLine}
          showInfoIcon  
          showTimeRangeSelector
          selectedTimeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          gridSpan="sm:col-span-2 lg:col-span-3"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={equityCurve} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="accountBalanceFillChart" x1="0" y1="0" x2="0" y2="1"> 
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/> 
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={rechartsGridStroke} strokeDasharray="3 3" vertical={false}/>
                <XAxis 
                  dataKey="date" 
                  stroke={rechartsTextFill} 
                  tick={{fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke={rechartsTextFill} 
                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} 
                  tick={{fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }} 
                  labelStyle={{color: rechartsTextFill, fontWeight: 'bold'}}
                  itemStyle={{color: '#3B82F6'}}
                  formatter={(value: number, name: string) => [`$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, name]} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  fill="url(#accountBalanceFillChart)" 
                  strokeWidth={3} 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#3B82F6', fill: '#3B82F6' }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      
        {/* Winrate Card */}
        <DashboardCard 
          title="Win Rate Analysis" 
          icon={FaPercentage}
          showInfoIcon  
          showTimeRangeSelector
          selectedTimeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          gridSpan="sm:col-span-2 lg:col-span-3"
        >
          <div className="flex flex-col items-center justify-center space-y-6 h-full">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="95%"
                  outerRadius="130%"
                  barSize={16}
                  data={winrateChartData} 
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar 
                    dataKey='value' 
                    cornerRadius={8}
                    angleAxisId={0}
                    fill="url(#winrateGradient)"
                  />
                  <defs>
                    <linearGradient id="winrateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {(dashboardStats?.winRate || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Win Rate
                </div>
              </div>
              </div>

            <div className="w-full max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk-Reward Ratio</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{averageRRDisplay}</span>
              </div>
              <div className="relative h-3 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(( (dashboardStats?.averageRR || 0) / 5) * 100, 100)}%`}}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0</span>
                <span>2.5</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Commission and Fees */}
        <DashboardCard 
          title="Trading Costs" 
          icon={FaFileInvoiceDollar}
          gridSpan="sm:col-span-1 lg:col-span-3" 
          showTimeRangeSelector 
          selectedTimeRange={timeRange} 
          onTimeRangeChange={setTimeRange} 
          showInfoIcon
        >
          <div className="space-y-4">
            {[
              { label: 'Total Commissions', value: dashboardStats?.totalCommissions || 0, color: 'text-gray-900 dark:text-white', isRatio: false },
              { label: 'Avg Fees per Trade', value: (dashboardStats?.totalCommissions && dashboardStats?.closedTrades ? dashboardStats.totalCommissions / dashboardStats.closedTrades : 0), color: 'text-gray-900 dark:text-white', isRatio: false },
              { label: 'P&L to Fees Ratio', value: (dashboardStats?.totalNetPnl && dashboardStats?.totalCommissions && dashboardStats.totalCommissions !== 0 ? (dashboardStats.totalNetPnl / dashboardStats.totalCommissions) : 0), color: (dashboardStats?.totalNetPnl && dashboardStats?.totalCommissions && (dashboardStats.totalNetPnl / dashboardStats.totalCommissions) < 1 && dashboardStats.totalCommissions !==0) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400', isRatio: true },
              { label: 'Avg Fees per Day', value: avgFeesPerDay, color: 'text-gray-900 dark:text-white', isRatio: false },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>
                  {item.isRatio ? (typeof item.value === 'number' ? item.value.toFixed(2) : '0.00') : <CurrencyAmount amount={item.value} className="inline" />}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Trade Performance */}
        <DashboardCard 
          title="Trade Statistics" 
          icon={FaTasks}
          gridSpan="sm:col-span-1 lg:col-span-3" 
          showTimeRangeSelector 
          selectedTimeRange={timeRange} 
          onTimeRangeChange={setTimeRange} 
          showInfoIcon
        >
          <div className="space-y-4">
            {[
              { label: 'Total Trades', value: dashboardStats?.closedTrades || 0, color: 'text-gray-900 dark:text-white' },
              { label: 'Winning Trades', value: dashboardStats?.winningTrades || 0, color: 'text-green-600 dark:text-green-400' },
              { label: 'Losing Trades', value: dashboardStats?.losingTrades || 0, color: 'text-red-600 dark:text-red-400' },
              { label: 'Breakeven Trades', value: dashboardStats?.breakevenTrades || 0, color: 'text-gray-900 dark:text-white' },
              { label: 'Avg Trades per Day', value: (avgTradesPerDay || 0).toFixed(2), color: 'text-gray-900 dark:text-white' },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Top Trades */}
        <DashboardCard
          title="Top Performing Trades"
          icon={FaListOl}
          gridSpan="lg:col-span-3"
          showTimeRangeSelector={true}
          selectedTimeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          showInfoIcon={true}
        >
          <TopTradesByReturn trades={filteredTrades || []} topN={5} />
        </DashboardCard>

        {/* Calendar */}
        <DashboardCard
          title="P&L Calendar"
          icon={FaCalendarDay}
          gridSpan="lg:col-span-3"
          showTimeRangeSelector={false}
          showInfoIcon={true}
        >
          <DashboardPnlCalendar trades={filteredTrades || []} />
        </DashboardCard>
        
        {/* Trading Activity Heatmap */}
        <DashboardCard
          title="Trading Activity Heatmap"
          icon={FaCalendarAlt}
          gridSpan="lg:col-span-6"
          showTimeRangeSelector={true}
          selectedTimeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        >
          <TradesCalendarHeatmap 
            trades={filteredTrades || []} 
            onDateClick={handleHeatmapDateClick}
          />
        </DashboardCard>
      </div>

      {/* No Trades Message */}
      {(!filteredTrades || filteredTrades.length === 0) && !tradesLoading && (
        <div className="text-center py-16 bg-gradient-to-br from-emerald-50/80 to-white/80 dark:from-emerald-950/20 dark:to-black/80 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-lg">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <FaChartLine className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              No trades recorded yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start your trading journey by logging your first trade or adjust the time range to view historical data.
            </p>
            <AnimatedButton 
              onClick={() => { window.location.href = '/journal/new'; }}
              variant="gradient"
              size="lg"
              icon={<FaPlus className="w-4 h-4" />}
              iconPosition="left"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              ripple
              glow
            >
              Log Your First Trade
            </AnimatedButton>
          </div>
        </div>
      )}

        {/* Set Target Modal */}
        <SetTargetModal 
          isOpen={isSetTargetModalOpen}
          onClose={handleCloseSetTargetModal}
          currentGoal={personalTargetGoal}
          onSave={handleSaveTarget}
        />

        {/* Trading Activity Modal */}
        <TradingActivityModal
          isOpen={isTradingActivityModalOpen}
          onClose={() => setIsTradingActivityModalOpen(false)}
          selectedDate={selectedDateData}
          tradesForDate={selectedDateTrades}
        />

        {/* Floating Action Button for Quick Trade Entry */}
        <FloatingActionButton
              onClick={() => { window.location.href = '/journal/new'; }}
          icon={<FaPlus className="w-6 h-6" />}
          tooltip="Log New Trade"
          position="bottom-right"
        />
      </div>
    </div>
  );
}