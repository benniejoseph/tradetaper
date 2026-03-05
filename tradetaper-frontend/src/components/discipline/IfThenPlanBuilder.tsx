"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FaPlus, FaTrash, FaLightbulb } from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import disciplineService, {
  IfThenPlan,
  IfThenTriggerType,
} from '@/services/disciplineService';

interface IfThenPlanBuilderProps {
  accountId?: string;
}

const SUGGESTIONS: Array<{
  triggerType: IfThenTriggerType;
  ifCue: string;
  thenAction: string;
}> = [
  {
    triggerType: 'overtrading',
    ifCue: 'I feel FOMO after a breakout',
    thenAction: 'I wait for a retest or skip the trade',
  },
  {
    triggerType: 'revenge_trade',
    ifCue: 'I take a loss and want to revenge trade',
    thenAction: 'I take a 10-minute break and review my plan',
  },
  {
    triggerType: 'performance_dip',
    ifCue: 'I am up for the day and feel overconfident',
    thenAction: 'I reduce size or stop trading after 1 more setup',
  },
  {
    triggerType: 'unauthorized_trade',
    ifCue: 'My setup isn’t fully confirmed',
    thenAction: 'I pass and journal why I skipped it',
  },
];

const TRIGGER_LABELS: Record<IfThenTriggerType, string> = {
  custom: 'Custom',
  loss_streak: 'Loss Streak',
  overtrading: 'Overtrading',
  revenge_trade: 'Revenge Risk',
  unauthorized_trade: 'Rule-Break Risk',
  performance_dip: 'Performance Dip',
};

export default function IfThenPlanBuilder({ accountId }: IfThenPlanBuilderProps) {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [plans, setPlans] = useState<IfThenPlan[]>([]);
  const [ifCue, setIfCue] = useState('');
  const [thenAction, setThenAction] = useState('');
  const [triggerType, setTriggerType] = useState<IfThenTriggerType>('custom');
  const [scopeToSelectedAccount, setScopeToSelectedAccount] = useState(Boolean(accountId));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setScopeToSelectedAccount(false);
    }
  }, [accountId]);

  const loadPlans = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await disciplineService.getIfThenPlans(accountId);
      setPlans(data);
    } catch (err) {
      console.error('Failed to load If-Then plans', err);
      setError('Unable to load plans right now.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId, accountId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setPlans([]);
      return;
    }
    loadPlans();
  }, [isAuthenticated, userId, loadPlans]);

  const activeCount = useMemo(() => plans.filter((p) => p.isActive).length, [plans]);

  const handleAdd = () => {
    const trimmedIf = ifCue.trim();
    const trimmedThen = thenAction.trim();
    if (!trimmedIf || !trimmedThen) return;
    if (scopeToSelectedAccount && !accountId) return;

    setSaving(true);
    setError(null);
    disciplineService
      .createIfThenPlan({
        ifCue: trimmedIf,
        thenAction: trimmedThen,
        triggerType,
        accountId: scopeToSelectedAccount ? accountId : undefined,
      })
      .then((createdPlan) => {
        setPlans((prev) => [createdPlan, ...prev]);
        setIfCue('');
        setThenAction('');
        setTriggerType('custom');
      })
      .catch((err) => {
        console.error('Failed to create If-Then plan', err);
        setError('Failed to create plan.');
      })
      .finally(() => setSaving(false));
  };

  const handleToggle = (id: string) => {
    const current = plans.find((plan) => plan.id === id);
    if (!current) return;

    const nextActive = !current.isActive;
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, isActive: nextActive } : plan,
      ),
    );

    disciplineService.updateIfThenPlan(id, { isActive: nextActive }).catch((err) => {
      console.error('Failed to update If-Then plan', err);
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === id ? { ...plan, isActive: current.isActive } : plan,
        ),
      );
      setError('Failed to update plan.');
    });
  };

  const handleDelete = (id: string) => {
    const previous = plans;
    setPlans((prev) => prev.filter((plan) => plan.id !== id));

    disciplineService.deleteIfThenPlan(id).catch((err) => {
      console.error('Failed to delete If-Then plan', err);
      setPlans(previous);
      setError('Failed to delete plan.');
    });
  };

  const applySuggestion = (suggestion: {
    triggerType: IfThenTriggerType;
    ifCue: string;
    thenAction: string;
  }) => {
    setTriggerType(suggestion.triggerType);
    setIfCue(suggestion.ifCue);
    setThenAction(suggestion.thenAction);
  };

  return (
    <AnimatedCard animate={false} variant="default" className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            If‑Then Plans
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Turn triggers into automatic discipline responses
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Active: <span className="font-bold text-gray-900 dark:text-white">{activeCount}</span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => applySuggestion(s)}
            className="text-left text-[11px] p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <FaLightbulb className="w-3 h-3" />
              Quick plan
            </div>
            <div className="text-gray-600 dark:text-gray-300 mt-1">
              If {s.ifCue.toLowerCase()}, then {s.thenAction.toLowerCase()}.
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={ifCue}
            onChange={(e) => setIfCue(e.target.value)}
            placeholder="If I feel X or see Y..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-sm text-gray-900 dark:text-white"
          />
          <input
            value={thenAction}
            onChange={(e) => setThenAction(e.target.value)}
            placeholder="Then I will do Z..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-sm text-gray-900 dark:text-white"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as IfThenTriggerType)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-sm text-gray-900 dark:text-white"
          >
            {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={scopeToSelectedAccount}
              onChange={(e) => setScopeToSelectedAccount(e.target.checked)}
              disabled={!accountId}
              className="rounded border-gray-300"
            />
            Scope to selected account
          </label>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !ifCue.trim() || !thenAction.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
        >
          <FaPlus className="w-3 h-3" />
          {saving ? 'Saving...' : 'Add Plan'}
        </button>
      </div>

      <div className="space-y-2">
        {loading && (
          <div className="text-center text-xs text-gray-500 py-3">
            Loading plans...
          </div>
        )}
        {!loading && plans.length === 0 && (
          <div className="text-center text-xs text-gray-500 py-6">
            No plans yet. Add one to build your discipline reflexes.
          </div>
        )}
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
              plan.isActive
                ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10'
                : 'border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/30'
            }`}
          >
            <div className="text-xs text-gray-700 dark:text-gray-200">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  {TRIGGER_LABELS[plan.triggerType]}
                </span>
                <span className="text-[10px] text-gray-500">
                  {plan.accountId ? 'Account scoped' : 'Global'}
                </span>
              </div>
              <div><span className="font-bold">If</span> {plan.ifCue}</div>
              <div className="mt-1"><span className="font-bold">Then</span> {plan.thenAction}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(plan.id)}
                className={`px-2 py-1 text-[10px] rounded-md font-bold ${
                  plan.isActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                {plan.isActive ? 'Active' : 'Paused'}
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="p-1 text-gray-400 hover:text-red-500"
                aria-label="Delete plan"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AnimatedCard>
  );
}
