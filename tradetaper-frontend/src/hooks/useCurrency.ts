'use client';

import { useState, useEffect } from 'react';
import {
  DEFAULT_CURRENCY_CODE,
  resolveCurrencyCode,
  type CurrencyCode,
} from '@/lib/currency';

export type { CurrencyCode };

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;   // '₹' | '$'
  isIndia: boolean;
  locale: string;   // 'en-IN' | 'en-US'
}

const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', isIndia: true,  locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', isIndia: false, locale: 'en-US' },
};

// SSR-safe default: USD (avoids hydration mismatch)
const DEFAULT: CurrencyInfo = CURRENCIES[DEFAULT_CURRENCY_CODE];
const DEFAULT_IDLE_DELAY_MS = 1200;

type CurrencyFetchMode = 'eager' | 'idle' | 'off';

type UseCurrencyOptions = {
  initialCurrencyCode?: CurrencyCode;
  fetchMode?: CurrencyFetchMode;
  idleDelayMs?: number;
};

function getBrowserFallbackCurrency(): CurrencyInfo {
  if (typeof navigator !== 'undefined') {
    const localeCandidates = [
      navigator.language,
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    ]
      .filter(Boolean)
      .map((value) => value.toUpperCase());

    if (localeCandidates.some((locale) => locale.endsWith('-IN'))) {
      return CURRENCIES.INR;
    }
  }

  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Asia/Kolkata') {
      return CURRENCIES.INR;
    }
  }

  return CURRENCIES.USD;
}

function resolveCurrency(country?: string, currency?: string): CurrencyInfo {
  return CURRENCIES[resolveCurrencyCode(country, currency)] ?? CURRENCIES.USD;
}

export function useCurrency(options: UseCurrencyOptions = {}): {
  currency: CurrencyInfo;
  loading: boolean;
} {
  const {
    initialCurrencyCode = DEFAULT_CURRENCY_CODE,
    fetchMode = 'eager',
    idleDelayMs = DEFAULT_IDLE_DELAY_MS,
  } = options;
  const initialCurrency = CURRENCIES[initialCurrencyCode] ?? DEFAULT;
  const shouldStartLoading = fetchMode === 'eager' && initialCurrencyCode === DEFAULT_CURRENCY_CODE;
  const [currency, setCurrency] = useState<CurrencyInfo>(initialCurrency);
  const [loading, setLoading] = useState(shouldStartLoading);

  useEffect(() => {
    if (fetchMode === 'off') {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const detectCurrency = () => {
      if (!isMounted) {
        return;
      }

      if (fetchMode === 'eager' && initialCurrencyCode === DEFAULT_CURRENCY_CODE) {
        setLoading(true);
      }

      fetch('/api/geo', { signal: controller.signal })
        .then((response) => response.json())
        .then(
          ({
            country,
            currency: detectedCurrency,
          }: {
            country?: string;
            currency?: string;
          }) => {
            if (!isMounted) {
              return;
            }
            setCurrency(resolveCurrency(country, detectedCurrency));
          },
        )
        .catch(() => {
          if (!isMounted || controller.signal.aborted) {
            return;
          }
          // Fallback for local/dev or blocked geo headers.
          setCurrency(getBrowserFallbackCurrency());
        })
        .finally(() => {
          if (!isMounted) {
            return;
          }
          setLoading(false);
        });
    };

    if (fetchMode === 'idle') {
      const win = window as Window & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions,
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
      timeoutId = window.setTimeout(() => {
        if (!isMounted) {
          return;
        }
        if (typeof win.requestIdleCallback === 'function') {
          idleId = win.requestIdleCallback(
            () => detectCurrency(),
            { timeout: 500 },
          );
        } else {
          detectCurrency();
        }
      }, idleDelayMs);
    } else {
      detectCurrency();
    }

    return () => {
      isMounted = false;
      controller.abort();
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== null) {
        const win = window as Window & {
          cancelIdleCallback?: (handle: number) => void;
        };
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(idleId);
        } else {
          window.clearTimeout(idleId);
        }
      }
    };
  }, [fetchMode, idleDelayMs, initialCurrencyCode]);

  return { currency, loading };
}
