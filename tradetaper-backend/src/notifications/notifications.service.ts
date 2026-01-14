import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In, MoreThan } from 'typeorm';
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
import { WebSocketService } from '../websocket/websocket.service';

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
  ) {}

  /**
   * Send a notification to a user
   * Respects user preferences and routes to appropriate channels
   */
  async send(dto: CreateNotificationDto): Promise<Notification> {
    this.logger.log(
      `Sending notification: ${dto.type} to user ${dto.userId}`,
    );

    // Get user preferences
    const preferences = await this.getOrCreatePreferences(dto.userId);

    // Check if notifications are enabled
    if (!preferences.enabled) {
      this.logger.debug(`Notifications disabled for user ${dto.userId}`);
      return this.createNotification(dto, NotificationStatus.DELIVERED);
    }

    // Get channel preferences for this notification type
    const channelPref = preferences.channelPreferences[dto.type] || {
      inApp: true,
      push: false,
      email: false,
    };

    // Create the notification record
    const notification = await this.createNotification(
      dto,
      NotificationStatus.PENDING,
    );

    // Route to appropriate channels
    const deliveryPromises: Promise<void>[] = [];

    if (channelPref.inApp) {
      deliveryPromises.push(this.deliverInApp(notification));
    }

    if (channelPref.push && preferences.pushToken) {
      deliveryPromises.push(this.deliverPush(notification, preferences));
    }

    if (channelPref.email && preferences.emailEnabled) {
      deliveryPromises.push(this.deliverEmail(notification));
    }

    // Wait for all deliveries
    await Promise.allSettled(deliveryPromises);

    // Update status to delivered
    notification.status = NotificationStatus.DELIVERED;
    notification.sentAt = new Date();
    await this.notificationRepository.save(notification);

    return notification;
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
        await this.send({
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          resourceType: notification.resourceType,
          resourceId: notification.resourceId,
          actionUrl: notification.actionUrl,
          icon: notification.icon,
        });

        // Delete the scheduled one (already sent via send())
        await this.notificationRepository.delete(notification.id);
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
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const where: any = { userId };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.unreadOnly) {
      where.status = In([NotificationStatus.DELIVERED, NotificationStatus.PENDING]);
      where.readAt = null;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: filter.limit || 50,
      skip: filter.offset || 0,
    });

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: {
        userId,
        status: In([NotificationStatus.DELIVERED, NotificationStatus.PENDING]),
        readAt: null,
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
        status: NotificationStatus.DELIVERED,
        readAt: null,
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
        status: In([NotificationStatus.DELIVERED, NotificationStatus.PENDING]),
        readAt: null,
      },
    });
  }

  /**
   * Get or create user preferences
   */
  async getOrCreatePreferences(userId: string): Promise<NotificationPreference> {
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
    updates: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    const preferences = await this.getOrCreatePreferences(userId);

    Object.assign(preferences, updates);

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
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      channel: NotificationChannel.IN_APP,
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
      createdAt: notification.createdAt,
    });
  }

  private async deliverPush(
    notification: Notification,
    preferences: NotificationPreference,
  ): Promise<void> {
    this.logger.debug(`Delivering push notification ${notification.id}`);

    // Check quiet hours
    if (preferences.quietHoursEnabled && this.isQuietHours(preferences)) {
      this.logger.debug('Skipping push - quiet hours active');
      return;
    }

    // TODO: Implement FCM push notification
    // This is a placeholder for FCM integration
    this.logger.warn('Push notifications not yet implemented');
  }

  private async deliverEmail(notification: Notification): Promise<void> {
    this.logger.debug(`Delivering email notification ${notification.id}`);

    // TODO: Implement email delivery via SendGrid/Resend
    // This is a placeholder for email integration
    this.logger.warn('Email notifications not yet implemented');
  }

  private isQuietHours(preferences: NotificationPreference): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return currentTime >= start && currentTime < end;
  }
}
