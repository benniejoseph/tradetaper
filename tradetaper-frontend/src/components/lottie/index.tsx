'use client';

import LottieAnimation from './LottieAnimation';

export { default as LottieAnimation } from './LottieAnimation';

/** Pulsing candlesticks - use wherever trading data is loading. */
export function CandleLoader({
  size = 96,
  label = 'Loading…',
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2"
      style={{ width: size, height: size }}
    >
      <LottieAnimation src="/lottie/candle-loader.json" ariaLabel={label} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Self-drawing chart line - for empty states ("no trades yet"). */
export function EmptyChartAnimation({ size = 180 }: { size?: number }) {
  return (
    <div className="mx-auto" style={{ width: size, height: size }}>
      <LottieAnimation src="/lottie/empty-chart.json" ariaLabel="No data yet" />
    </div>
  );
}

/** One-shot celebration for a profitable trade / completed journal entry. */
export function TradeWinAnimation({
  size = 140,
  onComplete,
}: {
  size?: number;
  onComplete?: () => void;
}) {
  return (
    <div style={{ width: size, height: size }}>
      <LottieAnimation
        src="/lottie/trade-win.json"
        loop={false}
        onComplete={onComplete}
        ariaLabel="Trade logged"
      />
    </div>
  );
}

/** Flickering flame for journaling streaks. */
export function StreakFlame({ size = 28 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <LottieAnimation
        src="/lottie/streak-flame.json"
        ariaLabel="Journaling streak"
      />
    </div>
  );
}
