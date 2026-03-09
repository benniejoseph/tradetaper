import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'; // Added Inject, forwardRef
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import {
  NotificationType,
  NotificationPriority,
} from './entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';
import { EconomicEventAlert } from '../market-intelligence/entities/economic-event-alert.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { EconomicCalendarService } from '../market-intelligence/economic-calendar.service';

interface ScheduledEconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  scheduledTime: Date;
  importance: 'low' | 'medium' | 'high';
  description?: string;
}

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => EconomicCalendarService))
    private readonly economicCalendarService: EconomicCalendarService, // Injected with forwardRef
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
    @InjectRepository(EconomicEventAlert)
    private readonly economicAlertRepository: Repository<EconomicEventAlert>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Check for economic events every 5 minutes
   * Send 1-hour and 15-minute prior alerts
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async checkEconomicEvents(): Promise<void> {
    this.logger.log('Checking for upcoming economic events...');

    const now = new Date();

    try {
      // Get upcoming events from Real Service
      const upcomingEvents = await this.getUpcomingEconomicEvents();
      const eventIds = upcomingEvents.map((event) => event.id);
      const alertMap = new Map<string, Set<string>>();

      if (eventIds.length > 0) {
        const subscriptions = await this.economicAlertRepository.find({
          where: { eventId: In(eventIds) },
        });
        subscriptions.forEach((sub) => {
          const list = alertMap.get(sub.eventId) || new Set<string>();
          list.add(sub.userId);
          alertMap.set(sub.eventId, list);
        });
      }

      for (const event of upcomingEvents) {
        const diffMs = event.scheduledTime.getTime() - now.getTime();
        const minutesUntilEvent = Math.round(diffMs / 60000); // 1.5 -> 2, 60.1 -> 60

        // Tolerance for cron (cron runs every 5 mins, usually at :00, :05)
        // We want to catch the exact window.
        // If minutes is 60 (+/- 2.5), 45 (+/- 2.5), etc.
        const tolerance = 2;

        // 1. 60 Minute Alert (1h)
        if (
          minutesUntilEvent >= 60 - tolerance &&
          minutesUntilEvent <= 60 + tolerance
        ) {
          if (event.importance === 'high') {
            await this.economicCalendarService.precomputeHighImpactAnalysis(
              event.id,
            );
          }
          await this.sendEconomicAlert(
            event,
            '1h',
            NotificationType.ECONOMIC_EVENT_1H,
            alertMap.get(event.id),
          );
        }

        const isVeryHighImpact = this.isVeryHighImpactEvent(event);
        if (
          isVeryHighImpact &&
          minutesUntilEvent >= 240 - tolerance &&
          minutesUntilEvent <= 240 + tolerance
        ) {
          await this.economicCalendarService.precomputeHighImpactAnalysis(
            event.id,
          );
        }

        if (
          isVeryHighImpact &&
          minutesUntilEvent >= 120 - tolerance &&
          minutesUntilEvent <= 120 + tolerance
        ) {
          await this.economicCalendarService.precomputeHighImpactAnalysis(
            event.id,
          );
        }

        // 2. 45 Minute Alert (Use 15M type)
        // User requested "Starting from 1h prior till news... for 15 min interval"
        if (
          minutesUntilEvent >= 45 - tolerance &&
          minutesUntilEvent <= 45 + tolerance
        ) {
          await this.sendEconomicAlert(
            event,
            '45m',
            NotificationType.ECONOMIC_EVENT_15M,
            alertMap.get(event.id),
          );
        }

        // 3. 30 Minute Alert (Use 15M type)
        if (
          minutesUntilEvent >= 30 - tolerance &&
          minutesUntilEvent <= 30 + tolerance
        ) {
          await this.sendEconomicAlert(
            event,
            '30m',
            NotificationType.ECONOMIC_EVENT_15M,
            alertMap.get(event.id),
          );
        }

        // 4. 15 Minute Alert (Use 15M type)
        if (
          minutesUntilEvent >= 15 - tolerance &&
          minutesUntilEvent <= 15 + tolerance
        ) {
          await this.sendEconomicAlert(
            event,
            '15m',
            NotificationType.ECONOMIC_EVENT_15M,
            alertMap.get(event.id),
          );
        }

        // 5. NOW Alert (0-5 mins)
        if (minutesUntilEvent >= 0 && minutesUntilEvent <= 5) {
          await this.sendEconomicAlert(
            event,
            'now',
            NotificationType.ECONOMIC_EVENT_NOW,
            alertMap.get(event.id),
          );
        }
      }

    } catch (error) {
      this.logger.error('Failed to check economic events', error);
    }
  }

  /**
   * Process scheduled notifications every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    const count =
      await this.notificationsService.processScheduledNotifications();
    if (count > 0) {
      this.logger.log(`Processed ${count} scheduled notifications`);
    }
  }

  /**
   * Clean up old notifications daily at 3 AM
   */
  @Cron('0 3 * * *')
  async cleanupOldNotifications(): Promise<void> {
    const count = await this.notificationsService.cleanupOldNotifications();
    this.logger.log(`Cleaned up ${count} old notifications`);
  }

  /**
   * Send economic event alert to all subscribed users
   */
  private async sendEconomicAlert(
    event: ScheduledEconomicEvent,
    alertType: '1h' | '45m' | '30m' | '15m' | 'now',
    notificationType: NotificationType,
    explicitUserIds?: Set<string>,
  ): Promise<void> {
    const dedupeKey = this.getAlertDedupeKey(event.id, alertType);
    const alreadySent = await this.cacheManager.get(dedupeKey);
    if (alreadySent) {
      return;
    }

    await this.cacheManager.set(
      dedupeKey,
      true,
      this.getAlertDedupeTtlMs(event.scheduledTime),
    );

    this.logger.log(
      `Sending ${alertType} alert for economic event: ${event.title}`,
    );

    let targetUserIds: string[] = [];
    let preferences: NotificationPreference[] = [];
    if (explicitUserIds && explicitUserIds.size > 0) {
      targetUserIds = Array.from(explicitUserIds);
    } else {
      preferences = await this.getSubscribedUsers(event.importance, alertType);
      targetUserIds = preferences.map((pref) => pref.userId);
    }
    const prefMap = new Map(preferences.map((pref) => [pref.userId, pref]));

    // Determine alert message based on timing
    let title: string;
    let message: string;
    let priority: NotificationPriority;

    switch (alertType) {
      case '1h':
        title = `📅 ${event.title} in 1 hour`;
        message = `${event.currency}: ${event.title} is scheduled in 1h.`;
        priority = NotificationPriority.HIGH;
        break;
      case '45m':
        title = `⚠️ ${event.title} in 45 minutes`;
        message = `${event.currency}: ${event.title} in 45 mins.`;
        priority = NotificationPriority.HIGH;
        break;
      case '30m':
        title = `⚠️ ${event.title} in 30 minutes`;
        message = `${event.currency}: ${event.title} in 30 mins. Volatility Incoming.`;
        priority = NotificationPriority.HIGH;
        break;
      case '15m':
        title = `⚠️ ${event.title} in 15 minutes`;
        message = `${event.currency}: ${event.title} starting in 15 mins. Check positions!`;
        priority = NotificationPriority.URGENT;
        break;
      case 'now':
        title = `🔴 ${event.title} starting NOW`;
        message = `${event.currency}: ${event.title} released.`;
        priority = NotificationPriority.URGENT;
        break;
      default:
        title = `Event Alert`;
        message = `${event.title}`;
        priority = NotificationPriority.NORMAL;
    }

    // Send to each subscribed user
    let successCount = 0;

    await this.processInBatches(targetUserIds, 20, async (userId) => {
      const pref = prefMap.get(userId);
      if (
        pref &&
        pref.economicEventCurrencies &&
        pref.economicEventCurrencies.length > 0 &&
        !pref.economicEventCurrencies.includes(event.currency)
      ) {
        return;
      }

      try {
        const sent = await this.notificationsService.send({
          userId,
          type: notificationType,
          title,
          message,
          priority,
          data: {
            eventId: event.id,
            eventTitle: event.title,
            country: event.country,
            currency: event.currency,
            importance: event.importance,
            scheduledTime: event.scheduledTime.toISOString(),
            alertType,
          },
          resourceType: 'economic_event',
          resourceId: event.id,
          actionUrl: '/market-intelligence?tab=economic-calendar',
          icon: this.getEventIcon(event.importance),
        });
        if (sent) {
          successCount += 1;
        }
      } catch (error) {
        this.logger.error(`Failed to send alert to user ${userId}`, error);
      }
    });

    if (successCount === 0) {
      await this.cacheManager.del(dedupeKey);
    }
  }

  /**
   * Get users subscribed to economic alerts for given importance level
   */
  private async getSubscribedUsers(
    importance: 'low' | 'medium' | 'high',
    alertType: '1h' | '45m' | '30m' | '15m' | 'now',
  ): Promise<NotificationPreference[]> {
    const where: FindOptionsWhere<NotificationPreference> = { enabled: true };

    switch (alertType) {
      case '1h':
        where.economicAlert1h = true;
        break;
      case '45m':
      case '30m':
      case '15m':
        where.economicAlert15m = true;
        break;
      case 'now':
        where.economicAlertNow = true;
        break;
    }

    const preferences = await this.preferenceRepository.find({ where });

    return preferences.filter((pref) => {
      // Check if user wants alerts for this importance level
      if (!pref.economicEventImportance.includes(importance)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get upcoming economic events from the calendar service
   * TODO: Integrate with EconomicCalendarService
   */
  private async getUpcomingEconomicEvents(): Promise<ScheduledEconomicEvent[]> {
    // Fetch from Economic Calendar Service
    // Range: Now to Now + 4 hours to support pre-compute windows.
    const now = new Date();
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    // Format dates for service if needed?
    // Service accepts ISO strings or undefined?
    // getEconomicCalendar(from?: string, to?: string)

    const response = await this.economicCalendarService.getEconomicCalendar(
      now.toISOString(),
      fourHoursLater.toISOString(),
    );

    return response.events.map((e) => ({
      id: e.id,
      title: e.title,
      country: e.country,
      currency: e.currency,
      scheduledTime: typeof e.date === 'string' ? new Date(e.date) : e.date,
      importance: e.importance,
      description: e.description,
    }));
  }

  private getEventIcon(importance: 'low' | 'medium' | 'high'): string {
    switch (importance) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '📊';
    }
  }

  private isVeryHighImpactEvent(event: ScheduledEconomicEvent): boolean {
    const title = event.title.toLowerCase();
    return (
      event.importance === 'high' &&
      (title.includes('fomc') ||
        title.includes('non-farm') ||
        title.includes('nonfarm') ||
        title.includes('nfp') ||
        title.includes('interest rate') ||
        title.includes('fed chair') ||
        title.includes('powell'))
    );
  }

  private getAlertDedupeKey(eventId: string, alertType: string): string {
    return `notifications:economic-alert:${eventId}:${alertType}`;
  }

  private getAlertDedupeTtlMs(scheduledTime: Date): number {
    const fallbackMs = 6 * 60 * 60 * 1000;
    const now = Date.now();
    const eventTime = scheduledTime.getTime();
    if (Number.isNaN(eventTime)) {
      return fallbackMs;
    }

    // Keep dedupe window through event time plus a buffer.
    return Math.max(eventTime - now + 2 * 60 * 60 * 1000, 30 * 60 * 1000);
  }

  private async processInBatches<T>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((item) => processor(item)));
    }
  }
}
