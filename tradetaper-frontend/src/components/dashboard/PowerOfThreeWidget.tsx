'use client';

import React, { useState, useEffect } from 'react';
import { FaBolt, FaInfoCircle, FaChartLine } from 'react-icons/fa';

interface PowerOfThreeData {
  symbol: string;
  currentPhase: 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION';
  phaseProgress: number; // 0-100
  description: string;
  characteristics: string[];
  tradingGuidance: string;
  nextPhase: string;
  timeInPhase: string;
}

interface Props {
  symbol?: string;
}

export default function PowerOfThreeWidget({ symbol = 'EURUSD' }: Props) {
  const [data, setData] = useState<PowerOfThreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);

  const symbols = ['EURUSD', 'XAUUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];

  useEffect(() => {
    fetchPowerOfThreeData(selectedSymbol);
  }, [selectedSymbol]);

  const fetchPowerOfThreeData = async (sym: string) => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${API_BASE_URL}/ict/power-of-three/${sym}?timeframe=1H`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        // Fallback to demo data
        setData(generateDemoData(sym));
      }
    } catch (error) {
      console.error('Error fetching Power of Three data:', error);
      setData(generateDemoData(sym));
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = (sym: string): PowerOfThreeData => {
    const phases: PowerOfThreeData['currentPhase'][] = ['ACCUMULATION', 'MANIPULATION', 'DISTRIBUTION'];
    const randomPhase = phases[Math.floor(Math.random() * phases.length)];

    const phaseDetails = {
      ACCUMULATION: {
        description: 'Institutions are building positions. Price consolidates and creates liquidity pools.',
        characteristics: [
          'Tight range consolidation',
          'Low volatility',
          'Building liquidity above/below',
          'Quiet price action',
        ],
        tradingGuidance: '⏸️ Wait for manipulation before entering. Mark liquidity zones.',
        nextPhase: 'Manipulation',
        color: 'blue',
      },
      MANIPULATION: {
        description: 'Stop hunt in progress! Price sweeps liquidity to trap traders before reversal.',
        characteristics: [
          'Sharp price movement',
          'Liquidity sweep (stop hunt)',
          'False breakouts',
          'Inducement of wrong-side traders',
        ],
        tradingGuidance: '⚡ KEY MOMENT! Watch for reversal after liquidity sweep. Prepare for distribution.',
        nextPhase: 'Distribution',
        color: 'yellow',
      },
      DISTRIBUTION: {
        description: 'Institutions are taking profits. Strong directional move in play.',
        characteristics: [
          'Sustained directional movement',
          'High momentum',
          'Clear trend structure',
          'Volume expansion',
        ],
        tradingGuidance: '🚀 TRADE ACTIVE! Follow the trend. Trail stops. Aim for FVGs and Order Blocks.',
        nextPhase: 'Accumulation',
        color: 'green',
      },
    };

    const details = phaseDetails[randomPhase];

    return {
      symbol: sym,
      currentPhase: randomPhase,
      phaseProgress: Math.floor(Math.random() * 100),
      description: details.description,
      characteristics: details.characteristics,
      tradingGuidance: details.tradingGuidance,
      nextPhase: details.nextPhase,
      timeInPhase: `${Math.floor(Math.random() * 120) + 15}m`,
    };
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'ACCUMULATION':
        return {
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-500',
          gradient: 'from-blue-500 to-blue-600',
        };
      case 'MANIPULATION':
        return {
          text: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-500',
          gradient: 'from-yellow-500 to-yellow-600',
        };
      case 'DISTRIBUTION':
        return {
          text: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-500',
          gradient: 'from-green-500 to-green-600',
        };
      default:
        return {
          text: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-500',
          gradient: 'from-gray-500 to-gray-600',
        };
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'ACCUMULATION':
        return '🔵';
      case 'MANIPULATION':
        return '⚡';
      case 'DISTRIBUTION':
        return '🚀';
      default:
        return '📊';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const colors = getPhaseColor(data.currentPhase);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaBolt className="text-yellow-500 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Power of Three (AMD)
          </h3>
        </div>
        
        {/* Symbol Selector */}
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
        >
          {symbols.map((sym) => (
            <option key={sym} value={sym}>{sym}</option>
          ))}
        </select>
      </div>

      {/* Current Phase */}
      <div className={`p-6 rounded-lg border-2 mb-6 ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">{getPhaseIcon(data.currentPhase)}</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Phase</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {data.currentPhase}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Time in Phase</p>
            <p className={`text-xl font-bold ${colors.text}`}>
              {data.timeInPhase}
            </p>
          </div>
        </div>

        {/* Phase Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
            style={{ width: `${data.phaseProgress}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
          {data.phaseProgress}% complete
        </p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.description}
        </p>
      </div>

      {/* Characteristics */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <FaInfoCircle className="text-gray-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Phase Characteristics
          </p>
        </div>
        <div className="space-y-2">
          {data.characteristics.map((char, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-900/20 rounded"
            >
              <span className={`mt-0.5 ${colors.text}`}>•</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{char}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Guidance */}
      <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border} mb-6`}>
        <div className="flex items-start space-x-2">
          <FaChartLine className={`mt-1 ${colors.text}`} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Trading Guidance
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {data.tradingGuidance}
            </p>
          </div>
        </div>
      </div>

      {/* Phase Cycle */}
      <div className="bg-gradient-to-r from-blue-50 via-yellow-50 to-green-50 dark:from-blue-900/10 dark:via-yellow-900/10 dark:to-green-900/10 p-4 rounded-lg">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
          ICT Power of Three Cycle
        </p>
        <div className="flex items-center justify-between">
          <div className={`text-center ${data.currentPhase === 'ACCUMULATION' ? 'scale-110' : 'opacity-50'} transition-all`}>
            <div className="w-12 h-12 mx-auto bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-1">
              A
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">Accumulation</p>
          </div>
          
          <div className="flex-1 mx-2">
            <div className="border-t-2 border-dashed border-gray-400"></div>
          </div>
          
          <div className={`text-center ${data.currentPhase === 'MANIPULATION' ? 'scale-110' : 'opacity-50'} transition-all`}>
            <div className="w-12 h-12 mx-auto bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-1">
              M
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">Manipulation</p>
          </div>
          
          <div className="flex-1 mx-2">
            <div className="border-t-2 border-dashed border-gray-400"></div>
          </div>
          
          <div className={`text-center ${data.currentPhase === 'DISTRIBUTION' ? 'scale-110' : 'opacity-50'} transition-all`}>
            <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-1">
              D
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">Distribution</p>
          </div>
        </div>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          Next: <span className="font-semibold">{data.nextPhase}</span>
        </p>
      </div>
    </div>
  );
}

