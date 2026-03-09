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
  className?: string;
  onUnavailable?: (reason: string) => void;
  sessionId?: string;
}

const CHARTING_LIBRARY_SRC = '/charting_library/charting_library.standalone.js';

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

const TradingViewBacktestChart = forwardRef<
  TradingViewBacktestChartHandle,
  TradingViewBacktestChartProps
>(function TradingViewBacktestChart(
  {
    symbol,
    timeframe,
    isDark,
    replayTo,
    className,
    onUnavailable,
    sessionId,
  }: TradingViewBacktestChartProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<TradingViewWidgetApi | null>(null);
  const replayToRef = useRef<number | undefined>(replayTo);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);
  const isDarkRef = useRef(isDark);
  const [libraryReady, setLibraryReady] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  replayToRef.current = replayTo;
  symbolRef.current = symbol;
  timeframeRef.current = timeframe;
  isDarkRef.current = isDark;

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
        symbol: symbolRef.current,
        interval: mapReplayTimeframeToTradingViewResolution(timeframeRef.current),
        container: containerRef.current,
        datafeed,
        library_path: '/charting_library/',
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

    if (window.TradingView?.widget) {
      setLibraryReady(true);
      initWidget();
      return () => {
        cancelled = true;
        widgetRef.current?.remove();
        widgetRef.current = null;
        setChartReady(false);
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHARTING_LIBRARY_SRC}"]`,
    );

    const handleLoaded = () => {
      if (cancelled) return;
      setLibraryReady(true);
      initWidget();
    };
    const handleError = () => {
      if (cancelled) return;
      onUnavailable?.(
        'TradingView Advanced library is missing. Add charting_library files to /public/charting_library.',
      );
    };

    if (existing) {
      existing.addEventListener('load', handleLoaded);
      existing.addEventListener('error', handleError);
    } else {
      const script = document.createElement('script');
      script.src = CHARTING_LIBRARY_SRC;
      script.async = true;
      script.onload = handleLoaded;
      script.onerror = handleError;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (existing) {
        existing.removeEventListener('load', handleLoaded);
        existing.removeEventListener('error', handleError);
      }
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
      symbol,
      mapReplayTimeframeToTradingViewResolution(timeframe),
      () => undefined,
    );
  }, [symbol, timeframe, chartReady]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !chartReady || replayTo == null) return;
    widget.activeChart?.().resetData?.();
  }, [chartReady, replayTo]);

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
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-emerald-200 text-sm">
          Loading TradingView Advanced chart...
        </div>
      )}
    </div>
  );
});

export default TradingViewBacktestChart;
