'use client';

import React from 'react';
import {
  FaChartSimple,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaMinus,
  FaScaleBalanced,
  FaGaugeHigh,
} from 'react-icons/fa6';
import { DeskRun } from '@/types/taperai';
import { computeDeskMetrics, Stance, PersonaLean } from '@/lib/deskMetrics';

const stanceColor: Record<Stance, string> = {
  bullish: 'bg-emerald-500',
  bearish: 'bg-red-500',
  neutral: 'bg-gray-400 dark:bg-gray-500',
};

const stanceText: Record<Stance, string> = {
  bullish: 'text-emerald-600 dark:text-emerald-400',
  bearish: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-500 dark:text-gray-400',
};

const leanIcon: Record<PersonaLean, React.ReactNode> = {
  bull: <FaArrowTrendUp className="inline-block text-emerald-600 dark:text-emerald-400" />,
  bear: <FaArrowTrendDown className="inline-block text-red-600 dark:text-red-400" />,
  neutral: <FaMinus className="inline-block text-gray-500 dark:text-gray-400" />,
};

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{sub}</p>
      )}
    </div>
  );
}

function HBar({
  label,
  value,
  max = 100,
  color = 'bg-emerald-500',
  valueLabel,
  title,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  valueLabel?: string;
  title?: string;
}) {
  const widthPct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3" title={title ?? `${label}: ${value}`}>
      <span className="w-28 shrink-0 text-xs capitalize text-gray-600 dark:text-gray-300">
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-r ${color}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-xs font-semibold text-gray-900 dark:text-white">
        {valueLabel ?? value}
      </span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-2">
        <span className="mr-1.5 text-emerald-600 dark:text-emerald-400">{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * Quantitative layer for a completed Desk run: stat tiles, confidence-
 * weighted consensus split, per-analyst confidence bars, the conviction
 * path through the pipeline, persona votes, and key levels. Purely
 * additive — all numbers are computed client-side from the stored stages.
 */
export default function DeskAnalytics({ run }: { run: DeskRun }) {
  const m = computeDeskMetrics(run);
  if (!m || m.analysts.length === 0) return null;

  const scoreLabel =
    m.consensusScore > 0 ? `+${m.consensusScore}` : `${m.consensusScore}`;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-4">
        <FaChartSimple className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
        Desk analytics
      </h3>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatTile
          label="Final conviction"
          value={m.convictionPath.final != null ? `${m.convictionPath.final}` : '—'}
          sub="out of 100"
        />
        <StatTile
          label="Consensus score"
          value={scoreLabel}
          sub="-100 bear · +100 bull"
        />
        <StatTile
          label="Win probability"
          value={
            m.probabilityOfSuccess != null ? `${m.probabilityOfSuccess}%` : '—'
          }
          sub="trader estimate"
        />
        <StatTile
          label="Reward : risk"
          value={
            m.riskRewardRatio != null ? `${m.riskRewardRatio.toFixed(1)}x` : '—'
          }
          sub="to invalidation"
        />
        <StatTile
          label="Suggested risk"
          value={
            m.suggestedRiskPercent != null ? `${m.suggestedRiskPercent}%` : '—'
          }
          sub="of capital"
        />
        <StatTile
          label="Run stats"
          value={m.run.durationSec != null ? `${m.run.durationSec}s` : '—'}
          sub={`${m.run.llmCalls} agent calls${
            m.run.costUsd != null ? ` · $${m.run.costUsd.toFixed(3)}` : ''
          }`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consensus split */}
        <Section title="Desk consensus (confidence-weighted)" icon={<FaScaleBalanced className="inline-block" />}>
          <div
            className="flex h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800"
            title={`Bullish ${m.consensus.bullishPct}% · Neutral ${m.consensus.neutralPct}% · Bearish ${m.consensus.bearishPct}%`}
          >
            {m.consensus.bullishPct > 0 && (
              <div
                className="bg-emerald-500 border-r-2 border-white dark:border-gray-950"
                style={{ width: `${m.consensus.bullishPct}%` }}
              />
            )}
            {m.consensus.neutralPct > 0 && (
              <div
                className="bg-gray-400 dark:bg-gray-500 border-r-2 border-white dark:border-gray-950"
                style={{ width: `${m.consensus.neutralPct}%` }}
              />
            )}
            {m.consensus.bearishPct > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${m.consensus.bearishPct}%` }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600 dark:text-gray-300">
            <span>
              <FaArrowTrendUp className="inline-block mr-1 text-emerald-600 dark:text-emerald-400" />
              Bullish {m.consensus.bullishPct}%
            </span>
            <span>
              <FaMinus className="inline-block mr-1 text-gray-500 dark:text-gray-400" />
              Neutral {m.consensus.neutralPct}%
            </span>
            <span>
              <FaArrowTrendDown className="inline-block mr-1 text-red-600 dark:text-red-400" />
              Bearish {m.consensus.bearishPct}%
            </span>
          </div>

          {m.personaVotes.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Persona votes
              </p>
              <div className="flex flex-wrap gap-2">
                {m.personaVotes.map((v) => (
                  <span
                    key={v.persona}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300"
                    title={`${v.name}: ${v.verdict}`}
                  >
                    {leanIcon[v.lean]}
                    {v.name}
                    <span className="text-gray-400 dark:text-gray-500">
                      {v.verdict}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Analyst confidence */}
        <Section title="Analyst confidence by stance" icon={<FaChartSimple className="inline-block" />}>
          <div className="space-y-2">
            {m.analysts.map((a) => (
              <HBar
                key={a.role}
                label={a.role}
                value={a.confidence}
                color={stanceColor[a.stance]}
                valueLabel={`${a.confidence}`}
                title={`${a.role}: ${a.stance}, confidence ${a.confidence}/100`}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[11px]">
            {(['bullish', 'neutral', 'bearish'] as Stance[]).map((s) => (
              <span key={s} className={`capitalize ${stanceText[s]}`}>
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1 ${stanceColor[s]}`}
                />
                {s}
              </span>
            ))}
          </div>
        </Section>

        {/* Conviction path */}
        <Section title="Conviction through the pipeline" icon={<FaGaugeHigh className="inline-block" />}>
          <div className="space-y-2">
            {m.convictionPath.trader != null && (
              <HBar
                label="Trader"
                value={m.convictionPath.trader}
                color="bg-emerald-400"
                title={`Trader's initial conviction: ${m.convictionPath.trader}/100`}
              />
            )}
            {m.convictionPath.riskAdjusted != null && (
              <HBar
                label="Risk-adjusted"
                value={m.convictionPath.riskAdjusted}
                color="bg-amber-500"
                title={`After risk manager stress-test: ${m.convictionPath.riskAdjusted}/100`}
              />
            )}
            {m.convictionPath.final != null && (
              <HBar
                label="PM final"
                value={m.convictionPath.final}
                color="bg-emerald-600"
                title={`Portfolio manager's final conviction: ${m.convictionPath.final}/100`}
              />
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
            The risk manager may only lower conviction; the PM signs off on the
            final number.
          </p>
        </Section>

        {/* Key levels */}
        {m.keyLevels && (
          <Section title="Key technical levels" icon={<FaChartSimple className="inline-block" />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-red-600 dark:text-red-400 mb-1">
                  Resistance
                </p>
                <ul className="space-y-0.5">
                  {m.keyLevels.resistance.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm font-mono font-medium text-gray-900 dark:text-white"
                    >
                      {r}
                    </li>
                  ))}
                  {m.keyLevels.resistance.length === 0 && (
                    <li className="text-xs text-gray-500">—</li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">
                  Support
                </p>
                <ul className="space-y-0.5">
                  {m.keyLevels.support.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm font-mono font-medium text-gray-900 dark:text-white"
                    >
                      {s}
                    </li>
                  ))}
                  {m.keyLevels.support.length === 0 && (
                    <li className="text-xs text-gray-500">—</li>
                  )}
                </ul>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
