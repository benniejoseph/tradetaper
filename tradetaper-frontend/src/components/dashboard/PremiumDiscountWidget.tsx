'use client';

import React, { useState, useEffect } from 'react';
import { FaChartBar, FaArrowUp, FaArrowDown, FaEquals, FaInfoCircle } from 'react-icons/fa';

interface PremiumDiscountData {
  symbol: string;
  position: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';
  percentage: number; // 0-100
  currentPrice: number;
  swingHigh: number;
  swingLow: number;
  fibonacci: {
    level: number;
    price: number;
    label: string;
  }[];
  optimalTradeEntry: {
    min: number;
    max: number;
  };
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  recommendation: string;
}

interface Props {
  symbol?: string;
}

export default function PremiumDiscountWidget({ symbol = 'EURUSD' }: Props) {
  const [data, setData] = useState<PremiumDiscountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);

  const symbols = ['EURUSD', 'XAUUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];

  useEffect(() => {
    fetchPremiumDiscountData(selectedSymbol);
  }, [selectedSymbol]);

  const fetchPremiumDiscountData = async (sym: string) => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${API_BASE_URL}/ict/premium-discount/${sym}?timeframe=1H`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        // Fallback to demo data
        setData(generateDemoData(sym));
      }
    } catch (error) {
      console.error('Error fetching Premium/Discount data:', error);
      setData(generateDemoData(sym));
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = (sym: string): PremiumDiscountData => {
    const prices: Record<string, { price: number; high: number; low: number }> = {
      'EURUSD': { price: 1.0850, high: 1.0920, low: 1.0780 },
      'XAUUSD': { price: 2030.50, high: 2055.00, low: 2010.00 },
      'GBPUSD': { price: 1.2750, high: 1.2850, low: 1.2650 },
      'USDJPY': { price: 149.50, high: 150.20, low: 148.80 },
      'BTCUSD': { price: 43500, high: 44500, low: 42500 },
    };

    const { price, high, low } = prices[sym] || prices['EURUSD'];
    const range = high - low;
    const position = ((price - low) / range) * 100;

    let positionType: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';
    let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    let recommendation: string;

    if (position >= 55) {
      positionType = 'PREMIUM';
      bias = 'BEARISH';
      recommendation = 'Look for SHORT entries. Price is in premium zone.';
    } else if (position <= 45) {
      positionType = 'DISCOUNT';
      bias = 'BULLISH';
      recommendation = 'Look for LONG entries. Price is in discount zone.';
    } else {
      positionType = 'EQUILIBRIUM';
      bias = 'NEUTRAL';
      recommendation = 'Wait for price to move into premium or discount before entering.';
    }

    return {
      symbol: sym,
      position: positionType,
      percentage: Math.round(position),
      currentPrice: price,
      swingHigh: high,
      swingLow: low,
      fibonacci: [
        { level: 0, price: low, label: '0% (Swing Low)' },
        { level: 23.6, price: low + range * 0.236, label: '23.6%' },
        { level: 38.2, price: low + range * 0.382, label: '38.2%' },
        { level: 50, price: low + range * 0.5, label: '50% (EQ)' },
        { level: 61.8, price: low + range * 0.618, label: '61.8% (OTE)' },
        { level: 78.6, price: low + range * 0.786, label: '78.6% (OTE)' },
        { level: 100, price: high, label: '100% (Swing High)' },
      ],
      optimalTradeEntry: {
        min: low + range * 0.618,
        max: low + range * 0.786,
      },
      bias,
      recommendation,
    };
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'PREMIUM':
        return 'text-red-600 dark:text-red-400';
      case 'DISCOUNT':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getPositionBg = (position: string) => {
    switch (position) {
      case 'PREMIUM':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'DISCOUNT':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'PREMIUM':
        return <FaArrowUp className="text-red-600" />;
      case 'DISCOUNT':
        return <FaArrowDown className="text-green-600" />;
      default:
        return <FaEquals className="text-blue-600" />;
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaChartBar className="text-purple-600 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Premium/Discount Arrays
          </h3>
        </div>
        
        {/* Symbol Selector */}
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
        >
          {symbols.map((sym) => (
            <option key={sym} value={sym}>{sym}</option>
          ))}
        </select>
      </div>

      {/* Current Position */}
      <div className={`p-4 rounded-lg border-2 mb-6 ${getPositionBg(data.position)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getPositionIcon(data.position)}
            <span className={`text-2xl font-bold ${getPositionColor(data.position)}`}>
              {data.position}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Position</p>
            <p className={`text-xl font-bold ${getPositionColor(data.position)}`}>
              {data.percentage}%
            </p>
          </div>
        </div>
        
        {/* Visual Bar */}
        <div className="relative w-full h-6 bg-gradient-to-r from-green-200 via-blue-200 to-red-200 dark:from-green-900 dark:via-blue-900 dark:to-red-900 rounded-full overflow-hidden mb-3">
          {/* Equilibrium Line */}
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-900 dark:bg-white z-10"></div>
          
          {/* Current Position Marker */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 border-2 border-white dark:border-gray-900 rounded-full shadow-lg z-20 animate-pulse"
            style={{ left: `${data.percentage}%` }}
          ></div>
          
          {/* Labels */}
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-between px-2 text-xs font-medium">
            <span className="text-green-800 dark:text-green-200">DISCOUNT</span>
            <span className="text-blue-800 dark:text-blue-200">EQ</span>
            <span className="text-red-800 dark:text-red-200">PREMIUM</span>
          </div>
        </div>

        {/* Current Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
          <span className="font-mono font-semibold text-gray-900 dark:text-white">
            {data.currentPrice.toFixed(data.symbol.includes('USD') && !data.symbol.includes('JPY') ? 4 : 2)}
          </span>
        </div>
      </div>

      {/* Trading Bias */}
      <div className={`p-4 rounded-lg mb-6 ${
        data.bias === 'BULLISH' 
          ? 'bg-green-50 dark:bg-green-900/20' 
          : data.bias === 'BEARISH' 
          ? 'bg-red-50 dark:bg-red-900/20' 
          : 'bg-gray-50 dark:bg-gray-900/20'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Trading Bias:</span>
          <span className={`font-bold ${
            data.bias === 'BULLISH' 
              ? 'text-green-600 dark:text-green-400' 
              : data.bias === 'BEARISH' 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {data.bias}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {data.recommendation}
        </p>
      </div>

      {/* Fibonacci Levels */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-3">
          <FaInfoCircle className="text-gray-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Fibonacci Levels
          </p>
        </div>
        
        {data.fibonacci.map((fib) => {
          const isOTE = fib.level === 61.8 || fib.level === 78.6;
          const isEQ = fib.level === 50;
          const isCurrentLevel = Math.abs(data.currentPrice - fib.price) / data.currentPrice < 0.005;
          
          return (
            <div
              key={fib.level}
              className={`flex items-center justify-between p-2 rounded ${
                isCurrentLevel 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' 
                  : isOTE 
                  ? 'bg-purple-50 dark:bg-purple-900/20' 
                  : isEQ 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'bg-gray-50 dark:bg-gray-900/20'
              }`}
            >
              <div className="flex items-center space-x-2">
                {isCurrentLevel && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>}
                <span className={`text-sm ${
                  isOTE 
                    ? 'font-bold text-purple-700 dark:text-purple-300' 
                    : isEQ 
                    ? 'font-bold text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {fib.label}
                  {isOTE && ' ⭐'}
                </span>
              </div>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {fib.price.toFixed(data.symbol.includes('USD') && !data.symbol.includes('JPY') ? 4 : 2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* OTE Zone Highlight */}
      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-purple-600 dark:text-purple-400 font-bold">⭐ OTE Zone</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Optimal Trade Entry: {data.optimalTradeEntry.min.toFixed(4)} - {data.optimalTradeEntry.max.toFixed(4)}
        </p>
      </div>
    </div>
  );
}

