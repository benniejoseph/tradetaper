'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Strategy } from '@/types/strategy';
import { PerformanceMatrix } from '@/types/backtesting';
import { strategiesService } from '@/services/strategiesService';
import { backtestingService } from '@/services/backtestingService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FiArrowLeft, FiGrid } from 'react-icons/fi';

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

function getWinRateColor(winRate: number): string {
  if (winRate >= 65) return 'bg-green-500 text-white';
  if (winRate >= 55) return 'bg-green-300 text-green-900';
  if (winRate >= 50) return 'bg-yellow-300 text-yellow-900';
  if (winRate >= 40) return 'bg-orange-300 text-orange-900';
  return 'bg-red-400 text-white';
}

function getRecommendation(winRate: number, trades: number): string {
  if (trades < 10) return '📊 Need more data';
  if (winRate >= 60) return '✅ TRADE';
  if (winRate >= 50) return '⚠️ CAUTION';
  return '❌ AVOID';
}

function PerformanceMatrixContent() {
  const searchParams = useSearchParams();
  const strategyIdFromUrl = searchParams.get('strategyId');

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategyIdFromUrl || '');
  const [matrix, setMatrix] = useState<PerformanceMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  
  const [rowDimension, setRowDimension] = useState<'session' | 'timeframe' | 'killZone' | 'dayOfWeek'>('session');
  const [columnDimension, setColumnDimension] = useState<'symbol' | 'session' | 'timeframe'>('symbol');

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    if (selectedStrategyId) {
      loadMatrix();
    }
  }, [selectedStrategyId, rowDimension, columnDimension]);

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

  const loadMatrix = async () => {
    try {
      setMatrixLoading(true);
      const data = await backtestingService.getPerformanceMatrix(
        selectedStrategyId,
        rowDimension,
        columnDimension
      );
      setMatrix(data);
    } catch (err) {
      console.error('Failed to load matrix:', err);
      setMatrix(null);
    } finally {
      setMatrixLoading(false);
    }
  };

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  const getCellData = (row: string, col: string) => {
    return matrix?.data.find(d => d.row === row && d.column === col);
  };

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
          title="Performance Matrix"
          description="Heatmap showing win rates across different trading conditions"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Strategy:</label>
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

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Rows:</label>
          <select
            value={rowDimension}
            onChange={(e) => setRowDimension(e.target.value as any)}
            className="px-3 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
          >
            <option value="session">Session</option>
            <option value="timeframe">Timeframe</option>
            <option value="killZone">Kill Zone</option>
            <option value="dayOfWeek">Day of Week</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Columns:</label>
          <select
            value={columnDimension}
            onChange={(e) => setColumnDimension(e.target.value as any)}
            className="px-3 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
          >
            <option value="symbol">Symbol</option>
            <option value="session">Session</option>
            <option value="timeframe">Timeframe</option>
          </select>
        </div>
      </div>

      {/* Matrix */}
      {matrixLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : matrix && matrix.data.length > 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-950/20 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/30 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {rowDimension}
                </th>
                {matrix.columns.map(col => (
                  <th key={col} className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map(row => (
                <tr key={row} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {row.replace(/_/g, ' ')}
                  </td>
                  {matrix.columns.map(col => {
                    const cell = getCellData(row, col);
                    if (!cell) {
                      return (
                        <td key={col} className="px-4 py-3 text-center">
                          <div className="inline-block px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs">
                            No data
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={col} className="px-4 py-3 text-center">
                        <div className={`inline-block px-3 py-2 rounded ${getWinRateColor(Number(cell.winRate))}`}>
                          <div className="font-bold text-lg">{Number(cell.winRate).toFixed(0)}%</div>
                          <div className="text-xs opacity-80">{cell.trades} trades</div>
                          <div className="text-xs opacity-80">PF: {Number(cell.profitFactor).toFixed(2)}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">≥65% (TRADE)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-300"></div>
              <span className="text-gray-600 dark:text-gray-400">55-64%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-300"></div>
              <span className="text-gray-600 dark:text-gray-400">50-54% (CAUTION)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-300"></div>
              <span className="text-gray-600 dark:text-gray-400">40-49%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-400"></div>
              <span className="text-gray-600 dark:text-gray-400">&lt;40% (AVOID)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-12 text-center">
          <FiGrid className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Backtest Data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Record backtest trades to see the performance matrix
          </p>
          <Link
            href={`/backtesting/new?strategyId=${selectedStrategyId}`}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Record First Trade
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PerformanceMatrixPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <PerformanceMatrixContent />
    </Suspense>
  );
}
