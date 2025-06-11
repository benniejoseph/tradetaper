import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductionLoggerService } from './services/logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ProductionLoggerService,
    GlobalExceptionFilter,
    LoggingInterceptor,
  ],
  exports: [
    ProductionLoggerService,
    GlobalExceptionFilter,
    LoggingInterceptor,
  ],
})
export class CommonModule {}