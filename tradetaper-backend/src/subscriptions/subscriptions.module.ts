import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Subscription } from './entities/subscription.entity';
import { Usage } from './entities/usage.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionService } from './services/subscription.service';
import { RazorpayService } from './services/razorpay.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Subscription, Usage, User]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionService, RazorpayService],
  exports: [SubscriptionService, RazorpayService],
})
export class SubscriptionsModule {}
