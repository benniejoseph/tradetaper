'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createTradingViewBacktestingDatafeed,
  mapReplayTimeframeToTradingViewResolution,
} from './tradingViewDatafeed';

type TradingViewChartApi = {
  setSymbol?: (symbol: string, interval: string, callback?: () => void) => void;
  resetData?: () => void;
};

type TradingViewWidgetApi = {
  remove: () => void;
  onChartReady?: (callback: () => void) => void;
  activeChart?: () => TradingViewChartApi;
  changeTheme?: (theme: 'Dark' | 'Light') => void;
  save?: (callback: (state: Record<string, unknown>) => void) => void;
  load?: (state: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => TradingViewWidgetApi;
    };
  }
}

export interface TradingViewBacktestChartHandle {
  saveLayout: () => Promise<boolean>;
  clearLayout: () => Promise<void>;
}

interface TradingViewBacktestChartProps {
  symbol: string;
  timeframe: string;
  isDark: boolean;
  replayTo?: number;
  sessionStart?: number;
  sessionEnd?: number;
  className?: string;
  onUnavailable?: (reason: string) => void;
  sessionId?: string;
}

const DEFAULT_LOCAL_LIBRARY_PATH = '/charting_library/';
const LOCAL_LIBRARY_SOURCES = [
  '/charting_library/charting_library.js',
  '/charting_library/charting_library.standalone.js',
];

const normalizeLibraryPath = (value: string): string => {
  if (!value) return value;
  return value.endsWith('/') ? value : `${value}/`;
};

const deriveLibraryPathFromSrc = (src: string): string => {
  const markers = ['/charting_library.js', '/charting_library.standalone.js'];
  for (const marker of markers) {
    const index = src.lastIndexOf(marker);
    if (index >= 0) {
      return normalizeLibraryPath(src.substring(0, index));
    }
  }
  const lastSlash = src.lastIndexOf('/');
  if (lastSlash >= 0) {
    return normalizeLibraryPath(src.substring(0, lastSlash));
  }
  return DEFAULT_LOCAL_LIBRARY_PATH;
};

interface LibraryCandidate {
  src: string;
  libraryPath: string;
}

const normalizeApiBase = (value: string): string => value.replace(/\/+$/, '');

const getLocalLayoutKey = (sessionId: string): string =>
  `tt:backtesting:tv-layout:${sessionId}`;

const parseJsonObject = (value: string | null): Record<string, unknown> | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

const normalizeSymbolForTradingView = (value: string): string => {
  const upper = (value || '').trim().toUpperCase();
  const maybeSymbol = upper.includes(':') ? upper.split(':').pop() || upper : upper;
  return maybeSymbol.replace(/[^A-Z0-9._-]/g, '') || 'XAUUSD';
};

const TradingViewBacktestChart = forwardRef<
  TradingViewBacktestChartHandle,
  TradingViewBacktestChartProps
>(function TradingViewBacktestChart(
  {
    symbol,
    timeframe,
    isDark,
    replayTo,
    sessionStart,
    sessionEnd,
    className,
    onUnavailable,
    sessionId,
  }: TradingViewBacktestChartProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<TradingViewWidgetApi | null>(null);
  const libraryPathRef = useRef<string>(DEFAULT_LOCAL_LIBRARY_PATH);
  const replayToRef = useRef<number | undefined>(replayTo);
  const previousReplayToRef = useRef<number | null>(null);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);
  const isDarkRef = useRef(isDark);
  const sessionStartRef = useRef<number | undefined>(sessionStart);
  const sessionEndRef = useRef<number | undefined>(sessionEnd);
  const [libraryReady, setLibraryReady] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  replayToRef.current = replayTo;
  symbolRef.current = symbol;
  timeframeRef.current = timeframe;
  isDarkRef.current = isDark;
  sessionStartRef.current = sessionStart;
  sessionEndRef.current = sessionEnd;

  const apiBase = useMemo(
    () =>
      normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api/v1`),
    [],
  );

  const datafeed = useMemo(
    () =>
      createTradingViewBacktestingDatafeed({
        apiBaseUrl: apiBase,
        getReplayTo: () => replayToRef.current,
        getSessionStart: () => sessionStartRef.current,
        getSessionEnd: () => sessionEndRef.current,
      }),
    [apiBase],
  );

  const saveLayoutToBackend = useCallback(
    async (layout: Record<string, unknown> | null) => {
      if (!sessionId) return;

      await fetch(`${apiBase}/backtesting/sessions/${sessionId}/chart-layout`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ layout }),
      });
    },
    [apiBase, sessionId],
  );

  const saveLayout = useCallback(async (): Promise<boolean> => {
    const widget = widgetRef.current;
    if (!widget?.save) return false;

    return await new Promise((resolve) => {
      try {
        widget.save?.((state) => {
          void (async () => {
            try {
              if (sessionId) {
                localStorage.setItem(getLocalLayoutKey(sessionId), JSON.stringify(state));
              }
              await saveLayoutToBackend(state);
              resolve(true);
            } catch {
              resolve(false);
            }
          })();
        });
      } catch {
        resolve(false);
      }
    });
  }, [saveLayoutToBackend, sessionId]);

  const clearLayout = useCallback(async (): Promise<void> => {
    if (sessionId) {
      localStorage.removeItem(getLocalLayoutKey(sessionId));
      try {
        await saveLayoutToBackend(null);
      } catch {
        // keep clear operation best-effort
      }
    }
  }, [saveLayoutToBackend, sessionId]);

  useImperativeHandle(
    ref,
    () => ({
      saveLayout,
      clearLayout,
    }),
    [clearLayout, saveLayout],
  );

  useEffect(() => {
    let cancelled = false;

    const initWidget = () => {
      if (cancelled || !containerRef.current || !window.TradingView?.widget) return;

      const widget = new window.TradingView.widget({
        symbol: normalizeSymbolForTradingView(symbolRef.current),
        interval: mapReplayTimeframeToTradingViewResolution(timeframeRef.current),
        container: containerRef.current,
        datafeed,
        library_path: libraryPathRef.current,
        locale: 'en',
        timezone: 'Etc/UTC',
        autosize: true,
        theme: isDarkRef.current ? 'Dark' : 'Light',
      });

      widgetRef.current = widget;
      widget.onChartReady?.(() => {
        if (!cancelled) setChartReady(true);
      });
    };

    const rawCandidates: LibraryCandidate[] = [];

    const envLibrarySrc = (process.env.NEXT_PUBLIC_TRADINGVIEW_LIBRARY_SRC || '').trim();
    const envLibraryPath = (process.env.NEXT_PUBLIC_TRADINGVIEW_LIBRARY_PATH || '').trim();
    for (const src of LOCAL_LIBRARY_SOURCES) {
      rawCandidates.push({
        src,
        libraryPath: DEFAULT_LOCAL_LIBRARY_PATH,
      });
    }

    if (envLibrarySrc) {
      rawCandidates.push({
        src: envLibrarySrc,
        libraryPath: normalizeLibraryPath(
          envLibraryPath || deriveLibraryPathFromSrc(envLibrarySrc),
        ),
      });
    }
    const candidates = rawCandidates.filter((candidate, index) =>
      rawCandidates.findIndex((item) => item.src === candidate.src) === index,
    );

    const loadScript = async (src: string): Promise<void> =>
      await new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing) {
          if (existing.dataset.tvLoaded === 'true') {
            resolve();
            return;
          }
          const handleLoaded = () => {
            existing.dataset.tvLoaded = 'true';
            existing.removeEventListener('load', handleLoaded);
            existing.removeEventListener('error', handleError);
            resolve();
          };
          const handleError = () => {
            existing.removeEventListener('load', handleLoaded);
            existing.removeEventListener('error', handleError);
            reject(new Error(`Failed to load ${src}`));
          };
          existing.addEventListener('load', handleLoaded);
          existing.addEventListener('error', handleError);
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
          script.dataset.tvLoaded = 'true';
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });

    const bootstrap = async () => {
      const tried: string[] = [];
      for (const candidate of candidates) {
        tried.push(candidate.src);
        try {
          await loadScript(candidate.src);
          if (cancelled) return;
          if (!window.TradingView?.widget) continue;
          libraryPathRef.current = candidate.libraryPath;
          setLibraryReady(true);
          initWidget();
          return;
        } catch {
          // Try next candidate.
        }
      }

      if (cancelled) return;
      onUnavailable?.(
        `TradingView Advanced library unavailable. Tried ${tried.length} source(s). Configure NEXT_PUBLIC_TRADINGVIEW_LIBRARY_SRC or add licensed files to /public/charting_library.`,
      );
    };

    void bootstrap();

    return () => {
      cancelled = true;
      widgetRef.current?.remove();
      widgetRef.current = null;
      setChartReady(false);
    };
  }, [datafeed, onUnavailable]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;
    widget.changeTheme?.(isDark ? 'Dark' : 'Light');
  }, [isDark]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !chartReady) return;
    widget.activeChart?.().setSymbol?.(
      normalizeSymbolForTradingView(symbol),
      mapReplayTimeframeToTradingViewResolution(timeframe),
      () => undefined,
    );
  }, [symbol, timeframe, chartReady]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !chartReady || replayTo == null) return;
    const replayToSeconds = Math.floor(replayTo);
    const previousReplayTo = previousReplayToRef.current;
    previousReplayToRef.current = replayToSeconds;

    // Let realtime polling drive forward playback to keep motion smooth.
    // Force a reset only when user moves replay backwards.
    if (previousReplayTo != null && replayToSeconds < previousReplayTo) {
      widget.activeChart?.().resetData?.();
    }
  }, [chartReady, replayTo]);

  useEffect(() => {
    previousReplayToRef.current = null;
  }, [symbol, timeframe]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !chartReady || !widget.load || !sessionId) return;

    let cancelled = false;

    const loadSavedLayout = async () => {
      let layout: Record<string, unknown> | null = null;

      try {
        const res = await fetch(`${apiBase}/backtesting/sessions/${sessionId}/chart-layout`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const payload = (await res.json()) as { layout?: Record<string, unknown> | null };
          if (payload?.layout && typeof payload.layout === 'object') {
            layout = payload.layout;
          }
        }
      } catch {
        // fall back to local cache
      }

      if (!layout) {
        layout = parseJsonObject(localStorage.getItem(getLocalLayoutKey(sessionId)));
      }

      if (!layout || cancelled) return;

      try {
        widget.load?.(layout);
      } catch {
        // keep chart available even when stored state is incompatible
      }
    };

    void loadSavedLayout();

    return () => {
      cancelled = true;
    };
  }, [apiBase, chartReady, sessionId]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className || ''}`}>
      <div ref={containerRef} className="h-full w-full" />
      {!libraryReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-emerald-200 text-sm text-center px-4">
          Loading TradingView Advanced chart...
        </div>
      )}
    </div>
  );
});

export default TradingViewBacktestChart;
