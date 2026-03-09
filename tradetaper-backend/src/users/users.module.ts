// src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { UsersService } from './users.service';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { ConfigModule } from '@nestjs/config';
import { MT5Account } from './entities/mt5-account.entity';
import { MT5AccountsService } from './mt5-accounts.service';
import { MT5AccountsController } from './mt5-accounts.controller';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { TradesModule } from '../trades/trades.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MetaApiService } from './metaapi.service';
import { UsersController } from './users.controller';
import { MT5SyncBootstrapService } from './mt5-sync-bootstrap.service';
import { MetaApiIdleSuspensionService } from './metaapi-idle-suspension.service';
import { TerminalInstance } from '../terminal-farm/entities/terminal-instance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, MT5Account, TerminalInstance]),
    ConfigModule,
    forwardRef(() => TradesModule),
    SubscriptionsModule,
  ],
  providers: [
    UsersService,
    AccountsService,
    MT5AccountsService,
    TradeHistoryParserService,
    MetaApiService,
    MT5SyncBootstrapService,
    MetaApiIdleSuspensionService,
  ],
  exports: [
    UsersService,
    AccountsService,
    MT5AccountsService,
    TradeHistoryParserService,
  ],
  controllers: [AccountsController, MT5AccountsController, UsersController],
})
export class UsersModule {}
