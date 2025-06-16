// src/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { SeedService } from './seed.service';
import { ProductionSeedService } from './production-seed.service';
import { TestUserSeedService } from './test-user-seed.service';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Strategy } from '../strategies/entities/strategy.entity';
import { UsersModule } from '../users/users.module'; // Import UsersModule for UsersService

@Module({
  imports: [
    ConfigModule, // Make ConfigService available
    TypeOrmModule.forFeature([User, Trade, Subscription, Tag, MT5Account, Strategy]),
    UsersModule, // To inject UsersService into SeedService
  ],
  providers: [SeedService, ProductionSeedService, TestUserSeedService],
  exports: [SeedService, ProductionSeedService, TestUserSeedService], // Optional: if other modules might trigger seeding
})
export class SeedModule {}
