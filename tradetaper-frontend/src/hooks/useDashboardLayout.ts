"use client";

import { useState, useEffect, useCallback } from 'react';
import { Layout } from 'react-grid-layout';

// Define Layouts type since it's not exported from the package
type Layouts = { [key: string]: Layout[] };

const STORAGE_KEY = 'dashboard-layout';

// Default layouts for different breakpoints
const defaultLayouts: Layouts = {
  lg: [
    { i: 'portfolio-balance', x: 0, y: 0, w: 2, h: 2 },
    { i: 'personal-target', x: 2, y: 0, w: 2, h: 2 },
    { i: 'total-return', x: 4, y: 0, w: 2, h: 2 },
    { i: 'equity-curve', x: 0, y: 2, w: 3, h: 3 },
    { i: 'win-rate', x: 3, y: 2, w: 3, h: 3 },
    { i: 'trading-costs', x: 0, y: 5, w: 3, h: 2 },
    { i: 'trade-statistics', x: 3, y: 5, w: 3, h: 2 },
    { i: 'top-trades', x: 0, y: 7, w: 3, h: 3 },
    { i: 'pnl-calendar', x: 3, y: 7, w: 3, h: 3 },
    { i: 'activity-heatmap', x: 0, y: 10, w: 6, h: 2 },
  ],
  md: [
    { i: 'portfolio-balance', x: 0, y: 0, w: 2, h: 2 },
    { i: 'personal-target', x: 2, y: 0, w: 2, h: 2 },
    { i: 'total-return', x: 0, y: 2, w: 2, h: 2 },
    { i: 'equity-curve', x: 2, y: 2, w: 2, h: 2 },
    { i: 'win-rate', x: 0, y: 4, w: 4, h: 3 },
    { i: 'trading-costs', x: 0, y: 7, w: 2, h: 2 },
    { i: 'trade-statistics', x: 2, y: 7, w: 2, h: 2 },
    { i: 'top-trades', x: 0, y: 9, w: 2, h: 3 },
    { i: 'pnl-calendar', x: 2, y: 9, w: 2, h: 3 },
    { i: 'activity-heatmap', x: 0, y: 12, w: 4, h: 2 },
  ],
  sm: [
    { i: 'portfolio-balance', x: 0, y: 0, w: 2, h: 2 },
    { i: 'personal-target', x: 0, y: 2, w: 2, h: 2 },
    { i: 'total-return', x: 0, y: 4, w: 2, h: 2 },
    { i: 'equity-curve', x: 0, y: 6, w: 2, h: 2 },
    { i: 'win-rate', x: 0, y: 8, w: 2, h: 3 },
    { i: 'trading-costs', x: 0, y: 11, w: 2, h: 2 },
    { i: 'trade-statistics', x: 0, y: 13, w: 2, h: 2 },
    { i: 'top-trades', x: 0, y: 15, w: 2, h: 3 },
    { i: 'pnl-calendar', x: 0, y: 18, w: 2, h: 3 },
    { i: 'activity-heatmap', x: 0, y: 21, w: 2, h: 2 },
  ],
};

export function useDashboardLayout() {
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved layout from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLayouts = localStorage.getItem(STORAGE_KEY);
        if (savedLayouts) {
          const parsed = JSON.parse(savedLayouts);
          setLayouts(parsed);
        }
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save layout to localStorage
  const saveLayout = useCallback((newLayouts: Layouts) => {
    setLayouts(newLayouts);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
      } catch (error) {
        console.error('Failed to save dashboard layout:', error);
      }
    }
  }, []);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to reset dashboard layout:', error);
      }
    }
  }, []);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  return {
    layouts,
    isEditMode,
    isLoaded,
    saveLayout,
    resetLayout,
    toggleEditMode,
    defaultLayouts,
  };
}

export type { Layout, Layouts };
