'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Zap, Clock, X } from 'lucide-react';
import { useState } from 'react';

/**
 * TrialBanner
 *
 * Shows a top-of-screen banner when the user is on a TRIALING subscription.
 * Dismissible per-session. Shows urgency color when < 2 days remain.
 */
export function TrialBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const subscription = useSelector(
    (state: RootState) => state.auth.user?.subscription,
  );

  const status = subscription?.status;
  const trialEnd: string | null =
    (subscription as any)?.trialEnd ?? null;

  const daysLeft = useMemo(() => {
    if (!trialEnd) return null;
    const end = new Date(trialEnd).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [trialEnd]);

  if (dismissed) return null;
  if (status !== 'trialing') return null;

  const isUrgent = daysLeft !== null && daysLeft <= 2;

  return (
    <div
      className={`relative flex items-center justify-between gap-4 px-4 py-2.5 text-sm font-medium transition-colors ${
        isUrgent
          ? 'bg-amber-500 text-white'
          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <Clock className="h-4 w-4 shrink-0" />
        ) : (
          <Zap className="h-4 w-4 shrink-0" />
        )}
        <span>
          {daysLeft === null
            ? 'You are on a 7-day free trial'
            : daysLeft === 0
            ? 'Your free trial has ended — upgrade to keep access'
            : daysLeft === 1
            ? 'Your free trial ends tomorrow — upgrade now to avoid interruption'
            : `Your free trial ends in ${daysLeft} days`}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push('/plans')}
          className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-semibold transition-colors"
        >
          Upgrade Now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-full p-0.5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss trial banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
