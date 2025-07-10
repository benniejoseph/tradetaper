import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ProductionLoggerService } from '../services/logger.service';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: ProductionLoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
