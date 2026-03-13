'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DisciplineDashboard } from '@/components/discipline/DisciplineDashboard';
import { CooldownOverlay } from '@/components/discipline/CooldownOverlay';
import disciplineService, {
  TraderDiscipline,
  CooldownSession,
  DisciplineBehaviorSignals,
} from '@/services/disciplineService';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { FeatureGate } from '@/components/common/FeatureGate';
import IfThenPlanBuilder from '@/components/discipline/IfThenPlanBuilder';
import JitaiTriggerCard, { JitaiTrigger } from '@/components/discipline/JitaiTriggerCard';
import MindsetInsightsPanel from '@/components/discipline/MindsetInsightsPanel';
import { psychologyService } from '@/services/psychology.service';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { selectAvailableAccounts, selectSelectedAccountId } from '@/store/features/accountSlice';
import { selectMT5Accounts, selectSelectedMT5AccountId } from '@/store/features/mt5AccountsSlice';
import { PsychologicalInsight, ProfileSummary } from '@/types/psychology';

type MindWindow = '7d' | '30d' | '90d' | 'all';

const WINDOW_DAYS: Record<Exclude<MindWindow, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const WINDOW_LABEL: Record<MindWindow, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All history',
};

function getDateRange(window: MindWindow): { startDate?: string; endDate?: string } {
  if (window === 'all') {
    return {};
  }

  const days = WINDOW_DAYS[window];
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export default function DisciplinePage() {
  const [discipline, setDiscipline] = useState<TraderDiscipline | null>(null);
  const [cooldown, setCooldown] = useState<CooldownSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [psychProfile, setPsychProfile] = useState<PsychologicalInsight[]>([]);
  const [psychSummary, setPsychSummary] = useState<ProfileSummary | null>(null);
  const [psychLoading, setPsychLoading] = useState(false);
  const [psychError, setPsychError] = useState<string | null>(null);
  const [jitaiTriggers, setJitaiTriggers] = useState<JitaiTrigger[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsError, setSignalsError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [signalsMetrics, setSignalsMetrics] = useState<DisciplineBehaviorSignals['metrics'] | null>(null);
  const [mindWindow, setMindWindow] = useState<MindWindow>('30d');

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const accounts = useSelector(selectAvailableAccounts);
  const mt5Accounts = useSelector(selectMT5Accounts);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const hasPsychologyAccess = Boolean(
    user?.subscription?.planDetails?.limits?.psychology,
  );
  const selectedScopeAccountId = selectedAccountId || selectedMT5AccountId || undefined;
  const selectedScopeLabel = useMemo(() => {
    if (selectedAccountId) {
      const account = accounts.find((item) => item.id === selectedAccountId);
      return account?.name || 'Selected account';
    }

    if (selectedMT5AccountId) {
      const account = mt5Accounts.find((item) => item.id === selectedMT5AccountId);
      if (account) {
        return `${account.accountName} (${account.login})`;
      }
      return 'Selected MT5 account';
    }

    return 'All accounts';
  }, [accounts, mt5Accounts, selectedAccountId, selectedMT5AccountId]);
  const psychDateRange = useMemo(() => getDateRange(mindWindow), [mindWindow]);
  const coachingHeadline = useMemo(() => {
    if (signalsError) {
      return 'Behavior signal engine unavailable. Keep position sizes small and trade only A+ setups until signals recover.';
    }
    if (riskScore === null) {
      return 'Collecting behavior data. Continue journaling emotions to improve coaching precision.';
    }
    if (riskScore >= 75) {
      return 'Capital-preservation mode: reduce size by 50%, cap to 2 trades, and enforce cooldown before every new entry.';
    }
    if (riskScore >= 50) {
      return 'Moderate behavioral pressure detected. Trade one setup model only and pause after any rule violation.';
    }
    return 'Execution quality is stable. Keep checklist discipline and avoid increasing frequency just because conditions feel good.';
  }, [riskScore, signalsError]);

  const refreshBehaviorSignals = useCallback(async () => {
    if (!isAuthenticated) return;

    setSignalsLoading(true);
    setSignalsError(null);

    try {
      const signalData = await disciplineService.getBehaviorSignals(selectedScopeAccountId);
      setRiskScore(signalData.riskScore);
      setSignalsMetrics(signalData.metrics);
      setJitaiTriggers(
        signalData.triggers.map((trigger) => ({
          title: trigger.title,
          severity: trigger.severity,
          detail: trigger.detail,
          suggestion: trigger.suggestion,
        })),
      );

      if (signalData.cooldownActive) {
        const activeCooldown = await disciplineService.getActiveCooldown();
        setCooldown(activeCooldown);
      }
    } catch (err) {
      console.error('Failed to load discipline behavior signals', err);
      setSignalsError('Unable to load behavior signals right now.');
      setRiskScore(null);
      setSignalsMetrics(null);
      setJitaiTriggers([]);
    } finally {
      setSignalsLoading(false);
    }
  }, [isAuthenticated, selectedScopeAccountId]);

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [statsData, cooldownData] = await Promise.all([
          disciplineService.getStats(selectedScopeAccountId),
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
  }, [isAuthenticated, selectedScopeAccountId]);

  useEffect(() => {
    refreshBehaviorSignals();
  }, [refreshBehaviorSignals]);

  useEffect(() => {
    if (!isAuthenticated || !hasPsychologyAccess) {
      setPsychProfile([]);
      setPsychSummary(null);
      setPsychLoading(false);
      setPsychError(null);
      return;
    }
    setPsychLoading(true);
    setPsychError(null);
    Promise.all([
      psychologyService.getProfile({
        accountId: selectedScopeAccountId,
        ...psychDateRange,
        limit: 100,
      }),
      psychologyService.getProfileSummary({
        accountId: selectedScopeAccountId,
        ...psychDateRange,
      }),
    ])
      .then(([profileData, summaryData]) => {
        setPsychProfile(profileData);
        setPsychSummary(summaryData);
      })
      .catch((err) => {
        console.error('Failed to load psychological summary', err);
        setPsychError('Failed to load mindset insights. Please try again later.');
      })
      .finally(() => setPsychLoading(false));
  }, [isAuthenticated, hasPsychologyAccess, selectedScopeAccountId, psychDateRange]);

  const handleCooldownComplete = () => {
    setCooldown(null);
    disciplineService.getStats(selectedScopeAccountId).then(setDiscipline);
    refreshBehaviorSignals();
  };

  return (
    <FeatureGate feature="discipline">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        {/* Cooldown Overlay */}
        {cooldown && !cooldown.isCompleted && !cooldown.isSkipped && (
          <CooldownOverlay
            cooldown={cooldown}
            onComplete={handleCooldownComplete}
            onSkip={() => {
              setCooldown(null);
              refreshBehaviorSignals();
            }}
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

          <AnimatedCard animate={false} variant="default" className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Active Scope
                </p>
                <h2 className="mt-2 text-xl font-black text-gray-900 dark:text-white">
                  {selectedScopeLabel}
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Psychology range: {WINDOW_LABEL[mindWindow]}
                </p>
              </div>
              <div className="inline-flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-black/30">
                {(['7d', '30d', '90d', 'all'] as MindWindow[]).map((windowKey) => (
                  <button
                    key={windowKey}
                    type="button"
                    onClick={() => setMindWindow(windowKey)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      mindWindow === windowKey
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-200'
                    }`}
                  >
                    {windowKey === 'all' ? 'All' : windowKey.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                Pro Coaching Focus
              </p>
              <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-100">{coachingHeadline}</p>
            </div>
          </AnimatedCard>

          {/* Dashboard Stats */}
          <DisciplineDashboard discipline={discipline} loading={loading} />

          {/* Mindset Insights */}
          <FeatureGate feature="psychology" blur={false}>
            <MindsetInsightsPanel
              profile={psychProfile}
              summary={psychSummary}
              loading={psychLoading}
              error={psychError}
              windowLabel={WINDOW_LABEL[mindWindow]}
              riskScore={riskScore}
              signalsMetrics={signalsMetrics}
            />
          </FeatureGate>

          {/* Discipline Playbook */}
          <div className="grid lg:grid-cols-2 gap-4">
            <JitaiTriggerCard
              triggers={jitaiTriggers}
              riskScore={riskScore}
              loading={signalsLoading}
              error={signalsError}
            />
            <IfThenPlanBuilder accountId={selectedScopeAccountId} />
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
