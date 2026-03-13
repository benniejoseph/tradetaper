"use client";

import React, { useMemo } from 'react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PsychologicalInsight, ProfileSummary } from '@/types/psychology';

interface BehaviorMetrics {
  closedTradesSampled: number;
  lossStreak: number;
  tradesLast2Hours: number;
  recentAveragePnl: number;
  violationRate: number;
  emotionalPressure: number;
}

interface MindsetInsightsPanelProps {
  profile: PsychologicalInsight[];
  summary: ProfileSummary | null;
  loading?: boolean;
  error?: string | null;
  windowLabel?: string;
  riskScore?: number | null;
  signalsMetrics?: BehaviorMetrics | null;
}

const NEGATIVE_SENTIMENT_HINTS = [
  'negative',
  'fear',
  'anxious',
  'frustrated',
  'fomo',
  'revenge',
  'impatient',
  'rushed',
  'overwhelmed',
  'hesitant',
  'distracted',
  'fatigued',
  'disappointed',
  'greedy',
  'nervous',
];

const POSITIVE_SENTIMENT_HINTS = [
  'positive',
  'calm',
  'confident',
  'focused',
  'disciplined',
  'satisfied',
  'relieved',
  'hopeful',
  'patient',
  'prepared',
];

const getDominantLabel = (counts: Record<string, number>) => {
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.reduce((best, current) => (current[1] > best[1] ? current : best))[0];
};

const containsAnyHint = (value: string, hints: string[]) => {
  const normalized = value.toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
};

export default function MindsetInsightsPanel({
  profile,
  summary,
  loading = false,
  error = null,
  windowLabel = 'Selected range',
  riskScore = null,
  signalsMetrics = null,
}: MindsetInsightsPanelProps) {
  const insightTypeChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.insightTypeCounts || {})
      .map(([name, value]) => ({
        name,
        count: value,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [summary]);

  const sentimentChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.sentimentCounts || {}).map(([name, value]) => ({
      name,
      count: value,
    }));
  }, [summary]);

  const topInsight = useMemo(() => {
    if (!summary?.insightTypeCounts) return null;
    return getDominantLabel(summary.insightTypeCounts);
  }, [summary]);

  const dominantSentiment = useMemo(() => {
    if (!summary?.sentimentCounts) return null;
    return getDominantLabel(summary.sentimentCounts);
  }, [summary]);

  const sentimentHealth = useMemo(() => {
    const entries = Object.entries(summary?.sentimentCounts || {});
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    entries.forEach(([sentiment, count]) => {
      if (containsAnyHint(sentiment, NEGATIVE_SENTIMENT_HINTS)) {
        negative += count;
      } else if (containsAnyHint(sentiment, POSITIVE_SENTIMENT_HINTS)) {
        positive += count;
      } else {
        neutral += count;
      }
    });

    const total = positive + negative + neutral;
    const negativeRatio = total > 0 ? negative / total : 0;
    const positiveRatio = total > 0 ? positive / total : 0;

    return {
      positive,
      negative,
      neutral,
      total,
      negativeRatio,
      positiveRatio,
    };
  }, [summary]);

  const patternConcentration = useMemo(() => {
    if (!summary?.insightTypeCounts || summary.totalInsights === 0) return 0;
    const maxCount = Math.max(...Object.values(summary.insightTypeCounts));
    return (maxCount / summary.totalInsights) * 100;
  }, [summary]);

  const mindsetStabilityScore = useMemo(() => {
    if (!summary) return 0;

    let score = 68;
    score += (summary.averageConfidence - 0.5) * 36;
    score -= sentimentHealth.negativeRatio * 26;
    score -= (signalsMetrics?.violationRate ?? 0) * 30;
    score -= Math.min((signalsMetrics?.emotionalPressure ?? 0) * 2.8, 18);
    score -= ((riskScore ?? 0) / 100) * 14;

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [summary, sentimentHealth.negativeRatio, signalsMetrics, riskScore]);

  if (loading) {
    return (
      <AnimatedCard animate={false} variant="default">
        <p className="text-sm text-gray-500">Loading mindset insights...</p>
      </AnimatedCard>
    );
  }

  if (error) {
    return (
      <AnimatedCard animate={false} variant="default">
        <p className="text-sm text-red-500">{error}</p>
      </AnimatedCard>
    );
  }

  if (!summary || summary.totalInsights === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mindset Insights</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI note insights are not available yet for this scope.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-600 dark:border-white/10 dark:bg-black/20 dark:text-gray-300">
            {windowLabel}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatedCard animate={false} variant="default" className="space-y-2">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Build Your Mindset Profile
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Journal your trade emotions and reflections to unlock AI pattern insights and sentiment trends.
            </p>
            <ul className="mt-2 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li>1. Add pre-trade and post-trade emotions in Journal.</li>
              <li>2. Record mistakes and lessons learned after each close.</li>
              <li>3. Use voice journaling to create richer psychological context.</li>
            </ul>
          </AnimatedCard>

          <AnimatedCard animate={false} variant="default" className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Behavior Pressure</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400">Risk score</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  {riskScore === null ? '—' : `${riskScore}/100`}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400">Closed trades sampled</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  {signalsMetrics ? signalsMetrics.closedTradesSampled : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400">Loss streak</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  {signalsMetrics ? signalsMetrics.lossStreak : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400">Violation rate</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  {signalsMetrics ? `${Math.round(signalsMetrics.violationRate * 100)}%` : '—'}
                </p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  const recentInsights = profile.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mindset Insights</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Patterns pulled from your journaling behavior and coaching analysis.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-600 dark:border-white/10 dark:bg-black/20 dark:text-gray-300">
          {windowLabel}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedCard animate={false} variant="default" className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Insights</p>
          <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{summary.totalInsights}</div>
        </AnimatedCard>
        <AnimatedCard animate={false} variant="default" className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Confidence</p>
          <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
            {(summary.averageConfidence * 100).toFixed(1)}%
          </div>
        </AnimatedCard>
        <AnimatedCard animate={false} variant="default" className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mindset Stability</p>
          <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{mindsetStabilityScore}</div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">0-100 composite score</p>
        </AnimatedCard>
        <AnimatedCard animate={false} variant="default" className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dominant Pattern</p>
          <div className="mt-2 text-lg font-black text-gray-900 dark:text-white">{topInsight || '—'}</div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Concentration: {patternConcentration.toFixed(0)}%
          </p>
        </AnimatedCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnimatedCard animate={false} variant="default" className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Sentiment Profile</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Positive bias</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {(sentimentHealth.positiveRatio * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(sentimentHealth.positiveRatio * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Negative pressure</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {(sentimentHealth.negativeRatio * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${Math.min(sentimentHealth.negativeRatio * 100, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dominant sentiment: <span className="font-semibold">{dominantSentiment || '—'}</span>
          </p>
        </AnimatedCard>

        <AnimatedCard animate={false} variant="default" className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Behavior Pressure</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
              <p className="text-gray-500 dark:text-gray-400">Risk score</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {riskScore === null ? '—' : `${riskScore}/100`}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
              <p className="text-gray-500 dark:text-gray-400">Loss streak</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {signalsMetrics ? signalsMetrics.lossStreak : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
              <p className="text-gray-500 dark:text-gray-400">Violation rate</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {signalsMetrics ? `${Math.round(signalsMetrics.violationRate * 100)}%` : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
              <p className="text-gray-500 dark:text-gray-400">Trades (2h)</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {signalsMetrics ? signalsMetrics.tradesLast2Hours : '—'}
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnimatedCard animate={false} variant="default" className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insights by Type</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insightTypeChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>

        <AnimatedCard animate={false} variant="default" className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Sentiment Mix</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>
      </div>

      <AnimatedCard animate={false} variant="default" className="space-y-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Recent Insights</h4>
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {recentInsights.length === 0 ? (
            <p className="text-sm text-gray-500">No recent insights yet.</p>
          ) : (
            recentInsights.map((insight) => (
              <div key={insight.id} className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{insight.insightType}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(insight.analysisDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-500">{insight.sentiment}</div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  &ldquo;{insight.extractedText}&rdquo;
                </p>
                <div className="mt-2 text-[11px] text-gray-500">
                  Confidence: {(insight.confidenceScore * 100).toFixed(1)}%
                </div>
              </div>
            ))
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}
