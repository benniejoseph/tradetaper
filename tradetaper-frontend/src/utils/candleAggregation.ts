import { CandlestickData, UTCTimestamp } from 'lightweight-charts';

/**
 * Aggregate candles from one timeframe to another
 * @param candles - Array of candles to aggregate
 * @param targetTimeframe - Target timeframe ('1m', '5m', '15m', '30m', '1h', '4h', '1d')
 * @returns Aggregated candles
 */
export function aggregateCandles(
  candles: CandlestickData[],
  targetTimeframe: string
): CandlestickData[] {
  if (candles.length === 0) return [];

  const intervalMap: Record<string, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
  };

  const interval = intervalMap[targetTimeframe] || 1;
  if (interval === 1) return candles;

  const aggregated: CandlestickData[] = [];
  let bucket: CandlestickData[] = [];
  let bucketStartTime: number | null = null;

  for (const candle of candles) {
    const candleTime = candle.time as number;
    const candleMinute = Math.floor(candleTime / 60) * 60;
    const bucketTime = Math.floor(candleMinute / (interval * 60)) * (interval * 60);

    if (bucketStartTime === null) {
      bucketStartTime = bucketTime;
    }

    if (bucketTime === bucketStartTime) {
      bucket.push(candle);
    } else {
      if (bucket.length > 0) {
        aggregated.push({
          time: bucketStartTime as UTCTimestamp,
          open: bucket[0].open,
          high: Math.max(...bucket.map((c) => c.high)),
          low: Math.min(...bucket.map((c) => c.low)),
          close: bucket[bucket.length - 1].close,
        });
      }
      bucket = [candle];
      bucketStartTime = bucketTime;
    }
  }

  // Add the last bucket
  if (bucket.length > 0 && bucketStartTime !== null) {
    aggregated.push({
      time: bucketStartTime as UTCTimestamp,
      open: bucket[0].open,
      high: Math.max(...bucket.map((c) => c.high)),
      low: Math.min(...bucket.map((c) => c.low)),
      close: bucket[bucket.length - 1].close,
    });
  }

  return aggregated;
}

/**
 * Convert timeframe string to minutes
 */
export function timeframeToMinutes(timeframe: string): number {
  const map: Record<string, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
    '1w': 10080,
  };
  return map[timeframe] || 1;
}

/**
 * Check if aggregation is possible
 * @param sourceTimeframe - Source timeframe
 * @param targetTimeframe - Target timeframe
 * @returns true if target is larger than source
 */
export function canAggregate(
  sourceTimeframe: string,
  targetTimeframe: string
): boolean {
  return timeframeToMinutes(targetTimeframe) > timeframeToMinutes(sourceTimeframe);
}
