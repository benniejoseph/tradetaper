export interface RequestMetric {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string | null;
}

export interface UsageEndpointStats {
  endpoint: string;
  count: number;
  avgResponseTime: number;
}

export interface UsageMethodStats {
  method: string;
  count: number;
  percentage: number;
}

export interface PerformanceBucket {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export class RequestMetricsStore {
  private static readonly maxEntries = 10_000;
  private static metrics: RequestMetric[] = [];

  static clear(): void {
    RequestMetricsStore.metrics = [];
  }

  static record(metric: RequestMetric): void {
    RequestMetricsStore.metrics.push({
      ...metric,
      path: RequestMetricsStore.normalizePath(metric.path),
    });

    const overflow = RequestMetricsStore.metrics.length - RequestMetricsStore.maxEntries;
    if (overflow > 0) {
      RequestMetricsStore.metrics.splice(0, overflow);
    }
  }

  static getMetricsSince(rangeMs: number): RequestMetric[] {
    const since = Date.now() - Math.max(rangeMs, 0);
    return RequestMetricsStore.metrics.filter((metric) => metric.timestamp >= since);
  }

  static buildUsageStats(rangeMs: number): {
    totalRequests: number;
    requestsByEndpoint: UsageEndpointStats[];
    requestsByMethod: UsageMethodStats[];
  } {
    const metrics = RequestMetricsStore.getMetricsSince(rangeMs);
    const totalRequests = metrics.length;

    const endpointBuckets = new Map<
      string,
      { count: number; totalDuration: number }
    >();
    const methodBuckets = new Map<string, number>();

    for (const metric of metrics) {
      const endpoint = endpointBuckets.get(metric.path) || {
        count: 0,
        totalDuration: 0,
      };
      endpoint.count += 1;
      endpoint.totalDuration += metric.durationMs;
      endpointBuckets.set(metric.path, endpoint);

      methodBuckets.set(metric.method, (methodBuckets.get(metric.method) || 0) + 1);
    }

    const requestsByEndpoint = [...endpointBuckets.entries()]
      .map(([endpoint, value]) => ({
        endpoint,
        count: value.count,
        avgResponseTime:
          value.count > 0 ? Math.round((value.totalDuration / value.count) * 100) / 100 : 0,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 25);

    const requestsByMethod = [...methodBuckets.entries()]
      .map(([method, count]) => ({
        method,
        count,
        percentage:
          totalRequests > 0
            ? Math.round((count / totalRequests) * 10_000) / 100
            : 0,
      }))
      .sort((left, right) => right.count - left.count);

    return {
      totalRequests,
      requestsByEndpoint,
      requestsByMethod,
    };
  }

  static buildPerformanceSeries(
    rangeMs: number,
    bucketCount: number = 12,
  ): PerformanceBucket[] {
    const cappedRangeMs = Math.max(rangeMs, 60_000);
    const metrics = RequestMetricsStore.getMetricsSince(cappedRangeMs);
    const now = Date.now();
    const clampedBucketCount = Math.min(Math.max(bucketCount, 6), 60);
    const bucketMs = Math.max(Math.floor(cappedRangeMs / clampedBucketCount), 1_000);

    const buckets = new Map<
      number,
      { count: number; totalDuration: number; errorCount: number }
    >();

    for (const metric of metrics) {
      const bucketStart =
        now - Math.floor((now - metric.timestamp) / bucketMs) * bucketMs;
      const bucket = buckets.get(bucketStart) || {
        count: 0,
        totalDuration: 0,
        errorCount: 0,
      };

      bucket.count += 1;
      bucket.totalDuration += metric.durationMs;
      if (metric.statusCode >= 500) {
        bucket.errorCount += 1;
      }
      buckets.set(bucketStart, bucket);
    }

    const series: PerformanceBucket[] = [];
    for (let i = clampedBucketCount - 1; i >= 0; i -= 1) {
      const bucketStart = now - i * bucketMs;
      const bucket = buckets.get(bucketStart) || {
        count: 0,
        totalDuration: 0,
        errorCount: 0,
      };
      const responseTime =
        bucket.count > 0
          ? Math.round((bucket.totalDuration / bucket.count) * 100) / 100
          : 0;
      const errorRate =
        bucket.count > 0
          ? Math.round((bucket.errorCount / bucket.count) * 10_000) / 100
          : 0;

      series.push({
        timestamp: new Date(bucketStart).toISOString(),
        responseTime,
        throughput: bucket.count,
        errorRate,
      });
    }

    return series;
  }

  static getRecentLogs(rangeMs: number): Array<{
    level: 'error' | 'warn' | 'info';
    message: string;
    timestamp: string;
    method: string;
    endpoint: string;
    statusCode: number;
    responseTime: number;
  }> {
    const metrics = RequestMetricsStore.getMetricsSince(rangeMs);
    return metrics
      .slice()
      .sort((left, right) => right.timestamp - left.timestamp)
      .map((metric) => ({
        level:
          metric.statusCode >= 500
            ? 'error'
            : metric.statusCode >= 400
              ? 'warn'
              : 'info',
        message: `${metric.method} ${metric.path} -> ${metric.statusCode} (${metric.durationMs}ms)`,
        timestamp: new Date(metric.timestamp).toISOString(),
        method: metric.method,
        endpoint: metric.path,
        statusCode: metric.statusCode,
        responseTime: metric.durationMs,
      }));
  }

  private static normalizePath(path: string): string {
    const withoutQuery = path.split('?')[0] || '/';
    const normalized = withoutQuery
      .replace(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
        ':uuid',
      )
      .replace(/\/\d+(?=\/|$)/g, '/:id');
    return normalized || '/';
  }
}
