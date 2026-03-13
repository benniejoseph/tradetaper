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
import ReplayControls from '@/components/backtesting/workbench/ReplayControls';
import { aggregateCandles } from '@/utils/candleAggregation';
import Link from 'next/link';
import {
  FaChevronLeft, FaSave,
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
  const [timeframe] = useState(searchParams.get('timeframe') || '15m');
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
  const currentIndexRef = useRef(currentIndex);
  const fullDataRef = useRef(fullData);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

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

  const bg = isDark ? 'bg-black' : 'bg-gray-50';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-slate-500' : 'text-gray-500';

  return (
    <div className={`h-full w-full ${bg} ${text} flex flex-col relative overflow-hidden`}>
      {isDark && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-emerald-950/20 to-transparent" />
        </div>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3" />
              <p className={muted}>Loading 1m candles for {symbol}...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`rounded-xl p-6 max-w-sm border ${
                isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
              }`}
            >
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
            <div className="flex-1 min-h-0">
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

            <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto">
                <Link
                  href="/backtesting"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-black/75 border-zinc-700 text-slate-300 hover:text-emerald-300 hover:border-emerald-700'
                      : 'bg-white/90 border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                  }`}
                  aria-label="Back to backtesting"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </Link>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                {tvUnavailableReason && (
                  <div className="text-[10px] px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 max-w-[320px] truncate">
                    {tvUnavailableReason}
                  </div>
                )}
                <button
                  onClick={handleSaveSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-semibold transition-colors"
                >
                  <FaSave className="w-3 h-3" />
                  Save
                </button>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center pointer-events-none">
              <div className="pointer-events-auto w-full max-w-2xl">
                <ReplayControls
                  isPlaying={isPlaying}
                  onPlayPause={() => setIsPlaying((prev) => !prev)}
                  onNextCandle={handleNextCandle}
                  onPrevCandle={handlePrevCandle}
                  speed={speed}
                  onSpeedChange={setSpeed}
                  currentDate={currentCandleDate}
                  totalCandles={fullData.length}
                  currentCandleIndex={currentIndex + 1}
                  tickMode={false}
                  onTickModeToggle={() => undefined}
                  isAnimating={false}
                />
              </div>
            </div>
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
