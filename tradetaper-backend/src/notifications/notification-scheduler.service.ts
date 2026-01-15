import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'; // Added Inject, forwardRef
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationPriority } from './entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, Between } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';

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

  // Track which events we've already sent alerts for
  private alertsSent = new Map<string, Set<string>>();

  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => EconomicCalendarService))
    private readonly economicCalendarService: EconomicCalendarService, // Injected with forwardRef
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
      // Get upcoming events from Real Service
      const upcomingEvents = await this.getUpcomingEconomicEvents();

      for (const event of upcomingEvents) {
        const diffMs = event.scheduledTime.getTime() - now.getTime();
        const minutesUntilEvent = Math.round(diffMs / 60000); // 1.5 -> 2, 60.1 -> 60

        // Tolerance for cron (cron runs every 5 mins, usually at :00, :05)
        // We want to catch the exact window.
        // If minutes is 60 (+/- 2.5), 45 (+/- 2.5), etc.
        const tolerance = 2; 

        // 1. 60 Minute Alert (1h)
        if (minutesUntilEvent >= 60 - tolerance && minutesUntilEvent <= 60 + tolerance) {
           await this.sendEconomicAlert(event, '1h', NotificationType.ECONOMIC_EVENT_1H);
        }

        // 2. 45 Minute Alert (Use 15M type)
        // User requested "Starting from 1h prior till news... for 15 min interval"
        if (minutesUntilEvent >= 45 - tolerance && minutesUntilEvent <= 45 + tolerance) {
           await this.sendEconomicAlert(event, '45m', NotificationType.ECONOMIC_EVENT_15M);
        }

        // 3. 30 Minute Alert (Use 15M type)
        if (minutesUntilEvent >= 30 - tolerance && minutesUntilEvent <= 30 + tolerance) {
           await this.sendEconomicAlert(event, '30m', NotificationType.ECONOMIC_EVENT_15M);
        }

        // 4. 15 Minute Alert (Use 15M type)
        if (minutesUntilEvent >= 15 - tolerance && minutesUntilEvent <= 15 + tolerance) {
           await this.sendEconomicAlert(event, '15m', NotificationType.ECONOMIC_EVENT_15M);
        }

        // 5. NOW Alert (0-5 mins)
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
    alertType: '1h' | '45m' | '30m' | '15m' | 'now',
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
    alertType: '1h' | '45m' | '30m' | '15m' | 'now',
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
        case '45m':
        case '30m':
        case '15m':
          // Reuse '15m' preference for all countdown intervals if enabled
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
     // Fetch from Economic Calendar Service
     // Range: Now to Now + 2 hours to catch 1h alerts
     const now = new Date();
     const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
     
     // Format dates for service if needed? 
     // Service accepts ISO strings or undefined?
     // getEconomicCalendar(from?: string, to?: string)
     
     const response = await this.economicCalendarService.getEconomicCalendar(
       now.toISOString(),
       twoHoursLater.toISOString()
     );
     
     return response.events.map(e => ({
       id: e.id,
       title: e.title,
       country: e.country,
       currency: e.currency,
       scheduledTime: typeof e.date === 'string' ? new Date(e.date) : e.date,
       importance: e.importance as 'low' | 'medium' | 'high',
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
