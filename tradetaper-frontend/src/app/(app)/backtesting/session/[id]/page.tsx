// src/app/(app)/backtesting/session/[id]/page.tsx
'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CandleData } from '@/components/backtesting/workbench/mockData';
import TradingViewBacktestChart, {
  TradingViewBacktestChartHandle,
} from '@/components/backtesting/workbench/TradingViewBacktestChart';
import { aggregateCandles } from '@/utils/candleAggregation';
import Link from 'next/link';
import {
  FaChevronLeft,
  FaPause,
  FaPlay,
  FaSave,
  FaStepBackward,
  FaStepForward,
} from 'react-icons/fa';
import AlertModal from '@/components/ui/AlertModal';

interface ClosedReplayTrade {
  pnl: number;
  [key: string]: unknown;
}

interface CandleApiRow {
  time?: number | string;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close?: number | string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function BacktestSessionPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark') !== false);
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const [symbol] = useState(searchParams.get('symbol') || 'XAUUSD');
  const [timeframe, setTimeframe] = useState(searchParams.get('timeframe') || '15m');
  const [startDate] = useState(searchParams.get('startDate') || '2024-01-01');
  const [endDate] = useState(searchParams.get('endDate') || '2024-01-31');
  const [startingBalance] = useState(parseFloat(searchParams.get('balance') || '100000'));

  const [fullData, setFullData] = useState<CandleData[]>([]);
  const [visibleData, setVisibleData] = useState<CandleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const [balance, setBalance] = useState(startingBalance);
  const [trades, setTrades] = useState<ClosedReplayTrade[]>([]);
  const [executionMode, setExecutionMode] = useState<'market' | 'pending'>('market');
  const [orderVolume, setOrderVolume] = useState('0.10');

  const [tvUnavailableReason, setTvUnavailableReason] = useState<string | null>(null);

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: 'Notice',
    message: '',
  });
  const closeAlert = () => setAlertState((prev) => ({ ...prev, isOpen: false }));
  const showAlert = (message: string, title = 'Notice') =>
    setAlertState({ isOpen: true, title, message });

  const tradingViewRef = useRef<TradingViewBacktestChartHandle | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullDataRef = useRef(fullData);

  useEffect(() => {
    fullDataRef.current = fullData;
  }, [fullData]);

  const aggregateToTf = useCallback((raw: CandleData[], tf: string): CandleData[] => {
    if (tf === '1m') return raw;
    return aggregateCandles(
      raw as unknown as Parameters<typeof aggregateCandles>[0],
      tf,
    ) as unknown as CandleData[];
  }, []);

  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const response = await fetch(
        `${apiUrl}/backtesting/candles/${symbol}?timeframe=1m&startDate=${startDate}&endDate=${endDate}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) throw new Error('Failed to fetch candles');

      const rows = (await response.json()) as CandleApiRow[];
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('No candles returned');
      }

      const parseNum = (value: number | string | undefined): number | null => {
        if (value === undefined || value === null) return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
      };

      const raw: CandleData[] = [];
      for (const row of rows) {
        const time = row.time == null ? null : Number(row.time);
        const open = parseNum(row.open);
        const high = parseNum(row.high);
        const low = parseNum(row.low);
        const close = parseNum(row.close);

        if (
          time == null
          || !Number.isFinite(time)
          || open == null
          || high == null
          || low == null
          || close == null
        ) {
          continue;
        }

        raw.push({ time, open, high, low, close });
      }

      raw.sort((a, b) => Number(a.time) - Number(b.time));
      if (raw.length === 0) {
        throw new Error('No valid candles after filtering');
      }

      const aggregated = aggregateToTf(raw, timeframe);
      if (!aggregated.length) {
        throw new Error('No candles available for selected timeframe');
      }

      const startIdx = Math.min(50, aggregated.length);
      setFullData(aggregated);
      setVisibleData(aggregated.slice(0, startIdx));
      setCurrentIndex(startIdx - 1);
      setIsPlaying(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load candles'));
    } finally {
      setLoading(false);
    }
  }, [aggregateToTf, symbol, startDate, endDate, timeframe]);

  useEffect(() => {
    void fetchCandles();
  }, [fetchCandles]);

  useEffect(() => {
    const sessionId = params.id;
    if (!sessionId) return;

    let cancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const hydrateSessionState = async () => {
      try {
        const response = await fetch(`${apiUrl}/backtesting/sessions/${sessionId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) return;
        const payload = (await response.json()) as {
          trades?: ClosedReplayTrade[];
          endingBalance?: number;
        };

        if (cancelled) return;

        if (Array.isArray(payload.trades)) {
          setTrades(payload.trades);
        }

        if (typeof payload.endingBalance === 'number' && Number.isFinite(payload.endingBalance)) {
          setBalance(payload.endingBalance);
        }
      } catch {
        // Session hydration is best-effort only.
      }
    };

    void hydrateSessionState();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleNextCandle = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= fullDataRef.current.length) {
        setIsPlaying(false);
        return prev;
      }

      setVisibleData((prevCandles) => [...prevCandles, fullDataRef.current[nextIndex]]);
      return nextIndex;
    });
  }, []);

  const handlePrevCandle = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev <= 0) return prev;
      setVisibleData((prevCandles) => prevCandles.slice(0, -1));
      return prev - 1;
    });
  }, []);

  const handleSeek = useCallback((targetOneBased: number) => {
    const data = fullDataRef.current;
    if (!data.length) return;

    const clamped = Math.min(Math.max(targetOneBased, 1), data.length);
    const nextIndex = clamped - 1;
    setIsPlaying(false);
    setCurrentIndex(nextIndex);
    setVisibleData(data.slice(0, clamped));
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(handleNextCandle, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speed, handleNextCandle]);

  const handleSaveSession = async () => {
    try {
      const sessionId = params.id;
      if (!sessionId) {
        showAlert('Session ID is missing, cannot save this session.', 'Missing Session ID');
        return;
      }

      const wins = trades.filter((trade) => Number(trade.pnl) > 0).length;
      const losses = trades.filter((trade) => Number(trade.pnl) <= 0).length;
      const winRate = trades.length ? (wins / trades.length) * 100 : 0;
      const totalPnl = balance - startingBalance;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      const response = await fetch(`${apiUrl}/backtesting/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trades,
          endingBalance: balance,
          totalPnl,
          totalTrades: trades.length,
          winningTrades: wins,
          losingTrades: losses,
          winRate,
          status: 'in_progress',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      await tradingViewRef.current?.saveLayout();
      showAlert('Session saved successfully!', 'Session Saved');
    } catch (saveError) {
      showAlert(getErrorMessage(saveError, 'Failed to save session'), 'Save Failed');
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (!isPlaying) handleNextCandle();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (!isPlaying) handlePrevCandle();
          break;
        case '1':
          setSpeed(1000);
          break;
        case '2':
          setSpeed(500);
          break;
        case '3':
          setSpeed(200);
          break;
        case '4':
          setSpeed(50);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNextCandle, handlePrevCandle, isPlaying]);

  const currentCandleDate = useMemo(() => {
    const ts = visibleData[visibleData.length - 1]?.time as number;
    if (!ts) return '—';
    const date = new Date(ts * 1000);
    return `${date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    })} ${date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, [visibleData]);

  const sessionStartSec = useMemo(() => {
    const first = fullData[0]?.time;
    const parsed = Number(first);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [fullData]);

  const sessionEndSec = useMemo(() => {
    const last = fullData[fullData.length - 1]?.time;
    const parsed = Number(last);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [fullData]);

  const currentPrice = Number(visibleData[visibleData.length - 1]?.close || 0);
  const displayPrice = Number.isFinite(currentPrice) ? currentPrice.toFixed(2) : '0.00';
  const totalPnl = balance - startingBalance;
  const pnlPositive = totalPnl >= 0;
  const wins = trades.filter((trade) => Number(trade.pnl) > 0).length;
  const losses = trades.filter((trade) => Number(trade.pnl) <= 0).length;
  const progressPercent = fullData.length > 0
    ? ((currentIndex + 1) / fullData.length) * 100
    : 0;
  const speedLabelMap: Record<number, string> = {
    1000: '1x',
    500: '2x',
    200: '5x',
    50: '10x',
  };
  const timeframeOptions = ['1m', '5m', '15m', '1h', '4h', '1d'];

  const panelTheme = isDark
    ? {
      page: 'bg-[#060707] text-white',
      card: 'bg-[#0c0e0e] border-zinc-800',
      top: 'bg-[#0d1010] text-zinc-100 border-zinc-800',
      chartTools: 'bg-[#111314] border-zinc-800 text-zinc-200',
      muted: 'text-zinc-400',
    }
    : {
      page: 'bg-[#f5f6f7] text-zinc-900',
      card: 'bg-white border-zinc-200',
      top: 'bg-white text-zinc-900 border-zinc-200',
      chartTools: 'bg-[#f8fafc] border-zinc-200 text-zinc-800',
      muted: 'text-zinc-500',
    };

  const handleVolumeStep = (delta: number) => {
    const current = Number(orderVolume);
    const base = Number.isFinite(current) ? current : 0.1;
    const next = Math.max(0.01, base + delta);
    setOrderVolume(next.toFixed(2));
  };

  const renderOrderPanel = () => (
    <div className="flex h-full flex-col p-3 gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Order Ticket</div>
        <div className="text-xs font-semibold">{symbol}</div>
      </div>

      <div className={`rounded-xl border p-3 ${isDark ? 'border-zinc-700 bg-black/40' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => showAlert(`SELL order simulation queued at ${displayPrice}`, 'Market Simulation')}
            className="rounded-lg bg-red-500/15 border border-red-500/30 py-2 text-red-300 font-semibold hover:bg-red-500/25 transition-colors"
          >
            SELL {displayPrice}
          </button>
          <button
            onClick={() => showAlert(`BUY order simulation queued at ${displayPrice}`, 'Market Simulation')}
            className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 py-2 text-emerald-300 font-semibold hover:bg-emerald-500/25 transition-colors"
          >
            BUY {displayPrice}
          </button>
        </div>

        <div className="mt-3 flex rounded-lg border border-zinc-700/70 p-1">
          <button
            onClick={() => setExecutionMode('market')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              executionMode === 'market'
                ? 'bg-emerald-500 text-black'
                : `${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setExecutionMode('pending')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              executionMode === 'pending'
                ? 'bg-emerald-500 text-black'
                : `${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      <div className={`rounded-xl border p-3 space-y-3 ${isDark ? 'border-zinc-700 bg-black/40' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Volume</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVolumeStep(-0.01)}
            className={`h-9 w-9 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 hover:bg-zinc-900' : 'border-zinc-300 hover:bg-zinc-100'}`}
          >
            -
          </button>
          <input
            value={orderVolume}
            onChange={(event) => setOrderVolume(event.target.value)}
            className={`flex-1 h-9 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark ? 'bg-[#121415] border-zinc-700 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
            }`}
          />
          <button
            onClick={() => handleVolumeStep(0.01)}
            className={`h-9 w-9 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 hover:bg-zinc-900' : 'border-zinc-300 hover:bg-zinc-100'}`}
          >
            +
          </button>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Net P&L</span>
            <span className={pnlPositive ? 'text-emerald-400' : 'text-red-400'}>
              {pnlPositive ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Trades</span>
            <span>{wins}W / {losses}L</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Execution</span>
            <span className="capitalize">{executionMode}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`h-full w-full ${panelTheme.page} flex flex-col overflow-hidden`}>
      <main className="flex-1 min-h-0 flex flex-col gap-3 p-3 md:p-4">
        {loading && (
          <div className={`flex-1 min-h-0 rounded-2xl border ${panelTheme.card} flex items-center justify-center`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3" />
              <p className={panelTheme.muted}>Loading 1m candles for {symbol}...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className={`flex-1 min-h-0 rounded-2xl border ${panelTheme.card} flex items-center justify-center p-6`}>
            <div className={`rounded-xl p-6 max-w-sm border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
              <p className="text-red-400 text-center mb-4">{error}</p>
              <button
                onClick={() => {
                  void fetchCandles();
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && fullData.length > 0 && (
          <>
            <header className={`h-14 shrink-0 rounded-xl border ${panelTheme.top} px-3 md:px-4 flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href="/backtesting"
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                    isDark
                      ? 'bg-black border-zinc-700 text-zinc-300 hover:text-emerald-300 hover:border-emerald-700'
                      : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                  }`}
                  aria-label="Back to backtesting"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </Link>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{symbol} {timeframe.toUpperCase()}</div>
                  <div className={`text-[11px] ${panelTheme.muted}`}>{startDate} {'->'} {endDate}</div>
                </div>
                <span className="hidden md:inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-[0.12em]">
                  Active
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-6 text-sm">
                <div>
                  <span className={panelTheme.muted}>Balance </span>
                  <span className="font-semibold">${balance.toFixed(2)}</span>
                </div>
                <div className={pnlPositive ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                  {pnlPositive ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className={`h-8 px-3 rounded-md border text-xs font-semibold transition-colors ${
                    isPlaying
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500 text-black border-emerald-500 hover:bg-emerald-400'
                  }`}
                >
                  {isPlaying ? 'Pause' : 'Replay'}
                </button>
                <button
                  onClick={handleSaveSession}
                  className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <FaSave className="w-3 h-3" />
                  Save
                </button>
              </div>
            </header>

            <section className={`flex-1 min-h-0 rounded-2xl border ${panelTheme.card} overflow-hidden flex flex-col`}>
              <div className={`h-11 shrink-0 border-b ${panelTheme.chartTools} flex items-center justify-between px-2 md:px-3`}>
                <div className="flex items-center gap-1 md:gap-2">
                  {timeframeOptions.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        if (tf === timeframe) return;
                        setIsPlaying(false);
                        setTimeframe(tf);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        timeframe === tf
                          ? 'bg-emerald-500 text-black'
                          : isDark
                            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                  <button
                    onClick={() => showAlert('Indicators are managed directly inside TradingView toolbar.', 'TradingView Controls')}
                    className={`ml-1 px-2.5 py-1 rounded-md text-xs transition-colors border ${
                      isDark
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                        : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    Indicators
                  </button>
                </div>
                <div className={`text-xs ${panelTheme.muted}`}>{currentCandleDate}</div>
              </div>

              <div className="flex-1 min-h-0 flex">
                <div className="flex-1 min-w-0 h-full">
                  <TradingViewBacktestChart
                    ref={tradingViewRef}
                    sessionId={params.id}
                    symbol={symbol}
                    timeframe={timeframe}
                    isDark={isDark}
                    replayTo={Number(visibleData[visibleData.length - 1]?.time || 0)}
                    sessionStart={sessionStartSec}
                    sessionEnd={sessionEndSec}
                    className="h-full w-full"
                    onUnavailable={(reason) => {
                      setTvUnavailableReason(reason);
                      setError(reason);
                    }}
                  />
                </div>

                <aside className={`hidden xl:block w-[320px] border-l ${isDark ? 'border-zinc-800 bg-[#090b0b]' : 'border-zinc-200 bg-[#fbfbfb]'}`}>
                  {renderOrderPanel()}
                </aside>
              </div>

              <div className={`xl:hidden border-t ${isDark ? 'border-zinc-800 bg-[#090b0b]' : 'border-zinc-200 bg-[#fbfbfb]'}`}>
                {renderOrderPanel()}
              </div>
            </section>

            <section className={`shrink-0 rounded-2xl border ${panelTheme.card} p-3 md:p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevCandle}
                    disabled={isPlaying || currentIndex <= 0}
                    className={`h-9 w-9 rounded-lg border transition-colors disabled:opacity-45 ${
                      isDark ? 'border-zinc-700 hover:bg-zinc-900' : 'border-zinc-300 hover:bg-zinc-100'
                    }`}
                    title="Previous candle"
                  >
                    <FaStepBackward className="mx-auto" />
                  </button>
                  <button
                    onClick={() => setIsPlaying((prev) => !prev)}
                    className={`h-9 px-4 rounded-lg font-semibold text-sm transition-colors ${
                      isPlaying
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500 text-black'
                    }`}
                  >
                    {isPlaying ? (
                      <span className="inline-flex items-center gap-2"><FaPause /> Pause</span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><FaPlay /> Play</span>
                    )}
                  </button>
                  <button
                    onClick={handleNextCandle}
                    disabled={isPlaying || currentIndex >= fullData.length - 1}
                    className={`h-9 w-9 rounded-lg border transition-colors disabled:opacity-45 ${
                      isDark ? 'border-zinc-700 hover:bg-zinc-900' : 'border-zinc-300 hover:bg-zinc-100'
                    }`}
                    title="Next candle"
                  >
                    <FaStepForward className="mx-auto" />
                  </button>
                </div>

                <div className={`text-xs md:text-sm ${panelTheme.muted}`}>
                  Candle {Math.max(currentIndex + 1, 0)} / {fullData.length}
                </div>

                <div className="flex items-center gap-2">
                  {[1000, 500, 200, 50].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSpeed(value)}
                      className={`h-8 px-2.5 rounded-md text-xs font-semibold border transition-colors ${
                        speed === value
                          ? 'bg-emerald-500 text-black border-emerald-500'
                          : isDark
                            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                            : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {speedLabelMap[value]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <input
                  type="range"
                  min={1}
                  max={Math.max(fullData.length, 1)}
                  value={Math.max(currentIndex + 1, 1)}
                  onChange={(event) => handleSeek(Number(event.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 text-xs ${panelTheme.muted}`}>
                <span>{currentCandleDate}</span>
                <span>
                  Win/Loss: {wins}/{losses}
                </span>
              </div>
            </section>

            {tvUnavailableReason && (
              <div className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {tvUnavailableReason}
              </div>
            )}
          </>
        )}
      </main>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
      />
    </div>
  );
}
