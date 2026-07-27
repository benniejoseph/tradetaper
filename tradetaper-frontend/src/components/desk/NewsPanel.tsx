'use client';

import React, { useState } from 'react';
import { FaNewspaper, FaChevronDown } from 'react-icons/fa6';
import { DeskRun } from '@/types/taperai';

const sentimentChip: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  negative: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** The actual headlines the news & sentiment analysts read for this run. */
export default function NewsPanel({ run }: { run: DeskRun }) {
  const [expanded, setExpanded] = useState(false);
  const snapshot = run.stages?.snapshot;
  const news = snapshot?.news ?? [];
  if (news.length === 0) return null;

  const shown = expanded ? news : news.slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
          <FaNewspaper className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
          News the desk read ({news.length})
        </h3>
        {snapshot?.sources?.length ? (
          <span className="hidden sm:block text-[11px] text-gray-400 dark:text-gray-500">
            {snapshot.sources.join(' · ')}
          </span>
        ) : null}
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">
        Last ~{snapshot?.newsWindowDays ?? 7} days — these exact headlines were
        given to the news and sentiment analysts.
      </p>

      <div className="space-y-3">
        {shown.map((n, i) => (
          <div
            key={`${n.title}-${i}`}
            className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                {n.title}
              </p>
              {n.sentiment && (
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    sentimentChip[n.sentiment] ?? sentimentChip.neutral
                  }`}
                >
                  {n.sentiment}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {n.publisher}
              {n.publishedUtc ? ` · ${timeAgo(n.publishedUtc)}` : ''}
            </p>
            {n.description && (
              <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {n.description}
              </p>
            )}
            {n.sentimentReasoning && (
              <p className="mt-1.5 text-[11px] italic text-gray-500 dark:text-gray-500 leading-relaxed">
                {n.sentimentReasoning}
              </p>
            )}
          </div>
        ))}
      </div>

      {news.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <FaChevronDown
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          {expanded ? 'Show fewer' : `Show all ${news.length} headlines`}
        </button>
      )}
    </div>
  );
}
