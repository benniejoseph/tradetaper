// src/trades/trades.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity'; // Import Tag
import { TradesService } from './trades.service';
import { ExportService } from './export.service';
import { PerformanceService } from './performance.service';
import { TradesController } from './trades.controller';
import { TradesGateway } from '../websocket/trades.gateway';
// UsersModule might not be strictly needed here anymore if not directly used by controller/service
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Tag]), // Add Tag here
    UsersModule,
  ],
  providers: [TradesService, ExportService, PerformanceService, TradesGateway],
  controllers: [TradesController],
  exports: [TradesService, ExportService, PerformanceService, TradesGateway],
})
export class TradesModule {}
