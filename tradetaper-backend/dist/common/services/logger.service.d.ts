import { LoggerService } from '@nestjs/common';
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
export declare class ProductionLoggerService implements LoggerService {
    private configService;
    private readonly logger;
    private readonly isProduction;
    private readonly enableDebugLogs;
    constructor(configService: ConfigService);
    error(message: string, stack?: string, context?: string, errorContext?: ErrorContext): void;
    warn(message: string, context?: string, details?: Record<string, any>): void;
    log(message: string, context?: string, details?: Record<string, any>): void;
    debug(message: string, context?: string, details?: Record<string, any>): void;
    verbose(message: string, context?: string): void;
    logApiCall(method: string, endpoint: string, statusCode: number, duration: number, userId?: string, error?: Error): void;
    logDatabaseOperation(operation: string, table: string, duration: number, recordCount?: number, error?: Error): void;
    logBusinessError(operation: string, userId: string, error: Error, additionalContext?: Record<string, any>): void;
    logSecurityEvent(event: string, userId?: string, ip?: string, userAgent?: string, severity?: 'low' | 'medium' | 'high'): void;
    logPerformanceMetric(operation: string, duration: number, metadata?: Record<string, any>): void;
}
