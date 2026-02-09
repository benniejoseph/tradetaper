"use client";

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load AnimatedChart (uses recharts library)
// recharts is ~300KB and only needed for animated charts
const AnimatedChart = dynamic(() => import('./AnimatedChart'), {
  loading: () => (
    <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <LoadingSpinner />
    </div>
  ),
  ssr: false,
});

export default AnimatedChart;
