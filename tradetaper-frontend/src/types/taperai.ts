// src/types/taperai.ts

export type DeskRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type DeskDirection = 'long' | 'short' | 'neutral';
export type DeskPersona = 'buffett' | 'burry' | 'wood';

export type HorizonKey = 'today' | 'week' | 'shortTerm' | 'longTerm';

export interface HorizonRead {
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  driver: string;
  flipLevel: string;
}

export interface NewsItem {
  title: string;
  publisher: string;
  publishedUtc: string;
  description?: string;
  sentiment?: string;
  sentimentReasoning?: string;
}

export interface TimeframeStats {
  label: string;
  bars: number;
  last: number;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  changePct1: number | null;
  changePct5: number | null;
  changePct20: number | null;
  atrPct: number | null;
  rangeHigh: number;
  rangeLow: number;
}

export interface SwingPoint {
  date: string;
  price: number;
  type: 'high' | 'low';
}

export interface FairValueGap {
  date: string;
  type: 'bullish' | 'bearish';
  top: number;
  bottom: number;
  mitigated: boolean;
}

export interface EqualLevel {
  price: number;
  count: number;
}

export interface KillZoneStatus {
  nowNy: string;
  activeZone: string | null;
  activeZoneIsNoTrade: boolean;
  nextZone: string;
  minutesToNextZone: number;
}

export interface ICTContext {
  pdh: number | null;
  pdl: number | null;
  pwh: number | null;
  pwl: number | null;
  ipda20Eq: number | null;
  ipda20High: number | null;
  ipda20Low: number | null;
  premiumDiscount: 'premium' | 'discount' | 'equilibrium' | null;
  adr14: number | null;
  dailyStructure: 'bullish' | 'bearish' | 'choppy' | null;
  dailySwings: SwingPoint[];
  intradaySwings: SwingPoint[];
  dailyFvgs: FairValueGap[];
  intradayFvgs: FairValueGap[];
  equalHighs: EqualLevel[];
  equalLows: EqualLevel[];
  killZone: KillZoneStatus;
}

export interface MarketSnapshot {
  symbol: string;
  resolvedSymbol: string;
  assetClass: 'equity' | 'forex' | 'crypto';
  sources: string[];
  asOf: string;
  quote: {
    price: number | null;
    previousClose: number | null;
    changePct: number | null;
    dayHigh: number | null;
    dayLow: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    currency?: string;
    volume?: number | null;
  };
  timeframes: Partial<Record<'intraday' | 'daily' | 'weekly', TimeframeStats>>;
  ict?: ICTContext | null;
  news: NewsItem[];
  newsWindowDays: number;
  errors: string[];
}

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
  // ICT analyst fields
  bias?: { daily?: string; weekly?: string };
  premiumDiscount?: 'premium' | 'discount' | 'equilibrium' | 'unknown';
  dol?: { target?: string; priority?: string; rationale?: string };
  pdArray?: { type?: string; zone?: string; rationale?: string };
  liquidity?: { swept?: string; resting?: string };
  killZoneNote?: string;
  model?: string;
  invalidation?: string;
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
  snapshot?: MarketSnapshot;
  analysts?: Record<string, AnalystReport>;
  debate?: DebateEntry[];
  personaOpinions?: Record<string, PersonaOpinion>;
  trader?: Record<string, unknown> & {
    horizons?: Partial<Record<HorizonKey, HorizonRead>>;
    timeframeConflict?: string;
  };
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
