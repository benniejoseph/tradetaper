import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';
import { Subscription, SubscriptionStatus, SubscriptionTier } from '../entities/subscription.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/entities/notification.entity';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Daily 9AM: Warn users whose standard subscription expires in 7 days */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringSubscriptions() {
    this.logger.log('Running daily subscription expiry check');
    try {
      const count = await this.subscriptionService.sendExpiryWarnings();
      this.logger.log(`Sent ${count} subscription expiry warnings`);
    } catch (error) {
      this.logger.error(
        `Failed to check expiring subscriptions: ${error.message}`,
      );
    }
  }

  /**
   * Daily 8:00 AM: Warn trial users whose trial ends within the next 2 days.
   * Razorpay does NOT fire subscription.trial_ending_soon, so we handle it here.
   */
  @Cron('0 8 * * *') // 8:00 AM daily
  async checkTrialEndingWarnings() {
    this.logger.log('Checking for trials ending within 2 days...');
    try {
      const now = new Date();
      const warningWindow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // now + 2 days

      const trialsSoonExpiring = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.TRIALING,
          trialEnd: Between(now, warningWindow),
        },
      });

      this.logger.log(`Found ${trialsSoonExpiring.length} trials ending within 2 days`);

      for (const sub of trialsSoonExpiring) {
        try {
          const daysLeft = Math.ceil(
            (sub.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          await this.notificationsService.send({
            userId: sub.userId,
            type: NotificationType.SUBSCRIPTION_REMINDER,
            priority: NotificationPriority.HIGH,
            title: daysLeft <= 1 ? 'Your free trial ends tomorrow!' : 'Your free trial ends in 2 days',
            message:
              'Add your payment details to keep access to AI analysis, Mentor, Psychology, and more.',
            data: {
              trialEnd: sub.trialEnd,
              plan: sub.plan,
              daysLeft,
              upgradeUrl: '/plans',
            },
          });
          this.logger.log(`Sent trial ending warning to user ${sub.userId} (${daysLeft}d left)`);
        } catch (err) {
          this.logger.warn(`Failed to send trial warning to user ${sub.userId}: ${err.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Trial ending check failed: ${error.message}`);
    }
  }

  /**
   * Daily 8:30 AM: Expire trials that have passed their trialEnd date.
   * Razorpay does NOT fire subscription.trial_ended, so we handle downgrade here.
   */
  @Cron('30 8 * * *') // 8:30 AM daily
  async expireFinishedTrials() {
    this.logger.log('Checking for expired trials...');
    try {
      const now = new Date();

      const expiredTrials = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.TRIALING,
          trialEnd: LessThanOrEqual(now),
        },
      });

      this.logger.log(`Found ${expiredTrials.length} expired trials to downgrade`);

      for (const sub of expiredTrials) {
        try {
          const previousPlan = sub.plan;
          sub.status = SubscriptionStatus.ACTIVE; // Move out of TRIALING
          sub.plan = 'free';
          sub.tier = SubscriptionTier.FREE;
          await this.subscriptionRepository.save(sub);

          await this.notificationsService.send({
            userId: sub.userId,
            type: NotificationType.TRIAL_ENDED,
            priority: NotificationPriority.HIGH,
            title: 'Your free trial has ended',
            message:
              `Your 7-day ${previousPlan} trial has ended. Upgrade to continue using AI analysis, Mentor, Psychology, and more.`,
            data: {
              previousPlan,
              upgradeUrl: '/plans',
            },
          });

          this.logger.log(`Downgraded user ${sub.userId} from trial ${previousPlan} → free`);
        } catch (err) {
          this.logger.warn(`Failed to expire trial for user ${sub.userId}: ${err.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Trial expiry check failed: ${error.message}`);
    }
  }
}
