import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Subscription } from './entities/subscription.entity';
import { Usage } from './entities/usage.entity';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Account } from '../users/entities/account.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Note } from '../notes/entities/note.entity';
import { Strategy } from '../strategies/entities/strategy.entity';
import { SubscriptionService } from './services/subscription.service';
import { RazorpayService } from './services/razorpay.service';
import { SubscriptionSchedulerService } from './services/subscription-scheduler.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsWebhookController } from './subscriptions.webhook.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Subscription,
      Usage,
      User,
      Trade,
      Account,
      MT5Account,
      Note,
      Strategy,
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [SubscriptionsController, SubscriptionsWebhookController],
  providers: [
    SubscriptionService,
    RazorpayService,
    SubscriptionSchedulerService,
  ],
  exports: [SubscriptionService, RazorpayService],
})
export class SubscriptionsModule {}
