// src/app/(app)/backtesting/session/[id]/page.tsx
'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CandleData } from '@/components/backtesting/workbench/mockData';
import ChartEngine, { ChartEngineRef } from '@/components/backtesting/workbench/ChartEngine';
import TradingViewBacktestChart, {
  TradingViewBacktestChartHandle,
} from '@/components/backtesting/workbench/TradingViewBacktestChart';
import ReplayControls from '@/components/backtesting/workbench/ReplayControls';
import OrderPanel from '@/components/backtesting/workbench/OrderPanel';
import PositionManager from '@/components/backtesting/workbench/PositionManager';
import IndicatorPanel from '@/components/backtesting/workbench/IndicatorPanel';
import DrawingToolbar from '@/components/backtesting/workbench/DrawingToolbar';
import SessionSidebar from '@/components/backtesting/workbench/SessionSidebar';
import HtfContextChart from '@/components/backtesting/workbench/HtfContextChart';
import { aggregateCandles } from '@/utils/candleAggregation';
import { CandlestickData } from 'lightweight-charts';
import { IndicatorConfig, DEFAULT_INDICATORS } from '@/utils/indicators';
import { DrawingTool, Drawing } from '@/utils/drawings';
import { animateCandle } from '@/utils/tickSimulation';
import Link from 'next/link';
import {
  FaChevronLeft, FaSave,
} from 'react-icons/fa';
import {
  FiSun, FiMoon, FiActivity, FiTrendingUp,
  FiCheck,
} from 'react-icons/fi';
import AlertModal from '@/components/ui/AlertModal';

// ── Session markers ────────────────────────────────────────────────────────────

const SESSIONS = [
  { name: 'Asia',   utcHour: 0,  color: '#8B5CF6', Icon: FiMoon      },
  { name: 'London', utcHour: 7,  color: '#3B82F6', Icon: FiActivity  },
  { name: 'NY',     utcHour: 12, color: '#10B981', Icon: FiTrendingUp },
  { name: 'NY PM',  utcHour: 15, color: '#F59E0B', Icon: FiSun       },
];

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const HTF_OPTIONS = ['5m', '15m', '1h', '4h', '1d'] as const;

interface SessionMarker {
  time: number;
  position: 'inBar' | 'aboveBar' | 'belowBar';
  color: string;
  shape: 'circle' | 'arrowUp' | 'arrowDown';
  size: number;
  text: string;
}

interface OpenReplayPosition {
  type: 'LONG' | 'SHORT';
  entry: number;
  sl: number;
  tp: number;
  lotSize: number;
  entryTime: number;
  spread: number;
  commission: number;
}

interface ClosedReplayTrade extends OpenReplayPosition {
  pnl: number;
  exitTime: number;
  exitPrice: number;
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function BacktestSessionPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark') !== false);
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // ── Session config from URL ────────────────────────────────────────────────
  const [symbol]         = useState(searchParams.get('symbol')    || 'XAUUSD');
  const [timeframe, setTimeframe] = useState(searchParams.get('timeframe') || '15m');
  const [startDate]      = useState(searchParams.get('startDate') || '2024-01-01');
  const [endDate]        = useState(searchParams.get('endDate')   || '2024-01-31');
  const [startingBalance]= useState(parseFloat(searchParams.get('balance') || '100000'));

  // Sim settings
  const [spreadPips]        = useState(parseFloat(searchParams.get('spread')     || '0'));
  const [slippagePips]      = useState(parseFloat(searchParams.get('slippage')   || '0'));
  const [commissionPerSide] = useState(parseFloat(searchParams.get('commission') || '0'));

  // ── Candle state ───────────────────────────────────────────────────────────
  // base1mData: raw 1m candles fetched ONCE from the API
  const [base1mData,   setBase1mData]   = useState<CandleData[]>([]);
  const base1mRef = useRef<CandleData[]>([]);
  base1mRef.current = base1mData;

  // fullData: aggregated for the CURRENT timeframe (derived from base1mData)
  const [fullData,     setFullData]     = useState<CandleData[]>([]);
  const [visibleData,  setVisibleData]  = useState<CandleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── Replay state ───────────────────────────────────────────────────────────
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [speed,       setSpeed]       = useState(1000);
  const [tickMode,    setTickMode]    = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cancelTickRef = useRef<(() => void) | null>(null);

  // ── Trading state ──────────────────────────────────────────────────────────
  const [balance,      setBalance]      = useState(startingBalance);
  const [trades,       setTrades]       = useState<ClosedReplayTrade[]>([]);
  const [markers,      setMarkers]      = useState<SessionMarker[]>([]);
  const [openPosition, setOpenPosition] = useState<OpenReplayPosition | null>(null);

  // ── Indicators + drawings ──────────────────────────────────────────────────
  const [indicators,  setIndicators] = useState<IndicatorConfig>(DEFAULT_INDICATORS);
  const [activeTool,  setActiveTool] = useState<DrawingTool>('none');
  const [drawings,    setDrawings]   = useState<Drawing[]>([]);

  // ── HTF context ────────────────────────────────────────────────────────────
  const [htfTimeframe, setHtfTimeframe] = useState<string>('4h');
  const [chartProvider, setChartProvider] = useState<'legacy' | 'tradingview'>(
    process.env.NEXT_PUBLIC_BACKTEST_CHART_PROVIDER === 'tradingview'
      ? 'tradingview'
      : 'legacy',
  );
  const [tvUnavailableReason, setTvUnavailableReason] = useState<string | null>(
    null,
  );

  // ── Alert modal ────────────────────────────────────────────────────────────
  const [alertState, setAlertState] = useState({ isOpen: false, title: 'Notice', message: '' });
  const closeAlert = () => setAlertState(p => ({ ...p, isOpen: false }));
  const showAlert  = (msg: string, title = 'Notice') =>
    setAlertState({ isOpen: true, title, message: msg });

  // ── Session jump toast ─────────────────────────────────────────────────────
  const [jumpMsg, setJumpMsg] = useState('');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const chartRef          = useRef<ChartEngineRef>(null);
  const tradingViewRef    = useRef<TradingViewBacktestChartHandle | null>(null);
  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef      = useRef(isPlaying);
  const currentIndexRef   = useRef(currentIndex);
  const fullDataRef       = useRef(fullData);
  const openPositionRef   = useRef(openPosition);
  isPlayingRef.current    = isPlaying;
  currentIndexRef.current = currentIndex;
  fullDataRef.current     = fullData;
  openPositionRef.current = openPosition;

  useEffect(() => {
    if (chartProvider === 'tradingview' && tickMode) {
      setTickMode(false);
    }
  }, [chartProvider, tickMode]);

  // ── HTF aggregation (derived from base1m, not re-fetched) ─────────────────
  const htfCandles = useMemo(
    () => aggregateCandles(base1mData as CandlestickData[], htfTimeframe),
    [base1mData, htfTimeframe],
  );

  const currentTimestamp = useMemo(
    () => (visibleData[visibleData.length - 1]?.time as number) || 0,
    [visibleData],
  );

  const htfCurrentTime = useMemo(() => {
    if (!htfCandles.length || !currentTimestamp) return 0;
    let result = htfCandles[0].time as number;
    for (const c of htfCandles) {
      if ((c.time as number) <= currentTimestamp) result = c.time as number;
      else break;
    }
    return result;
  }, [htfCandles, currentTimestamp]);

  // ── Aggregate 1m → target TF ──────────────────────────────────────────────
  const aggregateToTf = useCallback((raw: CandleData[], tf: string): CandleData[] => {
    if (tf === '1m') return raw;
    return aggregateCandles(raw as CandlestickData[], tf) as CandleData[];
  }, []);

  // ── Fetch 1m candles ONCE, derive everything else locally ─────────────────
  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const res = await fetch(
        `${apiUrl}/backtesting/candles/${symbol}?timeframe=1m&startDate=${startDate}&endDate=${endDate}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!res.ok) throw new Error('Failed to fetch candles');
      const candles = await res.json();
      if (!Array.isArray(candles) || candles.length === 0)
        throw new Error('No candles returned');

      const parseNum = (value: number | string | undefined): number | null => {
        if (value === undefined || value === null) return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
      };

      const raw: CandleData[] = [];
      for (const candleRow of candles as CandleApiRow[]) {
        const time = candleRow.time == null ? null : Number(candleRow.time);
        const open = parseNum(candleRow.open);
        const high = parseNum(candleRow.high);
        const low = parseNum(candleRow.low);
        const close = parseNum(candleRow.close);

        if (
          time == null ||
          !Number.isFinite(time) ||
          open == null ||
          high == null ||
          low == null ||
          close == null
        ) {
          continue;
        }

        raw.push({
          time,
          open,
          high,
          low,
          close,
        });
      }
      raw.sort((a, b) => Number(a.time) - Number(b.time));

      if (raw.length === 0) throw new Error('No valid candles after filtering');

      // Store raw 1m for TF switching
      setBase1mData(raw);
      base1mRef.current = raw;

      // Aggregate to selected TF
      const agg = aggregateToTf(raw, timeframe);
      const startIdx = Math.min(50, agg.length);
      setFullData(agg);
      setVisibleData(agg.slice(0, startIdx));
      setCurrentIndex(startIdx - 1);
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
          headers: {
            'Content-Type': 'application/json',
          },
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
        // Session hydration is best-effort to preserve page startup.
      }
    };

    void hydrateSessionState();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // ── Timeframe switch — INSTANT, no re-fetch ───────────────────────────────
  const handleTimeframeChange = useCallback((newTf: string) => {
    if (newTf === timeframe) return;
    setIsPlaying(false);
    cancelTickRef.current?.();

    // Preserve current timestamp position
    const keepTsRaw = visibleData[visibleData.length - 1]?.time;
    const keepTs = keepTsRaw != null ? Number(keepTsRaw) : undefined;

    setTimeframe(newTf);

    const raw = base1mRef.current;
    if (!raw.length) return;

    // Local aggregation — instant
    const agg = aggregateToTf(raw, newTf);
    setFullData(agg);

    let idx = Math.min(50, agg.length);
    if (keepTs !== undefined) {
      const near = agg.findIndex(c => Number(c.time) >= keepTs);
      if (near > 0) idx = Math.min(near + 1, agg.length);
    }
    setVisibleData(agg.slice(0, idx));
    setCurrentIndex(idx - 1);
  }, [timeframe, visibleData, aggregateToTf]);

  // ── Session jump ───────────────────────────────────────────────────────────
  const jumpToSession = useCallback((targetHour: number, sessionName: string) => {
    const data = fullDataRef.current;
    if (!data.length) return;

    const searchFrom = currentIndexRef.current;
    for (let i = searchFrom; i < data.length; i++) {
      const h = new Date((data[i].time as number) * 1000).getUTCHours();
      if (h === targetHour) {
        const jumpTo = Math.min(i + 1, data.length);
        setVisibleData(data.slice(0, jumpTo));
        setCurrentIndex(jumpTo - 1);
        setJumpMsg(`${sessionName} Open`);
        setTimeout(() => setJumpMsg(''), 2000);
        return;
      }
    }
    // Wrap around
    for (let i = 0; i < searchFrom; i++) {
      const h = new Date((data[i].time as number) * 1000).getUTCHours();
      if (h === targetHour) {
        const jumpTo = Math.min(i + 1, data.length);
        setVisibleData(data.slice(0, jumpTo));
        setCurrentIndex(jumpTo - 1);
        setJumpMsg(`${sessionName} Open (next)`);
        setTimeout(() => setJumpMsg(''), 2000);
        return;
      }
    }
    setJumpMsg(`No ${sessionName} candles found`);
    setTimeout(() => setJumpMsg(''), 2000);
  }, []);

  // ── Chart sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (chartProvider === 'legacy' && chartRef.current && visibleData.length > 0) {
      chartRef.current.setCandles(visibleData);
    }
  }, [visibleData, chartProvider]);

  // ── Process open positions on each new candle ──────────────────────────────
  const closeTrade = useCallback((pnl: number, time: number, exitPrice: number) => {
    const pos = openPositionRef.current;
    if (!pos) return;

    setBalance(prev => prev + pnl);
    setTrades(prev => [...prev, { ...pos, pnl, exitTime: time, exitPrice }]);
    setOpenPosition(null);
    setMarkers(prev => [...prev, {
      time, position: 'inBar',
      color: pnl >= 0 ? '#10B981' : '#EF4444',
      shape: 'circle', size: 1,
      text:  pnl >= 0 ? `+$${pnl.toFixed(0)}` : `-$${Math.abs(pnl).toFixed(0)}`,
    }]);
  }, []);

  const processOpenPositions = useCallback((candle: CandleData) => {
    const pos = openPositionRef.current;
    if (!pos) return;
    const { low, high, open } = candle;
    let exitPrice: number | null = null;
    let pnl = 0;

    if (pos.type === 'LONG') {
      const slHit = low <= pos.sl;
      const tpHit = high >= pos.tp;
      if (slHit && tpHit) {
        exitPrice = Math.abs(open - pos.sl) <= Math.abs(open - pos.tp) ? pos.sl : pos.tp;
      } else if (slHit) {
        exitPrice = pos.sl;
      } else if (tpHit) {
        exitPrice = pos.tp;
      }
      if (exitPrice != null) pnl = (exitPrice - pos.entry) * pos.lotSize * 100;
    } else {
      const slHit = high >= pos.sl;
      const tpHit = low <= pos.tp;
      if (slHit && tpHit) {
        exitPrice = Math.abs(open - pos.sl) <= Math.abs(open - pos.tp) ? pos.sl : pos.tp;
      } else if (slHit) {
        exitPrice = pos.sl;
      } else if (tpHit) {
        exitPrice = pos.tp;
      }
      if (exitPrice != null) pnl = (pos.entry - exitPrice) * pos.lotSize * 100;
    }

    if (exitPrice != null) closeTrade(pnl, Number(candle.time), exitPrice);
  }, [closeTrade]);

  // ── Close at market ────────────────────────────────────────────────────────
  const handleCloseAtMarket = useCallback(() => {
    const pos = openPositionRef.current;
    if (!pos) return;
    const currentCandle = visibleData[visibleData.length - 1];
    if (!currentCandle) return;
    const price = currentCandle.close;
    const pnl = pos.type === 'LONG'
      ? (price - pos.entry) * pos.lotSize * 100
      : (pos.entry - price) * pos.lotSize * 100;
    closeTrade(pnl, Number(currentCandle.time), price);
  }, [visibleData, closeTrade]);

  // ── SL/TP update ──────────────────────────────────────────────────────────
  const handleSlTpChange = useCallback((newSl: number, newTp: number) => {
    setOpenPosition(prev => prev ? { ...prev, sl: newSl, tp: newTp } : null);
  }, []);

  // ── Candle advance ────────────────────────────────────────────────────────
  const advanceCandle = useCallback((candle: CandleData, nextIndex: number) => {
    if (tickMode && chartProvider === 'legacy') {
      const numericTime = Number(candle.time);
      if (!Number.isFinite(numericTime)) {
        return;
      }

      cancelTickRef.current?.();
      setIsAnimating(true);
      const dur = Math.max(speed, 40);
      cancelTickRef.current = animateCandle(
        {
          time: numericTime,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        },
        dur,
        (partial) => { chartRef.current?.updateLastCandle(partial); },
        (final) => {
          setIsAnimating(false);
          cancelTickRef.current = null;
          setVisibleData(prev => [...prev, final]);
          setCurrentIndex(nextIndex);
          processOpenPositions(final);
        },
      );
    } else {
      setVisibleData(prev => [...prev, candle]);
      setCurrentIndex(nextIndex);
      processOpenPositions(candle);
    }
  }, [tickMode, speed, processOpenPositions, chartProvider]);

  const handleNextCandle = useCallback(() => {
    if (tickMode && isAnimating) return;
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex >= fullDataRef.current.length) { setIsPlaying(false); return prev; }
      advanceCandle(fullDataRef.current[nextIndex], nextIndex);
      return prev;
    });
  }, [tickMode, isAnimating, advanceCandle]);

  const handlePrevCandle = useCallback(() => {
    if (isAnimating) return;
    cancelTickRef.current?.();
    if (currentIndexRef.current > 0) {
      setCurrentIndex(prev => {
        setVisibleData(d => d.slice(0, -1));
        return prev - 1;
      });
    }
  }, [isAnimating]);

  const onNextClick = useCallback(() => {
    if (isAnimating) return;
    cancelTickRef.current?.();
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < fullDataRef.current.length) {
      advanceCandle(fullDataRef.current[nextIndex], nextIndex);
    }
  }, [isAnimating, advanceCandle]);

  // ── Replay timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) { if (timerRef.current) clearInterval(timerRef.current); return; }
    if (tickMode) { if (!isAnimating) handleNextCandle(); return; }
    timerRef.current = setInterval(handleNextCandle, speed);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, tickMode, isAnimating, handleNextCandle]);

  // ── Check positions on visible data change ─────────────────────────────────
  useEffect(() => {
    if (visibleData.length > 0 && openPosition) {
      processOpenPositions(visibleData[visibleData.length - 1]);
    }
  }, [visibleData, openPosition, processOpenPositions]);

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback((
    type: 'LONG' | 'SHORT', lotSize: number, sl: number, tp: number,
  ) => {
    if (openPosition) return;
    const candle = visibleData[visibleData.length - 1];
    if (!candle) return;
    const rawPrice = candle.close;
    const pip = symbol.includes('JPY') || symbol === 'XAUUSD' ? 0.01 : 0.0001;
    const halfSpread = (spreadPips / 2) * pip;
    const slip       = slippagePips * pip;
    const entry = type === 'LONG'
      ? rawPrice + halfSpread + slip
      : rawPrice - halfSpread - slip;

    if (commissionPerSide > 0) setBalance(prev => prev - commissionPerSide * 2);

    setOpenPosition({
      type, entry, sl, tp, lotSize,
      entryTime: Number(candle.time),
      spread: spreadPips, commission: commissionPerSide * 2,
    });
    setMarkers(prev => [...prev, {
      time: Number(candle.time),
      position: type === 'LONG' ? 'belowBar' : 'aboveBar',
      color: type === 'LONG' ? '#2196F3' : '#E91E63',
      shape: type === 'LONG' ? 'arrowUp' : 'arrowDown',
      size: 1,
      text:  `${type} @ ${entry.toFixed(5)}`,
    }]);
  }, [openPosition, visibleData, symbol, spreadPips, slippagePips, commissionPerSide]);

  // ── Drawings ───────────────────────────────────────────────────────────────
  const handleDrawingComplete = (d: Drawing) => setDrawings(prev => [...prev, d]);
  const handleDrawingDelete   = (id: string) => setDrawings(prev => prev.filter(d => d.id !== id));
  const handleClearDrawings   = () => setDrawings([]);

  // ── Save session ───────────────────────────────────────────────────────────
  const handleSaveSession = async () => {
    try {
      const sessionId = params.id;
      if (!sessionId) {
        showAlert('Session ID is missing, cannot save this session.', 'Missing Session ID');
        return;
      }

      const wins    = trades.filter(t => t.pnl > 0).length;
      const losses  = trades.filter(t => t.pnl <= 0).length;
      const winRate = trades.length ? (wins / trades.length) * 100 : 0;
      const totalPnl = balance - startingBalance;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const res = await fetch(`${apiUrl}/backtesting/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          trades, endingBalance: balance, totalPnl,
          totalTrades: trades.length, winningTrades: wins, losingTrades: losses,
          winRate, status: 'in_progress',
        }),
      });
      if (!res.ok) throw new Error('Failed to save');

      if (chartProvider === 'tradingview') {
        await tradingViewRef.current?.saveLayout();
      }

      showAlert('Session saved successfully!', 'Session Saved');
    } catch (error) {
      showAlert(
        getErrorMessage(error, 'Failed to save session'),
        'Save Failed',
      );
    }
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      switch (e.key) {
        case ' ':          e.preventDefault(); setIsPlaying(p => !p); break;
        case 'ArrowRight': e.preventDefault(); if (!isPlayingRef.current) onNextClick(); break;
        case 'ArrowLeft':  e.preventDefault(); if (!isPlayingRef.current) handlePrevCandle(); break;
        case '1': setSpeed(1000); break;
        case '2': setSpeed(500);  break;
        case '3': setSpeed(200);  break;
        case '4': setSpeed(50);   break;
        case '`': setTickMode(p => !p); break;
        case 'Escape': setActiveTool('none'); break;
        case 'h': case 'H': setActiveTool('horizontal'); break;
        case 't': case 'T': setActiveTool('trend');      break;
        case 'r': case 'R': setActiveTool('rectangle');  break;
        case 'b': case 'B': setActiveTool('fibonacci');  break;
        case 'F1': e.preventDefault(); jumpToSession(0,  'Asia');   break;
        case 'F2': e.preventDefault(); jumpToSession(7,  'London'); break;
        case 'F3': e.preventDefault(); jumpToSession(12, 'NY');     break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrevCandle, jumpToSession, onNextClick]);

  // ── Current candle date ────────────────────────────────────────────────────
  const currentCandleDate = useMemo(() => {
    const ts = visibleData[visibleData.length - 1]?.time as number;
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
         + ' '
         + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }, [visibleData]);

  // ── Theme classes (black + emerald green) ─────────────────────────────────
  const bg      = isDark ? 'bg-black'            : 'bg-gray-50';
  const header  = isDark ? 'bg-zinc-950/90 border-emerald-900/25' : 'bg-white/90 border-gray-200';
  const toolbar = isDark ? 'bg-zinc-950/70 border-emerald-900/20' : 'bg-gray-100/80 border-gray-200';
  const text    = isDark ? 'text-white'           : 'text-gray-900';
  const muted   = isDark ? 'text-slate-500'       : 'text-gray-500';

  const tfBtn = (active: boolean) => active
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
    : isDark
      ? 'text-slate-600 border-transparent hover:text-slate-300 hover:bg-white/5'
      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-200';

  const htfBtn = (active: boolean) => active
    ? 'bg-violet-500/15 text-violet-300 border-violet-500/40'
    : isDark
      ? 'text-slate-600 border-transparent hover:text-slate-400 hover:bg-white/5'
      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-200';

  const divider = isDark ? 'bg-white/8' : 'bg-gray-300';
  const isTradingViewMode = chartProvider === 'tradingview';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col relative overflow-hidden`}>

      {/* Ambient emerald glow (dark only) */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-emerald-950/20 to-transparent" />
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className={`h-14 border-b flex items-center justify-between px-4 backdrop-blur-sm z-30 gap-3 ${header}`}>

        {/* Left: back + session info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/backtesting"
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              isDark ? 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/20'
                     : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FaChevronLeft className="w-3 h-3" />
          </Link>
          <div className="min-w-0">
            <div className={`font-bold text-sm truncate ${text}`}>
              {symbol} &middot; {timeframe.toUpperCase()}
            </div>
            <div className={`text-xs truncate ${muted}`}>
              {startDate} &rarr; {endDate} &middot; ${startingBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Center: Timeframe switcher (native mode only) */}
        {isTradingViewMode ? (
          <div className={`text-[11px] font-medium px-2 py-1 rounded-md ${muted}`}>
            Full TradingView mode
          </div>
        ) : (
          <div className="flex items-center gap-0.5 shrink-0">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-all border ${tfBtn(timeframe === tf)}`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Right: balance + save */}
        <div className="flex items-center gap-3 shrink-0">
          {visibleData.length > 0 && (
            <div className="text-right">
              <div className={`text-[10px] ${muted}`}>{currentCandleDate}</div>
              <div className={`text-xs font-mono font-bold ${
                openPosition ? 'text-amber-400'
                  : balance >= startingBalance ? 'text-emerald-400' : 'text-red-400'
              }`}>
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                {openPosition && (
                  <span className="text-[9px] ml-1 px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    open
                  </span>
                )}
              </div>
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
      </header>

      {/* ── Sub-toolbar ─────────────────────────────────────────────────────── */}
      <div className={`h-10 border-b flex items-center px-4 gap-2 backdrop-blur-sm z-20 overflow-x-auto scrollbar-none ${toolbar}`}>

        {/* Chart provider switch */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className={`text-[9px] mr-1 font-semibold uppercase tracking-widest select-none ${muted}`}>
            Chart
          </span>
          <button
            onClick={() => setChartProvider('legacy')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
              chartProvider === 'legacy'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : isDark
                  ? 'text-slate-500 border-transparent hover:bg-white/5'
                  : 'text-gray-500 border-transparent hover:bg-gray-200'
            }`}
          >
            Native
          </button>
          <button
            onClick={() => {
              setTvUnavailableReason(null);
              setChartProvider('tradingview');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
              chartProvider === 'tradingview'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : isDark
                  ? 'text-slate-500 border-transparent hover:bg-white/5'
                  : 'text-gray-500 border-transparent hover:bg-gray-200'
            }`}
          >
            TradingView
          </button>
        </div>

        {tvUnavailableReason && (
          <div className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 shrink-0">
            {tvUnavailableReason}
          </div>
        )}

        {!isTradingViewMode && (
          <>
            {/* Indicators: Volume + Sessions only */}
            <IndicatorPanel config={indicators} onChange={setIndicators} isDark={isDark} />

            {/* Drawing tools */}
            <DrawingToolbar
              activeTool={activeTool}
              onChange={setActiveTool}
              drawingCount={drawings.length}
              onClear={handleClearDrawings}
            />

            {/* HTF selector */}
            <div className="flex items-center gap-0.5 shrink-0">
              <div className={`w-px h-5 mr-1.5 ${divider}`} />
              <span className={`text-[9px] mr-1 font-semibold uppercase tracking-widest select-none ${muted}`}>HTF</span>
              {HTF_OPTIONS.map(tf => (
                <button key={tf} onClick={() => setHtfTimeframe(tf)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all border ${htfBtn(htfTimeframe === tf)}`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Session Jump */}
            <div className="flex items-center gap-0.5 shrink-0">
              <div className={`w-px h-5 mr-1.5 ${divider}`} />
              <span className={`text-[9px] mr-1 font-semibold uppercase tracking-widest select-none ${muted}`}>Jump</span>
              {SESSIONS.map(s => (
                <button
                  key={s.name}
                  onClick={() => jumpToSession(s.utcHour, s.name)}
                  title={`Jump to ${s.name} Open (${s.utcHour.toString().padStart(2, '0')}:00 UTC) — F${SESSIONS.indexOf(s) + 1}`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all border border-transparent ${
                    isDark ? 'text-slate-500 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-200'
                  }`}
                  style={{ color: s.color }}
                >
                  <s.Icon className="w-2.5 h-2.5" style={{ color: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>

            {/* Jump toast */}
            {jumpMsg && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                <FiCheck className="w-3 h-3" />
                {jumpMsg}
              </div>
            )}

            {/* Keyboard hints */}
            <div className={`ml-auto flex items-center gap-2 text-[9px] font-mono select-none shrink-0 ${muted}`}>
              {[
                { key: 'Space', label: 'Play' },
                { key: '← →',  label: 'Step' },
                { key: '1–4',   label: 'Speed' },
                { key: 'H T R B', label: 'Draw' },
                { key: '`',     label: 'Tick' },
                { key: 'F1–F3', label: 'Jump' },
              ].map(({ key, label }) => (
                <span key={key}>
                  <kbd className={`px-1 py-0.5 rounded text-[8px] ${
                    isDark ? 'bg-zinc-900 text-slate-600' : 'bg-gray-200 text-gray-500'
                  }`}>{key}</kbd>
                  {' '}{label}
                </span>
              ))}
            </div>
          </>
        )}

        {isTradingViewMode && (
          <div className={`ml-auto text-[10px] font-medium ${muted}`}>
            Full TradingView controls enabled
          </div>
        )}
      </div>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3" />
              <p className={muted}>Loading 1m candles for {symbol}…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className={`rounded-xl p-6 max-w-sm border ${
              isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-red-400 text-center mb-4">{error}</p>
              <button
                onClick={() => fetchCandles()}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && fullData.length > 0 && (
          isTradingViewMode ? (
            <div className="flex-1 min-h-0">
              <TradingViewBacktestChart
                ref={tradingViewRef}
                sessionId={params.id}
                symbol={symbol}
                timeframe={timeframe}
                isDark={isDark}
                className="h-full w-full"
                onUnavailable={(reason) => {
                  setTvUnavailableReason(reason);
                  setChartProvider('legacy');
                }}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 flex overflow-hidden">

                {/* Chart column */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">

                  {/* Main chart */}
                  <div className="flex-1 p-3 pb-0 relative min-h-0">
                    <ChartEngine
                      ref={chartRef}
                      data={visibleData}
                      markers={markers}
                      indicators={indicators}
                      activeTool={activeTool}
                      drawings={drawings}
                      onDrawingComplete={handleDrawingComplete}
                      onDrawingDelete={handleDrawingDelete}
                      openPosition={openPosition}
                      onSlTpChange={handleSlTpChange}
                      isDark={isDark}
                    />

                    {/* Trade panel (top-left overlay) */}
                    <div className="absolute top-6 left-6 z-20">
                      {openPosition ? (
                        <PositionManager
                          position={openPosition}
                          currentPrice={visibleData[visibleData.length - 1]?.close || 0}
                          currentTime={visibleData[visibleData.length - 1]?.time as number || 0}
                          balance={balance}
                          symbol={symbol}
                          isDark={isDark}
                          onClose={handleCloseAtMarket}
                          onSlTpChange={handleSlTpChange}
                        />
                      ) : (
                        <OrderPanel
                          currentPrice={visibleData[visibleData.length - 1]?.close || 0}
                          balance={balance}
                          onPlaceOrder={handlePlaceOrder}
                          disabled={false}
                        />
                      )}
                    </div>
                  </div>

                  {/* HTF context pane */}
                  <div className={`flex-shrink-0 border-t ${
                    isDark ? 'border-emerald-900/15 bg-black' : 'border-gray-200 bg-gray-50'
                  }`} style={{ height: 150 }}>
                    {htfCandles.length > 1 ? (
                      <HtfContextChart
                        data={htfCandles}
                        currentTime={htfCurrentTime}
                        timeframe={htfTimeframe}
                        height={150}
                      />
                    ) : (
                      <div className={`flex items-center justify-center h-full text-[10px] select-none ${muted}`}>
                        Not enough data for {htfTimeframe.toUpperCase()} context
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Sidebar */}
                <SessionSidebar
                  openPosition={openPosition}
                  currentPrice={visibleData[visibleData.length - 1]?.close || 0}
                  currentTime={visibleData[visibleData.length - 1]?.time as number || 0}
                  trades={trades}
                  balance={balance}
                  startingBalance={startingBalance}
                  symbol={symbol}
                />
              </div>

              {/* Replay controls */}
              <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl">
                  <ReplayControls
                    isPlaying={isPlaying}
                    onPlayPause={() => setIsPlaying(p => !p)}
                    onNextCandle={onNextClick}
                    onPrevCandle={handlePrevCandle}
                    speed={speed}
                    onSpeedChange={setSpeed}
                    currentDate={currentCandleDate}
                    totalCandles={fullData.length}
                    currentCandleIndex={currentIndex + 1}
                    tickMode={tickMode}
                    onTickModeToggle={() => setTickMode(p => !p)}
                    isAnimating={isAnimating}
                  />
                </div>
              </div>
            </>
          )
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
