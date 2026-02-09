"use client";

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load the ChartEngine component to reduce initial bundle size
// lightweight-charts is ~400KB and only needed when viewing charts
const ChartEngine = dynamic(() => import('./ChartEngine'), {
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
      </div>
    </div>
  ),
  ssr: false, // Disable SSR for chart component
});

export default ChartEngine;
