import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ProductionLoggerService } from '../services/logger.service';
import { RequestMetricsStore } from '../services/request-metrics.store';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: ProductionLoggerService) {}

  private getResponseSizeBytes(data: unknown): number {
    if (data === null || data === undefined) {
      return 0;
    }

    if (Buffer.isBuffer(data)) {
      return data.length;
    }

    if (typeof data === 'string') {
      return Buffer.byteLength(data);
    }

    try {
      const serialized = JSON.stringify(data);
      if (typeof serialized !== 'string') {
        return 0;
      }
      return Buffer.byteLength(serialized);
    } catch {
      return 0;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const userId = (request as any).user?.id;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          const metricPath = request.originalUrl || url;

          RequestMetricsStore.record({
            timestamp: Date.now(),
            method,
            path: metricPath,
            statusCode,
            durationMs: duration,
            userId: userId || null,
          });

          // Log API call
          this.logger.logApiCall(method, url, statusCode, duration, userId);

          // Log performance metrics for slow requests
          if (duration > 1000) {
            this.logger.logPerformanceMetric(`${method} ${url}`, duration, {
              userId,
              statusCode,
              ip,
              userAgent,
              responseSize: this.getResponseSizeBytes(data),
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          const metricPath = request.originalUrl || url;

          RequestMetricsStore.record({
            timestamp: Date.now(),
            method,
            path: metricPath,
            statusCode,
            durationMs: duration,
            userId: userId || null,
          });

          // Log failed API call
          this.logger.logApiCall(
            method,
            url,
            statusCode,
            duration,
            userId,
            error,
          );

          // Log security events for authentication failures
          if (statusCode === 401 || statusCode === 403) {
            this.logger.logSecurityEvent(
              `Authentication failure on ${url}`,
              userId,
              ip,
              userAgent,
              'medium',
            );
          }
        },
      }),
    );
  }
}
