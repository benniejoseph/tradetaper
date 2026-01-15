
import React, { useState, useEffect } from 'react';
import { FaRobot, FaArrowUp, FaArrowDown, FaMinus, FaExclamationTriangle, FaChartBar } from 'react-icons/fa';
import { authApiClient } from '@/services/api';

interface AgentInsightProps {
  symbol: string;
}

interface PredictionData {
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    targetPrice: number;
    timeToTarget: number;
    probability: number;
  };
  technicalAnalysis: {
    trend: string;
    momentum: number;
    volatility: string;
    keyLevels: {
      support: number[];
      resistance: number[];
    };
  };
  fundamentalFactors: {
    economic: number;
    geopolitical: number;
    sentiment: number;
  };
  riskFactors: string[];
  rationale: string;
  timestamp: string; // Date string
}

export default function AgentInsight({ symbol }: AgentInsightProps) {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrediction();
  }, [symbol]);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApiClient.get(`/market-intelligence/predictions/${symbol}`);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch prediction', err);
      setError('AI Agent is analyzing... (Service might be warming up)');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <FaRobot className="text-4xl text-emerald-500 mb-3 mx-auto animate-bounce" />
          <p className="text-gray-500 dark:text-gray-400">AI Agent is analyzing {symbol}...</p>
          <p className="text-xs text-gray-400 mt-2">Checking real-time price, news, and economic events</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-amber-500 mb-3 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button 
            onClick={fetchPrediction}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { prediction, technicalAnalysis, rationale, riskFactors } = data;
  
  const getDirectionColor = (dir: string) => {
    if (dir === 'bullish') return 'text-emerald-500';
    if (dir === 'bearish') return 'text-red-500';
    return 'text-gray-500';
  };

  const getDirectionIcon = (dir: string) => {
    if (dir === 'bullish') return <FaArrowUp className="inline mr-1" />;
    if (dir === 'bearish') return <FaArrowDown className="inline mr-1" />;
    return <FaMinus className="inline mr-1" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <FaRobot className="text-emerald-600 dark:text-emerald-400 text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">AI Market Agent</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Real-time Multi-Model Analysis</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-lg capitalize ${getDirectionColor(prediction.direction)}`}>
            {getDirectionIcon(prediction.direction)}
            {prediction.direction}
          </div>
          <p className="text-xs text-gray-500">Confidence: {prediction.confidence}%</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Rationale */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FaChartBar className="mr-2 text-gray-400" />
            Analysis Rationale
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            {rationale}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Target Price</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{prediction.targetPrice}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">Volatility</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{technicalAnalysis.volatility}</p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">Trend</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{technicalAnalysis.trend.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Levels & Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Levels */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Key Levels</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-red-500 dark:text-red-400">
                <span>Resistance</span>
                <span className="font-mono font-medium">{technicalAnalysis.keyLevels.resistance.join(', ')}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
              <div className="flex justify-between items-center text-emerald-500 dark:text-emerald-400">
                <span>Support</span>
                <span className="font-mono font-medium">{technicalAnalysis.keyLevels.support.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <FaExclamationTriangle className="mr-2 text-amber-500" />
              Risk Factors
            </h4>
            <ul className="space-y-1">
              {riskFactors.slice(0, 3).map((risk, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="mr-2">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
