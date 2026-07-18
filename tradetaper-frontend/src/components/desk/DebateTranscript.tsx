'use client';

import React from 'react';
import { FaUserTie, FaScaleBalanced, FaShieldHalved, FaGavel } from 'react-icons/fa6';
import { DeskStages, PERSONA_LABELS, DeskPersona } from '@/types/taperai';

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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
        <span className="mr-2 text-emerald-600 dark:text-emerald-400">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

const stanceBadge: Record<string, string> = {
  bullish: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  bearish: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export default function DebateTranscript({ stages }: { stages: DeskStages }) {
  const analysts = stages.analysts ?? {};
  const debate = stages.debate ?? [];
  const personas = stages.personaOpinions ?? {};
  const risk = stages.risk;
  const pm = stages.pm;

  return (
    <div className="space-y-4">
      {/* Analysts */}
      {Object.keys(analysts).length > 0 && (
        <Section title="Analyst reports" icon={<FaUserTie className="inline-block" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(analysts).map(([role, report]) => (
              <div key={role} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                    {role}
                  </p>
                  {report.stance && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${stanceBadge[report.stance] ?? stanceBadge.neutral}`}
                    >
                      {report.stance} {typeof report.confidence === 'number' ? `· ${report.confidence}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{report.summary}</p>
                {report.bullets?.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5">
                    {report.bullets.map((b, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {report.dataGaps && report.dataGaps.length > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                    Data gaps: {report.dataGaps.join('; ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Bull vs Bear */}
      {debate.length > 0 && (
        <Section title="Bull vs. Bear debate" icon={<FaScaleBalanced className="inline-block" />}>
          <div className="space-y-3">
            {debate.map((entry, i) => {
              const isBull = entry.side === 'bull';
              return (
                <div
                  key={i}
                  className={`rounded-lg p-3 border-l-4 ${
                    isBull
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                      : 'border-red-500 bg-red-50/60 dark:bg-red-950/30'
                  }`}
                >
                  <p className="text-xs font-bold uppercase mb-1 text-gray-700 dark:text-gray-300">
                    {isBull ? 'Bull researcher' : 'Bear researcher'}
                    {entry.round ? ` — round ${entry.round}` : ''}
                  </p>
                  {entry.argument && (
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{entry.argument}</p>
                  )}
                  {entry.rebuttals && entry.rebuttals.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 mb-1">
                      {entry.rebuttals.map((r, j) => (
                        <li key={j} className="text-xs text-gray-700 dark:text-gray-300">
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.concessions && entry.concessions.length > 0 && (
                    <p className="text-xs italic text-gray-600 dark:text-gray-400">
                      Concedes: {entry.concessions.join('; ')}
                    </p>
                  )}
                  {entry.closingArgument && (
                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                      {entry.closingArgument}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Personas */}
      {Object.keys(personas).length > 0 && (
        <Section title="Persona opinions" icon={<FaUserTie className="inline-block" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(personas).map(([key, opinion]) => (
              <div key={key} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                  {PERSONA_LABELS[key as DeskPersona]?.name ?? key}
                </p>
                <p className="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {opinion.verdict?.replace(/-/g, ' ')}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">{opinion.reasoning}</p>
                {opinion.keyQuestion && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1">
                    Key question: {opinion.keyQuestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Risk */}
      {risk && (
        <Section title="Risk manager" icon={<FaShieldHalved className="inline-block" />}>
          {risk.whatKillsThis && risk.whatKillsThis.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 mb-2">
              {risk.whatKillsThis.map((r, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                  {r}
                </li>
              ))}
            </ul>
          )}
          {risk.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{risk.notes}</p>
          )}
        </Section>
      )}

      {/* PM */}
      {pm && (
        <Section title="Portfolio manager sign-off" icon={<FaGavel className="inline-block" />}>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mr-2 ${
                pm.decision === 'approved'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              }`}
            >
              {pm.decision ?? 'n/a'}
            </span>
            {pm.summary ?? pm.reasonIfRejected ?? ''}
          </p>
        </Section>
      )}
    </div>
  );
}
