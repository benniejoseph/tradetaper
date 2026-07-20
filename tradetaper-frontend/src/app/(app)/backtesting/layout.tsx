'use client';

import React from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';

export default function BacktestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGate feature="backtesting" className="min-h-screen">
      {children}
    </FeatureGate>
  );
}

