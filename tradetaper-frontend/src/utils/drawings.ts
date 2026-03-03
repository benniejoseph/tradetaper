// src/utils/drawings.ts
// Types and constants for chart drawing tools

export type DrawingTool = 'none' | 'horizontal' | 'trend' | 'rectangle' | 'fibonacci';

// ── Fibonacci constants ────────────────────────────────────────────────────────
export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
export const FIB_LABELS = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
export const FIB_COLORS = [
  '#F87171', // red    – 0%
  '#FB923C', // orange – 23.6%
  '#FBBF24', // amber  – 38.2%
  '#4ADE80', // green  – 50%
  '#60A5FA', // blue   – 61.8%
  '#C084FC', // purple – 78.6%
  '#F43F5E', // rose   – 100%
];

// ── Tool accent colours ────────────────────────────────────────────────────────
export const TOOL_COLOR: Record<DrawingTool, string> = {
  none:       '#64748B',
  horizontal: '#38BDF8',
  trend:      '#A78BFA',
  rectangle:  '#34D399',
  fibonacci:  '#FBBF24',
};

// ── Drawing shape interfaces ───────────────────────────────────────────────────

export interface HorizontalLine {
  type:  'horizontal';
  id:    string;
  price: number;
  color: string;
}

export interface TrendLine {
  type:       'trend';
  id:         string;
  startTime:  number;
  startPrice: number;
  endTime:    number;
  endPrice:   number;
  color:      string;
}

export interface RectZone {
  type:        'rectangle';
  id:          string;
  startTime:   number;
  startPrice:  number;
  endTime:     number;
  endPrice:    number;
  color:       string;
  fillOpacity: number;
}

export interface FibRetracement {
  type:       'fibonacci';
  id:         string;
  startTime:  number;
  startPrice: number;
  endTime:    number;
  endPrice:   number;
  color:      string;
}

export type Drawing = HorizontalLine | TrendLine | RectZone | FibRetracement;
