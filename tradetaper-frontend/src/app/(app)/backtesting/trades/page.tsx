'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Strategy } from '@/types/strategy';
import { BacktestTrade, TIMEFRAMES, SESSIONS, OUTCOMES } from '@/types/backtesting';
import { strategiesService } from '@/services/strategiesService';
import { backtestingService } from '@/services/backtestingService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import ExportButton from '@/components/backtesting/ExportButton';
import { FiArrowLeft, FiPlus, FiTrash2, FiFilter, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

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

function BacktestTradesContent() {
  const searchParams = useSearchParams();
  const strategyIdFromUrl = searchParams.get('strategyId');

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(false);
  
  // Filters
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategyIdFromUrl || '');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [sessionFilter, setSessionFilter] = useState<string>('');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('');

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    if (selectedStrategyId) {
      loadTrades();
    }
  }, [selectedStrategyId, symbolFilter, sessionFilter, timeframeFilter, outcomeFilter]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await strategiesService.getStrategies();
      setStrategies(data);
      if (data.length > 0 && !strategyIdFromUrl) {
        setSelectedStrategyId(data[0].id);
      } else if (strategyIdFromUrl) {
        setSelectedStrategyId(strategyIdFromUrl);
      }
    } catch (err) {
      console.error('Failed to load strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrades = async () => {
    try {
      setTradesLoading(true);
      const data = await backtestingService.getTrades({
        strategyId: selectedStrategyId,
        symbol: symbolFilter || undefined,
        session: sessionFilter || undefined,
        timeframe: timeframeFilter || undefined,
        outcome: outcomeFilter || undefined,
      });
      setTrades(data);
    } catch (err) {
      console.error('Failed to load trades:', err);
    } finally {
      setTradesLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backtest trade?')) return;
    try {
      await backtestingService.deleteTrade(id);
      loadTrades();
    } catch (err) {
      console.error('Failed to delete trade:', err);
    }
  };

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  // Get unique symbols from trades
  const symbols = [...new Set(trades.map(t => t.symbol))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/backtesting"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <ContentHeader
          title="Backtest Trades"
          description="View and manage all your recorded backtest trades"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={selectedStrategyId}
            onChange={(e) => setSelectedStrategyId(e.target.value)}
            className="px-3 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
          >
            {strategies.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <select
          value={symbolFilter}
          onChange={(e) => setSymbolFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="">All Symbols</option>
          {symbols.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="">All Sessions</option>
          {SESSIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={timeframeFilter}
          onChange={(e) => setTimeframeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="">All Timeframes</option>
          {TIMEFRAMES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="">All Outcomes</option>
          {OUTCOMES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          <ExportButton
            variant="trades"
            filters={{
              strategyId: selectedStrategyId,
              symbol: symbolFilter || undefined,
              session: sessionFilter || undefined,
              timeframe: timeframeFilter || undefined,
              outcome: outcomeFilter || undefined,
            }}
            label="Export CSV"
          />
          <Link
            href={`/backtesting/new?strategyId=${selectedStrategyId}`}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            New Trade
          </Link>
        </div>
      </div>

      {/* Trades Table */}
      {tradesLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : trades.length > 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-950/20 rounded-xl border border-gray-200/50 dark:border-gray-700/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TF</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">R</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {trades.map(trade => (
                  <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {new Date(trade.tradeDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        trade.direction === 'Long' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {trade.direction === 'Long' ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {trade.session || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {trade.timeframe}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        trade.outcome === 'win' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : trade.outcome === 'loss'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {trade.outcome.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      (Number(trade.pnlDollars) || 0) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.pnlDollars !== undefined && trade.pnlDollars !== null ? `$${Number(trade.pnlDollars).toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      (Number(trade.rMultiple) || 0) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.rMultiple !== undefined && trade.rMultiple !== null ? `${Number(trade.rMultiple).toFixed(2)}R` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(trade.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No backtest trades found for this strategy
          </p>
          <Link
            href={`/backtesting/new?strategyId=${selectedStrategyId}`}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Record First Trade
          </Link>
        </div>
      )}

      {/* Stats Summary */}
      {trades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{trades.length}</div>
            <div className="text-sm text-gray-500">Filtered Trades</div>
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">
              {trades.filter(t => t.outcome === 'win').length}
            </div>
            <div className="text-sm text-gray-500">Wins</div>
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600">
              {trades.filter(t => t.outcome === 'loss').length}
            </div>
            <div className="text-sm text-gray-500">Losses</div>
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className={`text-2xl font-bold ${
              trades.reduce((sum, t) => sum + (Number(t.pnlDollars) || 0), 0) >= 0 
                ? 'text-green-600' : 'text-red-600'
            }`}>
              ${trades.reduce((sum, t) => sum + (Number(t.pnlDollars) || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total P&L</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BacktestTradesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <BacktestTradesContent />
    </Suspense>
  );
}
