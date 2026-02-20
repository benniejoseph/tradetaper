"use client";

import React from 'react';

interface DashboardSkeletonProps {
  variant?: 'card' | 'widget' | 'chart' | 'table' | 'metric';
  className?: string;
}

export default function DashboardSkeleton({ variant = 'card', className = '' }: DashboardSkeletonProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] rounded-lg";
  
  switch (variant) {
    case 'widget':
      return (
        <div className={`space-y-4 p-4 ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${baseClasses} w-10 h-10 rounded-xl`}></div>
              <div className="space-y-2">
                <div className={`${baseClasses} h-4 w-24`}></div>
                <div className={`${baseClasses} h-3 w-16`}></div>
              </div>
            </div>
            <div className={`${baseClasses} h-6 w-16 rounded-full`}></div>
          </div>
          {/* Content */}
          <div className="space-y-3">
            <div className={`${baseClasses} h-16 w-full rounded-xl`}></div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`${baseClasses} h-12 rounded-lg`}></div>
              <div className={`${baseClasses} h-12 rounded-lg`}></div>
            </div>
            <div className={`${baseClasses} h-8 w-3/4`}></div>
          </div>
        </div>
      );

    case 'chart':
      return (
        <div className={`space-y-4 p-4 ${className}`}>
          <div className="flex items-center justify-between">
            <div className={`${baseClasses} h-5 w-32`}></div>
            <div className={`${baseClasses} h-8 w-48 rounded-lg`}></div>
          </div>
          <div className={`${baseClasses} h-48 w-full rounded-xl`}></div>
        </div>
      );

    case 'table':
      return (
        <div className={`space-y-3 p-4 ${className}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`${baseClasses} w-2 h-8 rounded-full`}></div>
                <div className="space-y-1">
                  <div className={`${baseClasses} h-4 w-20`}></div>
                  <div className={`${baseClasses} h-3 w-12`}></div>
                </div>
              </div>
              <div className={`${baseClasses} h-5 w-16`}></div>
            </div>
          ))}
        </div>
      );

    case 'metric':
      return (
        <div className={`flex items-center space-x-4 p-4 ${className}`}>
          <div className={`${baseClasses} w-12 h-12 rounded-xl`}></div>
          <div className="space-y-2 flex-1">
            <div className={`${baseClasses} h-3 w-20`}></div>
            <div className={`${baseClasses} h-6 w-28`}></div>
          </div>
        </div>
      );

    default: // card
      return (
        <div className={`space-y-4 p-6 ${className}`}>
          <div className="flex items-center space-x-3">
            <div className={`${baseClasses} w-10 h-10 rounded-xl`}></div>
            <div className={`${baseClasses} h-5 w-32`}></div>
          </div>
          <div className={`${baseClasses} h-20 w-full rounded-xl`}></div>
          <div className="flex space-x-4">
            <div className={`${baseClasses} h-4 w-1/3`}></div>
            <div className={`${baseClasses} h-4 w-1/3`}></div>
          </div>
        </div>
      );
  }
}

// Badge component for showing data source
export type DataSource = 'tradingview' | 'twelvedata' | 'fallback' | 'demo' | 'live';

interface DataSourceBadgeProps {
  source?: DataSource;
  isDemo?: boolean; // Legacy prop for backwards compatibility
}

export function DataSourceBadge({ source, isDemo = false }: DataSourceBadgeProps) {
  // Handle legacy isDemo prop
  const effectiveSource = source || (isDemo ? 'demo' : 'live');
  
  const getSourceConfig = (src: DataSource) => {
    switch (src) {
      case 'tradingview':
        return {
          label: 'TradingView',
          bgClass: 'bg-blue-100 dark:bg-emerald-900/30',
          textClass: 'text-blue-800 dark:text-emerald-400',
          dotClass: 'bg-blue-500 animate-pulse',
        };
      case 'twelvedata':
        return {
          label: 'Twelve Data',
          bgClass: 'bg-green-100 dark:bg-green-900/30',
          textClass: 'text-green-800 dark:text-green-400',
          dotClass: 'bg-green-500 animate-pulse',
        };
      case 'fallback':
      case 'demo':
        return {
          label: 'Demo',
          bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
          textClass: 'text-yellow-800 dark:text-yellow-400',
          dotClass: 'bg-yellow-500',
        };
      case 'live':
      default:
        return {
          label: 'Live',
          bgClass: 'bg-green-100 dark:bg-green-900/30',
          textClass: 'text-green-800 dark:text-green-400',
          dotClass: 'bg-green-500 animate-pulse',
        };
    }
  };

  const config = getSourceConfig(effectiveSource);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dotClass}`}></span>
      {config.label}
    </span>
  );
}
