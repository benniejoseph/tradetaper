interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of events to track
  maxMetrics: number; // Maximum number of metrics to store
  reportInterval: number; // Interval in ms to report metrics
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private config: PerformanceConfig;
  private reportTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      sampleRate: 0.1, // Track 10% of events by default
      maxMetrics: 1000,
      reportInterval: 60000, // Report every minute
      ...config,
    };

    if (this.config.enabled) {
      this.startReporting();
      this.setupWebVitalsTracking();
    }
  }

  // Track a timing metric (e.g., API response time, component render time)
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    if (!this.shouldSample()) return;

    this.addMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      type: 'timing',
      tags,
    });
  }

  // Track a counter metric (e.g., button clicks, API calls)
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.shouldSample()) return;

    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'counter',
      tags,
    });
  }

  // Track a gauge metric (e.g., memory usage, active connections)
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.shouldSample()) return;

    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'gauge',
      tags,
    });
  }

  // Measure execution time of a function
  async measure<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.timing(name, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.timing(name, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  // Measure execution time of a synchronous function
  measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.timing(name, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.timing(name, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  // Track page load performance
  trackPageLoad(pageName: string): void {
    if (typeof window === 'undefined') return;

    // Track navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.timing('page.load.total', navigation.loadEventEnd - navigation.fetchStart, { page: pageName });
      this.timing('page.load.dom', navigation.domContentLoadedEventEnd - navigation.fetchStart, { page: pageName });
      this.timing('page.load.first_byte', navigation.responseStart - navigation.fetchStart, { page: pageName });
    }

    // Track resource loading
    const resources = performance.getEntriesByType('resource');
    const totalResourceTime = resources.reduce((sum, resource) => sum + resource.duration, 0);
    this.timing('page.resources.total', totalResourceTime, { page: pageName, count: resources.length.toString() });
  }

  // Track API call performance
  trackApiCall(method: string, endpoint: string, duration: number, status: number): void {
    this.timing('api.request.duration', duration, {
      method,
      endpoint: endpoint.replace(/\/\d+/g, '/:id'), // Normalize IDs in URLs
      status: status.toString(),
      success: status < 400 ? 'true' : 'false',
    });

    this.increment('api.request.count', 1, {
      method,
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      status: status.toString(),
    });
  }

  // Track user interactions
  trackUserAction(action: string, component: string, metadata?: Record<string, string>): void {
    this.increment('user.action', 1, {
      action,
      component,
      ...metadata,
    });
  }

  // Track errors
  trackError(error: Error, context?: string, metadata?: Record<string, string>): void {
    this.increment('error.count', 1, {
      type: error.name,
      context: context || 'unknown',
      message: error.message.substring(0, 100), // Truncate long messages
      ...metadata,
    });
  }

  // Get current metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Get aggregated metrics for reporting
  getAggregatedMetrics(): Record<string, {
    name: string;
    type: string;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    tags: Record<string, string>;
  }> {
    const aggregated: Record<string, {
      name: string;
      type: string;
      count: number;
      sum: number;
      min: number;
      max: number;
      avg: number;
      tags: Record<string, string>;
    }> = {};

    this.metrics.forEach(metric => {
      const key = `${metric.name}.${metric.type}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          name: metric.name,
          type: metric.type,
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
          tags: metric.tags || {},
        };
      }

      const agg = aggregated[key];
      agg.count++;
      agg.sum += metric.value;
      agg.min = Math.min(agg.min, metric.value);
      agg.max = Math.max(agg.max, metric.value);
      agg.avg = agg.sum / agg.count;
    });

    return aggregated;
  }

  private shouldSample(): boolean {
    return this.config.enabled && Math.random() < this.config.sampleRate;
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep metrics array size under control
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }
  }

  private startReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  private reportMetrics(): void {
    if (this.metrics.length === 0) return;

    const aggregated = this.getAggregatedMetrics();
    
    // In a real application, you would send these metrics to your monitoring service
    console.group('Performance Metrics Report');
    console.table(aggregated);
    console.groupEnd();

    // Clear metrics after reporting
    this.clearMetrics();
  }

  private setupWebVitalsTracking(): void {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals when available
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.timing('web_vitals.lcp', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const eventEntry = entry as PerformanceEventTiming;
          if (eventEntry.processingStart !== undefined) {
            this.timing('web_vitals.fid', eventEntry.processingStart - eventEntry.startTime);
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (layoutEntry.value !== undefined && !layoutEntry.hadRecentInput) {
            this.gauge('web_vitals.cls', layoutEntry.value);
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
    this.clearMetrics();
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions for common use cases
export const trackPageLoad = (pageName: string) => performanceMonitor.trackPageLoad(pageName);
export const trackApiCall = (method: string, endpoint: string, duration: number, status: number) => 
  performanceMonitor.trackApiCall(method, endpoint, duration, status);
export const trackUserAction = (action: string, component: string, metadata?: Record<string, string>) => 
  performanceMonitor.trackUserAction(action, component, metadata);
export const trackError = (error: Error, context?: string, metadata?: Record<string, string>) => 
  performanceMonitor.trackError(error, context, metadata);
export const measure = <T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>) => 
  performanceMonitor.measure(name, fn, tags);
export const measureSync = <T>(name: string, fn: () => T, tags?: Record<string, string>) => 
  performanceMonitor.measureSync(name, fn, tags);

export default performanceMonitor; 