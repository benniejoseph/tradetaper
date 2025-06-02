import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Subscription } from './entities/subscription.entity';
import { UsageTracking } from './entities/usage.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from './services/stripe.service';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionsController } from './subscriptions.controller';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Subscription, UsageTracking, User]),
  ],
  controllers: [SubscriptionsController, WebhooksController],
  providers: [StripeService, SubscriptionService],
  exports: [SubscriptionService, StripeService],
})
export class SubscriptionsModule {} 