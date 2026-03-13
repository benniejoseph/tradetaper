'use client';

import { BrainCircuit } from 'lucide-react';
import { FeatureGate } from '@/components/common/FeatureGate';
import TraderCoachChat from '@/components/coach/TraderCoachChat';

export default function AICoachPage() {
  return (
    <FeatureGate feature="aiCoach" className="min-h-screen">
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-2xl border border-emerald-500/20 bg-black/40 p-5">
          <div className="mb-2 flex items-center gap-3">
            <BrainCircuit className="h-7 w-7 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              AI Trader Coach
            </h1>
          </div>
          <p className="max-w-3xl text-sm text-zinc-300 md:text-base">
            Chat with an expert trader + trading psychologist persona powered by
            Gemini and your own trade records. Ask for account-level performance
            diagnosis, psychology patterns, risk leaks, and a concrete plan for
            your next trades.
          </p>
        </div>

        <TraderCoachChat />
      </div>
    </FeatureGate>
  );
}
