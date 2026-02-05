// src/types/trade.ts

import { 
  ICTConcept, 
  TradingSession, 
  EmotionalState, 
  ExecutionGrade, 
  MarketCondition, 
  HTFBias, 
  Timeframe 
} from './enums';

// RE-DEFINED AssetType, TradeDirection, TradeStatus here
export enum AssetType {
  STOCK = 'Stock',
  CRYPTO = 'Crypto',
  FOREX = 'Forex',
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
    CANCELLED = 'Cancelled', // Added Cancelled as it was in the form
}

export interface Tag {
  id?: string; // Optional: May not have an ID if new and not yet saved
  name: string;
  userId?: string; // Optional: Depending on if tags are user-specific or global
  color?: string; // Optional: For UI display
  createdAt?: string;
  updatedAt?: string;
}

export interface Trade {
  id: string;
  userId: string;
  assetType: AssetType;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  commission?: number;
  notes?: string;
  profitOrLoss?: number;
  rMultiple?: number;
  ictConcept?: ICTConcept;
  session?: TradingSession;
  setupDetails?: string;
  mistakesMade?: string;
  lessonsLearned?: string;
  imageUrl?: string;
  chartAnalysisData?: any;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
  accountId?: string;
  isStarred?: boolean;
  marginUsed?: number;
  account?: { id: string; name: string; type: string; balance?: number };

  // ========== PHASE 1: Psychology & Emotion Tracking ==========
  emotionBefore?: EmotionalState;
  emotionDuring?: EmotionalState;
  emotionAfter?: EmotionalState;
  confidenceLevel?: number; // 1-10 scale
  followedPlan?: boolean;
  ruleViolations?: string[];

  // ========== PHASE 2: Advanced Performance Metrics ==========
  plannedRR?: number;
  maePrice?: number;
  mfePrice?: number;
  maePips?: number;
  mfePips?: number;
  slippage?: number;
  executionGrade?: ExecutionGrade;

  // ========== PHASE 3: Market Context ==========
  marketCondition?: MarketCondition;
  timeframe?: Timeframe;
  htfBias?: HTFBias;
  newsImpact?: boolean;

  // ========== PHASE 4: Pre-Trade Checklist ==========
  entryReason?: string;
  confirmations?: string[];
  hesitated?: boolean;
  preparedToLose?: boolean;

  // ========== PHASE 5: Environmental Factors ==========
  sleepQuality?: number; // 1-5 scale
  energyLevel?: number; // 1-5 scale
  distractionLevel?: number; // 1-5 scale
  tradingEnvironment?: string;
}

export interface CreateTradePayload extends Omit<Partial<Trade>, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'profitOrLoss' | 'tags'> {
  assetType: AssetType;
  symbol: string;
  direction: TradeDirection;
  entryDate: string;
  entryPrice: number;
  quantity: number;
  status?: TradeStatus; // Add status here, as it was in form and backend likely expects it
  ictConcept?: ICTConcept; 
  session?: TradingSession;
  tagNames?: string[]; 
  stopLoss?: number;
  takeProfit?: number;
  // Add other optional text fields that are part of the form
  notes?: string;
  setupDetails?: string;
  mistakesMade?: string;
  lessonsLearned?: string;
  imageUrl?: string;
  commission?: number;
  accountId?: string; // Added: To link trade to an account
  isStarred?: boolean; // New field for starring trades
}

export interface UpdateTradePayload extends Partial<Omit<CreateTradePayload, 'tagNames'>> {
  tagNames?: string[];
}

// Example Usage (Illustrative)
// const exampleTrade: Trade = {
//   id: '1',
//   userId: 'user123',
//   assetType: AssetType.FOREX,
//   symbol: 'EURUSD',
//   direction: TradeDirection.LONG,
//   status: TradeStatus.CLOSED,
//   entryDate: new Date().toISOString(),
//   entryPrice: 1.1200,
//   exitDate: new Date().toISOString(),
//   exitPrice: 1.1250,
//   quantity: 10000,
//   stopLoss: 1.1180,
//   takeProfit: 1.1260,
//   ictConcept: ICTConcept.FVG,
//   session: TradingSession.LONDON,
//   profitOrLoss: 50,
//   rMultiple: 2.5,
//   tags: [{name: 'Valid Setup'}, {name: 'Good Execution'}],
//   createdAt: new Date().toISOString(),
//   updatedAt: new Date().toISOString(),
// };