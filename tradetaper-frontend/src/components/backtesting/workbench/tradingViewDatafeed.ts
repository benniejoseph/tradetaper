type TvOnReadyCallback = (config: {
  supports_search: boolean;
  supports_group_request: boolean;
  supports_marks: boolean;
  supports_timescale_marks: boolean;
  supports_time: boolean;
  supported_resolutions: string[];
}) => void;

type TvHistoryCallback = (
  bars: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>,
  meta: { noData?: boolean; nextTime?: number },
) => void;

type TvErrorCallback = (reason: string) => void;

interface TvPeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
  countBack: number;
}

interface TradingViewDatafeedOptions {
  apiBaseUrl: string;
  getReplayTo?: () => number | undefined;
}

const SUPPORTED_RESOLUTIONS = ['1', '5', '15', '30', '60', '240', '1D'];

const normalizeApiBase = (value: string): string => value.replace(/\/+$/, '');

const buildUrl = (
  apiBaseUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): string => {
  const base = normalizeApiBase(apiBaseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const isAbsolute = /^https?:\/\//i.test(base);
  const absoluteUrl = isAbsolute
    ? `${base}${normalizedPath}`
    : `${window.location.origin}${base}${normalizedPath}`;
  const url = new URL(absoluteUrl);

  if (query) {
    for (const [key, rawValue] of Object.entries(query)) {
      if (rawValue === undefined || rawValue === null || rawValue === '') continue;
      url.searchParams.set(key, String(rawValue));
    }
  }

  return url.toString();
};

const fetchJson = async <T>(
  apiBaseUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> => {
  const res = await fetch(buildUrl(apiBaseUrl, path, query), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`TradingView datafeed request failed (${res.status})`);
  }

  return (await res.json()) as T;
};

const mapTimeframeToResolution = (tf: string): string => {
  const value = tf.toLowerCase();
  switch (value) {
    case '1m':
      return '1';
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '30m':
      return '30';
    case '1h':
      return '60';
    case '4h':
      return '240';
    case '1d':
    case 'd':
      return '1D';
    default:
      return '60';
  }
};

export const mapReplayTimeframeToTradingViewResolution = mapTimeframeToResolution;

export function createTradingViewBacktestingDatafeed(
  options: TradingViewDatafeedOptions,
) {
  const { apiBaseUrl, getReplayTo } = options;
  const subscriberMap = new Map<string, ReturnType<typeof setInterval>>();
  const lastBarTimeBySubscriber = new Map<string, number>();

  const parseHistoryBars = (
    payload: {
      s?: string;
      t?: number[];
      o?: number[];
      h?: number[];
      l?: number[];
      c?: number[];
      v?: number[];
    } | null,
  ) => {
    if (!payload || payload.s !== 'ok' || !Array.isArray(payload.t)) {
      return [];
    }

    const bars: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number;
    }> = [];

    for (let i = 0; i < payload.t.length; i++) {
      const t = Number(payload.t[i]);
      const o = Number(payload.o?.[i]);
      const h = Number(payload.h?.[i]);
      const l = Number(payload.l?.[i]);
      const c = Number(payload.c?.[i]);
      const v = Number(payload.v?.[i] ?? 0);
      if (
        !Number.isFinite(t) ||
        !Number.isFinite(o) ||
        !Number.isFinite(h) ||
        !Number.isFinite(l) ||
        !Number.isFinite(c)
      ) {
        continue;
      }

      bars.push({
        time: t * 1000, // TradingView JS API expects milliseconds
        open: o,
        high: h,
        low: l,
        close: c,
        volume: Number.isFinite(v) ? v : 0,
      });
    }

    return bars;
  };

  return {
    onReady: async (callback: TvOnReadyCallback) => {
      try {
        const config = await fetchJson<{
          supports_search: boolean;
          supports_group_request: boolean;
          supports_marks: boolean;
          supports_timescale_marks: boolean;
          supports_time: boolean;
          supported_resolutions: string[];
        }>(apiBaseUrl, '/backtesting/tv/config');
        setTimeout(() => callback(config), 0);
      } catch {
        setTimeout(
          () =>
            callback({
              supports_search: true,
              supports_group_request: false,
              supports_marks: false,
              supports_timescale_marks: false,
              supports_time: true,
              supported_resolutions: SUPPORTED_RESOLUTIONS,
            }),
          0,
        );
      }
    },

    searchSymbols: async (
      userInput: string,
      _exchange: string,
      _symbolType: string,
      onResultReadyCallback: (symbols: unknown[]) => void,
    ) => {
      try {
        const symbols = await fetchJson<unknown[]>(
          apiBaseUrl,
          '/backtesting/tv/search',
          { query: userInput || '' },
        );
        onResultReadyCallback(symbols);
      } catch {
        onResultReadyCallback([]);
      }
    },

    resolveSymbol: async (
      symbolName: string,
      onSymbolResolvedCallback: (symbolInfo: unknown) => void,
      onResolveErrorCallback: TvErrorCallback,
    ) => {
      try {
        const symbolInfo = await fetchJson<unknown>(
          apiBaseUrl,
          '/backtesting/tv/symbols',
          { symbol: symbolName },
        );
        onSymbolResolvedCallback(symbolInfo);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to resolve symbol';
        onResolveErrorCallback(message);
      }
    },

    getBars: async (
      symbolInfo: { ticker?: string; name?: string },
      resolution: string,
      periodParams: TvPeriodParams,
      onHistoryCallback: TvHistoryCallback,
      onErrorCallback: TvErrorCallback,
    ) => {
      try {
        const replayTo = getReplayTo?.();
        const requestedTo = Math.floor(periodParams.to);
        const effectiveTo =
          replayTo && Number.isFinite(replayTo)
            ? Math.min(requestedTo, Math.floor(replayTo))
            : requestedTo;

        if (effectiveTo <= periodParams.from) {
          onHistoryCallback([], { noData: true, nextTime: periodParams.from });
          return;
        }

        const payload = await fetchJson<{
          s?: string;
          t?: number[];
          o?: number[];
          h?: number[];
          l?: number[];
          c?: number[];
          v?: number[];
          nextTime?: number;
        }>(apiBaseUrl, '/backtesting/tv/history', {
          symbol: symbolInfo.ticker || symbolInfo.name || 'XAUUSD',
          resolution,
          from: Math.floor(periodParams.from),
          to: effectiveTo,
        });

        if (payload?.s === 'no_data') {
          onHistoryCallback([], { noData: true, nextTime: payload.nextTime });
          return;
        }

        const bars = parseHistoryBars(payload || null);
        onHistoryCallback(bars, { noData: bars.length === 0 });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load history';
        onErrorCallback(message);
      }
    },

    subscribeBars: (
      symbolInfo: { ticker?: string; name?: string },
      resolution: string,
      onRealtimeCallback: (bar: {
        time: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume?: number;
      }) => void,
      subscriberUID: string,
    ) => {
      const interval = setInterval(async () => {
        try {
          const replayTo = getReplayTo?.();
          if (!replayTo || !Number.isFinite(replayTo)) return;

          const to = Math.floor(replayTo);
          const from = Math.max(0, to - 24 * 60 * 60);
          const payload = await fetchJson<{
            s?: string;
            t?: number[];
            o?: number[];
            h?: number[];
            l?: number[];
            c?: number[];
            v?: number[];
          }>(apiBaseUrl, '/backtesting/tv/history', {
            symbol: symbolInfo.ticker || symbolInfo.name || 'XAUUSD',
            resolution,
            from,
            to,
          });
          const bars = parseHistoryBars(payload || null);
          const lastBar = bars[bars.length - 1];
          if (!lastBar) return;

          const prevTime = lastBarTimeBySubscriber.get(subscriberUID);
          if (prevTime === lastBar.time) return;

          lastBarTimeBySubscriber.set(subscriberUID, lastBar.time);
          onRealtimeCallback(lastBar);
        } catch {
          // Keep polling loop resilient; charting library handles retries visually.
        }
      }, 1500);

      subscriberMap.set(subscriberUID, interval);
    },

    unsubscribeBars: (subscriberUID: string) => {
      const interval = subscriberMap.get(subscriberUID);
      if (interval) clearInterval(interval);
      subscriberMap.delete(subscriberUID);
      lastBarTimeBySubscriber.delete(subscriberUID);
    },
  };
}
