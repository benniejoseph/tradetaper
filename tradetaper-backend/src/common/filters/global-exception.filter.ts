import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProductionLoggerService, ErrorContext } from '../services/logger.service';
import { ConfigService } from '@nestjs/config';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: any;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly productionLogger: ProductionLoggerService,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate request ID for tracking
    const requestId = this.generateRequestId();

    // Determine status code and message
    const { statusCode, message, error } = this.getErrorDetails(exception);

    // Create error context for logging
    const errorContext: ErrorContext = {
      userId: (request as any).user?.id,
      requestId,
      endpoint: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: request.ip || request.connection.remoteAddress,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    // Log the error with context
    this.logError(exception, errorContext, statusCode);

    // Create response
    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.sanitizeErrorMessage(message, statusCode),
      requestId,
    };

    // Add error details in development
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      errorResponse.error = error;
      errorResponse.details = this.getErrorDetails(exception);
    }

    // Send response
    response.status(statusCode).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      return {
        statusCode: status,
        message: typeof response === 'string' ? response : (response as any).message || exception.message,
        error: exception.name,
      };
    }

    // Handle specific error types
    if (exception instanceof Error) {
      // Database connection errors
      if (exception.message.includes('ECONNREFUSED') || exception.message.includes('ENOTFOUND')) {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database connection error',
          error: 'DatabaseConnectionError',
        };
      }

      // JWT errors
      if (exception.message.includes('jwt') || exception.message.includes('token')) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Authentication failed',
          error: 'AuthenticationError',
        };
      }

      // Validation errors
      if (exception.message.includes('validation') || exception.message.includes('ValidationError')) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input data',
          error: 'ValidationError',
        };
      }

      // Stripe errors
      if (exception.message.includes('Stripe') || exception.message.includes('stripe')) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Payment processing error',
          error: 'PaymentError',
        };
      }

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        error: exception.name,
      };
    }

    // Unknown error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'UnknownError',
    };
  }

  private logError(exception: unknown, errorContext: ErrorContext, statusCode: number): void {
    const message = exception instanceof Error ? exception.message : 'Unknown error occurred';
    const stack = exception instanceof Error ? exception.stack : undefined;

    // Log different levels based on status code
    if (statusCode >= 500) {
      // Server errors - log as error
      this.productionLogger.error(
        `Server Error: ${message}`,
        stack,
        'GlobalExceptionFilter',
        errorContext,
      );
    } else if (statusCode >= 400) {
      // Client errors - log as warning
      this.productionLogger.warn(
        `Client Error: ${message}`,
        'GlobalExceptionFilter',
        { errorContext, statusCode },
      );
    } else {
      // Other errors - log as info
      this.productionLogger.log(
        `Error: ${message}`,
        'GlobalExceptionFilter',
        { errorContext, statusCode },
      );
    }

    // Log security events for authentication/authorization failures
    if (statusCode === HttpStatus.UNAUTHORIZED || statusCode === HttpStatus.FORBIDDEN) {
      this.productionLogger.logSecurityEvent(
        `${statusCode} error on ${errorContext.endpoint}`,
        errorContext.userId,
        errorContext.ip,
        errorContext.userAgent,
        'medium',
      );
    }
  }

  private sanitizeErrorMessage(message: string, statusCode: number): string {
    // In production, don't expose sensitive error details to clients
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      switch (statusCode) {
        case HttpStatus.INTERNAL_SERVER_ERROR:
          return 'An unexpected error occurred. Please try again later.';
        case HttpStatus.SERVICE_UNAVAILABLE:
          return 'Service temporarily unavailable. Please try again later.';
        case HttpStatus.BAD_GATEWAY:
          return 'Service communication error. Please try again later.';
        case HttpStatus.GATEWAY_TIMEOUT:
          return 'Request timeout. Please try again later.';
        default:
          return message;
      }
    }

    return message;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}