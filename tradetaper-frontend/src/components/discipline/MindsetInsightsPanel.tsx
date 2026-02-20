"use client";

import React, { useMemo } from 'react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PsychologicalInsight, ProfileSummary } from '@/types/psychology';

interface MindsetInsightsPanelProps {
  profile: PsychologicalInsight[];
  summary: ProfileSummary | null;
  loading?: boolean;
  error?: string | null;
}

const getDominantLabel = (counts: Record<string, number>) => {
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.reduce((best, current) => (current[1] > best[1] ? current : best))[0];
};

export default function MindsetInsightsPanel({
  profile,
  summary,
  loading = false,
  error = null,
}: MindsetInsightsPanelProps) {
  const insightTypeChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.insightTypeCounts || {}).map(([name, value]) => ({
      name,
      count: value,
    }));
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
      <AnimatedCard animate={false} variant="default" className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mindset Insights</h3>
        <p className="text-sm text-gray-500">
          No insights yet. Capture emotions, rule breaks, or reflections to start building your mindset profile.
        </p>
      </AnimatedCard>
    );
  }

  const recentInsights = profile.slice(0, 8);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mindset Insights</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Patterns pulled from your trade reflections and behavior tags.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <AnimatedCard animate={false} variant="default" className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Insights</p>
          <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {summary.totalInsights}
          </div>
        </AnimatedCard>
        <AnimatedCard animate={false} variant="default" className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Insight Confidence</p>
          <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {(summary.averageConfidence * 100).toFixed(1)}%
          </div>
        </AnimatedCard>
        <AnimatedCard animate={false} variant="default" className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Pattern</p>
          <div className="text-lg font-black text-gray-900 dark:text-white mt-2">
            {topInsight || '—'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Dominant sentiment: <span className="font-semibold">{dominantSentiment || '—'}</span>
          </p>
        </AnimatedCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <AnimatedCard animate={false} variant="default" className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insights by Type</h4>
          </div>
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
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Sentiment Mix</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>
      </div>

      <AnimatedCard animate={false} variant="default" className="space-y-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Recent Insights</h4>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {recentInsights.length === 0 ? (
            <p className="text-sm text-gray-500">No recent insights yet.</p>
          ) : (
            recentInsights.map((insight) => (
              <div key={insight.id} className="p-4 border border-gray-200 dark:border-white/10 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{insight.insightType}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(insight.analysisDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {insight.sentiment}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">"{insight.extractedText}"</p>
                <div className="text-[11px] text-gray-500 mt-2">
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
