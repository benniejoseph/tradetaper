import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Helper function to create lazy-loaded components with loading state
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loadingMessage?: string
) {
  return dynamic(importFunc, {
    loading: () => <LoadingSpinner message={loadingMessage} />,
    ssr: false // Disable SSR for heavy client-side components
  });
}

// Pre-configured lazy components for common heavy imports
export const LazyTradeChart = lazyLoad(
  () => import('../charts/TradeChart'),
  'Loading chart...'
);

export const LazyPnlCalendar = lazyLoad(
  () => import('../analytics/PnlCalendar'),
  'Loading calendar...'
);

export const LazyTradesTable = lazyLoad(
  () => import('../journal/TradesTable'),
  'Loading trades...'
);

export const LazyTradeForm = lazyLoad(
  () => import('../trades/TradeForm'),
  'Loading form...'
);

export const LazyMT5AccountForm = lazyLoad(
  () => import('../settings/MT5AccountForm'),
  'Loading MT5 form...'
);

export const LazyLiveTradingDashboard = lazyLoad(
  () => import('../trades/LiveTradingDashboard'),
  'Loading live dashboard...'
);