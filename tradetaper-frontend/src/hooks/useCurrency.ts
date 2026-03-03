'use client';

import { useState, useEffect } from 'react';

export type CurrencyCode = 'INR' | 'USD';

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
const DEFAULT: CurrencyInfo = CURRENCIES.USD;

export function useCurrency(): { currency: CurrencyInfo; loading: boolean } {
  const [currency, setCurrency] = useState<CurrencyInfo>(DEFAULT);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then(({ country }: { country: string }) => {
        setCurrency(country === 'IN' ? CURRENCIES.INR : CURRENCIES.USD);
      })
      .catch(() => {
        // Keep USD default on network error / ad-blocker
      })
      .finally(() => setLoading(false));
  }, []);

  return { currency, loading };
}
