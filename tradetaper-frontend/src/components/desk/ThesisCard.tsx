'use client';

import React from 'react';
import { FaArrowTrendUp, FaArrowTrendDown, FaMinus, FaTriangleExclamation } from 'react-icons/fa6';
import { DeskRun } from '@/types/taperai';

const directionStyles: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  long: {
    label: 'LONG',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: <FaArrowTrendUp className="inline-block mr-1" />,
  },
  short: {
    label: 'SHORT',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    icon: <FaArrowTrendDown className="inline-block mr-1" />,
  },
  neutral: {
    label: 'NEUTRAL',
    classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: <FaMinus className="inline-block mr-1" />,
  },
};

function ConvictionBar({ value }: { value: number }) {
  const color =
    value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">
        {value}
      </span>
    </div>
  );
}

export default function ThesisCard({ run }: { run: DeskRun }) {
  const verdict = run.verdict;
  if (!verdict) return null;
  const dir = directionStyles[verdict.direction] ?? directionStyles.neutral;
  const rejected = run.stages?.pm?.decision === 'rejected';

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{run.symbol}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${dir.classes}`}>
            {dir.icon}
            {dir.label}
          </span>
          {rejected && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              PM REJECTED — NO EDGE
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Horizon: {verdict.horizon}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          Desk conviction
        </p>
        <ConvictionBar value={verdict.conviction} />
      </div>

      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
        {verdict.thesis}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {verdict.entry && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Entry zone</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{verdict.entry}</p>
          </div>
        )}
        {verdict.exit && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Exit target</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{verdict.exit}</p>
          </div>
        )}
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3">
          <p className="text-xs text-red-600 dark:text-red-400">
            <FaTriangleExclamation className="inline-block mr-1" />
            What invalidates this
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {verdict.invalidation || '—'}
          </p>
        </div>
      </div>

      {verdict.dissent && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-3 mb-2">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Desk dissent
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{verdict.dissent}</p>
        </div>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
        AI-generated research for educational purposes only. Not financial advice.
      </p>
    </div>
  );
}
