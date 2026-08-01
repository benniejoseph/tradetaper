'use client';

import React from 'react';
import {
  FaCrosshairs,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaMinus,
  FaClock,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import { DeskRun } from '@/types/taperai';

const biasChip: Record<string, string> = {
  bullish: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  bearish: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  choppy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const biasIcon: Record<string, React.ReactNode> = {
  bullish: <FaArrowTrendUp className="inline-block" />,
  bearish: <FaArrowTrendDown className="inline-block" />,
};

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

/** ICT (smart-money/liquidity) read: bias, DOL, PD array, kill zone, and the analyst's interpretation. */
export default function ICTPanel({ run }: { run: DeskRun }) {
  const ict = run.stages?.analysts?.ict;
  const ctx = run.stages?.snapshot?.ict;
  if (!ict) return null;

  const kz = ctx?.killZone;
  const digits = run.stages?.snapshot?.assetClass === 'forex' ? 5 : 2;
  const fmt = (n: number | null | undefined) =>
    n == null || !Number.isFinite(n) ? 'n/a' : n.toFixed(digits);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
          <FaCrosshairs className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
          ICT Read (Smart Money / Liquidity)
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            biasChip[ict.stance] ?? biasChip.neutral
          }`}
        >
          {biasIcon[ict.stance] ?? <FaMinus className="inline-block" />} {ict.stance} · {ict.confidence}
        </span>
      </div>

      {kz && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            kz.activeZoneIsNoTrade
              ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
              : kz.activeZone
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
          }`}
        >
          <FaClock className="w-3 h-3 shrink-0" />
          {kz.activeZoneIsNoTrade
            ? `NY ${kz.nowNy} — inside ${kz.activeZone}, ICT no-trade window`
            : kz.activeZone
              ? `NY ${kz.nowNy} — inside the ${kz.activeZone} kill zone`
              : `NY ${kz.nowNy} — outside kill zones, next: ${kz.nextZone} in ${kz.minutesToNextZone}m`}
        </div>
      )}

      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{ict.summary}</p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
        <Stat label="Daily bias" value={ict.bias?.daily ?? '—'} />
        <Stat label="Weekly bias" value={ict.bias?.weekly ?? '—'} />
        <Stat
          label="Premium / discount"
          value={
            <span
              className={
                ict.premiumDiscount === 'premium'
                  ? 'text-red-600 dark:text-red-400'
                  : ict.premiumDiscount === 'discount'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : ''
              }
            >
              {ict.premiumDiscount ?? '—'}
            </span>
          }
        />
        <Stat label="PDH / PDL" value={`${fmt(ctx?.pdh)} / ${fmt(ctx?.pdl)}`} />
        <Stat label="Prior week H/L" value={`${fmt(ctx?.pwh)} / ${fmt(ctx?.pwl)}`} />
        <Stat label="IPDA 20D EQ" value={fmt(ctx?.ipda20Eq)} />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-1">
            Draw on liquidity
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{ict.dol?.target ?? '—'}</p>
          {ict.dol?.priority && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ict.dol.priority}</p>
          )}
          {ict.dol?.rationale && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              {ict.dol.rationale}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-1">
            PD array (entry zone)
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {ict.pdArray?.type ?? '—'} {ict.pdArray?.zone ? `@ ${ict.pdArray.zone}` : ''}
          </p>
          {ict.pdArray?.rationale && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              {ict.pdArray.rationale}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-1">
            Liquidity
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Swept: </span>
            {ict.liquidity?.swept ?? '—'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Still resting: </span>
            {ict.liquidity?.resting ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-1">
            Model
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{ict.model ?? '—'}</p>
          {ict.invalidation && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Invalidation: {ict.invalidation}
            </p>
          )}
        </div>
      </div>

      {ict.bullets?.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {ict.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
              {b}
            </li>
          ))}
        </ul>
      )}

      {ict.dataGaps && ict.dataGaps.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <FaTriangleExclamation className="w-3 h-3 mt-0.5 shrink-0" />
          {ict.dataGaps.join('; ')}
        </p>
      )}
    </div>
  );
}
