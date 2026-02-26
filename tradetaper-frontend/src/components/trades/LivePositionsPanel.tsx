'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaBolt, FaClock, FaCircle, FaExclamationTriangle } from 'react-icons/fa';
import { LivePositionsResponse, LivePosition, terminalService } from '@/services/terminalService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { RootState } from '@/store/store';

interface LivePositionsPanelProps {
  accountId?: string;
  accountName?: string;
  isMT5?: boolean;
}

type DistanceUnit = 'price' | 'pips';

const formatTimeAgo = (timestamp?: string) => {
  if (!timestamp) return '—';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diffMs)) return '—';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatDuration = (openTime?: string) => {
  if (!openTime) return '—';
  const diffMs = Date.now() - new Date(openTime).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return '—';
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  if (days > 0) return `${days}d ${remainingHours}h`;
  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  return `${remainingMinutes}m`;
};

const computeChange = (position: LivePosition) => {
  const open = Number(position.openPrice);
  const current = Number(position.currentPrice);
  const rawChange = current - open;
  return position.type === 'BUY' ? rawChange : -rawChange;
};

const getPipSize = (symbol?: string) => {
  const normalized = (symbol || '').toUpperCase();
  if (!normalized) return 0.0001;
  if (normalized.includes('JPY')) return 0.01;
  if (normalized.startsWith('XAU') || normalized.startsWith('XAG')) return 0.1;
  if (normalized.includes('BTC') || normalized.includes('ETH')) return 1;
  if (normalized.includes('NAS') || normalized.includes('SPX') || normalized.includes('US30')) return 1;
  return 0.0001;
};

const parseTargetValue = (value?: number | null) => {
  if (value === null || value === undefined) return Number.NaN;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) return Number.NaN;
  return numeric;
};

const getTargets = (position: LivePosition) => {
  const sl = parseTargetValue(position.stopLoss);
  const tp = parseTargetValue(position.takeProfit);
  const current = Number(position.currentPrice);
  if (!Number.isFinite(sl) || !Number.isFinite(tp) || !Number.isFinite(current)) {
    return null;
  }
  const range = Math.abs(tp - sl);
  if (!Number.isFinite(range) || range === 0) return null;

  const progress = position.type === 'BUY'
    ? (current - sl) / range
    : (sl - current) / range;

  const distanceToSL = position.type === 'BUY' ? current - sl : sl - current;
  const distanceToTP = position.type === 'BUY' ? tp - current : current - tp;

  return {
    sl,
    tp,
    progress: Math.max(0, Math.min(1, progress)),
    distanceToSL,
    distanceToTP,
  };
};

const formatNumber = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// [FIX #13] Enriched position type — computed once per data update, not per render
interface EnrichedPosition extends LivePosition {
  _change: number;
  _changePct: number;
  _targets: ReturnType<typeof getTargets>;
}

export default function LivePositionsPanel({ accountId, accountName, isMT5 }: LivePositionsPanelProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [data, setData] = useState<LivePositionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('price');
  const { isConnected, subscribe } = useWebSocket({
    autoConnect: Boolean(isAuthenticated),
    namespace: '/mt5',
  });

  const fetchPositions = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await terminalService.getLivePositions(accountId);
      setData(response);
    } catch (err) {
      setError('Unable to fetch live positions.');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Initial fetch
  useEffect(() => {
    if (!accountId || !isMT5) {
      setData(null);
      return;
    }
    fetchPositions();
  }, [accountId, isMT5, fetchPositions]);

  // [FIX #8] Polling fallback when WebSocket is disconnected
  useEffect(() => {
    if (isConnected || !accountId || !isMT5) return;
    // Poll every 20 seconds as fallback when WS is down
    const interval = setInterval(fetchPositions, 20_000);
    return () => clearInterval(interval);
  }, [isConnected, accountId, isMT5, fetchPositions]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!isConnected || !accountId) return;
    const unsubscribe = subscribe('mt5:positions', (payload: any) => {
      if (!payload || payload.accountId !== accountId) return;
      setData(payload as LivePositionsResponse);
      setError(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConnected, subscribe, accountId]);

  const totalOpenPnl = useMemo(() => {
    if (!data?.positions?.length) return 0;
    return data.positions.reduce((sum, pos) => sum + (Number(pos.profit) || 0), 0);
  }, [data?.positions]);

  // [FIX #13] Memoize all derived position values — computed once per positions update
  const enrichedPositions = useMemo<EnrichedPosition[]>(() => {
    if (!data?.positions?.length) return [];
    return data.positions.map((pos) => {
      const open = Number(pos.openPrice);
      const change = computeChange(pos);
      const changePct = open ? (change / open) * 100 : 0;
      return {
        ...pos,
        _change: change,
        _changePct: changePct,
        _targets: getTargets(pos),
      };
    });
  }, [data?.positions]);

  // [FIX #7] Tighter stale detection — 75s = 2.5x the 30s heartbeat interval
  const heartbeatAge = data?.lastHeartbeat
    ? Date.now() - new Date(data.lastHeartbeat).getTime()
    : null;
  const isHeartbeatStale = heartbeatAge !== null && heartbeatAge > 75_000;

  // Differentiate position data staleness from heartbeat staleness
  const positionAge = data?.positionsUpdatedAt
    ? Date.now() - new Date(data.positionsUpdatedAt).getTime()
    : null;
  const isPositionsStale = positionAge !== null && positionAge > 90_000; // stale if >90s since last positions update

  const formatDistance = (value: number, symbol?: string) => {
    if (!Number.isFinite(value)) return '—';
    if (distanceUnit === 'pips') {
      const pipSize = getPipSize(symbol);
      return `${formatNumber(value / pipSize, 1)}p`;
    }
    return formatNumber(value, 5);
  };

  if (!isMT5) {
    return (
      <div className="bg-white dark:bg-black/70 rounded-2xl border border-gray-200 dark:border-emerald-900/40 p-6 mb-8">
        <div className="flex items-center gap-3">
          <FaBolt className="text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Live MT5 Positions</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select an MT5 account to view open positions in real time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black/70 rounded-2xl border border-gray-200 dark:border-emerald-900/40 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Positions</h2>
            {data?.status && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                data.status === 'RUNNING'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
              }`}>
                <FaCircle className="text-[8px]" />
                {data.status}
              </span>
            )}
            {/* [FIX #7] Differentiated stale indicators */}
            {isHeartbeatStale && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
                <FaExclamationTriangle />
                Terminal Offline
              </span>
            )}
            {!isHeartbeatStale && isPositionsStale && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                <FaExclamationTriangle />
                Positions Stale
              </span>
            )}
            {/* [FIX #8] Indicator when polling fallback is active */}
            {!isConnected && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Polling
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {accountName ? `${accountName} • ` : ''}
            {isConnected ? 'Streaming live' : 'Polling every 20s'} • Last update {formatTimeAgo(data?.positionsUpdatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Open P&L</p>
            <p className={`text-lg font-bold ${totalOpenPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalOpenPnl >= 0 ? '+' : ''}{formatNumber(totalOpenPnl, 2)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Distance</span>
            <div className="flex items-center rounded-full bg-gray-100 dark:bg-emerald-950/40 p-1">
              {(['price', 'pips'] as DistanceUnit[]).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setDistanceUnit(unit)}
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${
                    distanceUnit === unit
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {unit === 'price' ? 'Price' : 'Pips'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && !data && (
        <div className="py-10 text-center text-gray-500 dark:text-gray-400">
          Loading live positions...
        </div>
      )}

      {error && (
        <div className="py-8 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {data && !data.enabled && (
        <div className="py-8 text-center text-gray-600 dark:text-gray-400">
          Auto-sync is not enabled for this MT5 account. Enable it to see live positions.
        </div>
      )}

      {data?.enabled && (!enrichedPositions.length) && !loading && (
        <div className="py-10 text-center text-gray-500 dark:text-gray-400">
          No open positions right now.
        </div>
      )}

      {data?.enabled && enrichedPositions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-emerald-900/40">
                <th className="py-2">Symbol</th>
                <th className="py-2">Side</th>
                <th className="py-2">Size</th>
                <th className="py-2">Open</th>
                <th className="py-2">Current</th>
                <th className="py-2">Change</th>
                <th className="py-2">P/L</th>
                <th className="py-2">Duration</th>
                <th className="py-2">Targets</th>
              </tr>
            </thead>
            <tbody>
              {/* [FIX #13] Use pre-computed enrichedPositions — no repeated compute per render */}
              {enrichedPositions.map((pos) => {
                const profit = Number(pos.profit);
                return (
                  <tr key={pos.ticket} className="border-b border-gray-100 dark:border-emerald-900/20">
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">
                      {pos.symbol}
                      {/* [Enhancement #18] Show comment badge if present */}
                      {(pos as any).comment && (
                        <span className="ml-1 text-[9px] text-gray-400 dark:text-gray-500" title={(pos as any).comment}>
                          {String((pos as any).comment).substring(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className={`py-3 font-semibold ${pos.type === 'BUY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {pos.type}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{formatNumber(Number(pos.volume), 2)}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{formatNumber(Number(pos.openPrice), 5)}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{formatNumber(Number(pos.currentPrice), 5)}</td>
                    <td className={`py-3 font-medium ${pos._change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {pos._change >= 0 ? '+' : ''}{formatNumber(pos._change, 5)} ({pos._change >= 0 ? '+' : ''}{formatNumber(pos._changePct, 2)}%)
                    </td>
                    <td className={`py-3 font-semibold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {profit >= 0 ? '+' : ''}{formatNumber(profit, 2)}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        {formatDuration(pos.openTime)}
                      </div>
                    </td>
                    <td className="py-3">
                      {pos._targets ? (
                        <div className="min-w-[180px] space-y-1">
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            SL {formatNumber(pos._targets.sl, 5)} • TP {formatNumber(pos._targets.tp, 5)}
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-red-500">to SL {formatDistance(pos._targets.distanceToSL, pos.symbol)}</span>
                            <span className="text-emerald-500">to TP {formatDistance(pos._targets.distanceToTP, pos.symbol)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-emerald-950/40 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500/70 via-amber-400/70 to-emerald-500"
                              style={{ width: `${pos._targets.progress * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Targets not set</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
