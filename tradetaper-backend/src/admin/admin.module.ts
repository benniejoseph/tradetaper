import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Account } from '../users/entities/account.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Usage } from '../subscriptions/entities/usage.entity';
import { SeedModule } from '../seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Account,
      Trade,
      Tag,
      MT5Account,
      Subscription,
      Usage,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tradetaper-secret',
      signOptions: { expiresIn: '30d' },
    }),
    SeedModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
