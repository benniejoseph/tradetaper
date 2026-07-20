'use client';

import React from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';
import { Brain, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function PsychologyPage() {
  return (
    <FeatureGate feature="psychology" className="min-h-screen">
      <PsychologyDashboard />
    </FeatureGate>
  );
}

function PsychologyDashboard() {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_55%)]" />

      <div className="w-full max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 dark:border-purple-800/40 bg-white/80 dark:bg-zinc-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300 w-fit">
            <Brain className="h-3.5 w-3.5" />
            AI Psychology Engine
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Trading Psychology
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            Understand the emotional patterns behind your trades. AI-powered profiling built from your journal and trade history.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Brain, title: 'Emotional Profile', desc: 'Identify fear, FOMO, overconfidence and revenge trading patterns.', color: 'text-purple-500' },
            { icon: TrendingUp, title: 'Bias Detection', desc: 'Detect recency bias, loss aversion, and confirmation bias in your trades.', color: 'text-emerald-500' },
            { icon: ShieldCheck, title: 'Risk Tolerance', desc: 'Map your actual vs stated risk tolerance based on position sizing habits.', color: 'text-blue-500' },
            { icon: Zap, title: 'Mindset Timeline', desc: 'Track psychology improvements week-over-week with journaling insights.', color: 'text-amber-500' },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-5 space-y-3"
            >
              <item.icon className={`h-7 w-7 ${item.color}`} />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="rounded-3xl border border-purple-200/40 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-zinc-950 dark:to-purple-900/10 p-10 text-center">
          <Brain className="h-14 w-14 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Full Psychology Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm">
            Your psychological trading profile is being built from your journal entries and trade data. Check back after logging more trades and journal entries.
          </p>
        </div>
      </div>
    </div>
  );
}
