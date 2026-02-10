import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringSubscriptions() {
    this.logger.log('Running daily subscription expiry check');
    try {
      const count = await this.subscriptionService.sendExpiryWarnings();
      this.logger.log(`Sent ${count} subscription expiry warnings`);
    } catch (error) {
      this.logger.error(`Failed to check expiring subscriptions: ${error.message}`);
    }
  }
}
