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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: ProductionLoggerService) {}

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

          // Log API call
          this.logger.logApiCall(
            method,
            url,
            statusCode,
            duration,
            userId,
          );

          // Log performance metrics for slow requests
          if (duration > 1000) {
            this.logger.logPerformanceMetric(
              `${method} ${url}`,
              duration,
              {
                userId,
                statusCode,
                ip,
                userAgent,
                responseSize: JSON.stringify(data).length,
              },
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

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