/**
 * Pure indicator calculation utilities for the backtesting replay engine.
 * Only Volume and Sessions (kill zones) are kept; EMA and RSI removed.
 */

export interface IndicatorConfig {
  volume:    boolean;
  killZones: boolean; // shown as "Sessions" in UI
}

export const DEFAULT_INDICATORS: IndicatorConfig = {
  volume:    false,
  killZones: false,
};

// ── Volume ────────────────────────────────────────────────────────────────────

export interface VolumeBar {
  time: number;
  value: number;
  color: string;
}

/**
 * Builds volume histogram data coloured by candle direction.
 */
export function buildVolumeData(candles: { time: number; open: number; close: number; volume?: number }[]): VolumeBar[] {
  return candles.map((c) => ({
    time: c.time,
    value: c.volume ?? 1, // fallback 1 so bars are visible even without volume data
    color: c.close >= c.open
      ? 'rgba(16, 185, 129, 0.35)'  // emerald for up candles
      : 'rgba(239, 68, 68, 0.35)',  // red for down candles
  }));
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Convert a parallel value array + times array into lightweight-charts
 * LineSeries data, dropping null entries.
 */
export function toLineData(
  times: number[],
  values: (number | null)[]
): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  for (let i = 0; i < times.length; i++) {
    if (values[i] !== null && values[i] !== undefined) {
      out.push({ time: times[i], value: values[i] as number });
    }
  }
  return out;
}
