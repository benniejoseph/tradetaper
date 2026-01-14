import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationPriority } from './entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, Between } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';

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

  // Track which events we've already sent alerts for
  private alertsSent = new Map<string, Set<string>>(); // eventId -> Set<'1h' | '15m' | 'now'>

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
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
      // Get upcoming events (mocked for now, will integrate with real API)
      const upcomingEvents = await this.getUpcomingEconomicEvents();

      for (const event of upcomingEvents) {
        const minutesUntilEvent = Math.floor(
          (event.scheduledTime.getTime() - now.getTime()) / (1000 * 60),
        );

        // Check 1-hour alert (55-65 minutes)
        if (minutesUntilEvent >= 55 && minutesUntilEvent <= 65) {
          await this.sendEconomicAlert(event, '1h', NotificationType.ECONOMIC_EVENT_1H);
        }

        // Check 15-minute alert (10-20 minutes)
        if (minutesUntilEvent >= 10 && minutesUntilEvent <= 20) {
          await this.sendEconomicAlert(event, '15m', NotificationType.ECONOMIC_EVENT_15M);
        }

        // Check event starting now (0-5 minutes)
        if (minutesUntilEvent >= 0 && minutesUntilEvent <= 5) {
          await this.sendEconomicAlert(event, 'now', NotificationType.ECONOMIC_EVENT_NOW);
        }
      }

      // Clean up old tracking data
      this.cleanupOldAlerts();
    } catch (error) {
      this.logger.error('Failed to check economic events', error);
    }
  }

  /**
   * Process scheduled notifications every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    const count = await this.notificationsService.processScheduledNotifications();
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
    alertType: '1h' | '15m' | 'now',
    notificationType: NotificationType,
  ): Promise<void> {
    // Check if we've already sent this alert
    const sentAlerts = this.alertsSent.get(event.id) || new Set();
    if (sentAlerts.has(alertType)) {
      return;
    }

    this.logger.log(
      `Sending ${alertType} alert for economic event: ${event.title}`,
    );

    // Get all users with preferences for this type of alert and event importance
    const preferences = await this.getSubscribedUsers(event.importance, alertType);

    // Determine alert message based on timing
    let title: string;
    let message: string;
    let priority: NotificationPriority;

    switch (alertType) {
      case '1h':
        title = `📅 ${event.title} in 1 hour`;
        message = `${event.currency} - ${event.country}: ${event.title} is scheduled in approximately 1 hour.`;
        priority = NotificationPriority.HIGH;
        break;
      case '15m':
        title = `⚠️ ${event.title} in 15 minutes`;
        message = `${event.currency} - ${event.country}: ${event.title} is starting in approximately 15 minutes. Consider your positions.`;
        priority = NotificationPriority.URGENT;
        break;
      case 'now':
        title = `🔴 ${event.title} starting now`;
        message = `${event.currency} - ${event.country}: ${event.title} is happening now!`;
        priority = NotificationPriority.URGENT;
        break;
    }

    // Send to each subscribed user
    for (const pref of preferences) {
      // Check currency filter if set
      if (
        pref.economicEventCurrencies &&
        pref.economicEventCurrencies.length > 0 &&
        !pref.economicEventCurrencies.includes(event.currency)
      ) {
        continue;
      }

      try {
        await this.notificationsService.send({
          userId: pref.userId,
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
      } catch (error) {
        this.logger.error(
          `Failed to send alert to user ${pref.userId}`,
          error,
        );
      }
    }

    // Mark as sent
    sentAlerts.add(alertType);
    this.alertsSent.set(event.id, sentAlerts);
  }

  /**
   * Get users subscribed to economic alerts for given importance level
   */
  private async getSubscribedUsers(
    importance: 'low' | 'medium' | 'high',
    alertType: '1h' | '15m' | 'now',
  ): Promise<NotificationPreference[]> {
    const preferences = await this.preferenceRepository.find({
      where: { enabled: true },
    });

    return preferences.filter((pref) => {
      // Check if user wants alerts for this importance level
      if (!pref.economicEventImportance.includes(importance)) {
        return false;
      }

      // Check if user wants this type of alert
      switch (alertType) {
        case '1h':
          return pref.economicAlert1h;
        case '15m':
          return pref.economicAlert15m;
        case 'now':
          return pref.economicAlertNow;
        default:
          return false;
      }
    });
  }

  /**
   * Get upcoming economic events from the calendar service
   * TODO: Integrate with EconomicCalendarService
   */
  private async getUpcomingEconomicEvents(): Promise<ScheduledEconomicEvent[]> {
    // Mock data for testing - will be replaced with actual API call
    const now = new Date();

    // Generate sample events for the next 2 hours
    const events: ScheduledEconomicEvent[] = [];

    // Sample events (in production, fetch from EconomicCalendarService)
    const sampleEvents = [
      { title: 'Non-Farm Payrolls', country: 'United States', currency: 'USD', importance: 'high' as const },
      { title: 'ECB Interest Rate Decision', country: 'Eurozone', currency: 'EUR', importance: 'high' as const },
      { title: 'UK CPI y/y', country: 'United Kingdom', currency: 'GBP', importance: 'high' as const },
      { title: 'German ZEW', country: 'Germany', currency: 'EUR', importance: 'medium' as const },
      { title: 'Japan Trade Balance', country: 'Japan', currency: 'JPY', importance: 'medium' as const },
    ];

    // Create events at various times for testing
    // In production, this would fetch real scheduled times from the API
    const testOffsets = [15, 60, 3]; // 15 min, 1 hour, 3 min from now

    for (let i = 0; i < Math.min(sampleEvents.length, 3); i++) {
      const event = sampleEvents[i];
      const scheduledTime = new Date(now.getTime() + testOffsets[i] * 60 * 1000);

      events.push({
        id: `event-${i}-${scheduledTime.getTime()}`,
        title: event.title,
        country: event.country,
        currency: event.currency,
        importance: event.importance,
        scheduledTime,
        description: `${event.title} for ${event.country}`,
      });
    }

    return events;
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

  private cleanupOldAlerts(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove entries for events that are more than 1 hour old
    for (const [eventId] of this.alertsSent) {
      // Extract timestamp from event ID (format: event-{index}-{timestamp})
      const parts = eventId.split('-');
      const timestamp = parseInt(parts[parts.length - 1], 10);

      if (timestamp < oneHourAgo) {
        this.alertsSent.delete(eventId);
      }
    }
  }
}
