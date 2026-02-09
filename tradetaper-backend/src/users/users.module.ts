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
// We might add UsersController later if we need direct user management endpoints

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, MT5Account]),
    ConfigModule,
    forwardRef(() => TradesModule),
    SubscriptionsModule,
  ],
  providers: [
    UsersService,
    AccountsService,
    MT5AccountsService,
    TradeHistoryParserService,
  ],
  exports: [
    UsersService,
    AccountsService,
    MT5AccountsService,
    TradeHistoryParserService,
  ],
  controllers: [AccountsController, MT5AccountsController],
})
export class UsersModule {}
