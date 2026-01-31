// src/terminal-farm/terminal-farm.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TerminalInstance } from './entities/terminal-instance.entity';
import { TerminalFarmService } from './terminal-farm.service';
import { TerminalFarmController } from './terminal-farm.controller';
import { TerminalWebhookController } from './terminal-webhook.controller';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { TradesModule } from '../trades/trades.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TerminalInstance, MT5Account]),
    ConfigModule,
    forwardRef(() => TradesModule),
  ],
  controllers: [TerminalFarmController, TerminalWebhookController],
  providers: [TerminalFarmService],
  exports: [TerminalFarmService],
})
export class TerminalFarmModule {}
