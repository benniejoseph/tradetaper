// Backtest Trade Types

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';
export type KillZone = 'london_open' | 'ny_open' | 'ny_close' | 'asia_open' | 'overlap' | 'none';
export type MarketStructure = 'bullish' | 'bearish' | 'consolidating';
export type HTFBias = 'bullish' | 'bearish' | 'neutral';
export type TradeOutcome = 'win' | 'loss' | 'breakeven';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
export type TradingSession = 'London' | 'New York' | 'Asia' | 'London-NY Overlap' | 'Other';
export type TradeDirection = 'Long' | 'Short';

export interface BacktestTrade {
  id: string;
  strategyId: string;
  userId: string;
  
  // Trade Details
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize: number;
  
  // Timing Dimensions
  timeframe: Timeframe;
  session?: TradingSession;
  killZone?: KillZone;
  dayOfWeek?: DayOfWeek;
  hourOfDay?: number;
  tradeDate: string;
  
  // Setup Details
  setupType?: string;
  ictConcept?: string;
  marketStructure?: MarketStructure;
  htfBias?: HTFBias;
  
  // Results
  outcome: TradeOutcome;
  pnlPips?: number;
  pnlDollars?: number;
  rMultiple?: number;
  holdingTimeMinutes?: number;
  
  // Quality Metrics
  entryQuality?: number;
  executionQuality?: number;
  followedRules: boolean;
  checklistScore?: number;
  
  // Notes
  notes?: string;
  screenshotUrl?: string;
  lessonLearned?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface CreateBacktestTradeDto {
  strategyId: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize?: number;
  timeframe: Timeframe;
  session?: TradingSession;
  killZone?: KillZone;
  dayOfWeek?: DayOfWeek;
  hourOfDay?: number;
  tradeDate: string;
  setupType?: string;
  ictConcept?: string;
  marketStructure?: MarketStructure;
  htfBias?: HTFBias;
  outcome: TradeOutcome;
  pnlPips?: number;
  pnlDollars?: number;
  rMultiple?: number;
  holdingTimeMinutes?: number;
  entryQuality?: number;
  executionQuality?: number;
  followedRules?: boolean;
  checklistScore?: number;
  notes?: string;
  screenshotUrl?: string;
  lessonLearned?: string;
}

export interface BacktestStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnlDollars: number;
  totalPnlPips: number;
  averagePnlDollars: number;
  averagePnlPips: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  averageRMultiple: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageEntryQuality: number;
  ruleFollowingRate: number;
  averageChecklistScore: number;
}

export interface DimensionStats {
  dimension: string;
  value: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number;
  recommendation: 'TRADE' | 'CAUTION' | 'AVOID' | 'MORE_DATA';
}

export interface PerformanceMatrix {
  rows: string[];
  columns: string[];
  data: {
    row: string;
    column: string;
    trades: number;
    winRate: number;
    totalPnl: number;
    profitFactor: number;
  }[];
}

export interface AnalysisData {
  overallStats: BacktestStats;
  bySymbol: DimensionStats[];
  bySession: DimensionStats[];
  byTimeframe: DimensionStats[];
  byKillZone: DimensionStats[];
  byDayOfWeek: DimensionStats[];
  bySetup: DimensionStats[];
  bestConditions: Record<string, DimensionStats | undefined>;
  worstConditions: Record<string, DimensionStats | undefined>;
  tradeCount: number;
  dateRange: { start: string; end: string } | null;
}

// Constants for dropdowns
export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'M1', label: '1 Minute' },
  { value: 'M5', label: '5 Minutes' },
  { value: 'M15', label: '15 Minutes' },
  { value: 'M30', label: '30 Minutes' },
  { value: 'H1', label: '1 Hour' },
  { value: 'H4', label: '4 Hours' },
  { value: 'D1', label: 'Daily' },
  { value: 'W1', label: 'Weekly' },
];

export const SESSIONS: { value: TradingSession; label: string }[] = [
  { value: 'London', label: 'London' },
  { value: 'New York', label: 'New York' },
  { value: 'Asia', label: 'Asia' },
  { value: 'London-NY Overlap', label: 'London-NY Overlap' },
  { value: 'Other', label: 'Other' },
];

export const KILL_ZONES: { value: KillZone; label: string }[] = [
  { value: 'london_open', label: 'London Open (02:00-05:00 EST)' },
  { value: 'ny_open', label: 'NY Open (08:00-11:00 EST)' },
  { value: 'ny_close', label: 'NY Close (14:00-16:00 EST)' },
  { value: 'asia_open', label: 'Asia Open (20:00-23:00 EST)' },
  { value: 'overlap', label: 'London/NY Overlap' },
  { value: 'none', label: 'No Kill Zone' },
];

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
];

export const MARKET_STRUCTURES: { value: MarketStructure; label: string }[] = [
  { value: 'bullish', label: 'Bullish' },
  { value: 'bearish', label: 'Bearish' },
  { value: 'consolidating', label: 'Consolidating' },
];

export const HTF_BIASES: { value: HTFBias; label: string }[] = [
  { value: 'bullish', label: 'Bullish' },
  { value: 'bearish', label: 'Bearish' },
  { value: 'neutral', label: 'Neutral' },
];

export const OUTCOMES: { value: TradeOutcome; label: string }[] = [
  { value: 'win', label: 'Win' },
  { value: 'loss', label: 'Loss' },
  { value: 'breakeven', label: 'Breakeven' },
];

export const COMMON_SYMBOLS = [
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'NAS100',
  'US30',
  'SPX500',
  'BTCUSD',
  'ETHUSD',
];

export const ICT_CONCEPTS = [
  'Fair Value Gap',
  'Order Block',
  'Breaker Block',
  'Mitigation Block',
  'Liquidity Grab (BSL/SSL)',
  'Liquidity Void',
  'Silver Bullet',
  'Judas Swing',
  'SMT Divergence',
  'Power of Three (AMD)',
  'Optimal Trade Entry (OTE)',
  'Market Structure Shift (MSS)',
  'Other',
];

export const SETUP_TYPES = [
  'Order Block Entry',
  'Fair Value Gap Entry',
  'Breaker Block Entry',
  'Liquidity Sweep Entry',
  'BOS Entry',
  'CHoCH Entry',
  'Trend Continuation',
  'Reversal',
  'Breakout',
  'Pullback',
];

// Market Log Types
export type MarketMovementType = 'Expansion' | 'Retracement' | 'Reversal' | 'Consolidation' | 'Other';
export type MarketSentiment = 'Bullish' | 'Bearish' | 'Neutral';

export interface MarketLog {
  id: string;
  userId: string;
  symbol: string;
  tradeDate: string;
  timeframe: Timeframe;
  session?: TradingSession;
  tags?: string[];
  observation: string;
  movementType?: MarketMovementType;
  significance?: number;
  sentiment?: MarketSentiment;
  screenshotUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketLogDto {
  symbol: string;
  tradeDate: string;
  timeframe: Timeframe;
  session?: TradingSession;
  tags?: string[];
  observation: string;
  movementType?: MarketMovementType;
  significance?: number;
  sentiment?: MarketSentiment;
  screenshotUrl?: string;
}

export type UpdateMarketLogDto = Partial<CreateMarketLogDto>;

export const MARKET_MOVEMENTS: { value: MarketMovementType; label: string }[] = [
  { value: 'Expansion', label: 'Expansion' },
  { value: 'Retracement', label: 'Retracement' },
  { value: 'Reversal', label: 'Reversal' },
  { value: 'Consolidation', label: 'Consolidation' },
  { value: 'Other', label: 'Other' },
];

export const MARKET_SENTIMENTS: { value: MarketSentiment; label: string }[] = [
  { value: 'Bullish', label: 'Bullish' },
  { value: 'Bearish', label: 'Bearish' },
  { value: 'Neutral', label: 'Neutral' },
];

export interface MarketPatternDiscovery {
  tag: string;
  occurrences: number;
  confidence: number;
  avgSignificance: number;
  dominantPattern: string;
  dominantSentiment: string;
  movementDistribution: Record<string, number>;
  sentimentDistribution: Record<string, number>;
}

