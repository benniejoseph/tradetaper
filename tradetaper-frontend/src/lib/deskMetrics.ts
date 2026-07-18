// src/lib/deskMetrics.ts
import { DeskRun, DeskStages, PERSONA_LABELS, DeskPersona } from '@/types/taperai';

/**
 * Deterministic analytics computed client-side from a completed Desk run's
 * stored pipeline stages. All math lives here (never in the LLM), and it
 * works for historical runs too — nothing depends on newer backend fields.
 */

export type Stance = 'bullish' | 'bearish' | 'neutral';
export type PersonaLean = 'bull' | 'bear' | 'neutral';

export interface AnalystStat {
  role: string;
  stance: Stance;
  confidence: number; // 0-100
}

export interface PersonaVote {
  persona: string;
  name: string;
  verdict: string;
  lean: PersonaLean;
}

export interface DeskMetrics {
  analysts: AnalystStat[];
  /** Confidence-weighted stance split, percentages summing to ~100 */
  consensus: { bullishPct: number; bearishPct: number; neutralPct: number };
  /** -100 (unanimous bear) .. +100 (unanimous bull) */
  consensusScore: number;
  personaVotes: PersonaVote[];
  convictionPath: {
    trader?: number;
    riskAdjusted?: number;
    final?: number;
  };
  riskRewardRatio?: number;
  probabilityOfSuccess?: number;
  suggestedRiskPercent?: number;
  keyLevels?: { support: string[]; resistance: string[] };
  run: {
    durationSec?: number;
    costUsd?: number;
    totalTokens?: number;
    llmCalls: number;
  };
}

const PERSONA_LEAN: Record<string, PersonaLean> = {
  attractive: 'bull',
  'contrarian-long': 'bull',
  'exponential-opportunity': 'bull',
  unattractive: 'bear',
  'crowded-long': 'bear',
  'asymmetric-short': 'bear',
  'legacy-risk': 'bear',
  'outside-competence': 'neutral',
  'no-edge': 'neutral',
  'not-disruptive': 'neutral',
};

const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export function computeDeskMetrics(run: DeskRun): DeskMetrics | null {
  const stages: DeskStages | undefined = run.stages;
  if (!stages) return null;

  // ---- Analyst stats ------------------------------------------------------
  const analysts: AnalystStat[] = Object.entries(stages.analysts ?? {})
    .filter(([, r]) => r && !r.parseError)
    .map(([role, r]) => ({
      role,
      stance: (['bullish', 'bearish', 'neutral'] as Stance[]).includes(
        r.stance as Stance,
      )
        ? (r.stance as Stance)
        : 'neutral',
      confidence: clamp(num(r.confidence) ?? 50, 0, 100),
    }));

  // ---- Confidence-weighted consensus --------------------------------------
  const weight = (s: Stance) =>
    analysts
      .filter((a) => a.stance === s)
      .reduce((sum, a) => sum + a.confidence, 0);
  const bull = weight('bullish');
  const bear = weight('bearish');
  const neutral = weight('neutral');
  const total = bull + bear + neutral;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const consensusScore =
    total > 0 ? Math.round(((bull - bear) / total) * 100) : 0;

  // ---- Persona votes ------------------------------------------------------
  const personaVotes: PersonaVote[] = Object.entries(
    stages.personaOpinions ?? {},
  )
    .filter(([, o]) => o && !o.parseError && o.verdict)
    .map(([persona, o]) => ({
      persona,
      name: PERSONA_LABELS[persona as DeskPersona]?.name ?? persona,
      verdict: String(o.verdict).replace(/-/g, ' '),
      lean: PERSONA_LEAN[String(o.verdict)] ?? 'neutral',
    }));

  // ---- Conviction path ----------------------------------------------------
  const trader = stages.trader as Record<string, unknown> | undefined;
  const convictionPath = {
    trader: num(trader?.conviction),
    riskAdjusted: num(stages.risk?.adjustedConviction),
    final: num(stages.pm?.finalConviction) ?? run.conviction ?? undefined,
  };

  // ---- Key levels (from the technical analyst) ----------------------------
  const technical = stages.analysts?.technical;
  const keyLevels =
    technical?.keyLevels &&
    (technical.keyLevels.support?.length || technical.keyLevels.resistance?.length)
      ? {
          support: technical.keyLevels.support ?? [],
          resistance: technical.keyLevels.resistance ?? [],
        }
      : undefined;

  return {
    analysts,
    consensus: {
      bullishPct: pct(bull),
      bearishPct: pct(bear),
      neutralPct: pct(neutral),
    },
    consensusScore,
    personaVotes,
    convictionPath,
    riskRewardRatio: num(trader?.riskRewardRatio),
    probabilityOfSuccess: num(trader?.probabilityOfSuccess),
    suggestedRiskPercent: num(stages.risk?.suggestedRiskPercent),
    keyLevels,
    run: {
      durationSec: run.durationMs ? Math.round(run.durationMs / 1000) : undefined,
      costUsd: num(run.totalCostUsd),
      totalTokens: run.totalTokens,
      llmCalls:
        analysts.length + personaVotes.length + 3 /* debate */ + 3 /* T/R/PM */,
    },
  };
}
