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
import { UsersModule } from '../users/users.module';
import { WebSocketGatewayModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Tag]),
    forwardRef(() => UsersModule),
    forwardRef(() => WebSocketGatewayModule),
  ],
  providers: [
    TradesService,
    ExportService,
    PerformanceService,
    AdvancedAnalyticsService,
  ],
  controllers: [TradesController],
  exports: [
    TradesService,
    ExportService,
    PerformanceService,
    AdvancedAnalyticsService,
  ],
})
export class TradesModule {}
