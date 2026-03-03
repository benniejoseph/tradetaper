'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Strategy } from '@/types/strategy';
import { BacktestStats } from '@/types/backtesting';
import { strategiesService } from '@/services/strategiesService';
import { backtestingService } from '@/services/backtestingService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MarketLogsList } from '@/components/backtesting/MarketLogsList';
import {
  FiPlus,
  FiTrendingUp,
  FiGrid,
  FiBarChart2,
  FiList,
  FiPlay,
  FiClock,
  FiChevronRight,
} from 'react-icons/fi';
import { FaFlask, FaChartLine } from 'react-icons/fa';
import React from 'react';

function ContentHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}

function StatCard({ label, value, subValue, trend }: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${
        trend === 'up'   ? 'text-green-600 dark:text-green-400' :
        trend === 'down' ? 'text-red-600 dark:text-red-400'     :
                           'text-gray-900 dark:text-white'
      }`}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</div>
      )}
    </div>
  );
}

export default function BacktestingPage() {
  const [strategies, setStrategies]               = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [stats, setStats]                         = useState<BacktestStats | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [statsLoading, setStatsLoading]           = useState(false);
  const [error, setError]                         = useState<string | null>(null);
  const [activeTab, setActiveTab]                 = useState<'trades' | 'logs'>('trades');

  const loadStrategies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await strategiesService.getStrategies();
      setStrategies(data);
      if (data.length > 0) setSelectedStrategyId(data[0].id);
    } catch (err) {
      setError('Failed to load strategies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!selectedStrategyId) return;
    try {
      setStatsLoading(true);
      const data = await backtestingService.getStrategyStats(selectedStrategyId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedStrategyId]);

  useEffect(() => {
    void loadStrategies();
  }, [loadStrategies]);

  useEffect(() => {
    if (selectedStrategyId) {
      void loadStats();
    }
  }, [selectedStrategyId, loadStats]);

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <ContentHeader
          title="Backtesting & Market Perception"
          description="Validate strategies and discover market patterns"
        />
      </div>

      {/* ── Replay Workbench Banner ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700/40 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-60">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 shrink-0">
            <FiPlay className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                Chart Replay Workbench
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-wide">
                Coming Soon
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Replay real OHLCV data tick-by-tick · Session zones · Drawing tools
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-white dark:bg-black text-sm font-medium cursor-not-allowed"
          >
            <FiClock className="w-4 h-4" />
            Sessions
          </button>
          <button
            disabled
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-semibold cursor-not-allowed"
          >
            <FiPlay className="w-4 h-4" />
            New Session
            <FiChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('trades')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'trades'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Trade Validator
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'logs'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Pattern Discovery (Logs)
          </button>
        </nav>
      </div>

      {/* ── Trade Validator Tab ────────────────────────────────────────────────── */}
      {activeTab === 'trades' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Strategy Selector */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Strategy:
              </label>
              <select
                value={selectedStrategyId}
                onChange={(e) => setSelectedStrategyId(e.target.value)}
                className="px-4 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white min-w-[200px]"
              >
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href={`/backtesting/new?strategyId=${selectedStrategyId}`}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              Record Backtest Trade
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {strategies.length === 0 ? (
            <div className="text-center py-12">
              <FaFlask className="mx-auto w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Strategies to Backtest
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create a strategy first to start backtesting
              </p>
              <Link
                href="/strategies/new"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <FiPlus className="mr-2" />
                Create Strategy
              </Link>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <StatCard
                    label="Total Trades"
                    value={stats.totalTrades}
                    subValue={`${stats.wins}W / ${stats.losses}L / ${stats.breakevens}BE`}
                  />
                  <StatCard
                    label="Win Rate"
                    value={`${Number(stats.winRate).toFixed(1)}%`}
                    trend={Number(stats.winRate) >= 50 ? 'up' : 'down'}
                  />
                  <StatCard
                    label="Total P&L"
                    value={`$${Number(stats.totalPnlDollars).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue={`${Number(stats.totalPnlPips).toFixed(1)} pips`}
                    trend={Number(stats.totalPnlDollars) >= 0 ? 'up' : 'down'}
                  />
                  <StatCard
                    label="Profit Factor"
                    value={Number(stats.profitFactor).toFixed(2)}
                    trend={Number(stats.profitFactor) >= 1.5 ? 'up' : Number(stats.profitFactor) >= 1 ? 'neutral' : 'down'}
                  />
                  <StatCard
                    label="Expectancy"
                    value={`$${Number(stats.expectancy).toFixed(2)}`}
                    trend={Number(stats.expectancy) >= 0 ? 'up' : 'down'}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-8 text-center">
                  <FaChartLine className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No backtest data yet. Record your first backtest trade to see statistics.
                  </p>
                </div>
              )}

              {/* Additional Stats Row */}
              {stats && stats.totalTrades > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Avg R-Multiple"
                    value={Number(stats.averageRMultiple).toFixed(2)}
                    subValue="Risk:Reward"
                  />
                  <StatCard
                    label="Consecutive Wins"
                    value={stats.maxConsecutiveWins}
                    subValue="Max streak"
                  />
                  <StatCard
                    label="Consecutive Losses"
                    value={stats.maxConsecutiveLosses}
                    subValue="Max streak"
                  />
                  <StatCard
                    label="Rule Following"
                    value={`${stats.ruleFollowingRate}%`}
                    trend={stats.ruleFollowingRate >= 80 ? 'up' : stats.ruleFollowingRate >= 60 ? 'neutral' : 'down'}
                  />
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href={`/backtesting/trades?strategyId=${selectedStrategyId}`}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-white to-blue-50 dark:from-black dark:to-emerald-950/20 rounded-xl border border-blue-200/50 dark:border-emerald-700/30 hover:shadow-lg transition-all"
                >
                  <div className="p-3 bg-blue-100 dark:bg-emerald-900/30 rounded-lg">
                    <FiList className="w-6 h-6 text-blue-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">View All Trades</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Browse backtest trade history</p>
                  </div>
                </Link>

                <Link
                  href={`/backtesting/matrix?strategyId=${selectedStrategyId}`}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-white to-purple-50 dark:from-black dark:to-emerald-950/20 rounded-xl border border-purple-200/50 dark:border-emerald-700/30 hover:shadow-lg transition-all"
                >
                  <div className="p-3 bg-purple-100 dark:bg-emerald-900/30 rounded-lg">
                    <FiGrid className="w-6 h-6 text-purple-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Performance Matrix</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Heatmap by conditions</p>
                  </div>
                </Link>

                <Link
                  href={`/backtesting/analysis?strategyId=${selectedStrategyId}`}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-white to-amber-50 dark:from-black dark:to-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-700/30 hover:shadow-lg transition-all"
                >
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <FiBarChart2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generate mechanical rules</p>
                  </div>
                </Link>

                {/* Practice Trading — Coming Soon */}
                <div className="relative flex items-center gap-4 p-4 bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900/20 rounded-xl border border-gray-200/50 dark:border-gray-700/30 opacity-60 cursor-not-allowed select-none">
                  {/* Coming Soon badge */}
                  <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                    <span className="text-[10px] font-semibold uppercase tracking-wide">Coming Soon</span>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800/30 rounded-lg shrink-0">
                    <FiPlay className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Practice Trading</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Replay with real candles</p>
                  </div>
                </div>
              </div>

              {/* Strategy Info */}
              {selectedStrategy && (
                <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedStrategy.color || '#3B82F6' }}
                    />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedStrategy.name}
                    </h2>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        selectedStrategy.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {selectedStrategy.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {selectedStrategy.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {selectedStrategy.description}
                    </p>
                  )}
                  {selectedStrategy.checklist && selectedStrategy.checklist.length > 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedStrategy.checklist.length} checklist items
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      ) : (
        /* ── Pattern Discovery / Logs Tab ──────────────────────────────────── */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-black dark:to-emerald-950/20 rounded-xl p-8 border border-blue-200/50 dark:border-emerald-700/30 text-center">
            <div className="p-4 bg-blue-100 dark:bg-emerald-900/30 rounded-full inline-flex mb-4">
              <FiTrendingUp className="w-8 h-8 text-blue-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Market Perception & Discovery
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Log market movements, chart observations, and recurring patterns without taking
              pnl-impacting trades. Let our AI help you find your next edge.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/backtesting/logs/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="mr-2" />
                Log Observation
              </Link>
              <Link
                href="/backtesting/logs/analysis"
                className="inline-flex items-center px-4 py-2 bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <FiBarChart2 className="mr-2" />
                Analyze Patterns
              </Link>
            </div>
          </div>

          <MarketLogsList />
        </div>
      )}
    </div>
  );
}
