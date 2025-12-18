'use client';

import React, { useState, useEffect } from 'react';
import {
  FaChartLine,
  FaWater,
  FaChartBar,
  FaCrosshairs,
  FaCube,
  FaClock,
  FaMoneyBillWave,
  FaBolt,
  FaSync,
} from 'react-icons/fa';
import ICTScoreGauge from './ICTScoreGauge';

interface CompleteICTData {
  symbol: string;
  ictScore: number;
  overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  alignment: number;
  narrative: string;
  concepts: {
    liquidity: any;
    marketStructure: any;
    fairValueGaps: any;
    orderBlocks: any;
    killZone: any;
    premiumDiscount: any;
    powerOfThree: any;
  };
  tradingPlan: {
    setup: string;
    bias: string;
    entryZone: { min: number; max: number };
    stopLoss: number;
    takeProfit: { tp1: number; tp2: number; tp3: number };
    riskReward: number;
    reasoning: string;
  };
  entryZones: any[];
}

interface Props {
  symbol: string;
}

export default function CompleteICTAnalysis({ symbol }: Props) {
  const [data, setData] = useState<CompleteICTData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompleteAnalysis();
  }, [symbol]);

  const fetchCompleteAnalysis = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${API_BASE_URL}/ict/complete-analysis?symbol=${symbol}`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        // Demo data
        setData(generateDemoData(symbol));
      }
    } catch (error) {
      console.error('Error fetching Complete ICT Analysis:', error);
      setData(generateDemoData(symbol));
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = (sym: string): CompleteICTData => {
    return {
      symbol: sym,
      ictScore: 87,
      overallBias: 'BULLISH',
      confidence: 82,
      alignment: 90,
      narrative: `Strong bullish ICT setup for ${sym}. Price swept sell-side liquidity at 1.0795, creating a liquidity void. Bullish Order Block confirmed at 1.0820 with an unmitigated Fair Value Gap. Premium/Discount analysis shows we're in discount territory (38% Fibonacci), ideal for long entries. Currently in London Kill Zone (optimal time). Power of Three model indicates we're in the Manipulation phase, expecting distribution to the upside soon.`,
      concepts: {
        liquidity: {
          buySideLiquidity: [{ price: 1.0920, strength: 'HIGH' }],
          sellSideLiquidity: [{ price: 1.0780, strength: 'MEDIUM', swept: true }],
          nearestTarget: 1.0920,
          voids: [{ high: 1.0850, low: 1.0830 }],
        },
        marketStructure: {
          trend: 'BULLISH',
          lastBOS: 1.0850,
          lastCHoCH: null,
          swingHigh: 1.0920,
          swingLow: 1.0780,
        },
        fairValueGaps: {
          bullish: [{ high: 1.0835, low: 1.0815, mitigated: false }],
          bearish: [],
          nearest: 1.0825,
        },
        orderBlocks: {
          bullish: [{ price: 1.0820, strength: 85, volume: 'HIGH' }],
          bearish: [],
          nearest: 1.0820,
        },
        killZone: {
          current: 'London Open',
          isOptimal: true,
          nextZone: 'NY Open',
        },
        premiumDiscount: {
          position: 'DISCOUNT',
          percentage: 38,
          optimalEntry: { min: 1.0815, max: 1.0835 },
        },
        powerOfThree: {
          phase: 'MANIPULATION',
          description: 'Liquidity sweep complete, expecting distribution',
          progress: 65,
        },
      },
      tradingPlan: {
        setup: 'Bullish Order Block + FVG in Discount',
        bias: 'LONG',
        entryZone: { min: 1.0815, max: 1.0835 },
        stopLoss: 1.0795,
        takeProfit: { tp1: 1.0860, tp2: 1.0890, tp3: 1.0920 },
        riskReward: 3.5,
        reasoning: 'All ICT concepts align for a bullish setup. Enter on retracement to OB/FVG zone in discount. Target buy-side liquidity at 1.0920.',
      },
      entryZones: [
        { type: 'Order Block', price: 1.0820, strength: 'HIGH' },
        { type: 'Fair Value Gap', price: 1.0825, strength: 'MEDIUM' },
      ],
    };
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaSync className="animate-spin text-emerald-600" />
          <span className="text-gray-900 dark:text-white">Loading Complete ICT Analysis...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Complete ICT Analysis</h2>
        <p className="text-emerald-100">
          Comprehensive analysis using all ICT concepts for {data.symbol}
        </p>
      </div>

      {/* ICT Score Gauge */}
      <ICTScoreGauge
        score={data.ictScore}
        confidence={data.confidence}
        bias={data.overallBias}
        alignment={data.alignment}
      />

      {/* ICT Narrative */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaChartLine className="mr-2 text-emerald-600" />
          ICT Narrative
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.narrative}
        </p>
      </div>

      {/* All ICT Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Liquidity */}
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaWater className="text-emerald-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">Liquidity</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Buy-Side Target:</p>
              <p className="font-mono font-bold text-green-600">
                {data.concepts?.liquidity?.nearestTarget?.toFixed(4) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Sell-Side Swept:</p>
              <p className="font-mono text-gray-900 dark:text-white">
                {data.concepts?.liquidity?.sellSideLiquidity?.[0]?.swept ? '✓ Yes' : '✗ No'}
              </p>
            </div>
          </div>
        </div>

        {/* Market Structure */}
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaChartBar className="text-emerald-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Market Structure</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Trend:</p>
              <p className={`font-bold ${
                data.concepts?.marketStructure?.trend === 'BULLISH'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {data.concepts?.marketStructure?.trend || 'NEUTRAL'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Last BOS:</p>
              <p className="font-mono text-gray-900 dark:text-white">
                {data.concepts?.marketStructure?.lastBOS?.toFixed(4) || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Fair Value Gaps */}
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaCrosshairs className="text-yellow-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">Fair Value Gaps</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Bullish FVGs:</p>
              <p className="font-bold text-green-600">
                {data.concepts?.fairValueGaps?.bullish?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Nearest:</p>
              <p className="font-mono text-gray-900 dark:text-white">
                {data.concepts?.fairValueGaps?.nearest?.toFixed(4) || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Blocks */}
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaCube className="text-green-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">Order Blocks</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Bullish OBs:</p>
              <p className="font-bold text-green-600">
                {data.concepts?.orderBlocks?.bullish?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Nearest:</p>
              <p className="font-mono text-gray-900 dark:text-white">
                {data.concepts?.orderBlocks?.nearest?.toFixed(4) || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Kill Zones */}
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaClock className="text-emerald-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">Kill Zones</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Current:</p>
              <p className="font-bold text-emerald-600">
                {data.concepts?.killZone?.current || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Optimal:</p>
              <p className={`font-bold ${data.concepts?.killZone?.isOptimal ? 'text-green-600' : 'text-gray-600'}`}>
                {data.concepts?.killZone?.isOptimal ? '✓ Yes' : '✗ No'}
              </p>
            </div>
          </div>
        </div>

        {/* Premium/Discount */}
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaMoneyBillWave className="text-emerald-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Premium/Discount</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Position:</p>
              <p className={`font-bold ${
                data.concepts?.premiumDiscount?.position === 'DISCOUNT'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {data.concepts?.premiumDiscount?.position || 'NEUTRAL'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Level:</p>
              <p className="font-mono text-gray-900 dark:text-white">
                {data.concepts?.premiumDiscount?.percentage || 50}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Plan */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-6 border-2 border-green-500">
        <div className="flex items-center space-x-2 mb-4">
          <FaBolt className="text-green-600 text-xl" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trading Plan</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Setup Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Setup:</span>
                <span className="font-medium text-gray-900 dark:text-white">{data.tradingPlan?.setup || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Bias:</span>
                <span className={`font-bold ${
                  data.tradingPlan?.bias === 'LONG' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.tradingPlan?.bias || 'NEUTRAL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Risk/Reward:</span>
                <span className="font-bold text-green-600">{data.tradingPlan?.riskReward || 'N/A'}R</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Entry & Targets</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Entry Zone:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {data.tradingPlan?.entryZone?.min?.toFixed(4) || 'N/A'} - {data.tradingPlan?.entryZone?.max?.toFixed(4) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Stop Loss:</span>
                <span className="font-mono text-red-600">{data.tradingPlan?.stopLoss?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Take Profit:</span>
                <span className="font-mono text-green-600">
                  {data.tradingPlan?.takeProfit?.tp1?.toFixed(4) || 'N/A'} / {data.tradingPlan?.takeProfit?.tp2?.toFixed(4) || 'N/A'} / {data.tradingPlan?.takeProfit?.tp3?.toFixed(4) || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Reasoning:</strong> {data.tradingPlan?.reasoning || 'No trading plan reasoning available'}
          </p>
        </div>
      </div>
    </div>
  );
}

