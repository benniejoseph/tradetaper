// Trading session enums
export enum TradingSession {
  ASIA = 'Asia',
  LONDON = 'London',
  NEW_YORK = 'New York',
  LONDON_NY_OVERLAP = 'London-NY Overlap',
  OTHER = 'Other',
}

// ICT Concept enums
export enum ICTConcept {
  ORDER_BLOCK = 'Order Block',
  FAIR_VALUE_GAP = 'Fair Value Gap',
  LIQUIDITY_SWEEP = 'Liquidity Sweep',
  BREAK_OF_STRUCTURE = 'Break of Structure',
  CHANGE_OF_CHARACTER = 'Change of Character',
  PREMIUM_DISCOUNT = 'Premium/Discount',
  KILL_ZONE = 'Kill Zone',
  SMART_MONEY_REVERSAL = 'Smart Money Reversal',
  BALANCED_PRICE_RANGE = 'Balanced Price Range',
  OPTIMAL_TRADE_ENTRY = 'Optimal Trade Entry'
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
