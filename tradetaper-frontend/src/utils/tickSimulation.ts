// src/utils/tickSimulation.ts
// Generates a realistic intra-candle "tick" path from OHLCV data.
//
// Algorithm (matches common market microstructure):
//   Bullish candle (close >= open):  Open → Low → High → Close
//   Bearish candle (close <  open):  Open → High → Low → Close
//
// This produces candle objects that can be fed to lightweight-charts
// via series.update() for smooth tick-by-tick replay animation.

export interface CandleData {
  time:  number;
  open:  number;
  high:  number;
  low:   number;
  close: number;
}

/** Linear interpolation */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Add small random noise to a price value (< 10% of the candle range).
 * Disabled when range is zero (doji).
 */
const jitter = (value: number, range: number, intensity = 0.04): number => {
  if (range < 1e-9) return value;
  return value + (Math.random() - 0.5) * 2 * range * intensity;
};

/**
 * Generate an array of partial (forming) candles that simulate the price path
 * through a single OHLCV bar.
 *
 * @param candle       The full OHLC candle to animate.
 * @param stepsPerPhase Tick resolution per phase (default 12 → 48 ticks total).
 * @param noisy         Whether to add micro-noise for realism (default true).
 * @returns             Ordered array of partial CandleData objects.
 */
export function generateTickPath(
  candle: CandleData,
  stepsPerPhase = 12,
  noisy = true,
): CandleData[] {
  const { time, open, high, low, close } = candle;
  const isBullish = close >= open;
  const range = high - low;

  // Determine intra-candle waypoints
  const wick1 = isBullish ? low  : high;   // first wick extreme
  const wick2 = isBullish ? high : low;    // second wick / main move

  const add = noisy
    ? (v: number) => jitter(v, range)
    : (v: number) => v;

  const ticks: CandleData[] = [];

  // ── Phase 1: Open → wick1 ─────────────────────────────────────────────────
  // The candle initially moves against its main direction (forms the first wick)
  for (let i = 1; i <= stepsPerPhase; i++) {
    const t   = i / stepsPerPhase;
    const cur = add(lerp(open, wick1, t));

    ticks.push({
      time,
      open,
      high: isBullish ? Math.max(open, cur) : Math.max(open, cur),
      low:  isBullish ? Math.min(open, cur) : Math.min(open, cur),
      close: cur,
    });
  }

  // ── Phase 2: wick1 → wick2 ────────────────────────────────────────────────
  // Main directional move — runs twice as long for emphasis
  for (let i = 1; i <= stepsPerPhase * 2; i++) {
    const t   = i / (stepsPerPhase * 2);
    const cur = add(lerp(wick1, wick2, t));

    ticks.push({
      time,
      open,
      high: isBullish ? Math.max(cur, ...(ticks.slice(-1).map(tc => tc.high))) : high,
      low:  isBullish ? low : Math.min(cur, ...(ticks.slice(-1).map(tc => tc.low))),
      close: cur,
    });
  }

  // ── Phase 3: wick2 → close ────────────────────────────────────────────────
  // Settle toward the closing price
  for (let i = 1; i <= stepsPerPhase; i++) {
    const t   = i / stepsPerPhase;
    const cur = add(lerp(wick2, close, t));

    ticks.push({ time, open, high, low, close: cur });
  }

  // ── Final tick: exact canonical OHLC ──────────────────────────────────────
  ticks.push({ time, open, high, low, close });

  return ticks;
}

/**
 * Run a full tick animation for a single candle via requestAnimationFrame.
 *
 * @param candle        The OHLC candle to animate.
 * @param durationMs    Total animation duration in milliseconds.
 * @param onTick        Called on each tick with the partial candle.
 * @param onComplete    Called when animation finishes with the final candle.
 * @param stepsPerPhase Tick resolution (default 10 → 40 ticks total).
 *
 * @returns cancelFn — call to abort the animation early.
 */
export function animateCandle(
  candle: CandleData,
  durationMs: number,
  onTick:     (partial: CandleData) => void,
  onComplete: (final:   CandleData) => void,
  stepsPerPhase = 10,
): () => void {
  const ticks   = generateTickPath(candle, stepsPerPhase);
  const total   = ticks.length;
  let   rafId   = 0;
  let   startTs = 0;
  let   cancelled = false;

  const step = (ts: number) => {
    if (cancelled) return;
    if (!startTs) startTs = ts;

    const elapsed  = ts - startTs;
    const progress = Math.min(elapsed / durationMs, 1);
    const idx      = Math.min(Math.floor(progress * total), total - 1);

    onTick(ticks[idx]);

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      onComplete(candle);
    }
  };

  rafId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
