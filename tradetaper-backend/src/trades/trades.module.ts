// src/trades/trades.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { TradesService } from './trades.service';
import { GeminiVisionService } from '../notes/gemini-vision.service';
import { TradesController } from './trades.controller';
import { UsersModule } from '../users/users.module';
import { TagsModule } from '../tags/tags.module';
import { TradeJournalSyncService } from './services/trade-journal-sync.service';
import { Note } from '../notes/entities/note.entity';

import { TradeCandle } from './entities/trade-candle.entity';

import { TerminalFarmModule } from '../terminal-farm/terminal-farm.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Note, TradeCandle]),
    forwardRef(() => UsersModule),
    forwardRef(() => TerminalFarmModule),
    TagsModule,
    SubscriptionsModule,
  ],
  providers: [TradesService, GeminiVisionService, TradeJournalSyncService],
  controllers: [TradesController],
  exports: [TradesService, TradeJournalSyncService],
})
export class TradesModule {}
