"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import {
  Account,
  selectSelectedAccountId,
  selectSelectedAccount,
  selectAvailableAccounts,
  updateAccountThunk,
} from '@/store/features/accountSlice';
import {
  MT5Account,
  selectMT5Accounts,
  selectSelectedMT5AccountId,
  updateMT5Account,
} from '@/store/features/mt5AccountsSlice';
import { calculateDashboardStats, calculateEquityCurveData } from '@/utils/analytics';
import { TradeStatus } from '@/types/trade';
import { format as formatDateFns, subDays, isAfter, parseISO } from 'date-fns';
import { FaChartLine, FaPlus, FaRedo } from 'react-icons/fa';
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
import { authApiClient } from '@/services/api';
import { useRouter } from 'next/navigation';

const timeRangeDaysMapping: { [key: string]: number } = {
  '7d': 7, '1M': 30, '3M': 90, '1Y': 365, 'All': Infinity,
};

interface PerformanceSummary {
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  winRate?: number;
  totalPnL?: number;
  totalCommissions?: number;
  netPnL?: number;
  averageWin?: number;
  averageLoss?: number;
  profitFactor?: number;
  largestWin?: number;
  largestLoss?: number;
  averageRMultiple?: number;
  expectancy?: number;
  maxDrawdown?: number;
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    trades,
    isLoading: tradesLoading,
    error: tradesError,
    lastFetchIncludeTags,
    page: tradesPage,
    limit: tradesLimit,
  } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const selectedAccount = useSelector(selectSelectedAccount);
  const allRegularAccounts = useSelector(selectAvailableAccounts);
  const allMT5Accounts = useSelector(selectMT5Accounts);

  const [timeRange, setTimeRange] = useState('All');
  const [isSetTargetModalOpen, setIsSetTargetModalOpen] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, title: 'Notice', message: '' });
  const [periodSummary, setPeriodSummary] = useState<PerformanceSummary | null>(null);
  const [lifetimeSummary, setLifetimeSummary] = useState<PerformanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const closeAlert = () => setAlertState((prev) => ({ ...prev, isOpen: false }));
  const showAlert = (message: string, title = 'Notice') =>
    setAlertState({ isOpen: true, title, message });

  const currentAccountId = selectedAccountId || selectedMT5AccountId;

  const selectedMT5Account = useMemo(
    () => allMT5Accounts.find((account) => account.id === selectedMT5AccountId) || null,
    [allMT5Accounts, selectedMT5AccountId],
  );

  const rangeParams = useMemo(() => {
    const days = timeRangeDaysMapping[timeRange];
    if (days === Infinity) {
      return { from: undefined as string | undefined, to: undefined as string | undefined };
    }
    const to = new Date();
    const from = subDays(to, days);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [timeRange]);

  const fetchDashboardSummaries = useCallback(async () => {
    if (!isAuthenticated) return;

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const periodParams: Record<string, string> = {};
      const lifetimeParams: Record<string, string> = {};
      const requestNonce = Date.now().toString();

      if (currentAccountId) {
        periodParams.accountId = currentAccountId;
        lifetimeParams.accountId = currentAccountId;
      }
      if (rangeParams.from) periodParams.from = rangeParams.from;
      if (rangeParams.to) periodParams.to = rangeParams.to;
      const hasPeriodRange = Boolean(rangeParams.from || rangeParams.to);

      if (!hasPeriodRange) {
        const lifetimeResponse = await authApiClient.get<PerformanceSummary>(
          '/trades/summary',
          { params: { ...lifetimeParams, _ts: requestNonce } },
        );
        const summary = lifetimeResponse.data || null;
        setPeriodSummary(summary);
        setLifetimeSummary(summary);
      } else {
        const [periodResponse, lifetimeResponse] = await Promise.all([
          authApiClient.get<PerformanceSummary>('/trades/summary', {
            params: { ...periodParams, _ts: requestNonce },
          }),
          authApiClient.get<PerformanceSummary>('/trades/summary', {
            params: { ...lifetimeParams, _ts: `${requestNonce}-lifetime` },
          }),
        ]);

        setPeriodSummary(periodResponse.data || null);
        setLifetimeSummary(lifetimeResponse.data || null);
      }
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
            (error as { message?: string }).message ||
            'Failed to load dashboard summary'
          : 'Failed to load dashboard summary';
      setSummaryError(String(message));
    } finally {
      setSummaryLoading(false);
    }
  }, [isAuthenticated, currentAccountId, rangeParams.from, rangeParams.to]);

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(
      fetchTrades({
        accountId: currentAccountId || undefined,
        page: 1,
        limit: 1000,
        includeTags: false,
      }),
    );
  }, [dispatch, isAuthenticated, currentAccountId]);

  useEffect(() => {
    void fetchDashboardSummaries();
  }, [fetchDashboardSummaries]);

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

  const accountScopedTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    if (!currentAccountId) return trades;
    return trades.filter((trade) => trade.accountId === currentAccountId);
  }, [trades, currentAccountId]);

  const lifetimePnlFromTrades = useMemo(() => {
    return accountScopedTrades.reduce((sum, trade) => {
      if (trade.status !== TradeStatus.CLOSED) return sum;
      return sum + toNumber(trade.profitOrLoss);
    }, 0);
  }, [accountScopedTrades]);

  const baselineForDrawdown = useMemo(() => {
    if (selectedAccountId && selectedAccount) {
      return Math.max(toNumber(selectedAccount.balance), 1);
    }
    if (selectedMT5AccountId && selectedMT5Account) {
      return Math.max(toNumber(selectedMT5Account.balance), 1);
    }
    const allRegularStarting = allRegularAccounts.reduce(
      (sum: number, account) => sum + toNumber(account.balance),
      0,
    );
    const allMt5Current = allMT5Accounts.reduce(
      (sum, account) => sum + toNumber(account.balance),
      0,
    );
    return Math.max(allRegularStarting + allMt5Current, 1);
  }, [selectedAccountId, selectedAccount, selectedMT5AccountId, selectedMT5Account, allRegularAccounts, allMT5Accounts]);

  const calculatedStats = useMemo(
    () =>
      filteredTrades && filteredTrades.length > 0
        ? calculateDashboardStats(filteredTrades)
        : null,
    [filteredTrades],
  );

  const dashboardStats = useMemo(() => {
    if (!periodSummary) return calculatedStats;

    const readSummary = (value: unknown): number | undefined => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const withFallback = (summaryValue: unknown, fallbackValue = 0): number => {
      const summaryNum = readSummary(summaryValue);
      return summaryNum !== undefined ? summaryNum : fallbackValue;
    };

    const totalTrades = withFallback(periodSummary.totalTrades, calculatedStats?.totalTrades || 0);
    const winningTrades = withFallback(periodSummary.winningTrades, calculatedStats?.winningTrades || 0);
    const losingTrades = withFallback(periodSummary.losingTrades, calculatedStats?.losingTrades || 0);
    const breakevenTrades = Math.max(
      totalTrades - winningTrades - losingTrades,
      calculatedStats?.breakevenTrades || 0,
      0,
    );
    const maxDrawdownAbsolute = withFallback(
      periodSummary.maxDrawdown,
      calculatedStats?.maxDrawdown || 0,
    );
    const maxDrawdownPercent = baselineForDrawdown > 0
      ? (maxDrawdownAbsolute / baselineForDrawdown) * 100
      : 0;

    const netPnlSummary = readSummary(periodSummary.netPnL);
    const grossPnlSummary = readSummary(periodSummary.totalPnL);
    const resolvedTotalNetPnl = Number.isFinite(netPnlSummary)
      ? (netPnlSummary as number)
      : Number.isFinite(grossPnlSummary)
        ? (grossPnlSummary as number)
        : (calculatedStats?.totalNetPnl || 0);

    const resolvedAverageWin = withFallback(
      periodSummary.averageWin,
      calculatedStats?.averageWin || 0,
    );
    const resolvedAverageLossAbs = Math.abs(
      withFallback(periodSummary.averageLoss, Math.abs(calculatedStats?.averageLoss || 0)),
    );

    return {
      totalTrades,
      openTrades: calculatedStats?.openTrades || 0,
      closedTrades: totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      totalNetPnl: resolvedTotalNetPnl,
      totalCommissions: withFallback(periodSummary.totalCommissions, calculatedStats?.totalCommissions || 0),
      winRate:
        withFallback(
          periodSummary.winRate,
          totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
        ),
      lossRate: totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0,
      averageWin: resolvedAverageWin,
      averageLoss: losingTrades > 0 ? -resolvedAverageLossAbs : 0,
      profitFactor: withFallback(periodSummary.profitFactor, calculatedStats?.profitFactor || 0),
      expectancy: withFallback(periodSummary.expectancy, calculatedStats?.expectancy || 0),
      maxDrawdown: maxDrawdownPercent,
      currentBalance: 0,
      averageRR: withFallback(periodSummary.averageRMultiple, calculatedStats?.averageRR || 0),
      largestWin: withFallback(periodSummary.largestWin, calculatedStats?.largestWin || 0),
      largestLoss: withFallback(periodSummary.largestLoss, calculatedStats?.largestLoss || 0),
    };
  }, [periodSummary, calculatedStats, baselineForDrawdown]);

  const { personalTargetCurrent, isAllAccountsSelected } = useMemo(() => {
    const isAllAccounts = !selectedAccountId && !selectedMT5AccountId;
    const lifetimePnlCandidate = toNumber(lifetimeSummary?.totalPnL, Number.NaN);
    const currentForTarget = Number.isFinite(lifetimePnlCandidate)
      ? lifetimePnlCandidate
      : lifetimePnlFromTrades;
    return {
      personalTargetCurrent: currentForTarget,
      isAllAccountsSelected: isAllAccounts,
    };
  }, [selectedAccountId, selectedMT5AccountId, lifetimeSummary?.totalPnL, lifetimePnlFromTrades]);

  const personalTargetGoal = useMemo(() => {
    if (selectedAccountId && selectedAccount) {
      return selectedAccount.target || 1000;
    }
    if (selectedMT5AccountId) {
      const mt5Acc = allMT5Accounts.find(a => a.id === selectedMT5AccountId);
      return mt5Acc?.target || 1000;
    }
    const totalGoal = [
      ...allRegularAccounts.map((account) => toNumber(account.target)),
      ...allMT5Accounts.map((account) => toNumber(account.target)),
    ].reduce((sum, value) => sum + value, 0);
    return totalGoal > 0 ? totalGoal : 1000;
  }, [selectedAccountId, selectedAccount, selectedMT5AccountId, allRegularAccounts, allMT5Accounts]);

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
    const getManualBalance = (
      acc: Pick<Account, 'id' | 'balance'>,
      realizedPnlOverride?: number,
    ) => {
      if (Number.isFinite(realizedPnlOverride)) {
        return toNumber(acc.balance) + toNumber(realizedPnlOverride);
      }
      const accTrades = trades?.filter(t => t.accountId === acc.id) || [];
      const accPnl = accTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
      return (Number(acc.balance) || 0) + accPnl;
    };

    const getMT5Balance = (acc: Pick<MT5Account, 'balance'>) => {
      return Number(acc.balance) || 0;
    };

    if (selectedAccountId) {
      if (!selectedAccount) return 0;
      return getManualBalance(selectedAccount, toNumber(lifetimeSummary?.totalPnL, NaN));
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
  }, [selectedAccountId, selectedMT5AccountId, selectedAccount, allMT5Accounts, allRegularAccounts, trades, lifetimeSummary?.totalPnL]);

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
    const totalNetPnlForPeriod =
      (calculatedStats?.totalNetPnl ?? dashboardStats?.totalNetPnl) || 0;
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
  }, [shiftedEquityCurve, trueCurrentBalance, dashboardStats, calculatedStats?.totalNetPnl]);

  const totalReturnStats = useMemo(() => {
    if (!dashboardStats && !calculatedStats) return null;
    if (!dashboardStats) return calculatedStats;
    if (!calculatedStats) return dashboardStats;

    return {
      ...dashboardStats,
      totalNetPnl: calculatedStats.totalNetPnl,
      averageWin: calculatedStats.averageWin,
      averageLoss: calculatedStats.averageLoss,
      largestWin: calculatedStats.largestWin,
      largestLoss: calculatedStats.largestLoss,
      profitFactor: calculatedStats.profitFactor,
    };
  }, [dashboardStats, calculatedStats]);

  const personalTargetProgress = useMemo(() => {
    if (personalTargetGoal === 0) return 0;
    return (personalTargetCurrent / personalTargetGoal) * 100;
  }, [personalTargetCurrent, personalTargetGoal]);

  const handleSaveTarget = async (newGoal: number) => {
    if (isAllAccountsSelected) {
      showAlert('When "All Accounts" is selected, please set targets for individual accounts.', 'Set Target');
      setIsSetTargetModalOpen(false);
      throw new Error('Please select a specific account to update target.');
    }

    try {
      if (selectedAccountId && selectedAccount) {
        await dispatch(updateAccountThunk({ id: selectedAccount.id, target: newGoal })).unwrap();
      } else if (selectedMT5AccountId) {
        await dispatch(updateMT5Account({ id: selectedMT5AccountId, data: { target: newGoal } })).unwrap();
      } else {
        throw new Error('No account selected.');
      }
      setIsSetTargetModalOpen(false);
    } catch (error) {
      console.error('Failed to update target:', error);
      showAlert('Failed to update target. Please try again.', 'Set Target');
      throw error;
    }
  };

  const refreshDashboardData = useCallback(() => {
    if (!isAuthenticated) return;

    dispatch(
      fetchTrades({
        accountId: currentAccountId || undefined,
        page: tradesPage || 1,
        limit: Math.min(tradesLimit || 1000, 1000),
        includeTags: lastFetchIncludeTags,
        force: true,
      }),
    );
    void fetchDashboardSummaries();
  }, [
    isAuthenticated,
    dispatch,
    currentAccountId,
    tradesPage,
    tradesLimit,
    lastFetchIncludeTags,
    fetchDashboardSummaries,
  ]);

  if ((tradesLoading && trades?.length === 0) || (summaryLoading && !periodSummary && trades?.length === 0)) {
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

        {(tradesError || summaryError) && (
          <div className="rounded-2xl border border-red-300/50 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              {tradesError || summaryError}
            </p>
            <button
              onClick={refreshDashboardData}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300/60 dark:border-red-800/60 bg-white/70 dark:bg-black/30 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-white dark:hover:bg-black/50 transition-colors"
            >
              <FaRedo className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

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
            stats={totalReturnStats}
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
                onClick={() => router.push('/journal/new')}
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
