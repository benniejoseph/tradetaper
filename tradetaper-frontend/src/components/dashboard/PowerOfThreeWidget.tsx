'use client';

import React, { useState, useEffect } from 'react';
import { FaBolt, FaInfoCircle, FaChartLine } from 'react-icons/fa';
import { getPowerOfThree, type PowerOfThreeData as APIPowerOfThreeData } from '@/services/ictService';
import { DataSourceBadge, type DataSource } from './DashboardSkeleton';

interface PowerOfThreeData {
  symbol: string;
  currentPhase: 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION' | 'UNKNOWN';
  phaseProgress?: number; // 0-100
  confidence?: number;
  description: string;
  characteristics: string[];
  tradingGuidance: string;
  supportingEvidence?: string[];
  nextPhase?: string;
  timeInPhase?: string;
}

interface Props {
  symbol?: string;
}

export default function PowerOfThreeWidget({ symbol = 'XAUUSD' }: Props) {
  const [data, setData] = useState<PowerOfThreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [dataSource, setDataSource] = useState<DataSource>('demo');

  const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];

  useEffect(() => {
    fetchPowerOfThreeData(selectedSymbol);
  }, [selectedSymbol]);

  const fetchPowerOfThreeData = async (sym: string) => {
    setLoading(true);
    try {
      const result = await getPowerOfThree(sym, '1H');
      setData(result as PowerOfThreeData);
      // Get dataSource from API response (falls back to 'twelvedata' if not present)
      setDataSource((result as any).dataSource || 'twelvedata');
    } catch (error) {
      console.error('Error fetching Power of Three data from API, using fallback:', error);
      // Fallback to demo data if API fails
      setData(generateDemoData(sym));
      setDataSource('demo');
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

    const details = phaseDetails[randomPhase as keyof typeof phaseDetails] || phaseDetails['ACCUMULATION'];

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
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-500',
          gradient: 'from-emerald-500 to-emerald-600',
        };
      case 'MANIPULATION':
        return {
          text: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-500',
          gradient: 'from-amber-500 to-amber-600',
        };
      case 'DISTRIBUTION':
        return {
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-500',
          gradient: 'from-emerald-600 to-emerald-700',
        };
      default:
        return {
          text: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/10 dark:to-emerald-900/10',
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
      <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
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
    <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaBolt className="text-yellow-500 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Power of Three (AMD)
          </h3>
          <DataSourceBadge source={dataSource} />
        </div>
        
        {/* Symbol Selector - Styled for dark mode visibility */}
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="px-3 py-2 text-sm font-medium border-2 border-yellow-400 dark:border-yellow-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 cursor-pointer shadow-sm hover:border-yellow-500 transition-colors"
        >
          {symbols.map((sym) => (
            <option key={sym} value={sym} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">{sym}</option>
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
          {data.characteristics?.map((char, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 p-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/10 dark:to-emerald-900/10 rounded"
            >
              <span className={`mt-0.5 ${colors.text}`}>•</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{char}</span>
            </div>
          )) || []}
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
      <div className="bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-100 dark:from-emerald-950/20 dark:via-amber-950/20 dark:to-emerald-950/30 p-4 rounded-lg">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
          ICT Power of Three Cycle
        </p>
        <div className="flex items-center justify-between">
          <div className={`text-center ${data.currentPhase === 'ACCUMULATION' ? 'scale-110' : 'opacity-50'} transition-all`}>
            <div className="w-12 h-12 mx-auto bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-1">
              A
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">Accumulation</p>
          </div>
          
          <div className="flex-1 mx-2">
            <div className="border-t-2 border-dashed border-gray-400"></div>
          </div>
          
          <div className={`text-center ${data.currentPhase === 'MANIPULATION' ? 'scale-110' : 'opacity-50'} transition-all`}>
            <div className="w-12 h-12 mx-auto bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-1">
              M
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">Manipulation</p>
          </div>
          
          <div className="flex-1 mx-2">
            <div className="border-t-2 border-dashed border-gray-400"></div>
          </div>
          
          <div className={`text-center ${data.currentPhase === 'DISTRIBUTION' ? 'scale-110' : 'opacity-50'} transition-all`}>
            <div className="w-12 h-12 mx-auto bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-1">
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

