'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DisciplineDashboard } from '@/components/discipline/DisciplineDashboard';
import { CooldownOverlay } from '@/components/discipline/CooldownOverlay';
import disciplineService, { TraderDiscipline, CooldownSession } from '@/services/disciplineService';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { FeatureGate } from '@/components/common/FeatureGate';
import IfThenPlanBuilder from '@/components/discipline/IfThenPlanBuilder';
import JitaiTriggerCard, { JitaiTrigger } from '@/components/discipline/JitaiTriggerCard';
import MindsetInsightsPanel from '@/components/discipline/MindsetInsightsPanel';
import { psychologyService } from '@/services/psychology.service';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId } from '@/store/features/mt5AccountsSlice';
import { PsychologicalInsight, ProfileSummary } from '@/types/psychology';

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

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const hasPsychologyAccess = Boolean(
    user?.subscription?.planDetails?.limits?.psychology,
  );
  const selectedScopeAccountId = selectedAccountId || selectedMT5AccountId || undefined;

  const refreshBehaviorSignals = useCallback(async () => {
    if (!isAuthenticated) return;

    setSignalsLoading(true);
    setSignalsError(null);

    try {
      const signalData = await disciplineService.getBehaviorSignals(selectedScopeAccountId);
      setRiskScore(signalData.riskScore);
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
      setJitaiTriggers([]);
    } finally {
      setSignalsLoading(false);
    }
  }, [isAuthenticated, selectedScopeAccountId]);

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
  }, [isAuthenticated, hasPsychologyAccess]);

  const handleCooldownComplete = () => {
    setCooldown(null);
    disciplineService.getStats().then(setDiscipline);
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

          {/* Dashboard Stats */}
          <DisciplineDashboard discipline={discipline} loading={loading} />

          {/* Mindset Insights */}
          <FeatureGate feature="psychology" blur={false}>
            <MindsetInsightsPanel
              profile={psychProfile}
              summary={psychSummary}
              loading={psychLoading}
              error={psychError}
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
