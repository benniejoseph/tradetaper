import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In, IsNull } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from './entities/notification.entity';
import {
  NotificationPreference,
  ChannelPreference,
} from './entities/notification-preference.entity';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { WebSocketService } from '../websocket/websocket.service';
import { UsersService } from '../users/users.service'; // Assuming UsersService exists and can find email
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  icon?: string;
  scheduledFor?: Date;
}

interface DeliveryAttempt {
  channel: NotificationChannel;
  outcome: 'sent' | 'skipped' | 'failed';
  reason?: string;
}

interface DeliverySummary {
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface NotificationFilter {
  status?: NotificationStatus;
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
    private readonly webSocketService: WebSocketService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService, // Inject UsersService
  ) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not configured');
    }
  }

  private resend: Resend;

  /**
   * Send a notification to a user
   * Respects user preferences and routes to appropriate channels
   */
  async send(dto: CreateNotificationDto): Promise<Notification | null> {
    this.logger.log(`Sending notification: ${dto.type} to user ${dto.userId}`);

    // Get user preferences
    const preferences = await this.getOrCreatePreferences(dto.userId);

    // Check if notifications are enabled
    if (!preferences.enabled) {
      this.logger.debug(`Notifications disabled for user ${dto.userId}`);
      return null;
    }

    // Get channel preferences for this notification type
    const channelPref = preferences.channelPreferences[dto.type] || {
      inApp: true,
      push: false,
      email: false,
    };

    const effectiveChannelPref: ChannelPreference = {
      inApp: channelPref.inApp,
      push: channelPref.push && Boolean(preferences.pushToken),
      email: channelPref.email && preferences.emailEnabled,
    };

    if (!this.hasAnyEnabledChannel(effectiveChannelPref)) {
      this.logger.debug(
        `All channels disabled for user ${dto.userId} and type ${dto.type}`,
      );
      return null;
    }

    const primaryChannel = this.resolvePrimaryChannel(effectiveChannelPref);

    // Create the notification record
    const notification = await this.createNotification(
      dto,
      NotificationStatus.PENDING,
      primaryChannel,
    );

    return this.dispatchNotification(
      notification,
      preferences,
      effectiveChannelPref,
    );
  }

  /**
   * Schedule a notification for future delivery
   */
  async schedule(
    dto: CreateNotificationDto,
    scheduledFor: Date,
  ): Promise<Notification> {
    this.logger.log(
      `Scheduling notification: ${dto.type} for ${scheduledFor.toISOString()}`,
    );

    const notification = this.notificationRepository.create({
      ...dto,
      channel: NotificationChannel.IN_APP,
      priority: dto.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.PENDING,
      scheduledFor,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * Process scheduled notifications
   * Called by cron job
   */
  async processScheduledNotifications(): Promise<number> {
    const now = new Date();

    const scheduledNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduledFor: LessThanOrEqual(now),
      },
      take: 100, // Process in batches
    });

    this.logger.log(
      `Processing ${scheduledNotifications.length} scheduled notifications`,
    );

    for (const notification of scheduledNotifications) {
      try {
        const preferences = await this.getOrCreatePreferences(notification.userId);
        const channelPref = preferences.channelPreferences[notification.type] || {
          inApp: true,
          push: false,
          email: false,
        };

        const effectiveChannelPref: ChannelPreference = {
          inApp: channelPref.inApp,
          push: channelPref.push && Boolean(preferences.pushToken),
          email: channelPref.email && preferences.emailEnabled,
        };

        if (
          !preferences.enabled ||
          !this.hasAnyEnabledChannel(effectiveChannelPref)
        ) {
          notification.status = NotificationStatus.FAILED;
          notification.errorMessage =
            'Notification skipped due to user preferences';
          notification.sentAt = new Date();
          notification.scheduledFor = undefined;
          await this.notificationRepository.save(notification);
          continue;
        }

        notification.channel = this.resolvePrimaryChannel(effectiveChannelPref);
        await this.dispatchNotification(
          notification,
          preferences,
          effectiveChannelPref,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process scheduled notification ${notification.id}`,
          error,
        );
        notification.retryCount += 1;
        notification.errorMessage = error.message;

        if (notification.retryCount >= 3) {
          notification.status = NotificationStatus.FAILED;
        }

        await this.notificationRepository.save(notification);
      }
    }

    return scheduledNotifications.length;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    filter: NotificationFilter = {},
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const where: Record<string, unknown> = {
      userId,
      channel: NotificationChannel.IN_APP,
    };

    if (filter.status) {
      where.status = filter.status;
    } else if (!filter.unreadOnly) {
      where.status = In([
        NotificationStatus.DELIVERED,
        NotificationStatus.READ,
        NotificationStatus.FAILED,
      ]);
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.unreadOnly) {
      where.status = NotificationStatus.DELIVERED;
      where.readAt = IsNull();
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
      });

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        readAt: IsNull(),
      },
    });

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    const updated = await this.notificationRepository.save(notification);

    // Notify frontend via WebSocket
    this.webSocketService.sendToUser(userId, 'notification:read', { id });

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      {
        userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        readAt: IsNull(),
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );

    // Notify frontend via WebSocket
    this.webSocketService.sendToUser(userId, 'notification:readAll', {});

    return result.affected || 0;
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        readAt: IsNull(),
      },
    });
  }

  /**
   * Get or create user preferences
   */
  async getOrCreatePreferences(
    userId: string,
  ): Promise<NotificationPreference> {
    let preferences = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferenceRepository.create({ userId });
      preferences = await this.preferenceRepository.save(preferences);
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreference> | UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    const preferences = await this.getOrCreatePreferences(userId);
    const normalizedUpdates = this.normalizePreferenceUpdates(updates, preferences);
    Object.assign(preferences, normalizedUpdates);

    return this.preferenceRepository.save(preferences);
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.notificationRepository.delete({
      createdAt: LessThanOrEqual(thirtyDaysAgo),
      status: NotificationStatus.READ,
    });

    this.logger.log(`Cleaned up ${result.affected} old notifications`);

    return result.affected || 0;
  }

  // Private methods for channel delivery

  private async createNotification(
    dto: CreateNotificationDto,
    status: NotificationStatus,
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      channel,
      priority: dto.priority || NotificationPriority.NORMAL,
      status,
      data: dto.data,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      actionUrl: dto.actionUrl,
      icon: dto.icon,
      scheduledFor: dto.scheduledFor,
    });

    return this.notificationRepository.save(notification);
  }

  private hasAnyEnabledChannel(channelPref: ChannelPreference): boolean {
    return Boolean(channelPref.inApp || channelPref.push || channelPref.email);
  }

  private resolvePrimaryChannel(
    channelPref: ChannelPreference,
  ): NotificationChannel {
    if (channelPref.inApp) return NotificationChannel.IN_APP;
    if (channelPref.push) return NotificationChannel.PUSH;
    return NotificationChannel.EMAIL;
  }

  private async dispatchNotification(
    notification: Notification,
    preferences: NotificationPreference,
    channelPref: ChannelPreference,
  ): Promise<Notification> {
    const summary = await this.deliverToChannels(
      notification,
      preferences,
      channelPref,
    );

    if (summary.sentCount > 0) {
      notification.status = NotificationStatus.DELIVERED;
      notification.sentAt = new Date();
      notification.errorMessage = summary.errors.length
        ? summary.errors.join(' | ')
        : undefined;
    } else {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage =
        summary.errors.join(' | ') ||
        'Notification skipped due to channel delivery constraints';
      notification.sentAt = new Date();
    }

    notification.scheduledFor = undefined;
    return this.notificationRepository.save(notification);
  }

  private async deliverToChannels(
    notification: Notification,
    preferences: NotificationPreference,
    channelPref: ChannelPreference,
  ): Promise<DeliverySummary> {
    const attempts: Promise<DeliveryAttempt>[] = [];

    if (channelPref.inApp) {
      attempts.push(
        this.deliverInApp(notification)
          .then(() => ({
            channel: NotificationChannel.IN_APP,
            outcome: 'sent' as const,
          }))
          .catch((error) => ({
            channel: NotificationChannel.IN_APP,
            outcome: 'failed' as const,
            reason: `in_app:${error?.message || 'unknown_error'}`,
          })),
      );
    }

    if (channelPref.push) {
      attempts.push(
        this.deliverPush(notification, preferences)
          .then((sent) =>
            sent
              ? ({
                  channel: NotificationChannel.PUSH,
                  outcome: 'sent' as const,
                })
              : ({
                  channel: NotificationChannel.PUSH,
                  outcome: 'skipped' as const,
                  reason: 'push:not_available',
                }),
          )
          .catch((error) => ({
            channel: NotificationChannel.PUSH,
            outcome: 'failed' as const,
            reason: `push:${error?.message || 'unknown_error'}`,
          })),
      );
    }

    if (channelPref.email && preferences.emailEnabled) {
      attempts.push(
        this.deliverEmail(notification)
          .then((sent) =>
            sent
              ? ({
                  channel: NotificationChannel.EMAIL,
                  outcome: 'sent' as const,
                })
              : ({
                  channel: NotificationChannel.EMAIL,
                  outcome: 'skipped' as const,
                  reason: 'email:disabled_or_unavailable',
                }),
          )
          .catch((error) => ({
            channel: NotificationChannel.EMAIL,
            outcome: 'failed' as const,
            reason: `email:${error?.message || 'unknown_error'}`,
          })),
      );
    }

    const results = await Promise.all(attempts);
    const sentCount = results.filter((r) => r.outcome === 'sent').length;
    const failedCount = results.filter((r) => r.outcome === 'failed').length;
    const skippedCount = results.filter((r) => r.outcome === 'skipped').length;
    const errors = results
      .filter((r) => r.outcome !== 'sent' && r.reason)
      .map((r) => r.reason as string);

    return { sentCount, failedCount, skippedCount, errors };
  }

  private async deliverInApp(notification: Notification): Promise<void> {
    this.logger.debug(`Delivering in-app notification ${notification.id}`);

    this.webSocketService.sendToUser(notification.userId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      actionUrl: notification.actionUrl,
      icon: notification.icon,
      channel: notification.channel,
      status: NotificationStatus.DELIVERED,
      readAt: notification.readAt,
      sentAt: notification.sentAt || new Date(),
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    });
  }

  private async deliverPush(
    notification: Notification,
    preferences: NotificationPreference,
  ): Promise<boolean> {
    this.logger.debug(`Delivering push notification ${notification.id}`);

    if (!preferences.pushToken) {
      this.logger.debug('Skipping push - no push token registered');
      return false;
    }

    // Check quiet hours
    if (preferences.quietHoursEnabled && this.isQuietHours(preferences)) {
      this.logger.debug('Skipping push - quiet hours active');
      return false;
    }

    // TODO: Implement provider push delivery (FCM/APNS/WebPush).
    // Returning false keeps delivery state accurate while channel is unimplemented.
    this.logger.warn('Push notifications not yet implemented');
    return false;
  }

  private async deliverEmail(notification: Notification): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend client not initialized - skipping email');
      return false;
    }

    try {
      const user = await this.usersService.findOneById(notification.userId);
      if (!user || !user.email) {
        this.logger.warn(
          `User ${notification.userId} not found or no email - skipping email notification`,
        );
        return false;
      }

      this.logger.debug(
        `Delivering email notification ${notification.id} to ${user.email}`,
      );

      const { data, error } = await this.resend.emails.send({
        from:
          this.configService.get<string>('NOTIFICATION_FROM_EMAIL') ||
          'notifications@tradetaper.com',
        to: [user.email],
        subject: notification.title,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
            <hr />
            <p style="font-size: 12px; color: #666;">
              You received this email because you have notifications enabled.
              <a href="${this.configService.get<string>('FRONTEND_URL')}/notifications">Manage Preferences</a>
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error('Resend email failed:', error);
        return false;
      } else {
        this.logger.log(`Email sent successfully: ${data?.id}`);
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email to user ${notification.userId}`,
        error,
      );
      return false;
    }
  }

  private normalizePreferenceUpdates(
    updates: Partial<NotificationPreference> | UpdateNotificationPreferencesDto,
    current: NotificationPreference,
  ): Partial<NotificationPreference> {
    const normalized: Partial<NotificationPreference> = {};

    if (updates.enabled !== undefined) normalized.enabled = updates.enabled;
    if (updates.economicAlert1h !== undefined) {
      normalized.economicAlert1h = updates.economicAlert1h;
    }
    if (updates.economicAlert15m !== undefined) {
      normalized.economicAlert15m = updates.economicAlert15m;
    }
    if (updates.economicAlertNow !== undefined) {
      normalized.economicAlertNow = updates.economicAlertNow;
    }
    if (updates.quietHoursEnabled !== undefined) {
      normalized.quietHoursEnabled = updates.quietHoursEnabled;
    }
    if (updates.quietHoursStart !== undefined) {
      normalized.quietHoursStart = updates.quietHoursStart;
    }
    if (updates.quietHoursEnd !== undefined) {
      normalized.quietHoursEnd = updates.quietHoursEnd;
    }
    if (updates.timezone !== undefined) {
      normalized.timezone = updates.timezone;
    }
    if (updates.dailyDigestEnabled !== undefined) {
      normalized.dailyDigestEnabled = updates.dailyDigestEnabled;
    }
    if (updates.dailyDigestTime !== undefined) {
      normalized.dailyDigestTime = updates.dailyDigestTime;
    }
    if (updates.emailEnabled !== undefined) {
      normalized.emailEnabled = updates.emailEnabled;
    }
    if ('pushToken' in updates && updates.pushToken !== undefined) {
      normalized.pushToken = updates.pushToken as string;
    }

    if (updates.economicEventImportance) {
      const allowed = new Set(['high', 'medium', 'low']);
      const values = updates.economicEventImportance
        .map((v) => `${v}`.toLowerCase().trim())
        .filter((v) => allowed.has(v));
      normalized.economicEventImportance = Array.from(new Set(values));
    }

    if (updates.economicEventCurrencies) {
      normalized.economicEventCurrencies = Array.from(
        new Set(
          updates.economicEventCurrencies
            .map((v) => `${v}`.trim().toUpperCase())
            .filter((v) => Boolean(v)),
        ),
      );
    }

    if (updates.channelPreferences) {
      const rawPreferences = updates.channelPreferences as Record<
        string,
        { inApp?: boolean; push?: boolean; email?: boolean }
      >;
      const validTypes = new Set(Object.values(NotificationType));
      const mergedPreferences = {
        ...(current.channelPreferences || {}),
      } as Record<NotificationType, ChannelPreference>;
      for (const [type, pref] of Object.entries(rawPreferences)) {
        if (!validTypes.has(type as NotificationType)) {
          continue;
        }

        const existing =
          mergedPreferences[type as NotificationType] ||
          ({ inApp: true, push: false, email: false } as ChannelPreference);

        mergedPreferences[type as NotificationType] = {
          inApp: pref?.inApp ?? existing.inApp,
          push: pref?.push ?? existing.push,
          email: pref?.email ?? existing.email,
        };
      }
      normalized.channelPreferences = mergedPreferences;
    }

    return normalized;
  }

  private isQuietHours(preferences: NotificationPreference): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const currentTime = this.getCurrentTimeForTimezone(preferences.timezone);

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return currentTime >= start && currentTime < end;
  }

  private getCurrentTimeForTimezone(timezone?: string): string {
    const now = new Date();

    if (!timezone) {
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    try {
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
      return formatted;
    } catch {
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
  }
}
