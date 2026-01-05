"use client";

import React, { useState, useCallback } from 'react';
import { FaSync, FaChartBar, FaFlask, FaMicrochip } from 'react-icons/fa';

interface Strategy {
  id: string;
  name: string;
  description: string;
  entryConditions: number;
  filters: number;
  riskReward: number | string;
}

interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  totalPnLPercent: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  averageWin: number;
  averageLoss: number;
  averageRR: number;
}

interface BacktestTrade {
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  direction: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
  setup: string;
  ictScore: number;
  exitReason: string;
}

interface BacktestResult {
  config: any;
  metrics: BacktestMetrics;
  trades: BacktestTrade[];
  analysis: string[];
}

const PREBUILT_STRATEGIES: Strategy[] = [
  { id: 'power-of-three', name: 'Power of Three', description: 'PO3 + FVG entry', entryConditions: 2, filters: 2, riskReward: 2.5 },
  { id: 'turtle-soup', name: 'Turtle Soup', description: 'Structure break + OB', entryConditions: 2, filters: 2, riskReward: 3 },
  { id: 'fvg-rebalance', name: 'FVG Rebalance', description: 'FVG + Premium/Discount', entryConditions: 2, filters: 2, riskReward: 2 },
  { id: 'orderblock-entry', name: 'Order Block Entry', description: 'OB + Premium/Discount', entryConditions: 2, filters: 2, riskReward: 2 },
  { id: 'london-killzone', name: 'London Kill Zone', description: 'Kill Zone + FVG', entryConditions: 2, filters: 2, riskReward: 1.5 },
  { id: 'ny-open-reversal', name: 'NY Open Reversal', description: 'Multi-confluence', entryConditions: 3, filters: 2, riskReward: 2.5 },
];

const SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'NASDAQ', 'SPX', 'BTCUSD'];
const TIMEFRAMES = ['1H', '4H', '1D'];

export default function ICTBacktest() {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('power-of-three');
  const [symbol, setSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<string>('4H');
  const [days, setDays] = useState<number>(90);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://tradetaper-backend-326520250422.us-central1.run.app'}/api/v1/agents/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAgent: 'ict-backtest-agent',
          payload: {
            action: 'backtest',
            symbol,
            timeframe,
            days,
            strategyId: selectedStrategy,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Backtest failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, days, selectedStrategy]);

  const strategyInfo = PREBUILT_STRATEGIES.find(s => s.id === selectedStrategy);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaFlask className="w-8 h-8 text-indigo-500" />
            ICT Backtest Lab
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test ICT strategies on historical data with AI-powered analysis
          </p>
        </div>

        {/* Config Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Strategy Selection */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaMicrochip className="w-5 h-5 text-indigo-500" />
              Select Strategy
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PREBUILT_STRATEGIES.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedStrategy === strategy.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{strategy.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{strategy.description}</div>
                  <div className="text-xs text-indigo-500 mt-2">{strategy.riskReward}:1 R:R</div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaChartBar className="w-5 h-5 text-indigo-500" />
              Parameters
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-none"
                >
                  {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-none"
                >
                  {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lookback Days</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  min={30}
                  max={365}
                  className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-none"
                />
              </div>
              <button
                onClick={runBacktest}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FaSync className="w-5 h-5 animate-spin" />
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <FaFlask className="w-5 h-5" />
                    Run Backtest
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <MetricCard label="Win Rate" value={`${result.metrics.winRate.toFixed(1)}%`} color={result.metrics.winRate >= 50 ? 'green' : 'red'} />
              <MetricCard label="Total Trades" value={result.metrics.totalTrades.toString()} />
              <MetricCard label="Profit Factor" value={result.metrics.profitFactor.toFixed(2)} color={result.metrics.profitFactor >= 1.5 ? 'green' : result.metrics.profitFactor >= 1 ? 'yellow' : 'red'} />
              <MetricCard label="Total P&L" value={`$${result.metrics.totalPnL.toFixed(0)}`} color={result.metrics.totalPnL >= 0 ? 'green' : 'red'} />
              <MetricCard label="Max DD" value={`${result.metrics.maxDrawdownPercent.toFixed(1)}%`} color={result.metrics.maxDrawdownPercent <= 10 ? 'green' : 'red'} />
              <MetricCard label="Sharpe" value={result.metrics.sharpeRatio.toFixed(2)} />
              <MetricCard label="Avg Win" value={`$${result.metrics.averageWin.toFixed(0)}`} />
              <MetricCard label="Avg Loss" value={`$${result.metrics.averageLoss.toFixed(0)}`} />
            </div>

            {/* Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Analysis</h3>
              <ul className="space-y-2">
                {result.analysis.map((item, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300">{item}</li>
                ))}
              </ul>
            </div>

            {/* Trades Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trade History ({result.trades.length} trades)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 pr-4">Entry</th>
                    <th className="pb-3 pr-4">Direction</th>
                    <th className="pb-3 pr-4">Setup</th>
                    <th className="pb-3 pr-4">ICT Score</th>
                    <th className="pb-3 pr-4">Exit Reason</th>
                    <th className="pb-3 pr-4 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.slice(0, 20).map((trade, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-3 pr-4 text-gray-900 dark:text-white">{new Date(trade.entryTime).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${trade.direction === 'long' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{trade.setup}</td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{trade.ictScore}</td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{trade.exitReason}</td>
                      <td className={`py-3 pr-4 text-right font-medium ${trade.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ${trade.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.trades.length > 20 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">Showing first 20 of {result.trades.length} trades</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' | 'yellow' }) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color ? colorClasses[color] : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
    </div>
  );
}
