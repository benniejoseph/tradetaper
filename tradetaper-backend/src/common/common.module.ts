import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductionLoggerService } from './services/logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { CsrfController } from './controllers/csrf.controller';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [CsrfController],
  providers: [
    ProductionLoggerService,
    GlobalExceptionFilter,
    LoggingInterceptor,
    RateLimitGuard,
  ],
  exports: [
    ProductionLoggerService,
    GlobalExceptionFilter,
    LoggingInterceptor,
    RateLimitGuard,
  ],
})
export class CommonModule {}
