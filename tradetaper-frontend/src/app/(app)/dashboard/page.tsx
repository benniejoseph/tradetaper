/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import {
  selectSelectedAccountId,
  selectSelectedAccount,
  selectAvailableAccounts,
  updateAccountThunk,
} from '@/store/features/accountSlice';
import {
  selectMT5Accounts,
  selectSelectedMT5AccountId,
  updateMT5Account,
} from '@/store/features/mt5AccountsSlice';
import { calculateDashboardStats, calculateEquityCurveData } from '@/utils/analytics';
import { Trade, TradeStatus } from '@/types/trade';
import { format as formatDateFns, subDays, isAfter, parseISO } from 'date-fns';
import { FaChartLine, FaPlus } from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';

import QuickActionCards from '@/components/dashboard/QuickActionCards';
import PortfolioBalanceCard from '@/components/dashboard/PortfolioBalanceCard';
import PersonalTargetCard from '@/components/dashboard/PersonalTargetCard';
import TotalReturnCard from '@/components/dashboard/TotalReturnCard';
import SetTargetModal from '@/components/dashboard/SetTargetModal';
import SessionDetailsWidget from '@/components/dashboard/SessionDetailsWidget';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
import DetailedPnlCalendar from '@/components/dashboard/DetailedPnlCalendar';
import PerformanceRadarCard from '@/components/dashboard/PerformanceRadarCard';
import TradeWinExpectancyBlock from '@/components/dashboard/TradeWinExpectancyBlock';
import { FeatureGate } from '@/components/common/FeatureGate';
import AlertModal from '@/components/ui/AlertModal';

const timeRangeDaysMapping: { [key: string]: number } = {
  '7d': 7, '1M': 30, '3M': 90, '1Y': 365, 'All': Infinity,
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading, lastFetchKey, lastFetchAt, lastFetchIncludeTags } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  const allRegularAccounts = useSelector(selectAvailableAccounts);
  const allMT5Accounts = useSelector(selectMT5Accounts);

  const [timeRange, setTimeRange] = useState('All');
  const [isSetTargetModalOpen, setIsSetTargetModalOpen] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, title: 'Notice', message: '' });
  const closeAlert = () => setAlertState((prev) => ({ ...prev, isOpen: false }));
  const showAlert = (message: string, title = 'Notice') =>
    setAlertState({ isOpen: true, title, message });

  useEffect(() => {
    if (isAuthenticated) {
      const currentAccountId = selectedAccountId || selectedMT5AccountId;
      dispatch(fetchTrades({ accountId: currentAccountId || undefined, limit: 500, includeTags: false }));
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

  const dashboardStats = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) return calculateDashboardStats(filteredTrades);
    return null;
  }, [filteredTrades]);

  const { personalTargetCurrent, isAllAccountsSelected } = useMemo(() => {
    const isAllAccounts = !selectedAccountId && !selectedMT5AccountId;
    if (isAllAccounts) {
      const regularTargetSum = allRegularAccounts.reduce((sum: number, acc: any) => sum + (acc.target || 0), 0);
      return {
        personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
        isAllAccountsSelected: true,
      };
    }
    return {
      personalTargetCurrent: dashboardStats?.totalNetPnl || 0,
      isAllAccountsSelected: false,
    };
  }, [selectedAccountId, selectedMT5AccountId, dashboardStats?.totalNetPnl, allRegularAccounts]);

  const personalTargetGoal = useMemo(() => {
    if (selectedAccountId && selectedAccount) {
      return (selectedAccount as any).target || 1000;
    }
    if (selectedMT5AccountId) {
      const mt5Acc = allMT5Accounts.find(a => a.id === selectedMT5AccountId);
      return mt5Acc?.target || 1000;
    }
    return 1000;
  }, [selectedAccountId, selectedAccount, selectedMT5AccountId, allMT5Accounts]);

  const equityCurve = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) {
      const curveData = calculateEquityCurveData(filteredTrades);
      if (curveData && Array.isArray(curveData) && curveData.length > 0) {
        return curveData.map(point => ({ ...point, date: formatDateFns(new Date(point.date), 'MMM dd') }));
      }
    }
    return [{ date: formatDateFns(new Date(), 'MMM dd'), value: 0 }];
  }, [filteredTrades]);

  const trueCurrentBalance = useMemo(() => {
    const getManualBalance = (acc: any) => {
      const accTrades = trades?.filter(t => t.accountId === acc.id) || [];
      const accPnl = accTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
      return (Number(acc.balance) || 0) + accPnl;
    };

    const getMT5Balance = (acc: any) => {
      return Number(acc.balance) || 0;
    };

    if (selectedAccountId) {
      if (!selectedAccount) return 0;
      return getManualBalance(selectedAccount);
    }

    if (selectedMT5AccountId) {
      const mt5Acc = allMT5Accounts.find(a => a.id === selectedMT5AccountId);
      if (!mt5Acc) return 0;
      return getMT5Balance(mt5Acc);
    }

    let total = 0;
    allRegularAccounts.forEach(acc => {
      total += getManualBalance(acc);
    });

    allMT5Accounts.forEach(acc => {
      total += getMT5Balance(acc);
    });

    return total;
  }, [selectedAccountId, selectedMT5AccountId, selectedAccount, allMT5Accounts, allRegularAccounts, trades]);

  const shiftedEquityCurve = useMemo(() => {
    if (!equityCurve || equityCurve.length === 0) return [];
    const lastPnl = equityCurve[equityCurve.length - 1]?.value || 0;
    const offset = trueCurrentBalance - lastPnl;

    return equityCurve.map(point => ({
      ...point,
      value: point.value + offset,
    }));
  }, [equityCurve, trueCurrentBalance]);

  const periodMetrics = useMemo(() => {
    const totalNetPnlForPeriod = dashboardStats?.totalNetPnl || 0;
    const initialBalanceForPeriod = shiftedEquityCurve[0]?.value || 0;
    const currentBalance = trueCurrentBalance;

    let balancePercentageChange = 0;
    if (initialBalanceForPeriod && currentBalance) {
      balancePercentageChange = ((currentBalance - initialBalanceForPeriod) / initialBalanceForPeriod) * 100;
    }
    let roiPercentage = 0;
    if (initialBalanceForPeriod && totalNetPnlForPeriod) {
      roiPercentage = (totalNetPnlForPeriod / initialBalanceForPeriod) * 100;
    }
    return { balancePercentageChange, roiPercentage, initialBalanceForPeriod };
  }, [shiftedEquityCurve, trueCurrentBalance, dashboardStats]);

  const personalTargetProgress = useMemo(() => {
    if (personalTargetGoal === 0) return 0;
    return (personalTargetCurrent / personalTargetGoal) * 100;
  }, [personalTargetCurrent, personalTargetGoal]);

  const handleSaveTarget = async (newGoal: number) => {
    if (isAllAccountsSelected) {
      showAlert('When "All Accounts" is selected, please set targets for individual accounts.', 'Set Target');
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

  console.log('🔄 Dashboard Render State:', {
    isAuthenticated,
    selectedAccountId,
    selectedMT5AccountId,
    tradesLength: trades?.length,
    tradesLoading,
    lastFetchKey,
    lastFetchAt,
    timeRange
  });

  if (tradesLoading && trades?.length === 0) {
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
      <div className="space-y-4 relative z-10">
        <QuickActionCards />

        <FeatureGate feature="aiAnalysis" blur={true} className="col-span-1 sm:col-span-2 lg:col-span-6">
          <AIInsightsCard />
        </FeatureGate>

        <SessionDetailsWidget />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <PortfolioBalanceCard
            currentBalance={trueCurrentBalance}
            balancePercentageChange={periodMetrics.balancePercentageChange}
            initialBalance={periodMetrics.initialBalanceForPeriod || 0}
            totalNetPnl={dashboardStats?.totalNetPnl || 0}
            equityCurve={shiftedEquityCurve}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <PersonalTargetCard
            currentAmount={personalTargetCurrent}
            goalAmount={personalTargetGoal}
            progress={personalTargetProgress}
            onUpdateTarget={() => setIsSetTargetModalOpen(true)}
          />

          <TotalReturnCard
            stats={dashboardStats}
            roiPercentage={periodMetrics.roiPercentage}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <TradeWinExpectancyBlock stats={dashboardStats} />
          <PerformanceRadarCard stats={dashboardStats} />
        </div>

        <DetailedPnlCalendar trades={filteredTrades || []} />

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

        <SetTargetModal
          isOpen={isSetTargetModalOpen}
          onClose={() => setIsSetTargetModalOpen(false)}
          currentGoal={personalTargetGoal}
          onSave={handleSaveTarget}
        />
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={closeAlert}
          title={alertState.title}
          message={alertState.message}
        />
      </div>
    </div>
  );
}
