"use client";

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load TradeCandleChart to reduce initial bundle size
const TradeCandleChart = dynamic(() => import('./TradeCandleChart'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
      </div>
    </div>
  ),
  ssr: false,
});

export default TradeCandleChart;
