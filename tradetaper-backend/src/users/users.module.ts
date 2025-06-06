// src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { ConfigModule } from '@nestjs/config';
import { MT5Account } from './entities/mt5-account.entity';
import { MT5AccountsService } from './mt5-accounts.service';
import { MT5AccountsController } from './mt5-accounts.controller';
import { MetaApiService } from './metaapi.service';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { CacheModule } from '@nestjs/cache-manager';
import { TradesModule } from '../trades/trades.module';
// We might add UsersController later if we need direct user management endpoints

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MT5Account]),
    ConfigModule,
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      max: 100, // maximum number of items in cache
    }),
    forwardRef(() => TradesModule),
  ],
  providers: [UsersService, MT5AccountsService, MetaApiService, TradeHistoryParserService],
  exports: [UsersService, MT5AccountsService, MetaApiService, TradeHistoryParserService],
  controllers: [MT5AccountsController],
})
export class UsersModule {}
