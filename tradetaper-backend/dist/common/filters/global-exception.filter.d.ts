import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { ProductionLoggerService } from '../services/logger.service';
import { ConfigService } from '@nestjs/config';
export interface ErrorResponse {
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    message: string;
    error?: string;
    details?: Record<string, unknown>;
    requestId?: string;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly productionLogger;
    private readonly configService;
    private readonly logger;
    constructor(productionLogger: ProductionLoggerService, configService: ConfigService);
    catch(exception: unknown, host: ArgumentsHost): void;
    private getErrorDetails;
    private logError;
    private sanitizeErrorMessage;
    private generateRequestId;
}
