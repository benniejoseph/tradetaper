"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FaPlus, FaTrash, FaLightbulb } from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

interface IfThenPlan {
  id: string;
  ifCue: string;
  thenAction: string;
  active: boolean;
  createdAt: string;
}

const SUGGESTIONS: Array<{ ifCue: string; thenAction: string }> = [
  {
    ifCue: 'I feel FOMO after a breakout',
    thenAction: 'I wait for a retest or skip the trade',
  },
  {
    ifCue: 'I take a loss and want to revenge trade',
    thenAction: 'I take a 10-minute break and review my plan',
  },
  {
    ifCue: 'I am up for the day and feel overconfident',
    thenAction: 'I reduce size or stop trading after 1 more setup',
  },
  {
    ifCue: 'My setup isn’t fully confirmed',
    thenAction: 'I pass and journal why I skipped it',
  },
];

const storageKey = (userId?: string) => `trader-mind:if-then:${userId || 'anon'}`;

export default function IfThenPlanBuilder() {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [plans, setPlans] = useState<IfThenPlan[]>([]);
  const [ifCue, setIfCue] = useState('');
  const [thenAction, setThenAction] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) setPlans(JSON.parse(raw));
    } catch {
      setPlans([]);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey(userId), JSON.stringify(plans));
  }, [plans, userId]);

  const activeCount = useMemo(() => plans.filter(p => p.active).length, [plans]);

  const handleAdd = () => {
    const trimmedIf = ifCue.trim();
    const trimmedThen = thenAction.trim();
    if (!trimmedIf || !trimmedThen) return;

    setPlans(prev => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ifCue: trimmedIf,
        thenAction: trimmedThen,
        active: true,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setIfCue('');
    setThenAction('');
  };

  const handleToggle = (id: string) => {
    setPlans(prev => prev.map(p => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleDelete = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const applySuggestion = (suggestion: { ifCue: string; thenAction: string }) => {
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
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
        >
          <FaPlus className="w-3 h-3" />
          Add Plan
        </button>
      </div>

      <div className="space-y-2">
        {plans.length === 0 && (
          <div className="text-center text-xs text-gray-500 py-6">
            No plans yet. Add one to build your discipline reflexes.
          </div>
        )}
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
              plan.active
                ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10'
                : 'border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/30'
            }`}
          >
            <div className="text-xs text-gray-700 dark:text-gray-200">
              <div><span className="font-bold">If</span> {plan.ifCue}</div>
              <div className="mt-1"><span className="font-bold">Then</span> {plan.thenAction}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(plan.id)}
                className={`px-2 py-1 text-[10px] rounded-md font-bold ${
                  plan.active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                {plan.active ? 'Active' : 'Paused'}
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
