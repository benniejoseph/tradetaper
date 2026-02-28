'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';
import {
  Brain,
  TrendingUp,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  RefreshCw,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { getProfileSummary, getAllInsights, PsychologicalInsight } from '@/services/psychologyApi';
import { useAiError } from '@/hooks/useAiError';
import { format } from 'date-fns';

export default function PsychologyPage() {
  return (
    <FeatureGate feature="psychology" className="min-h-screen">
      <PsychologyDashboard />
    </FeatureGate>
  );
}

/* ────────────────────────────────────────────────────── */
/* Colour helpers                                         */
/* ────────────────────────────────────────────────────── */
const SENTIMENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  positive: { label: 'Positive',  color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Smile },
  negative: { label: 'Negative',  color: 'text-red-500',     bg: 'bg-red-500/10',     icon: Frown },
  neutral:  { label: 'Neutral',   color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    icon: Meh   },
  anger:    { label: 'Anger',     color: 'text-orange-500',  bg: 'bg-orange-500/10',  icon: AlertTriangle },
  fear:     { label: 'Fear',      color: 'text-yellow-500',  bg: 'bg-yellow-500/10',  icon: AlertTriangle },
};

const PATTERN_ICONS: Record<string, React.ElementType> = {
  'Revenge Trading':   AlertTriangle,
  'FOMO':              Zap,
  'Overtrading':       Activity,
  'Hesitation':        ShieldCheck,
  'Overall Sentiment': Brain,
};

function sentimentConf(s: string) {
  return SENTIMENT_CONFIG[s?.toLowerCase()] ?? { label: s, color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: Meh };
}

/* ────────────────────────────────────────────────────── */
/* Main dashboard                                         */
/* ────────────────────────────────────────────────────── */
function PsychologyDashboard() {
  const [insights, setInsights]   = useState<PsychologicalInsight[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const handleAiError = useAiError();

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const [ins, sum] = await Promise.all([getAllInsights(), getProfileSummary()]);
      setInsights(ins);
      setSummary(sum);
    } catch (e) {
      handleAiError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* Aggregated stats */
  const totalInsights     = summary?.totalInsights ?? 0;
  const avgConfidence     = summary?.averageConfidence ?? 0;
  const topPattern        = useMemo(() => {
    if (!summary?.insightTypeCounts) return null;
    const entries = Object.entries(summary.insightTypeCounts as Record<string, number>);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [summary]);

  const dominantSentiment = useMemo(() => {
    if (!summary?.sentimentCounts) return null;
    const entries = Object.entries(summary.sentimentCounts as Record<string, number>);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [summary]);

  /* Confidence bar colour */
  const confColor = avgConfidence >= 0.7 ? 'bg-emerald-500' : avgConfidence >= 0.4 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="relative min-h-screen">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_10%,rgba(139,92,246,0.1),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.07),transparent_55%)]" />

      <div className="w-full max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 dark:border-purple-800/40 bg-white/80 dark:bg-zinc-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300 w-fit">
              <Brain className="h-3.5 w-3.5" />
              AI Psychology Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Trading Psychology
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
              AI-powered emotional profiling built from your journal entries and trade history.
            </p>
          </div>
          <button
            onClick={() => load(false)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-gray-200/70 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : totalInsights === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Insights"
                value={totalInsights}
                icon={Brain}
                color="text-purple-500"
                bg="bg-purple-500/10"
              />
              <StatCard
                label="Avg Confidence"
                value={`${Math.round(avgConfidence * 100)}%`}
                icon={Activity}
                color="text-blue-500"
                bg="bg-blue-500/10"
                sub={
                  <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className={`h-1.5 rounded-full ${confColor}`} style={{ width: `${avgConfidence * 100}%` }} />
                  </div>
                }
              />
              {topPattern && (
                <StatCard
                  label="Top Pattern"
                  value={topPattern[0]}
                  icon={PATTERN_ICONS[topPattern[0]] ?? AlertTriangle}
                  color="text-amber-500"
                  bg="bg-amber-500/10"
                  sub={<span className="text-xs text-zinc-500">{topPattern[1]} occurrences</span>}
                />
              )}
              {dominantSentiment && (
                <StatCard
                  label="Dominant Mood"
                  value={sentimentConf(dominantSentiment[0]).label}
                  icon={sentimentConf(dominantSentiment[0]).icon}
                  color={sentimentConf(dominantSentiment[0]).color}
                  bg={sentimentConf(dominantSentiment[0]).bg}
                  sub={<span className="text-xs text-zinc-500">{dominantSentiment[1]} occurrences</span>}
                />
              )}
            </div>

            {/* ── Sentiment Breakdown ── */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Sentiment Breakdown">
                <SentimentBreakdown counts={summary?.sentimentCounts ?? {}} />
              </Card>
              <Card title="Pattern Frequency">
                <PatternBreakdown counts={summary?.insightTypeCounts ?? {}} />
              </Card>
            </div>

            {/* ── Insight Timeline ── */}
            <Card title="Recent Insights Timeline">
              <InsightTimeline insights={insights.slice(0, 20)} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Sub-components                                         */
/* ────────────────────────────────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-6 space-y-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, bg, sub,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-5 space-y-2">
      <div className={`inline-flex rounded-xl p-2 ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
      {sub}
    </div>
  );
}

function SentimentBreakdown({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return <p className="text-sm text-zinc-500">No sentiment data yet.</p>;

  return (
    <div className="space-y-3">
      {Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([sentiment, count]) => {
          const conf = sentimentConf(sentiment);
          const pct  = Math.round((count / total) * 100);
          return (
            <div key={sentiment}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${conf.color}`}>{conf.label}</span>
                <span className="text-xs text-zinc-500">{count} ({pct}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={`h-2 rounded-full ${conf.color.replace('text-', 'bg-')}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

function PatternBreakdown({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <p className="text-sm text-zinc-500">No patterns detected yet.</p>;
  const max = entries[0][1];

  return (
    <div className="space-y-3">
      {entries.map(([pattern, count]) => {
        const Icon = PATTERN_ICONS[pattern] ?? Brain;
        const pct  = Math.round((count / max) * 100);
        return (
          <div key={pattern} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
              <Icon className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{pattern}</span>
                <span className="text-xs text-zinc-500 shrink-0 ml-2">{count}×</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightTimeline({ insights }: { insights: PsychologicalInsight[] }) {
  if (!insights.length) return <p className="text-sm text-zinc-500">No insights yet.</p>;

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {insights.map((ins) => {
        const conf = sentimentConf(ins.sentiment);
        const Icon = conf.icon;
        return (
          <div
            key={ins.id}
            className="flex gap-3 rounded-xl border border-gray-100 dark:border-zinc-800 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${conf.bg}`}>
              <Icon className={`h-4 w-4 ${conf.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">{ins.insightType}</span>
                <span className={`shrink-0 text-[10px] font-semibold uppercase ${conf.color}`}>{conf.label}</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{ins.extractedText}</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-[10px] text-zinc-400">
                  {Math.round(ins.confidenceScore * 100)}% confidence
                </span>
                <span className="text-[10px] text-zinc-400">
                  {ins.analysisDate ? format(new Date(ins.analysisDate), 'MMM d, yyyy') : ''}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 self-center text-zinc-300" />
          </div>
        );
      })}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-28" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-64" />
        <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-64" />
      </div>
      <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-72" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-purple-200/40 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-zinc-950 dark:to-purple-900/10 p-12 text-center">
      <Brain className="h-16 w-16 text-purple-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        No Psychology Data Yet
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
        Start writing trade journal notes and use the <span className="font-semibold text-purple-600 dark:text-purple-400">Analyse</span> feature on individual notes to build your psychological profile. Your emotional patterns, biases, and triggers will appear here.
      </p>
      <div className="mt-6 grid sm:grid-cols-4 gap-3 max-w-xl mx-auto">
        {[
          { icon: AlertTriangle, label: 'Revenge Trading', color: 'text-orange-500' },
          { icon: Zap,           label: 'FOMO Detection',  color: 'text-yellow-500' },
          { icon: ShieldCheck,   label: 'Risk Awareness',  color: 'text-blue-500'   },
          { icon: TrendingUp,    label: 'Bias Patterns',   color: 'text-emerald-500'},
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-3 text-center">
            <item.icon className={`h-5 w-5 mx-auto mb-1.5 ${item.color}`} />
            <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
