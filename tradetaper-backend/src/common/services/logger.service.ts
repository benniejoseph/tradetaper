import { Injectable, Logger as NestLogger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  stack?: string;
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: string;
  details?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class ProductionLoggerService implements LoggerService {
  private readonly logger = new NestLogger(ProductionLoggerService.name);
  private readonly isProduction: boolean;
  private readonly enableDebugLogs: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    this.enableDebugLogs = configService.get<string>('DEBUG') === 'true';
  }

  /**
   * Log error with enhanced context for production debugging
   */
  error(message: string, stack?: string, context?: string, errorContext?: ErrorContext): void {
    const logEntry: LogEntry = {
      level: 'error',
      message,
      context: context || 'Application',
      details: {
        stack,
        errorContext,
        environment: this.configService.get<string>('NODE_ENV'),
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // In production, format logs for better parsing
    if (this.isProduction) {
      console.error(JSON.stringify(logEntry));
    } else {
      this.logger.error(message, stack, context);
    }

    // In a real production environment, you might also:
    // - Send to external logging service (e.g., Sentry, LogRocket)
    // - Store in database for analysis
    // - Send alerts for critical errors
  }

  /**
   * Log warning with context
   */
  warn(message: string, context?: string, details?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level: 'warn',
      message,
      context: context || 'Application',
      details,
      timestamp: new Date().toISOString(),
    };

    if (this.isProduction) {
      console.warn(JSON.stringify(logEntry));
    } else {
      this.logger.warn(message, context);
    }
  }

  /**
   * Log info message
   */
  log(message: string, context?: string, details?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level: 'info',
      message,
      context: context || 'Application',
      details,
      timestamp: new Date().toISOString(),
    };

    if (this.isProduction) {
      console.log(JSON.stringify(logEntry));
    } else {
      this.logger.log(message, context);
    }
  }

  /**
   * Log debug message (only in development or when explicitly enabled)
   */
  debug(message: string, context?: string, details?: Record<string, any>): void {
    if (!this.isProduction || this.enableDebugLogs) {
      const logEntry: LogEntry = {
        level: 'debug',
        message,
        context: context || 'Application',
        details,
        timestamp: new Date().toISOString(),
      };

      if (this.isProduction) {
        console.debug(JSON.stringify(logEntry));
      } else {
        this.logger.debug(message, context);
      }
    }
  }

  /**
   * Log verbose message (development only)
   */
  verbose(message: string, context?: string): void {
    if (!this.isProduction) {
      this.logger.verbose(message, context);
    }
  }

  /**
   * Log API request/response for debugging
   */
  logApiCall(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string,
    error?: Error,
  ): void {
    const details = {
      method,
      endpoint,
      statusCode,
      duration: `${duration}ms`,
      userId,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`;

    switch (level) {
      case 'error':
        this.error(message, error?.stack, 'ApiCall', { endpoint, method, userId });
        break;
      case 'warn':
        this.warn(message, 'ApiCall', details);
        break;
      default:
        this.log(message, 'ApiCall', details);
    }
  }

  /**
   * Log database operations for debugging
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    recordCount?: number,
    error?: Error,
  ): void {
    const details = {
      operation,
      table,
      duration: `${duration}ms`,
      recordCount,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    const message = `DB ${operation} on ${table} - ${recordCount || 0} records (${duration}ms)`;

    if (error) {
      this.error(message, error.stack, 'Database');
    } else {
      this.debug(message, 'Database', details);
    }
  }

  /**
   * Log business logic errors with context
   */
  logBusinessError(
    operation: string,
    userId: string,
    error: Error,
    additionalContext?: Record<string, any>,
  ): void {
    const errorContext: ErrorContext = {
      userId,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      ...additionalContext,
    };

    this.error(
      `Business logic error in ${operation}: ${error.message}`,
      error.stack,
      'Business',
      errorContext,
    );
  }

  /**
   * Log security-related events
   */
  logSecurityEvent(
    event: string,
    userId?: string,
    ip?: string,
    userAgent?: string,
    severity: 'low' | 'medium' | 'high' = 'medium',
  ): void {
    const details = {
      event,
      userId,
      ip,
      userAgent,
      severity,
      timestamp: new Date().toISOString(),
    };

    const message = `Security event: ${event}`;

    if (severity === 'high') {
      this.error(message, undefined, 'Security', details);
    } else if (severity === 'medium') {
      this.warn(message, 'Security', details);
    } else {
      this.log(message, 'Security', details);
    }
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    const details = {
      operation,
      duration: `${duration}ms`,
      ...metadata,
      timestamp: new Date().toISOString(),
    };

    const message = `Performance: ${operation} took ${duration}ms`;

    // Log as warning if operation took longer than 5 seconds
    if (duration > 5000) {
      this.warn(message, 'Performance', details);
    } else {
      this.debug(message, 'Performance', details);
    }
  }
}