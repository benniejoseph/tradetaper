import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NotificationsService,
  NotificationFilter,
} from './notifications.service';
import { NotificationStatus, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notifications for the current user
   */
  @Get()
  async getNotifications(
    @Request() req,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filter: NotificationFilter = {
      status,
      type,
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.notificationsService.getUserNotifications(req.user.id, filter);
  }

  /**
   * Get unread notification count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  /**
   * Mark a notification as read
   */
  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * Mark all notifications as read
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const count = await this.notificationsService.markAllAsRead(req.user.id);
    return { markedAsRead: count };
  }

  /**
   * Delete a notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.notificationsService.delete(id, req.user.id);
  }

  /**
   * Get notification preferences
   */
  @Get('preferences')
  async getPreferences(@Request() req) {
    return this.notificationsService.getOrCreatePreferences(req.user.id);
  }

  /**
   * Update notification preferences
   */
  @Patch('preferences')
  async updatePreferences(
    @Request() req,
    @Body() updates: Partial<NotificationPreference>,
  ) {
    // Remove fields that shouldn't be updatable
    delete (updates as any).id;
    delete (updates as any).userId;
    delete (updates as any).createdAt;
    delete (updates as any).updatedAt;

    return this.notificationsService.updatePreferences(req.user.id, updates);
  }

  /**
   * Register push token
   */
  @Patch('push-token')
  async registerPushToken(@Request() req, @Body('token') token: string) {
    return this.notificationsService.updatePreferences(req.user.id, {
      pushToken: token,
    });
  }

  /**
   * Test notification (development only)
   */
  @Get('test')
  async testNotification(@Request() req) {
    const notification = await this.notificationsService.send({
      userId: req.user.id,
      type: NotificationType.SYSTEM_UPDATE,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly.',
      data: { test: true, timestamp: new Date().toISOString() },
    });

    return { success: true, notification };
  }
}
