// src/trades/trades.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity'; // Import Tag
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
// UsersModule might not be strictly needed here anymore if not directly used by controller/service
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Tag]), // Add Tag here
    UsersModule,
  ],
  providers: [TradesService],
  controllers: [TradesController],
  exports: [TradesService],
})
export class TradesModule {}
