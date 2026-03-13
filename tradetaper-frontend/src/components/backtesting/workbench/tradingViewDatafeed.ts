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
  getSessionStart?: () => number | undefined;
  getSessionEnd?: () => number | undefined;
}

const SUPPORTED_RESOLUTIONS = ['1', '5', '15', '30', '60', '240', '1D'];
const DEFAULT_SYMBOLS = [
  'XAUUSD',
  'XAGUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'US100',
  'US500',
  'US30',
  'BTCUSD',
  'ETHUSD',
];

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

const mapResolutionToSeconds = (resolution: string): number => {
  const value = (resolution || '').toUpperCase();
  switch (value) {
    case '1':
      return 60;
    case '5':
      return 300;
    case '15':
      return 900;
    case '30':
      return 1800;
    case '60':
    case '1H':
      return 3600;
    case '240':
    case '4H':
      return 14400;
    case '1D':
    case 'D':
      return 86400;
    default:
      return 60;
  }
};

const inferSymbolType = (symbol: string): string => {
  if (symbol.startsWith('XAU') || symbol.startsWith('XAG')) return 'metal';
  if (
    symbol.startsWith('US') ||
    symbol.startsWith('NAS') ||
    symbol.startsWith('SPX') ||
    symbol.startsWith('DJ')
  ) {
    return 'index';
  }
  if (symbol.endsWith('USD') && symbol.length >= 6) return 'forex';
  if (symbol.startsWith('BTC') || symbol.startsWith('ETH')) return 'crypto';
  return 'forex';
};

const inferPriceScale = (symbol: string): number => {
  if (symbol.endsWith('JPY')) return 1000;
  if (symbol.startsWith('XAU') || symbol.startsWith('XAG')) return 100;
  if (symbol.startsWith('US') || symbol.startsWith('NAS') || symbol.startsWith('SPX')) {
    return 100;
  }
  return 100000;
};

const normalizeSymbol = (value: string): string => {
  const upper = value.trim().toUpperCase();
  const maybeSymbol = upper.includes(':') ? upper.split(':').pop() || upper : upper;
  return maybeSymbol.replace(/[^A-Z0-9._-]/g, '') || 'XAUUSD';
};

const buildFallbackSymbolInfo = (symbolName: string) => {
  const symbol = normalizeSymbol(symbolName);
  return {
    name: symbol,
    ticker: symbol,
    full_name: `TradeTaper:${symbol}`,
    description: `${symbol} (TradeTaper Backtesting Feed)`,
    type: inferSymbolType(symbol),
    session: '24x7',
    exchange: 'TradeTaper',
    listed_exchange: 'TradeTaper',
    timezone: 'Etc/UTC',
    minmov: 1,
    pricescale: inferPriceScale(symbol),
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: false,
    has_no_volume: false,
    supported_resolutions: SUPPORTED_RESOLUTIONS,
    volume_precision: 2,
    data_status: 'streaming',
  };
};

export function createTradingViewBacktestingDatafeed(
  options: TradingViewDatafeedOptions,
) {
  const { apiBaseUrl, getReplayTo, getSessionStart, getSessionEnd } = options;
  const subscriberMap = new Map<string, ReturnType<typeof setInterval>>();
  const lastBarTimeBySubscriber = new Map<string, number>();
  const lastReplayTimeBySubscriber = new Map<string, number>();

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

    getServerTime: async (callback: (time: number) => void) => {
      try {
        const serverTime = await fetchJson<number>(apiBaseUrl, '/backtesting/tv/time');
        callback(Number.isFinite(serverTime) ? serverTime : Math.floor(Date.now() / 1000));
      } catch {
        callback(Math.floor(Date.now() / 1000));
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
        const q = (userInput || '').trim().toUpperCase();
        onResultReadyCallback(
          DEFAULT_SYMBOLS.filter((symbol) => !q || symbol.includes(q)).map((symbol) => ({
            symbol,
            full_name: `TradeTaper:${symbol}`,
            description: `${symbol} (TradeTaper Backtesting Feed)`,
            exchange: 'TradeTaper',
            ticker: symbol,
            type: inferSymbolType(symbol),
          })),
        );
      }
    },

    resolveSymbol: async (
      symbolName: string,
      onSymbolResolvedCallback: (symbolInfo: unknown) => void,
      _onResolveErrorCallback: TvErrorCallback,
    ) => {
      try {
        const symbolInfo = await fetchJson<unknown>(
          apiBaseUrl,
          '/backtesting/tv/symbols',
          { symbol: symbolName },
        );
        onSymbolResolvedCallback(symbolInfo);
      } catch {
        onSymbolResolvedCallback(buildFallbackSymbolInfo(symbolName));
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
        const sessionStart = getSessionStart?.();
        const sessionEnd = getSessionEnd?.();
        const requestedTo = Math.floor(periodParams.to);
        const resolutionSeconds = mapResolutionToSeconds(resolution);
        const countBack = Math.max(Number(periodParams.countBack) || 500, 200);
        const upperBound =
          sessionEnd && Number.isFinite(sessionEnd)
            ? Math.min(requestedTo, Math.floor(sessionEnd))
            : requestedTo;
        const replayBound =
          replayTo && Number.isFinite(replayTo)
            ? Math.min(upperBound, Math.floor(replayTo))
            : upperBound;
        const effectiveTo = replayBound;
        const lookbackFrom = Math.max(
          0,
          effectiveTo - countBack * resolutionSeconds,
        );
        const effectiveFrom =
          sessionStart && Number.isFinite(sessionStart)
            ? Math.max(Math.floor(periodParams.from), Math.floor(sessionStart), lookbackFrom)
            : Math.max(Math.floor(periodParams.from), lookbackFrom);

        if (effectiveTo <= effectiveFrom) {
          onHistoryCallback([], { noData: true, nextTime: effectiveFrom });
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
          from: effectiveFrom,
          to: effectiveTo,
          countback: countBack,
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
      const resolutionSeconds = mapResolutionToSeconds(resolution);
      const pollIntervalMs = 350;
      const interval = setInterval(async () => {
        try {
          const replayTo = getReplayTo?.();
          if (!replayTo || !Number.isFinite(replayTo)) return;

          const sessionStart = getSessionStart?.();
          const sessionEnd = getSessionEnd?.();
          const to = sessionEnd && Number.isFinite(sessionEnd)
            ? Math.min(Math.floor(replayTo), Math.floor(sessionEnd))
            : Math.floor(replayTo);
          const previousReplayTo = lastReplayTimeBySubscriber.get(subscriberUID);
          if (previousReplayTo === to) return;
          lastReplayTimeBySubscriber.set(subscriberUID, to);

          const lookbackSeconds = Math.max(resolutionSeconds * 8, 600);
          const fromByLookback = Math.max(0, to - lookbackSeconds);
          const from = sessionStart && Number.isFinite(sessionStart)
            ? Math.max(fromByLookback, Math.floor(sessionStart))
            : fromByLookback;
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
            countback: Math.max(Math.floor(lookbackSeconds / resolutionSeconds), 50),
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
      }, pollIntervalMs);

      subscriberMap.set(subscriberUID, interval);
    },

    unsubscribeBars: (subscriberUID: string) => {
      const interval = subscriberMap.get(subscriberUID);
      if (interval) clearInterval(interval);
      subscriberMap.delete(subscriberUID);
      lastBarTimeBySubscriber.delete(subscriberUID);
      lastReplayTimeBySubscriber.delete(subscriberUID);
    },
  };
}
