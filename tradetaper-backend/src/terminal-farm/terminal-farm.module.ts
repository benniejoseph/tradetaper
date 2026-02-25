// src/terminal-farm/terminal-farm.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TerminalInstance } from './entities/terminal-instance.entity';
import { TerminalFarmService } from './terminal-farm.service';
import { TerminalFarmController } from './terminal-farm.controller';
import { TerminalWebhookController } from './terminal-webhook.controller';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { TradesModule } from '../trades/trades.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TerminalCommandsQueue } from './queue/terminal-commands.queue';
import { TerminalFailedTradesQueue } from './queue/terminal-failed-trades.queue';
import { TerminalTokenService } from './terminal-token.service';
import { TerminalHealthController } from './terminal-health.controller';
import { TradeProcessorService } from './trade-processor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TerminalInstance, MT5Account]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'test-secret-key-change-in-prod',
        ),
      }),
    }),
    forwardRef(() => TradesModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    TerminalFarmController,
    TerminalWebhookController,
    TerminalHealthController,
  ],
  providers: [
    TerminalFarmService,
    TerminalCommandsQueue,
    TerminalFailedTradesQueue,
    TerminalTokenService,
    TradeProcessorService,
  ],
  exports: [
    TerminalFarmService,
    TerminalCommandsQueue,
    TerminalFailedTradesQueue,
    TerminalTokenService,
    TradeProcessorService,
  ],
})
export class TerminalFarmModule {}
