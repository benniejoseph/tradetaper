'use client';

import React from 'react';
import { FaScaleUnbalanced, FaFlask } from 'react-icons/fa6';
import { DeskRun } from '@/types/taperai';

const stanceDot: Record<string, string> = {
  bullish: 'bg-emerald-500',
  bearish: 'bg-red-500',
  neutral: 'bg-gray-400 dark:bg-gray-600',
};

/** Deterministic cross-analyst agreement + the historical edge-check backtests. */
export default function ConfluencePanel({ run }: { run: DeskRun }) {
  const confluence = run.stages?.confluence;
  const backtests = run.stages?.snapshot?.backtests;
  const trader = run.stages?.trader;
  if (!confluence && !backtests) return null;

  const net = confluence?.netScore ?? 0;
  const barPct = Math.max(0, Math.min(100, 50 + net / 2));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-4">
        <FaScaleUnbalanced className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
        Desk Confluence &amp; Historical Edge
      </h3>

      {confluence && (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize">
              {confluence.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {confluence.netScore > 0 ? '+' : ''}
              {confluence.netScore}
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 w-px bg-gray-400 dark:bg-gray-600 z-10" />
            <div
              className={`h-full ${net >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{
                width: `${Math.abs(barPct - 50)}%`,
                marginLeft: net >= 0 ? '50%' : `${barPct}%`,
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {confluence.votes.map((v) => (
              <span
                key={v.role}
                className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${stanceDot[v.stance] ?? stanceDot.neutral}`} />
                <span className="capitalize font-medium">{v.role}</span>
                <span className="text-gray-400 dark:text-gray-600">{v.confidence}</span>
              </span>
            ))}
          </div>

          <p
            className={`mt-3 text-xs rounded-lg px-3 py-2 ${
              confluence.ictVsTechnical === 'agree'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : confluence.ictVsTechnical === 'conflict'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            ICT vs Technical:{' '}
            {confluence.ictVsTechnical === 'agree'
              ? 'agree — stronger signal'
              : confluence.ictVsTechnical === 'conflict'
                ? 'conflict — see horizon split below'
                : 'incomplete'}
          </p>

          {trader?.confluenceAlignment && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Trader on alignment: </span>
              {trader.confluenceAlignment}
            </p>
          )}
        </>
      )}

      {backtests && backtests.checks.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-900">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-2">
            <FaFlask className="inline-block mr-1.5" />
            Historical edge check ({backtests.historyDays}-bar history)
          </p>
          <div className="space-y-2">
            {backtests.checks.map((c, i) => (
              <div key={i} className="text-xs rounded-lg bg-gray-50 dark:bg-gray-900 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{c.name}</span>
                  {c.lowConfidence && (
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                      small sample
                    </span>
                  )}
                </div>
                {c.sampleSize > 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                    n={c.sampleSize} · win rate {c.winRatePct?.toFixed(1)}% · avg return{' '}
                    {c.avgForwardReturnPct != null && c.avgForwardReturnPct > 0 ? '+' : ''}
                    {c.avgForwardReturnPct?.toFixed(2)}%
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">no qualifying instances</p>
                )}
              </div>
            ))}
          </div>
          {trader?.historicalEdgeNote && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Trader on this: </span>
              {trader.historicalEdgeNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
