// src/services/ictService.ts
import { authApiClient as api } from './api';

export interface KillZoneData {
  currentZone: string | null;
  isOptimal: boolean;
  nextZone: {
    name: string;
    startsIn: number;
    timeUntil: string;
  } | null;
  allZones: Array<{
    name: string;
    start: string;
    end: string;
    timeZone: string;
    description: string;
    type: string;
    color: string;
    isActive?: boolean;
  }>;
}

export interface PremiumDiscountData {
  symbol: string;
  currentPrice: number;
  position: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';
  percentage: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  fibonacci: Array<{
    level: number;
    price: number;
    label: string;
    zone: 'premium' | 'discount' | 'equilibrium';
  }>;
  optimalTradeEntry: {
    min: number;
    max: number;
    zones: string[];
  };
  recommendation: string;
}

export interface PowerOfThreeData {
  symbol: string;
  currentPhase: 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION' | 'UNKNOWN';
  confidence: number;
  description: string;
  characteristics: string[];
  tradingGuidance: string;
  supportingEvidence: string[];
}

/**
 * Fetch Kill Zones status
 */
export const getKillZones = async (): Promise<KillZoneData> => {
  try {
    const response = await api.get('/ict/kill-zones');
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to fetch kill zones:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch kill zones');
  }
};

/**
 * Fetch Premium/Discount analysis for a symbol
 */
export const getPremiumDiscount = async (
  symbol: string,
  timeframe: string = '1H'
): Promise<PremiumDiscountData> => {
  try {
    const response = await api.get(`/ict/premium-discount/${symbol}`, {
      params: { timeframe }
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to fetch premium/discount:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch premium/discount data');
  }
};

/**
 * Fetch Power of Three analysis for a symbol
 */
export const getPowerOfThree = async (
  symbol: string,
  timeframe: string = '1H'
): Promise<PowerOfThreeData> => {
  try {
    const response = await api.get(`/ict/power-of-three/${symbol}`, {
      params: { timeframe }
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to fetch power of three:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch power of three data');
  }
};

/**
 * Fetch complete ICT analysis for a symbol
 */
export const getCompleteICTAnalysis = async (symbol: string) => {
  try {
    const response = await api.get('/ict/complete-analysis', {
      params: { symbol }
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to fetch complete ICT analysis:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch ICT analysis');
  }
};

