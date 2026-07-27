'use client';

import React from 'react';
import {
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaMinus,
  FaClock,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import { DeskRun, HorizonKey, HorizonRead } from '@/types/taperai';

const ORDER: { key: HorizonKey; label: string; sub: string }[] = [
  { key: 'today', label: 'Today', sub: 'current / next session' },
  { key: 'week', label: 'This Week', sub: 'next 1–2 weeks' },
  { key: 'shortTerm', label: 'Short Term', sub: '1–3 months' },
  { key: 'longTerm', label: 'Long Term', sub: '6–12 months' },
];

const biasStyle: Record<string, { chip: string; icon: React.ReactNode; bar: string }> = {
  bullish: {
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: <FaArrowTrendUp className="inline-block" />,
    bar: 'bg-emerald-500',
  },
  bearish: {
    chip: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    icon: <FaArrowTrendDown className="inline-block" />,
    bar: 'bg-red-500',
  },
  neutral: {
    chip: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    icon: <FaMinus className="inline-block" />,
    bar: 'bg-gray-400 dark:bg-gray-500',
  },
};

/**
 * Multi-horizon read: the desk's separate view for today, this week, the
 * short term and the long term. These are allowed to disagree — the conflict
 * is usually the most useful signal on the page.
 */
export default function HorizonPanel({ run }: { run: DeskRun }) {
  const trader = run.stages?.trader;
  const horizons = trader?.horizons;
  if (!horizons || Object.keys(horizons).length === 0) return null;

  const present = ORDER.filter((o) => horizons[o.key]);
  if (present.length === 0) return null;

  const conflict = trader?.timeframeConflict;
  const biases = present.map((o) => (horizons[o.key] as HorizonRead).bias);
  const allSame = biases.every((b) => b === biases[0]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-4">
        <FaClock className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
        Outlook by time horizon
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {present.map((o) => {
          const h = horizons[o.key] as HorizonRead;
          const style = biasStyle[h.bias] ?? biasStyle.neutral;
          const conf = Math.max(0, Math.min(100, Number(h.confidence) || 0));
          return (
            <div
              key={o.key}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {o.label}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${style.chip}`}
                >
                  {style.icon} {h.bias}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                {o.sub}
              </p>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div className={`h-full ${style.bar}`} style={{ width: `${conf}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  {conf}
                </span>
              </div>

              {h.driver && (
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug mb-2">
                  {h.driver}
                </p>
              )}
              {h.flipLevel && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  <span className="font-semibold">Flips if:</span> {h.flipLevel}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {(conflict || !allSame) && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 border ${
            allSame
              ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <FaTriangleExclamation
            className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${allSame ? 'text-gray-400' : 'text-amber-500'}`}
          />
          <p
            className={`text-xs leading-relaxed ${
              allSame ? 'text-gray-600 dark:text-gray-400' : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            <span className="font-semibold">
              {allSame ? 'Horizons aligned: ' : 'Timeframe conflict: '}
            </span>
            {conflict ||
              'The desk reads this instrument differently across horizons — size accordingly.'}
          </p>
        </div>
      )}
    </div>
  );
}
