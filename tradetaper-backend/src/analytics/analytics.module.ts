import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TradesModule } from '../trades/trades.module';
import { AuthModule } from '../auth/auth.module';
import { MarketIntelligenceModule } from '../market-intelligence/market-intelligence.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TradesModule,
    AuthModule,
    MarketIntelligenceModule,
    SubscriptionsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
