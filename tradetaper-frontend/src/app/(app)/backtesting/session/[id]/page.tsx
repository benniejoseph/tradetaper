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
  FaChartBar,
  FaChevronLeft,
  FaPause,
  FaPlay,
  FaSave,
  FaSearch,
  FaStepBackward,
  FaStepForward,
  FaWallet,
} from 'react-icons/fa';
import AlertModal from '@/components/ui/AlertModal';
import { ReplaySessionReviewReport } from '@/types/backtesting';

interface ClosedReplayTrade {
  id?: string;
  pnl: number;
  type?: 'LONG' | 'SHORT' | string;
  side?: 'BUY' | 'SELL';
  lotSize?: number;
  entry?: number;
  exitPrice?: number;
  entryTime?: number;
  exitTime?: number;
  source?: 'market' | 'pending' | 'manual';
  [key: string]: unknown;
}

interface CandleApiRow {
  time?: number | string;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close?: number | string;
}

type TerminalTab = 'positions' | 'pending' | 'history' | 'journal' | 'review';

type ReplayOrderSide = 'BUY' | 'SELL';

interface WatchlistInstrument {
  symbol: string;
  label: string;
  bid: number;
  ask: number;
  changePct: number;
}

interface ReplayOpenPosition {
  id: string;
  side: ReplayOrderSide;
  symbol: string;
  volume: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  openedAt: number;
  source: 'market' | 'pending';
}

interface ReplayPendingOrder {
  id: string;
  side: ReplayOrderSide;
  symbol: string;
  volume: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  createdAt: number;
}

interface ReplayJournalEntry {
  id: string;
  note: string;
  createdAt: number;
  candleIndex: number;
  candleTime: number;
}

interface SessionPatchPayload {
  trades?: ClosedReplayTrade[];
  openPositions?: ReplayOpenPosition[];
  pendingOrders?: ReplayPendingOrder[];
  journalEntries?: ReplayJournalEntry[];
  endingBalance?: number;
  totalPnl?: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  winRate?: number;
  status?: 'in_progress' | 'completed' | 'abandoned';
}

interface SessionHydrationPayload {
  trades?: ClosedReplayTrade[];
  openPositions?: ReplayOpenPosition[];
  pendingOrders?: ReplayPendingOrder[];
  journalEntries?: ReplayJournalEntry[];
  endingBalance?: number | string;
  reviewReport?: ReplaySessionReviewReport | null;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const toPositiveNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPriceDigits = (instrument: string): number => {
  if (instrument === 'XAUUSD') return 2;
  if (instrument.endsWith('JPY')) return 3;
  return 5;
};

const formatInstrumentPrice = (instrument: string, value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toFixed(getPriceDigits(instrument));
};

const formatTradeDate = (rawTime: unknown): string => {
  if (typeof rawTime !== 'number' || !Number.isFinite(rawTime) || rawTime <= 0) {
    return '—';
  }

  const normalizedMs = rawTime > 1_000_000_000_000 ? rawTime : rawTime * 1000;
  const value = new Date(normalizedMs);

  return `${value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })} ${value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const createClientId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const calculatePositionPnl = (
  side: ReplayOrderSide,
  entryPrice: number,
  currentPrice: number,
  volume: number,
): number => {
  const direction = side === 'BUY' ? 1 : -1;
  return (currentPrice - entryPrice) * direction * volume * 100;
};

const getTerminalStateFingerprint = (
  openPositions: ReplayOpenPosition[],
  pendingOrders: ReplayPendingOrder[],
  journalEntries: ReplayJournalEntry[],
): string => JSON.stringify({ openPositions, pendingOrders, journalEntries });

export default function BacktestSessionPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = params.id;

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
  const [startingBalance] = useState(() => {
    const parsed = Number(searchParams.get('balance') || '100000');
    return Number.isFinite(parsed) ? parsed : 100000;
  });

  const [fullData, setFullData] = useState<CandleData[]>([]);
  const [visibleData, setVisibleData] = useState<CandleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const [balance, setBalance] = useState(startingBalance);
  const [trades, setTrades] = useState<ClosedReplayTrade[]>([]);
  const [openPositions, setOpenPositions] = useState<ReplayOpenPosition[]>([]);
  const [pendingOrders, setPendingOrders] = useState<ReplayPendingOrder[]>([]);
  const [journalEntries, setJournalEntries] = useState<ReplayJournalEntry[]>([]);

  const [executionMode, setExecutionMode] = useState<'market' | 'pending'>('market');
  const [orderVolume, setOrderVolume] = useState('0.10');
  const [pendingPriceInput, setPendingPriceInput] = useState('');
  const [stopLossInput, setStopLossInput] = useState('');
  const [takeProfitInput, setTakeProfitInput] = useState('');
  const [watchSearch, setWatchSearch] = useState('');
  const [selectedTerminalTab, setSelectedTerminalTab] = useState<TerminalTab>('history');
  const [journalDraft, setJournalDraft] = useState('');
  const [sessionReviewReport, setSessionReviewReport] = useState<ReplaySessionReviewReport | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [tvUnavailableReason, setTvUnavailableReason] = useState<string | null>(null);

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: 'Notice',
    message: '',
  });
  const closeAlert = useCallback(
    () => setAlertState((prev) => ({ ...prev, isOpen: false })),
    [],
  );
  const showAlert = useCallback(
    (message: string, title = 'Notice') =>
      setAlertState({ isOpen: true, title, message }),
    [],
  );

  const tradingViewRef = useRef<TradingViewBacktestChartHandle | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullDataRef = useRef(fullData);
  const tradesRef = useRef(trades);
  const balanceRef = useRef(balance);
  const openPositionsRef = useRef(openPositions);
  const pendingOrdersRef = useRef(pendingOrders);
  const journalEntriesRef = useRef(journalEntries);
  const terminalStateHydratedRef = useRef(false);
  const lastPersistedTerminalStateRef = useRef('');

  useEffect(() => {
    fullDataRef.current = fullData;
  }, [fullData]);

  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    openPositionsRef.current = openPositions;
  }, [openPositions]);

  useEffect(() => {
    pendingOrdersRef.current = pendingOrders;
  }, [pendingOrders]);

  useEffect(() => {
    journalEntriesRef.current = journalEntries;
  }, [journalEntries]);

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

  const patchSession = useCallback(
    async (
      payload: SessionPatchPayload,
      options?: { silent?: boolean },
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
        const response = await fetch(`${apiUrl}/backtesting/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to persist session state');
        }

        return true;
      } catch (patchError) {
        if (!options?.silent) {
          showAlert(getErrorMessage(patchError, 'Failed to persist session state'), 'Sync Failed');
        }
        return false;
      }
    },
    [sessionId, showAlert],
  );

  const loadSessionReviewReport = useCallback(
    async (
      options?: { refresh?: boolean; silent?: boolean },
    ): Promise<ReplaySessionReviewReport | null> => {
      if (!sessionId) return null;

      try {
        setReviewLoading(true);
        if (!options?.silent) {
          setReviewError(null);
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
        const query = options?.refresh ? '?refresh=true' : '';
        const response = await fetch(
          `${apiUrl}/backtesting/sessions/${sessionId}/review-report${query}`,
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to load session review report');
        }

        const report = (await response.json()) as ReplaySessionReviewReport;
        setSessionReviewReport(report);
        setReviewError(null);
        return report;
      } catch (reviewFetchError) {
        const message = getErrorMessage(
          reviewFetchError,
          'Failed to load session review report',
        );
        setReviewError(message);
        if (!options?.silent) {
          showAlert(message, 'Session Review');
        }
        return null;
      } finally {
        setReviewLoading(false);
      }
    },
    [sessionId, showAlert],
  );

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const hydrateSessionState = async () => {
      try {
        const response = await fetch(`${apiUrl}/backtesting/sessions/${sessionId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          terminalStateHydratedRef.current = true;
          return;
        }

        const payload = (await response.json()) as SessionHydrationPayload;

        if (cancelled) return;

        const nextTrades = Array.isArray(payload.trades) ? payload.trades : [];
        const nextOpenPositions = Array.isArray(payload.openPositions)
          ? payload.openPositions
          : [];
        const nextPendingOrders = Array.isArray(payload.pendingOrders)
          ? payload.pendingOrders
          : [];
        const nextJournalEntries = Array.isArray(payload.journalEntries)
          ? payload.journalEntries
          : [];
        const nextReviewReport =
          payload.reviewReport && typeof payload.reviewReport === 'object'
            ? payload.reviewReport
            : null;

        setTrades(nextTrades);
        setOpenPositions(nextOpenPositions);
        setPendingOrders(nextPendingOrders);
        setJournalEntries(nextJournalEntries);
        setSessionReviewReport(nextReviewReport);

        const parsedEndingBalance = Number(payload.endingBalance);
        if (Number.isFinite(parsedEndingBalance)) {
          setBalance(parsedEndingBalance);
        }

        lastPersistedTerminalStateRef.current = getTerminalStateFingerprint(
          nextOpenPositions,
          nextPendingOrders,
          nextJournalEntries,
        );
        terminalStateHydratedRef.current = true;
      } catch {
        terminalStateHydratedRef.current = true;
      }
    };

    void hydrateSessionState();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const terminalStateFingerprint = useMemo(
    () => getTerminalStateFingerprint(openPositions, pendingOrders, journalEntries),
    [openPositions, pendingOrders, journalEntries],
  );

  useEffect(() => {
    if (!sessionId || !terminalStateHydratedRef.current) return;
    if (terminalStateFingerprint === lastPersistedTerminalStateRef.current) return;

    const timer = setTimeout(() => {
      void (async () => {
        const synced = await patchSession(
          {
            openPositions,
            pendingOrders,
            journalEntries,
          },
          { silent: true },
        );

        if (synced) {
          lastPersistedTerminalStateRef.current = terminalStateFingerprint;
        }
      })();
    }, 450);

    return () => clearTimeout(timer);
  }, [
    sessionId,
    terminalStateFingerprint,
    openPositions,
    pendingOrders,
    journalEntries,
    patchSession,
  ]);

  useEffect(() => {
    if (selectedTerminalTab !== 'review') return;
    if (sessionReviewReport || reviewLoading) return;
    void loadSessionReviewReport({ silent: true });
  }, [
    selectedTerminalTab,
    sessionReviewReport,
    reviewLoading,
    loadSessionReviewReport,
  ]);

  const evaluateExecutionForCandle = useCallback(
    (candle: CandleData, nextCandleIndex: number) => {
      const candleLow = toFiniteNumber(candle.low, NaN);
      const candleHigh = toFiniteNumber(candle.high, NaN);
      const candleClose = toFiniteNumber(candle.close, NaN);
      const candleTime = toFiniteNumber(candle.time, Date.now() / 1000);

      if (!Number.isFinite(candleLow) || !Number.isFinite(candleHigh) || !Number.isFinite(candleClose)) {
        return;
      }

      const currentPending = pendingOrdersRef.current;
      const activatedPositions: ReplayOpenPosition[] = [];
      const remainingPending: ReplayPendingOrder[] = [];

      for (const pending of currentPending) {
        const triggered = pending.side === 'BUY'
          ? candleLow <= pending.entryPrice
          : candleHigh >= pending.entryPrice;

        if (triggered) {
          activatedPositions.push({
            id: createClientId('pos'),
            side: pending.side,
            symbol: pending.symbol,
            volume: pending.volume,
            entryPrice: pending.entryPrice,
            stopLoss: pending.stopLoss,
            takeProfit: pending.takeProfit,
            openedAt: candleTime,
            source: 'pending',
          });
        } else {
          remainingPending.push(pending);
        }
      }

      const mergedOpenPositions = [...openPositionsRef.current, ...activatedPositions];
      const stillOpenPositions: ReplayOpenPosition[] = [];
      const closedTrades: ClosedReplayTrade[] = [];

      for (const position of mergedOpenPositions) {
        const stopLossHit = position.side === 'BUY'
          ? candleLow <= position.stopLoss
          : candleHigh >= position.stopLoss;
        const takeProfitHit = position.side === 'BUY'
          ? candleHigh >= position.takeProfit
          : candleLow <= position.takeProfit;

        if (!stopLossHit && !takeProfitHit) {
          stillOpenPositions.push(position);
          continue;
        }

        const exitPrice = stopLossHit ? position.stopLoss : position.takeProfit;
        const pnl = calculatePositionPnl(
          position.side,
          position.entryPrice,
          exitPrice,
          position.volume,
        );

        closedTrades.push({
          id: createClientId('closed'),
          pnl: Number(pnl.toFixed(2)),
          type: position.side === 'BUY' ? 'LONG' : 'SHORT',
          side: position.side,
          lotSize: position.volume,
          entry: position.entryPrice,
          exitPrice,
          entryTime: position.openedAt,
          exitTime: candleTime,
          source: position.source,
          candleIndex: nextCandleIndex,
        });
      }

      const hasChanges =
        activatedPositions.length > 0
        || remainingPending.length !== currentPending.length
        || closedTrades.length > 0
        || stillOpenPositions.length !== mergedOpenPositions.length;

      if (!hasChanges) return;

      const updatedTrades = [...tradesRef.current, ...closedTrades];
      const updatedBalance =
        balanceRef.current + closedTrades.reduce((sum, trade) => sum + toFiniteNumber(trade.pnl), 0);

      setPendingOrders(remainingPending);
      setOpenPositions(stillOpenPositions);
      setTrades(updatedTrades);
      setBalance(updatedBalance);

      if (closedTrades.length > 0) {
        setSelectedTerminalTab('history');
      } else if (activatedPositions.length > 0) {
        setSelectedTerminalTab('positions');
      }
    },
    [],
  );

  const handleNextCandle = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= fullDataRef.current.length) {
        setIsPlaying(false);
        return prev;
      }

      const nextCandle = fullDataRef.current[nextIndex];
      setVisibleData((prevCandles) => [...prevCandles, nextCandle]);
      evaluateExecutionForCandle(nextCandle, nextIndex + 1);
      return nextIndex;
    });
  }, [evaluateExecutionForCandle]);

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

    if (openPositionsRef.current.length > 0 || pendingOrdersRef.current.length > 0) {
      showAlert(
        'Seeking while orders are active can desync simulated execution. Close/cancel active orders first for accurate replay accounting.',
        'Seek Guardrail',
      );
      return;
    }

    const clamped = Math.min(Math.max(targetOneBased, 1), data.length);
    const nextIndex = clamped - 1;
    setIsPlaying(false);
    setCurrentIndex(nextIndex);
    setVisibleData(data.slice(0, clamped));
  }, [showAlert]);

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

  const currentPrice = Number(visibleData[visibleData.length - 1]?.close || 0);

  useEffect(() => {
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      return;
    }

    setPendingPriceInput((prev) => prev || currentPrice.toFixed(getPriceDigits(symbol)));
    setStopLossInput((prev) => prev || (currentPrice * 0.995).toFixed(getPriceDigits(symbol)));
    setTakeProfitInput((prev) => prev || (currentPrice * 1.01).toFixed(getPriceDigits(symbol)));
  }, [currentPrice, symbol]);

  const volumeValue = toPositiveNumber(orderVolume, 0.1);
  const entryPrice = executionMode === 'pending'
    ? toPositiveNumber(pendingPriceInput, currentPrice)
    : currentPrice;
  const stopLossValue = toPositiveNumber(stopLossInput, currentPrice);
  const takeProfitValue = toPositiveNumber(takeProfitInput, currentPrice);

  const riskDistance = Math.abs(entryPrice - stopLossValue);
  const rewardDistance = Math.abs(takeProfitValue - entryPrice);
  const riskAmount = riskDistance * volumeValue * 100;
  const rewardAmount = rewardDistance * volumeValue * 100;
  const rrRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  const handleSubmitOrder = useCallback(
    (side: ReplayOrderSide) => {
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        showAlert('Current market price is unavailable. Please wait for candles to load.', 'Order Rejected');
        return;
      }

      if (stopLossValue <= 0 || takeProfitValue <= 0) {
        showAlert('Stop loss and take profit must be valid positive numbers.', 'Order Rejected');
        return;
      }

      if (executionMode === 'market') {
        const position: ReplayOpenPosition = {
          id: createClientId('pos'),
          side,
          symbol,
          volume: volumeValue,
          entryPrice: currentPrice,
          stopLoss: stopLossValue,
          takeProfit: takeProfitValue,
          openedAt: Math.floor(Date.now() / 1000),
          source: 'market',
        };

        setOpenPositions((prev) => [...prev, position]);
        setSelectedTerminalTab('positions');
        showAlert(
          `${side} ${symbol} ${volumeValue.toFixed(2)} lots opened at ${formatInstrumentPrice(symbol, currentPrice)}.`,
          'Position Opened',
        );
        return;
      }

      if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
        showAlert('Enter a valid pending order entry price.', 'Order Rejected');
        return;
      }

      const pendingOrder: ReplayPendingOrder = {
        id: createClientId('ord'),
        side,
        symbol,
        volume: volumeValue,
        entryPrice,
        stopLoss: stopLossValue,
        takeProfit: takeProfitValue,
        createdAt: Math.floor(Date.now() / 1000),
      };

      setPendingOrders((prev) => [...prev, pendingOrder]);
      setSelectedTerminalTab('pending');
      showAlert(
        `${side} pending order queued at ${formatInstrumentPrice(symbol, entryPrice)} (${volumeValue.toFixed(2)} lots).`,
        'Pending Order Created',
      );
    },
    [
      currentPrice,
      stopLossValue,
      takeProfitValue,
      executionMode,
      symbol,
      volumeValue,
      entryPrice,
      showAlert,
    ],
  );

  const handleClosePosition = useCallback(
    (positionId: string) => {
      const position = openPositionsRef.current.find((item) => item.id === positionId);
      if (!position) return;

      const exitPrice = Number.isFinite(currentPrice) && currentPrice > 0
        ? currentPrice
        : position.entryPrice;
      const pnl = calculatePositionPnl(
        position.side,
        position.entryPrice,
        exitPrice,
        position.volume,
      );

      const closedTrade: ClosedReplayTrade = {
        id: createClientId('closed'),
        pnl: Number(pnl.toFixed(2)),
        type: position.side === 'BUY' ? 'LONG' : 'SHORT',
        side: position.side,
        lotSize: position.volume,
        entry: position.entryPrice,
        exitPrice,
        entryTime: position.openedAt,
        exitTime: Math.floor(Date.now() / 1000),
        source: 'manual',
      };

      setOpenPositions((prev) => prev.filter((item) => item.id !== positionId));
      setTrades((prev) => [...prev, closedTrade]);
      setBalance((prev) => prev + Number(closedTrade.pnl || 0));
      setSelectedTerminalTab('history');
    },
    [currentPrice],
  );

  const handleCancelPendingOrder = useCallback((orderId: string) => {
    setPendingOrders((prev) => prev.filter((order) => order.id !== orderId));
  }, []);

  const handleSaveJournalEntry = useCallback(() => {
    const text = journalDraft.trim();
    if (!text) {
      showAlert('Add some notes before saving your journal entry.', 'Journal');
      return;
    }

    const entry: ReplayJournalEntry = {
      id: createClientId('jnl'),
      note: text,
      createdAt: Date.now(),
      candleIndex: Math.max(currentIndex + 1, 1),
      candleTime: toFiniteNumber(visibleData[visibleData.length - 1]?.time, 0),
    };

    setJournalEntries((prev) => [entry, ...prev]);
    setJournalDraft('');
    setSelectedTerminalTab('journal');
    showAlert('Journal note captured for this replay session.', 'Journal Saved');
  }, [journalDraft, currentIndex, visibleData, showAlert]);

  const handleSaveSession = async () => {
    try {
      if (!sessionId) {
        showAlert('Session ID is missing, cannot save this session.', 'Missing Session ID');
        return;
      }

      const wins = trades.filter((trade) => Number(trade.pnl) > 0).length;
      const losses = trades.filter((trade) => Number(trade.pnl) <= 0).length;
      const winRate = trades.length ? (wins / trades.length) * 100 : 0;
      const totalPnl = balance - startingBalance;

      const synced = await patchSession({
        trades,
        openPositions,
        pendingOrders,
        journalEntries,
        endingBalance: balance,
        totalPnl,
        totalTrades: trades.length,
        winningTrades: wins,
        losingTrades: losses,
        winRate,
        status: 'in_progress',
      });

      if (!synced) return;

      lastPersistedTerminalStateRef.current = getTerminalStateFingerprint(
        openPositions,
        pendingOrders,
        journalEntries,
      );

      await tradingViewRef.current?.saveLayout();
      void loadSessionReviewReport({ refresh: true, silent: true });
      showAlert('Session saved successfully.', 'Session Saved');
    } catch (saveError) {
      showAlert(getErrorMessage(saveError, 'Failed to save session'), 'Save Failed');
    }
  };

  const handleExportSessionReview = useCallback(
    async (format: 'json' | 'pdf') => {
      if (!sessionId) {
        showAlert('Session ID is missing, cannot export review report.', 'Export Failed');
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
        const response = await fetch(
          `${apiUrl}/backtesting/sessions/${sessionId}/review-report/export?format=${format}`,
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to export ${format.toUpperCase()} review report`);
        }

        const disposition = response.headers.get('content-disposition') || '';
        const filenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
        const filename = filenameMatch?.[1] || `session-review.${format}`;
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (exportError) {
        showAlert(getErrorMessage(exportError, 'Failed to export review report'), 'Export Failed');
      }
    },
    [sessionId, showAlert],
  );

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

  const displayPrice = Number.isFinite(currentPrice)
    ? currentPrice.toFixed(getPriceDigits(symbol))
    : '0.00';
  const totalPnl = balance - startingBalance;
  const pnlPositive = totalPnl >= 0;
  const wins = trades.filter((trade) => Number(trade.pnl) > 0).length;
  const losses = trades.filter((trade) => Number(trade.pnl) <= 0).length;
  const reviewTradeAnalytics = sessionReviewReport?.tradeAnalytics || null;
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

  const usedMargin = useMemo(
    () => openPositions.reduce((sum, position) => sum + position.volume * 1000, 0),
    [openPositions],
  );
  const equity = balance + openPositions.reduce(
    (sum, position) => sum + calculatePositionPnl(position.side, position.entryPrice, currentPrice, position.volume),
    0,
  );
  const freeMargin = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

  const panelTheme = isDark
    ? {
      page: 'bg-[#060707] text-white',
      card: 'bg-[#0c0e0e] border-zinc-800',
      top: 'bg-[#0d1010] text-zinc-100 border-zinc-800',
      chartTools: 'bg-[#111314] border-zinc-800 text-zinc-200',
      panel: 'bg-[#090b0b] border-zinc-800',
      muted: 'text-zinc-400',
      subMuted: 'text-zinc-500',
      input: 'bg-[#121415] border-zinc-700 text-zinc-100',
      rowHover: 'hover:bg-zinc-900/70',
    }
    : {
      page: 'bg-[#f5f6f7] text-zinc-900',
      card: 'bg-white border-zinc-200',
      top: 'bg-white text-zinc-900 border-zinc-200',
      chartTools: 'bg-[#f8fafc] border-zinc-200 text-zinc-800',
      panel: 'bg-[#fbfbfb] border-zinc-200',
      muted: 'text-zinc-500',
      subMuted: 'text-zinc-500',
      input: 'bg-white border-zinc-300 text-zinc-900',
      rowHover: 'hover:bg-zinc-100',
    };

  const watchlist = useMemo<WatchlistInstrument[]>(() => {
    const staticRows: WatchlistInstrument[] = [
      { symbol: 'XAUUSD', label: 'Gold Spot', bid: 2186.42, ask: 2186.82, changePct: 0.41 },
      { symbol: 'EURUSD', label: 'Euro / Dollar', bid: 1.08423, ask: 1.08439, changePct: -0.11 },
      { symbol: 'GBPUSD', label: 'Pound / Dollar', bid: 1.2689, ask: 1.2691, changePct: 0.19 },
      { symbol: 'USDJPY', label: 'Dollar / Yen', bid: 151.632, ask: 151.654, changePct: -0.08 },
      { symbol: 'BTCUSD', label: 'Bitcoin CFD', bid: 67342.1, ask: 67349.6, changePct: 0.93 },
    ];

    const activeSpread = symbol === 'XAUUSD' ? 0.4 : symbol.endsWith('JPY') ? 0.02 : 0.0002;
    const activeBid = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : staticRows[0].bid;
    const activeAsk = activeBid + activeSpread;

    const merged = staticRows.map((row) => {
      if (row.symbol !== symbol) return row;
      return {
        ...row,
        bid: activeBid,
        ask: activeAsk,
        changePct: startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0,
      };
    });

    if (!merged.some((row) => row.symbol === symbol)) {
      merged.unshift({
        symbol,
        label: `${symbol} Session`,
        bid: activeBid,
        ask: activeAsk,
        changePct: startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0,
      });
    }

    const query = watchSearch.trim().toUpperCase();
    if (!query) return merged;
    return merged.filter((row) => row.symbol.includes(query) || row.label.toUpperCase().includes(query));
  }, [symbol, currentPrice, totalPnl, startingBalance, watchSearch]);

  const recentTrades = useMemo(
    () => [...trades].slice(-20).reverse(),
    [trades],
  );

  const handleVolumeStep = (delta: number) => {
    const current = Number(orderVolume);
    const base = Number.isFinite(current) ? current : 0.1;
    const next = Math.max(0.01, base + delta);
    setOrderVolume(next.toFixed(2));
  };

  const renderWatchlistPanel = () => (
    <div className="flex h-full flex-col">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Market Watch</div>
        <div className="text-xs font-semibold">{watchlist.length}</div>
      </div>

      <div className="p-3 pb-2">
        <label className="relative block">
          <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${panelTheme.subMuted}`} />
          <input
            value={watchSearch}
            onChange={(event) => setWatchSearch(event.target.value)}
            placeholder="Search symbols"
            className={`h-9 w-full rounded-lg border pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${panelTheme.input}`}
          />
        </label>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-2">
        <table className="w-full border-separate border-spacing-y-1 text-xs">
          <thead>
            <tr className={`${panelTheme.subMuted}`}>
              <th className="px-2 text-left font-medium">Symbol</th>
              <th className="px-2 text-right font-medium">Bid</th>
              <th className="px-2 text-right font-medium">Ask</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((instrument) => {
              const active = instrument.symbol === symbol;
              return (
                <tr
                  key={instrument.symbol}
                  className={`rounded-lg border cursor-pointer ${active
                    ? 'bg-emerald-500/12 border-emerald-500/30'
                    : `${isDark ? 'border-zinc-800' : 'border-zinc-200'} ${panelTheme.rowHover}`
                  }`}
                  onClick={() => {
                    if (instrument.symbol !== symbol) {
                      showAlert(
                        `Session symbol is fixed to ${symbol} for this replay. Create a new session to switch markets.`,
                        'Symbol Locked',
                      );
                    }
                  }}
                >
                  <td className="px-2 py-2">
                    <div className="font-semibold">{instrument.symbol}</div>
                    <div className={`${panelTheme.subMuted}`}>{instrument.label}</div>
                  </td>
                  <td className="px-2 text-right font-mono">
                    {formatInstrumentPrice(instrument.symbol, instrument.bid)}
                  </td>
                  <td className="px-2 text-right font-mono">
                    {formatInstrumentPrice(instrument.symbol, instrument.ask)}
                    <div className={instrument.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {instrument.changePct >= 0 ? '+' : ''}{instrument.changePct.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrderPanel = () => (
    <div className="flex h-full flex-col">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Trade Ticket</div>
        <div className="text-xs font-semibold">{symbol}</div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className={`rounded-xl border p-3 ${isDark ? 'border-zinc-700 bg-black/40' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-2">Execution</div>
          <div className={`flex rounded-lg border p-1 ${isDark ? 'border-zinc-700 bg-zinc-900/40' : 'border-zinc-300 bg-white'}`}>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-1">Bid</div>
              <div className="text-sm font-semibold font-mono">{displayPrice}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-1">Ask</div>
              <div className="text-sm font-semibold font-mono">
                {formatInstrumentPrice(symbol, currentPrice + (symbol === 'XAUUSD' ? 0.2 : 0.0001))}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-1">Volume (Lots)</div>
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
                className={`flex-1 h-9 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${panelTheme.input}`}
              />
              <button
                onClick={() => handleVolumeStep(0.01)}
                className={`h-9 w-9 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 hover:bg-zinc-900' : 'border-zinc-300 hover:bg-zinc-100'}`}
              >
                +
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {['0.10', '0.50', '1.00'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setOrderVolume(preset)}
                  className={`h-8 rounded-md border text-xs font-semibold transition-colors ${
                    orderVolume === preset
                      ? 'bg-emerald-500 text-black border-emerald-500'
                      : isDark
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                        : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {executionMode === 'pending' && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-1">Entry Price</div>
              <input
                value={pendingPriceInput}
                onChange={(event) => setPendingPriceInput(event.target.value)}
                className={`h-9 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${panelTheme.input}`}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-1">Stop Loss</div>
              <input
                value={stopLossInput}
                onChange={(event) => setStopLossInput(event.target.value)}
                className={`h-9 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-red-500 ${panelTheme.input}`}
              />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-1">Take Profit</div>
              <input
                value={takeProfitInput}
                onChange={(event) => setTakeProfitInput(event.target.value)}
                className={`h-9 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${panelTheme.input}`}
              />
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${isDark ? 'border-zinc-700 bg-black/40' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex justify-between">
            <span className="text-zinc-500">Estimated Risk</span>
            <span className="text-red-400">-${riskAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Estimated Reward</span>
            <span className="text-emerald-400">+${rewardAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">R:R</span>
            <span className="font-mono">{riskAmount > 0 ? rrRatio.toFixed(2) : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Execution</span>
            <span className="capitalize">{executionMode}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSubmitOrder('SELL')}
            className="rounded-lg bg-red-500/15 border border-red-500/30 py-2.5 text-red-300 font-semibold hover:bg-red-500/25 transition-colors"
          >
            SELL
          </button>
          <button
            onClick={() => handleSubmitOrder('BUY')}
            className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 py-2.5 text-emerald-300 font-semibold hover:bg-emerald-500/25 transition-colors"
          >
            BUY
          </button>
        </div>
      </div>
    </div>
  );

  const renderTerminalTabsPanel = () => (
    <section className={`shrink-0 h-[240px] rounded-2xl border ${panelTheme.card} overflow-hidden`}>
      <div className={`h-11 border-b ${panelTheme.chartTools} flex items-center px-2 gap-1`}>
        {[
          { id: 'positions', label: 'Positions' },
          { id: 'pending', label: 'Pending' },
          { id: 'history', label: 'History' },
          { id: 'journal', label: 'Journal' },
          { id: 'review', label: 'Review' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTerminalTab(tab.id as TerminalTab)}
            className={`h-8 px-3 rounded-md text-xs font-semibold border transition-colors ${
              selectedTerminalTab === tab.id
                ? 'bg-emerald-500 text-black border-emerald-500'
                : isDark
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-[calc(240px-44px)] overflow-auto p-3">
        {selectedTerminalTab === 'positions' && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-[1fr_0.8fr_0.9fr_0.9fr_0.8fr] gap-2 text-xs text-zinc-500 uppercase tracking-[0.12em]">
              <span>Symbol</span>
              <span>Side</span>
              <span>Entry</span>
              <span>P&L</span>
              <span>Action</span>
            </div>
            {openPositions.length === 0 && (
              <div className={`rounded-lg border p-3 text-xs ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                No open positions. Market orders appear here and are auto-managed by replay candles.
              </div>
            )}
            {openPositions.map((position) => {
              const pnl = calculatePositionPnl(
                position.side,
                position.entryPrice,
                currentPrice,
                position.volume,
              );

              return (
                <div
                  key={position.id}
                  className={`grid grid-cols-[1fr_0.8fr_0.9fr_0.9fr_0.8fr] gap-2 items-center rounded-lg border px-3 py-2 text-xs ${
                    isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'
                  }`}
                >
                  <span>{position.symbol}</span>
                  <span className={position.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{position.side}</span>
                  <span className="font-mono">{formatInstrumentPrice(symbol, position.entryPrice)}</span>
                  <span className={pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleClosePosition(position.id)}
                    className="h-7 rounded-md border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    Close
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selectedTerminalTab === 'pending' && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-[0.7fr_0.8fr_0.9fr_1fr_0.8fr] gap-2 text-xs text-zinc-500 uppercase tracking-[0.12em]">
              <span>Type</span>
              <span>Volume</span>
              <span>Entry</span>
              <span>SL / TP</span>
              <span>Action</span>
            </div>
            {pendingOrders.length === 0 && (
              <div className={`rounded-lg border p-3 text-xs ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                No pending orders.
              </div>
            )}
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className={`grid grid-cols-[0.7fr_0.8fr_0.9fr_1fr_0.8fr] gap-2 items-center rounded-lg border px-3 py-2 text-xs ${
                  isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <span className={order.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{order.side}</span>
                <span>{order.volume.toFixed(2)}</span>
                <span className="font-mono">{formatInstrumentPrice(symbol, order.entryPrice)}</span>
                <span className="font-mono text-zinc-400">
                  {formatInstrumentPrice(symbol, order.stopLoss)} / {formatInstrumentPrice(symbol, order.takeProfit)}
                </span>
                <button
                  onClick={() => handleCancelPendingOrder(order.id)}
                  className="h-7 rounded-md border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTerminalTab === 'history' && (
          <div className="space-y-2 text-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} text-zinc-500 uppercase tracking-[0.12em]`}>
                    <th className="py-2 text-left font-medium">#</th>
                    <th className="py-2 text-left font-medium">Side</th>
                    <th className="py-2 text-left font-medium">Volume</th>
                    <th className="py-2 text-left font-medium">Entry</th>
                    <th className="py-2 text-left font-medium">Exit</th>
                    <th className="py-2 text-left font-medium">P&L</th>
                    <th className="py-2 text-left font-medium">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-500">
                        No closed trades yet.
                      </td>
                    </tr>
                  )}
                  {recentTrades.map((trade, index) => {
                    const pnl = Number(trade.pnl) || 0;
                    const side = trade.side || (typeof trade.type === 'string' ? trade.type : 'CLOSED');
                    const lotSize = typeof trade.lotSize === 'number' ? trade.lotSize : volumeValue;
                    const entry = typeof trade.entry === 'number' ? trade.entry : null;
                    const exit = typeof trade.exitPrice === 'number' ? trade.exitPrice : null;

                    return (
                      <tr key={`${trade.id ?? trade.exitTime ?? index}-${index}`} className={`border-b ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
                        <td className="py-2">{recentTrades.length - index}</td>
                        <td className="py-2">{side}</td>
                        <td className="py-2">{lotSize.toFixed(2)}</td>
                        <td className="py-2 font-mono">{entry == null ? '—' : formatInstrumentPrice(symbol, entry)}</td>
                        <td className="py-2 font-mono">{exit == null ? '—' : formatInstrumentPrice(symbol, exit)}</td>
                        <td className={`py-2 font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                        </td>
                        <td className="py-2">{formatTradeDate(trade.exitTime)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTerminalTab === 'journal' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                <div className="text-zinc-500">Net P&L</div>
                <div className={`text-sm font-semibold ${pnlPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pnlPositive ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
                </div>
              </div>
              <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                <div className="text-zinc-500">Win / Loss</div>
                <div className="text-sm font-semibold">{wins} / {losses}</div>
              </div>
              <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                <div className="text-zinc-500">Progress</div>
                <div className="text-sm font-semibold">{progressPercent.toFixed(1)}%</div>
              </div>
              <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                <div className="text-zinc-500">Notes</div>
                <div className="text-sm font-semibold">{journalEntries.length}</div>
              </div>
            </div>

            <textarea
              value={journalDraft}
              onChange={(event) => setJournalDraft(event.target.value)}
              placeholder="Log replay observations, mistakes, and setup quality notes..."
              className={`h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${panelTheme.input}`}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveJournalEntry}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                Save Note
              </button>
            </div>

            <div className="space-y-2">
              {journalEntries.length === 0 && (
                <div className={`rounded-lg border p-3 text-xs ${isDark ? 'border-zinc-800 bg-black/35 text-zinc-500' : 'border-zinc-200 bg-zinc-50 text-zinc-500'}`}>
                  No session notes yet.
                </div>
              )}
              {journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-lg border p-3 text-xs ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}
                >
                  <div className="flex items-center justify-between gap-2 text-zinc-500 mb-1">
                    <span>Candle #{entry.candleIndex}</span>
                    <span>{formatTradeDate(entry.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-zinc-200 dark:text-zinc-200 text-zinc-800">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTerminalTab === 'review' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-zinc-500">Session Review Report</div>
                <div className="text-xs text-zinc-500">
                  {sessionReviewReport
                    ? `Last generated: ${formatTradeDate(
                        Date.parse(sessionReviewReport.generatedAt),
                      )}`
                  : 'Report not generated yet'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    void handleExportSessionReview('json');
                  }}
                  className={`h-8 px-3 rounded-md text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'border-zinc-700 text-zinc-200 hover:bg-zinc-900'
                      : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  Export JSON
                </button>
                <button
                  onClick={() => {
                    void handleExportSessionReview('pdf');
                  }}
                  className={`h-8 px-3 rounded-md text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'border-zinc-700 text-zinc-200 hover:bg-zinc-900'
                      : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  Export PDF
                </button>
                <button
                  onClick={() => {
                    void loadSessionReviewReport({ refresh: true });
                  }}
                  disabled={reviewLoading}
                  className={`h-8 px-3 rounded-md text-xs font-semibold border transition-colors ${
                    reviewLoading
                      ? 'opacity-60 cursor-not-allowed'
                      : isDark
                        ? 'border-zinc-700 text-zinc-200 hover:bg-zinc-900'
                        : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {reviewLoading ? 'Generating...' : 'Regenerate'}
                </button>
              </div>
            </div>

            {reviewError && (
              <div className={`rounded-lg border p-3 text-xs ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {reviewError}
              </div>
            )}

            {!reviewLoading && !reviewError && !sessionReviewReport && (
              <div className={`rounded-lg border p-4 text-sm ${isDark ? 'border-zinc-800 bg-black/35 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
                Save the session or click regenerate to create the automated analytics report.
              </div>
            )}

            {reviewTradeAnalytics && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="text-zinc-500">Trades</div>
                    <div className="text-sm font-semibold">{reviewTradeAnalytics.totalTrades}</div>
                  </div>
                  <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="text-zinc-500">Win Rate</div>
                    <div className="text-sm font-semibold">{reviewTradeAnalytics.winRate.toFixed(1)}%</div>
                  </div>
                  <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="text-zinc-500">Net P&L</div>
                    <div className={`text-sm font-semibold ${reviewTradeAnalytics.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {reviewTradeAnalytics.netPnl >= 0 ? '+' : '-'}${Math.abs(reviewTradeAnalytics.netPnl).toFixed(2)}
                    </div>
                  </div>
                  <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="text-zinc-500">Profit Factor</div>
                    <div className="text-sm font-semibold">{reviewTradeAnalytics.profitFactor.toFixed(2)}</div>
                  </div>
                  <div className={`rounded-lg border p-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="text-zinc-500">Max DD</div>
                    <div className="text-sm font-semibold text-amber-300">
                      ${reviewTradeAnalytics.maxDrawdown.toFixed(2)} ({reviewTradeAnalytics.maxDrawdownPct.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className={`rounded-lg border p-3 space-y-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="uppercase tracking-[0.12em] text-zinc-500">Execution Findings</div>
                    {sessionReviewReport?.executionFindings?.length ? (
                      <ul className="space-y-1 text-zinc-300 dark:text-zinc-300 text-zinc-700">
                        {sessionReviewReport.executionFindings.map((finding, idx) => (
                          <li key={`${finding}-${idx}`}>- {finding}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-zinc-500">No findings yet.</div>
                    )}
                  </div>

                  <div className={`rounded-lg border p-3 space-y-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="uppercase tracking-[0.12em] text-zinc-500">Behavioral Insights</div>
                    {sessionReviewReport?.behavioralInsights?.length ? (
                      <ul className="space-y-1 text-zinc-300 dark:text-zinc-300 text-zinc-700">
                        {sessionReviewReport.behavioralInsights.map((insight, idx) => (
                          <li key={`${insight}-${idx}`}>- {insight}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-zinc-500">No behavioral insights yet.</div>
                    )}
                  </div>

                  <div className={`rounded-lg border p-3 space-y-2 ${isDark ? 'border-zinc-800 bg-black/35' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="uppercase tracking-[0.12em] text-zinc-500">Next Session Checklist</div>
                    {sessionReviewReport?.nextSessionChecklist?.length ? (
                      <ul className="space-y-1 text-zinc-300 dark:text-zinc-300 text-zinc-700">
                        {sessionReviewReport.nextSessionChecklist.map((item, idx) => (
                          <li key={`${item}-${idx}`}>- {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-zinc-500">No checklist items yet.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
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
            <header className={`h-auto shrink-0 rounded-xl border ${panelTheme.top} px-3 py-2 md:px-4 md:py-3 flex flex-wrap items-center justify-between gap-3`}>
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
                  <div className="text-sm font-semibold truncate">{symbol} {timeframe.toUpperCase()} Replay Session</div>
                  <div className={`text-[11px] ${panelTheme.muted}`}>{startDate} {'->'} {endDate}</div>
                </div>
                <span className="hidden md:inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-[0.12em]">
                  Backtesting Terminal
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                <div className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 ${isDark ? 'border-zinc-700 bg-black/25' : 'border-zinc-200 bg-white'}`}>
                  <FaWallet className="text-[11px] text-emerald-400" />
                  <span className={panelTheme.muted}>Balance</span>
                  <span className="font-semibold">${balance.toFixed(2)}</span>
                </div>
                <div className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 ${isDark ? 'border-zinc-700 bg-black/25' : 'border-zinc-200 bg-white'}`}>
                  <FaChartBar className="text-[11px] text-sky-400" />
                  <span className={panelTheme.muted}>Equity</span>
                  <span className="font-semibold">${equity.toFixed(2)}</span>
                </div>
                <div className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 ${isDark ? 'border-zinc-700 bg-black/25' : 'border-zinc-200 bg-white'}`}>
                  <span className={panelTheme.muted}>Free Margin</span>
                  <span className={`font-semibold ${freeMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${freeMargin.toFixed(2)}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 ${isDark ? 'border-zinc-700 bg-black/25' : 'border-zinc-200 bg-white'}`}>
                  <span className={panelTheme.muted}>Margin Lvl</span>
                  <span className="font-semibold">{marginLevel.toFixed(0)}%</span>
                </div>
                <div className={pnlPositive ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
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

            <section className="flex-1 min-h-0 flex gap-3">
              <aside className={`hidden xl:block w-[260px] rounded-2xl border ${panelTheme.panel} overflow-hidden`}>
                {renderWatchlistPanel()}
              </aside>

              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="flex-1 min-h-0 flex gap-3">
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
                          sessionId={sessionId}
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
                    </div>
                  </section>

                  <aside className={`hidden xl:block w-[320px] rounded-2xl border ${panelTheme.panel} overflow-hidden`}>
                    {renderOrderPanel()}
                  </aside>
                </div>

                <div className={`xl:hidden rounded-2xl border ${panelTheme.panel} overflow-hidden max-h-[440px]`}>
                  {renderOrderPanel()}
                </div>

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
                    <span>Win/Loss: {wins}/{losses}</span>
                    <span>Used Margin: ${usedMargin.toFixed(2)}</span>
                    <span>Open/Pending: {openPositions.length}/{pendingOrders.length}</span>
                  </div>
                </section>

                {renderTerminalTabsPanel()}
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
