// src/types/taperai.ts

export type DeskRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type DeskDirection = 'long' | 'short' | 'neutral';
export type DeskPersona = 'buffett' | 'burry' | 'wood';

export interface DeskVerdict {
  direction: DeskDirection;
  conviction: number; // 0-100
  horizon: string;
  thesis: string;
  entry?: string;
  exit?: string;
  invalidation: string;
  dissent?: string;
}

export interface AnalystReport {
  role: string;
  summary: string;
  bullets: string[];
  stance: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  dataGaps?: string[];
  keyLevels?: { support: string[]; resistance: string[] };
  upcomingCatalysts?: string[];
  crowdedness?: string;
  parseError?: boolean;
  raw?: string;
}

export interface DebateEntry {
  side: 'bull' | 'bear';
  round?: number;
  argument?: string;
  strongestPoints?: string[];
  rebuttals?: string[];
  concessions?: string[];
  acknowledgedRisks?: string[];
  acknowledgedStrengths?: string[];
  closingArgument?: string;
  parseError?: boolean;
  raw?: string;
}

export interface PersonaOpinion {
  persona: string;
  verdict: string;
  reasoning: string;
  keyQuestion?: string;
  whatTheCrowdMisses?: string;
  fiveYearThesis?: string;
  parseError?: boolean;
  raw?: string;
}

export interface DeskStages {
  context?: string;
  analysts?: Record<string, AnalystReport>;
  debate?: DebateEntry[];
  personaOpinions?: Record<string, PersonaOpinion>;
  trader?: Record<string, unknown>;
  risk?: {
    adjustedConviction?: number;
    whatKillsThis?: string[];
    suggestedRiskPercent?: number;
    notes?: string;
  };
  pm?: {
    decision?: 'approved' | 'rejected';
    finalDirection?: DeskDirection;
    finalConviction?: number;
    summary?: string;
    reasonIfRejected?: string;
  };
}

export interface DeskRun {
  id: string;
  symbol: string;
  status: DeskRunStatus;
  personas: DeskPersona[];
  stages?: DeskStages;
  verdict?: DeskVerdict;
  direction?: DeskDirection;
  conviction?: number;
  error?: string;
  totalTokens?: number;
  totalCostUsd?: number | string;
  durationMs?: number;
  createdAt: string;
  completedAt?: string;
}

export const PERSONA_LABELS: Record<DeskPersona, { name: string; blurb: string }> = {
  buffett: { name: 'The Value Investor', blurb: 'Moats, margin of safety, decade horizons' },
  burry: { name: 'The Contrarian', blurb: 'What is the crowd wrong about?' },
  wood: { name: 'The Disruption Investor', blurb: 'S-curves and five-year exponentials' },
};
