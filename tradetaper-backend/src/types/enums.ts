// Trading enums - centralized definitions
export enum AssetType {
  STOCK = 'Stock',
  CRYPTO = 'Crypto',
  FOREX = 'Forex',
  INDICES = 'Indices', // Added INDICES
  COMMODITIES = 'Commodities',
  FUTURES = 'Futures',
  OPTIONS = 'Options',
}

export enum TradeDirection {
  LONG = 'Long',
  SHORT = 'Short',
}

export enum TradeStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  PENDING = 'Pending',
  CANCELLED = 'Cancelled',
}

export enum TradingSession {
  LONDON = 'London',
  NEW_YORK = 'New York',
  ASIA = 'Asia',
  LONDON_NY_OVERLAP = 'London-NY Overlap',
  OTHER = 'Other',
}

export enum ICTConcept {
  FVG = 'Fair Value Gap',
  ORDER_BLOCK = 'Order Block',
  BREAKER_BLOCK = 'Breaker Block',
  MITIGATION_BLOCK = 'Mitigation Block',
  LIQUIDITY_GRAB = 'Liquidity Grab (BSL/SSL)',
  LIQUIDITY_VOID = 'Liquidity Void',
  SILVER_BULLET = 'Silver Bullet',
  JUDAS_SWING = 'Judas Swing',
  SMT_DIVERGENCE = 'SMT Divergence',
  POWER_OF_THREE = 'Power of Three (AMD)',
  OPTIMAL_TRADE_ENTRY = 'Optimal Trade Entry (OTE)',
  MARKET_STRUCTURE_SHIFT = 'Market Structure Shift (MSS)',
  OTHER = 'Other',
}

export enum MarketMovementType {
  EXPANSION = 'Expansion',
  RETRACEMENT = 'Retracement',
  REVERSAL = 'Reversal',
  CONSOLIDATION = 'Consolidation',
  OTHER = 'Other',
}

export enum MarketSentiment {
  BULLISH = 'Bullish',
  BEARISH = 'Bearish',
  NEUTRAL = 'Neutral',
}

// ========== PHASE 1: Psychology & Emotion Tracking ==========
export enum EmotionalState {
  CALM = 'Calm',
  CONFIDENT = 'Confident',
  ANXIOUS = 'Anxious',
  FEARFUL = 'Fearful',
  GREEDY = 'Greedy',
  FRUSTRATED = 'Frustrated',
  OVERCONFIDENT = 'Overconfident',
  IMPATIENT = 'Impatient',
  FOMO = 'FOMO',
  REVENGE = 'Revenge Trading',
  BORED = 'Bored',
  FATIGUED = 'Fatigued',
  EXCITED = 'Excited',
  NERVOUS = 'Nervous',
  HOPEFUL = 'Hopeful',
  DISAPPOINTED = 'Disappointed',
  RELIEVED = 'Relieved',
  OVERWHELMED = 'Overwhelmed',
  HESITANT = 'Hesitant',
  RUSHED = 'Rushed',
  DISTRACTED = 'Distracted',
  FOCUSED = 'Focused',
}

// ========== PHASE 2: Execution Grading ==========
export enum ExecutionGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}

// ========== PHASE 3: Market Context ==========
export enum MarketCondition {
  TRENDING_UP = 'Trending Up',
  TRENDING_DOWN = 'Trending Down',
  RANGING = 'Ranging',
  CHOPPY = 'Choppy',
  HIGH_VOLATILITY = 'High Volatility',
  LOW_VOLATILITY = 'Low Volatility',
  NEWS_DRIVEN = 'News Driven',
  PRE_NEWS = 'Pre-News',
}

export enum HTFBias {
  BULLISH = 'Bullish',
  BEARISH = 'Bearish',
  NEUTRAL = 'Neutral',
}

export enum Timeframe {
  M1 = '1m',
  M5 = '5m',
  M15 = '15m',
  M30 = '30m',
  H1 = '1H',
  H4 = '4H',
  D1 = '1D',
  W1 = '1W',
  MN = '1M',
}
