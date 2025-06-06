// src/trades/trades.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TradesService } from './trades.service';
import { ExportService } from './export.service';
import { PerformanceService } from './performance.service';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { TradesController } from './trades.controller';
import { TradesGateway } from '../websocket/trades.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Tag]), // Add Tag here
    forwardRef(() => UsersModule),
  ],
  providers: [TradesService, ExportService, PerformanceService, AdvancedAnalyticsService, TradesGateway],
  controllers: [TradesController],
  exports: [TradesService, ExportService, PerformanceService, AdvancedAnalyticsService, TradesGateway],
})
export class TradesModule {}
