'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DisciplineDashboard } from '@/components/discipline/DisciplineDashboard';
import { CooldownOverlay } from '@/components/discipline/CooldownOverlay';
import disciplineService, { TraderDiscipline, CooldownSession } from '@/services/disciplineService';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { FeatureGate } from '@/components/common/FeatureGate';
import IfThenPlanBuilder from '@/components/discipline/IfThenPlanBuilder';
import JitaiTriggerCard, { JitaiTrigger } from '@/components/discipline/JitaiTriggerCard';
import MindsetInsightsPanel from '@/components/discipline/MindsetInsightsPanel';
import { psychologyService } from '@/services/psychology.service';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId } from '@/store/features/mt5AccountsSlice';
import { Trade, TradeStatus } from '@/types/trade';
import { subHours, isAfter } from 'date-fns';
import { PsychologicalInsight, ProfileSummary } from '@/types/psychology';

export default function DisciplinePage() {
  const [discipline, setDiscipline] = useState<TraderDiscipline | null>(null);
  const [cooldown, setCooldown] = useState<CooldownSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [psychProfile, setPsychProfile] = useState<PsychologicalInsight[]>([]);
  const [psychSummary, setPsychSummary] = useState<ProfileSummary | null>(null);
  const [psychLoading, setPsychLoading] = useState(false);
  const [psychError, setPsychError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { trades, lastFetchKey, lastFetchAt, lastFetchIncludeTags } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, cooldownData] = await Promise.all([
          disciplineService.getStats(),
          disciplineService.getActiveCooldown(),
        ]);
        setDiscipline(statsData);
        setCooldown(cooldownData);
      } catch (err) {
        console.error('Failed to fetch discipline data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const currentAccountId = selectedAccountId || selectedMT5AccountId;
    const limit = 300;
    const fetchKey = `account:${currentAccountId || 'all'}:page:1:limit:${limit}`;
    const isFresh = lastFetchAt && Date.now() - lastFetchAt < 60_000;
    if (trades.length > 0 && lastFetchKey === fetchKey && isFresh && !lastFetchIncludeTags) return;
    dispatch(fetchTrades({ accountId: currentAccountId || undefined, limit, includeTags: false }));
  }, [dispatch, isAuthenticated, selectedAccountId, selectedMT5AccountId, lastFetchKey, lastFetchAt, lastFetchIncludeTags, trades.length]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setPsychLoading(true);
    setPsychError(null);
    Promise.all([psychologyService.getProfile(), psychologyService.getProfileSummary()])
      .then(([profileData, summaryData]) => {
        setPsychProfile(profileData);
        setPsychSummary(summaryData);
      })
      .catch((err) => {
        console.error('Failed to load psychological summary', err);
        setPsychError('Failed to load mindset insights. Please try again later.');
      })
      .finally(() => setPsychLoading(false));
  }, [isAuthenticated]);

  const handleCooldownComplete = () => {
    setCooldown(null);
    disciplineService.getStats().then(setDiscipline);
  };

  const jitaiTriggers = useMemo((): JitaiTrigger[] => {
    const triggers: JitaiTrigger[] = [];
    const closedTrades = (trades || []).filter((t: Trade) => t.status === TradeStatus.CLOSED && t.exitDate);

    if (closedTrades.length === 0) return triggers;

    const sorted = [...closedTrades].sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());
    let lossStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      const pnl = sorted[i].profitOrLoss || 0;
      if (pnl < 0) lossStreak += 1;
      else break;
    }
    if (lossStreak >= 2) {
      triggers.push({
        title: 'Loss streak risk',
        severity: lossStreak >= 4 ? 'high' : 'medium',
        detail: `You have ${lossStreak} consecutive losing trades.`,
        suggestion: 'Pause for 10–20 minutes and reduce size or stop trading for the day.',
      });
    }

    const last2Hours = subHours(new Date(), 2);
    const recentTrades = sorted.filter(t => isAfter(new Date(t.exitDate!), last2Hours));
    if (recentTrades.length >= 6) {
      triggers.push({
        title: 'Rapid‑fire trading',
        severity: recentTrades.length >= 10 ? 'high' : 'medium',
        detail: `${recentTrades.length} trades in the last 2 hours.`,
        suggestion: 'Slow down: enforce a 5‑minute wait before new entries.',
      });
    }

    const last3 = sorted.slice(-3);
    const avgPnL = last3.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / Math.max(last3.length, 1);
    if (avgPnL < 0) {
      triggers.push({
        title: 'Performance dip',
        severity: avgPnL < -50 ? 'medium' : 'low',
        detail: `Recent average P&L is negative (${avgPnL.toFixed(2)}).`,
        suggestion: 'Review the last 3 trades and confirm checklist alignment.',
      });
    }

    return triggers;
  }, [trades]);

  return (
    <FeatureGate feature="discipline">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        {/* Cooldown Overlay */}
        {cooldown && !cooldown.isCompleted && !cooldown.isSkipped && (
          <CooldownOverlay
            cooldown={cooldown}
            onComplete={handleCooldownComplete}
            onSkip={() => setCooldown(null)}
          />
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                Trader Mind
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Build discipline, consistency, and execution focus
              </p>
            </div>
          </div>

          {/* Dashboard Stats */}
          <DisciplineDashboard discipline={discipline} loading={loading} />

          {/* Mindset Insights */}
          <MindsetInsightsPanel
            profile={psychProfile}
            summary={psychSummary}
            loading={psychLoading}
            error={psychError}
          />

          {/* Discipline Playbook */}
          <div className="grid lg:grid-cols-2 gap-4">
            <JitaiTriggerCard triggers={jitaiTriggers} />
            <IfThenPlanBuilder />
          </div>

          <AnimatedCard animate={false} variant="default" className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Discipline Commitments</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              A few small rules applied consistently beat occasional perfect sessions.
            </p>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Trade only your checklist-approved setups.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Stop after two rule violations in a day.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Journal immediately after execution.
              </li>
            </ul>
          </AnimatedCard>

        </div>
      </div>
    </FeatureGate>
  );
}
