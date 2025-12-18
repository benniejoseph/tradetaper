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
var ProductionLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionLoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ProductionLoggerService = ProductionLoggerService_1 = class ProductionLoggerService {
    configService;
    logger = new common_1.Logger(ProductionLoggerService_1.name);
    isProduction;
    enableDebugLogs;
    constructor(configService) {
        this.configService = configService;
        this.isProduction = configService.get('NODE_ENV') === 'production';
        this.enableDebugLogs = configService.get('DEBUG') === 'true';
    }
    error(message, stack, context, errorContext) {
        const logEntry = {
            level: 'error',
            message,
            context: context || 'Application',
            details: {
                stack,
                errorContext,
                environment: this.configService.get('NODE_ENV'),
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
        };
        if (this.isProduction) {
            console.error(JSON.stringify(logEntry));
        }
        else {
            this.logger.error(message, stack, context);
        }
    }
    warn(message, context, details) {
        const logEntry = {
            level: 'warn',
            message,
            context: context || 'Application',
            details,
            timestamp: new Date().toISOString(),
        };
        if (this.isProduction) {
            console.warn(JSON.stringify(logEntry));
        }
        else {
            this.logger.warn(message, context);
        }
    }
    log(message, context, details) {
        const logEntry = {
            level: 'info',
            message,
            context: context || 'Application',
            details,
            timestamp: new Date().toISOString(),
        };
        if (this.isProduction) {
            console.log(JSON.stringify(logEntry));
        }
        else {
            this.logger.log(message, context);
        }
    }
    debug(message, context, details) {
        if (!this.isProduction || this.enableDebugLogs) {
            const logEntry = {
                level: 'debug',
                message,
                context: context || 'Application',
                details,
                timestamp: new Date().toISOString(),
            };
            if (this.isProduction) {
                console.debug(JSON.stringify(logEntry));
            }
            else {
                this.logger.debug(message, context);
            }
        }
    }
    verbose(message, context) {
        if (!this.isProduction) {
            this.logger.verbose(message, context);
        }
    }
    logApiCall(method, endpoint, statusCode, duration, userId, error) {
        const details = {
            method,
            endpoint,
            statusCode,
            duration: `${duration}ms`,
            userId,
            error: error
                ? {
                    message: error.message,
                    stack: error.stack,
                }
                : undefined,
        };
        const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
        const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`;
        switch (level) {
            case 'error':
                this.error(message, error?.stack, 'ApiCall', {
                    endpoint,
                    method,
                    userId,
                });
                break;
            case 'warn':
                this.warn(message, 'ApiCall', details);
                break;
            default:
                this.log(message, 'ApiCall', details);
        }
    }
    logDatabaseOperation(operation, table, duration, recordCount, error) {
        const details = {
            operation,
            table,
            duration: `${duration}ms`,
            recordCount,
            error: error
                ? {
                    message: error.message,
                    stack: error.stack,
                }
                : undefined,
        };
        const message = `DB ${operation} on ${table} - ${recordCount || 0} records (${duration}ms)`;
        if (error) {
            this.error(message, error.stack, 'Database');
        }
        else {
            this.debug(message, 'Database', details);
        }
    }
    logBusinessError(operation, userId, error, additionalContext) {
        const errorContext = {
            userId,
            timestamp: new Date().toISOString(),
            stack: error.stack,
            ...additionalContext,
        };
        this.error(`Business logic error in ${operation}: ${error.message}`, error.stack, 'Business', errorContext);
    }
    logSecurityEvent(event, userId, ip, userAgent, severity = 'medium') {
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
        }
        else if (severity === 'medium') {
            this.warn(message, 'Security', details);
        }
        else {
            this.log(message, 'Security', details);
        }
    }
    logPerformanceMetric(operation, duration, metadata) {
        const details = {
            operation,
            duration: `${duration}ms`,
            ...metadata,
            timestamp: new Date().toISOString(),
        };
        const message = `Performance: ${operation} took ${duration}ms`;
        if (duration > 5000) {
            this.warn(message, 'Performance', details);
        }
        else {
            this.debug(message, 'Performance', details);
        }
    }
};
exports.ProductionLoggerService = ProductionLoggerService;
exports.ProductionLoggerService = ProductionLoggerService = ProductionLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProductionLoggerService);
//# sourceMappingURL=logger.service.js.map