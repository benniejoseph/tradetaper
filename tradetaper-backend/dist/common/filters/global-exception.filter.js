"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../services/logger.service");
const config_1 = require("@nestjs/config");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    productionLogger;
    configService;
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    constructor(productionLogger, configService) {
        this.productionLogger = productionLogger;
        this.configService = configService;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = this.generateRequestId();
        const { statusCode, message, error } = this.getErrorDetails(exception);
        const errorContext = {
            userId: request.user?.id,
            requestId,
            endpoint: request.url,
            method: request.method,
            userAgent: request.get('User-Agent'),
            ip: request.ip || request.connection.remoteAddress,
            timestamp: new Date().toISOString(),
            stack: exception instanceof Error ? exception.stack : undefined,
        };
        this.logError(exception, errorContext, statusCode);
        const errorResponse = {
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: this.sanitizeErrorMessage(message, statusCode),
            requestId,
        };
        if (this.configService.get('NODE_ENV') !== 'production') {
            errorResponse.error = error;
            errorResponse.details = this.getErrorDetails(exception);
        }
        response.status(statusCode).json(errorResponse);
    }
    getErrorDetails(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            return {
                statusCode: status,
                message: typeof response === 'string'
                    ? response
                    : response.message || exception.message,
                error: exception.name,
            };
        }
        if (exception instanceof Error) {
            if (exception.message.includes('ECONNREFUSED') ||
                exception.message.includes('ENOTFOUND')) {
                return {
                    statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
                    message: 'Database connection error',
                    error: 'DatabaseConnectionError',
                };
            }
            if (exception.message.includes('jwt') ||
                exception.message.includes('token')) {
                return {
                    statusCode: common_1.HttpStatus.UNAUTHORIZED,
                    message: 'Authentication failed',
                    error: 'AuthenticationError',
                };
            }
            if (exception.message.includes('validation') ||
                exception.message.includes('ValidationError')) {
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Invalid input data',
                    error: 'ValidationError',
                };
            }
            if (exception.message.includes('Stripe') ||
                exception.message.includes('stripe')) {
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Payment processing error',
                    error: 'PaymentError',
                };
            }
            return {
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: exception.message,
                error: exception.name,
            };
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
            error: 'UnknownError',
        };
    }
    logError(exception, errorContext, statusCode) {
        const message = exception instanceof Error ? exception.message : 'Unknown error occurred';
        const stack = exception instanceof Error ? exception.stack : undefined;
        if (statusCode >= 500) {
            this.productionLogger.error(`Server Error: ${message}`, stack, 'GlobalExceptionFilter', errorContext);
        }
        else if (statusCode >= 400) {
            this.productionLogger.warn(`Client Error: ${message}`, 'GlobalExceptionFilter', { errorContext, statusCode });
        }
        else {
            this.productionLogger.log(`Error: ${message}`, 'GlobalExceptionFilter', {
                errorContext,
                statusCode,
            });
        }
        if (statusCode === common_1.HttpStatus.UNAUTHORIZED ||
            statusCode === common_1.HttpStatus.FORBIDDEN) {
            this.productionLogger.logSecurityEvent(`${statusCode} error on ${errorContext.endpoint}`, errorContext.userId, errorContext.ip, errorContext.userAgent, 'medium');
        }
    }
    sanitizeErrorMessage(message, statusCode) {
        if (this.configService.get('NODE_ENV') === 'production') {
            switch (statusCode) {
                case common_1.HttpStatus.INTERNAL_SERVER_ERROR:
                    return 'An unexpected error occurred. Please try again later.';
                case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                    return 'Service temporarily unavailable. Please try again later.';
                case common_1.HttpStatus.BAD_GATEWAY:
                    return 'Service communication error. Please try again later.';
                case common_1.HttpStatus.GATEWAY_TIMEOUT:
                    return 'Request timeout. Please try again later.';
                default:
                    return message;
            }
        }
        return message;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [logger_service_1.ProductionLoggerService,
        config_1.ConfigService])
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map