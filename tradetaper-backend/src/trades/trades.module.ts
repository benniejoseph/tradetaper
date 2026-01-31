// src/trades/trades.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { TradesService } from './trades.service';
import { GeminiVisionService } from '../notes/gemini-vision.service';
import { TradesController } from './trades.controller';
import { UsersModule } from '../users/users.module';
import { TagsModule } from '../tags/tags.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TradeJournalSyncService } from './services/trade-journal-sync.service';
import { Note } from '../notes/entities/note.entity';
// import { WebSocketGatewayModule } from '../websocket/websocket.module';

import { TradeCandle } from './entities/trade-candle.entity';

import { YahooFinanceService } from '../integrations/yahoo-finance/yahoo-finance.service';
import { MassiveService } from '../integrations/massive/massive.service';
import { TerminalFarmModule } from '../terminal-farm/terminal-farm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Note, TradeCandle]),
    forwardRef(() => UsersModule),
    forwardRef(() => TerminalFarmModule),
    TagsModule,
    // WebSocketGatewayModule,
    CacheModule.register({
      ttl: 60 * 60 * 1000, // 1 hour
    }),
  ],
  providers: [TradesService, GeminiVisionService, TradeJournalSyncService, YahooFinanceService, MassiveService],
  controllers: [TradesController],
  exports: [TradesService, TradeJournalSyncService],
})
export class TradesModule {}
