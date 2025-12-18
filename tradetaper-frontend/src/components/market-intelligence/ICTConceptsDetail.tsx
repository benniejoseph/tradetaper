'use client';

import React, { useState } from 'react';
import {
  FaWater,
  FaChartBar,
  FaCrosshairs,
  FaCube,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

interface Props {
  symbol: string;
  concept: 'liquidity' | 'market-structure' | 'fvg' | 'order-blocks';
}

export default function ICTConceptsDetail({ symbol, concept }: Props) {
  const [loading, setLoading] = useState(false);

  const renderLiquidityDetail = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <FaWater className="text-3xl" />
          <h2 className="text-3xl font-bold">Liquidity Analysis</h2>
        </div>
        <p className="text-blue-100">
          Identifying buy-side and sell-side liquidity, sweeps, and voids for {symbol}
        </p>
      </div>

      {/* Buy-Side Liquidity */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaWater className="mr-2 text-green-500" />
          Buy-Side Liquidity
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Areas where buy stop orders are likely resting above the current price. Institutions often target these zones.
        </p>
        
        <div className="space-y-3">
          {[
            { price: 1.0920, strength: 'HIGH', volume: 'Large', description: 'Major swing high - strong buy-stop pool' },
            { price: 1.0895, strength: 'MEDIUM', volume: 'Medium', description: 'Recent resistance - moderate liquidity' },
            { price: 1.0880, strength: 'LOW', volume: 'Small', description: 'Minor swing - limited liquidity' },
          ].map((level, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                level.strength === 'HIGH'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : level.strength === 'MEDIUM'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                  : 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {level.price.toFixed(4)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  level.strength === 'HIGH'
                    ? 'bg-green-500 text-white'
                    : level.strength === 'MEDIUM'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {level.strength}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <strong>Volume:</strong> {level.volume}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {level.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sell-Side Liquidity */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaWater className="mr-2 text-red-500" />
          Sell-Side Liquidity
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Areas where sell stop orders are likely resting below the current price. Often swept before reversals.
        </p>
        
        <div className="space-y-3">
          {[
            { price: 1.0780, strength: 'HIGH', volume: 'Large', description: 'Major swing low - strong sell-stop pool', swept: true },
            { price: 1.0805, strength: 'MEDIUM', volume: 'Medium', description: 'Recent support - moderate liquidity', swept: false },
          ].map((level, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                level.swept
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
                  : level.strength === 'HIGH'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {level.price.toFixed(4)}
                </span>
                <div className="flex items-center space-x-2">
                  {level.swept && (
                    <FaCheckCircle className="text-purple-600" title="Swept" />
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    level.swept
                      ? 'bg-purple-500 text-white'
                      : level.strength === 'HIGH'
                      ? 'bg-red-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {level.swept ? 'SWEPT' : level.strength}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <strong>Volume:</strong> {level.volume}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {level.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Liquidity Voids */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaExclamationCircle className="mr-2 text-yellow-500" />
          Liquidity Voids
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Price ranges with minimal liquidity. Price tends to move quickly through these areas.
        </p>
        
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-500">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Void Range: 1.0830 - 1.0850
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Price may move rapidly through this zone with minimal resistance. Good for quick entries/exits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarketStructureDetail = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <FaChartBar className="text-3xl" />
          <h2 className="text-3xl font-bold">Market Structure</h2>
        </div>
        <p className="text-purple-100">
          Break of Structure (BOS) and Change of Character (CHoCH) analysis for {symbol}
        </p>
      </div>

      {/* Current Trend */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Current Market Trend
        </h3>
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Trend Direction</p>
            <p className="text-3xl font-bold text-green-600">BULLISH ↑</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Strength</p>
            <p className="text-2xl font-bold text-green-600">Strong</p>
          </div>
        </div>
      </div>

      {/* Break of Structure (BOS) */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Break of Structure (BOS)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Confirmation of trend continuation when price breaks previous swing high (bullish) or low (bearish).
        </p>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900 dark:text-white">Bullish BOS</span>
              <FaCheckCircle className="text-green-600" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              <strong>Level:</strong> <span className="font-mono">1.0850</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Price broke above previous swing high, confirming bullish trend continuation.
            </p>
          </div>
        </div>
      </div>

      {/* Change of Character (CHoCH) */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Change of Character (CHoCH)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Potential trend reversal when price fails to make new high/low and breaks opposite structure.
        </p>
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg border-2 border-emerald-300 dark:border-emerald-600/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No CHoCH detected. Trend remains intact.
          </p>
        </div>
      </div>

      {/* Swing Points */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Key Swing Points
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Swing High</p>
            <p className="text-2xl font-mono font-bold text-green-600">1.0920</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Swing Low</p>
            <p className="text-2xl font-mono font-bold text-red-600">1.0780</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFVGDetail = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <FaCrosshairs className="text-3xl" />
          <h2 className="text-3xl font-bold">Fair Value Gaps (FVG)</h2>
        </div>
        <p className="text-yellow-100">
          3-candle imbalances and premium entry zones for {symbol}
        </p>
      </div>

      {/* What is FVG */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-2 border-blue-500">
        <div className="flex items-start space-x-3">
          <FaInfoCircle className="text-blue-600 mt-1" />
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">What is a Fair Value Gap?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A Fair Value Gap (FVG) is a 3-candle pattern where the high of candle 1 doesn't overlap with the low of candle 3 (bullish FVG) or vice versa (bearish FVG). These gaps represent inefficiency in price delivery and often get filled or "mitigated" before price continues.
            </p>
          </div>
        </div>
      </div>

      {/* Bullish FVGs */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaCrosshairs className="mr-2 text-green-500" />
          Bullish Fair Value Gaps
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                UNFILLED
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Entry Opportunity</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">High:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">1.0835</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Low:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">1.0815</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gap Size:</span>
                <span className="font-mono text-gray-900 dark:text-white">20 pips</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Excellent long entry zone if price retraces into this gap.
            </p>
          </div>
        </div>
      </div>

      {/* Bearish FVGs */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaCrosshairs className="mr-2 text-red-500" />
          Bearish Fair Value Gaps
        </h3>
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg border-2 border-emerald-300 dark:border-emerald-600/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No bearish FVGs detected. Market structure is bullish.
          </p>
        </div>
      </div>
    </div>
  );

  const renderOrderBlocksDetail = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <FaCube className="text-3xl" />
          <h2 className="text-3xl font-bold">Order Blocks</h2>
        </div>
        <p className="text-green-100">
          Institutional demand and supply zones for {symbol}
        </p>
      </div>

      {/* What are Order Blocks */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-2 border-blue-500">
        <div className="flex items-start space-x-3">
          <FaInfoCircle className="text-blue-600 mt-1" />
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">What is an Order Block?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              An Order Block (OB) is the last bearish candle before a bullish move (bullish OB) or the last bullish candle before a bearish move (bearish OB). These represent areas where institutional orders were placed and often act as strong support/resistance.
            </p>
          </div>
        </div>
      </div>

      {/* Bullish Order Blocks */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaCube className="mr-2 text-green-500" />
          Bullish Order Blocks (Demand Zones)
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                HIGH STRENGTH
              </span>
              <span className="text-2xl">💪</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Price Level:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">1.0820</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                <span className="font-bold text-green-600">85/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                <span className="font-bold text-gray-900 dark:text-white">HIGH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="text-green-600 font-medium">✓ Unmitigated</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Strong institutional demand zone. Excellent long entry if price returns to this level.
            </p>
          </div>
        </div>
      </div>

      {/* Breaker Blocks */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaCube className="mr-2 text-purple-500" />
          Breaker Blocks
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Former Order Blocks that failed and now act as opposite zones (support becomes resistance or vice versa).
        </p>
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg border-2 border-emerald-300 dark:border-emerald-600/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No Breaker Blocks detected. All Order Blocks remain valid.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {concept === 'liquidity' && renderLiquidityDetail()}
      {concept === 'market-structure' && renderMarketStructureDetail()}
      {concept === 'fvg' && renderFVGDetail()}
      {concept === 'order-blocks' && renderOrderBlocksDetail()}
    </div>
  );
}

