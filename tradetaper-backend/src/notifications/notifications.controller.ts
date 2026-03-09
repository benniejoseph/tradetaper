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
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NotificationsService,
  NotificationFilter,
} from './notifications.service';
import {
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { ConfigService } from '@nestjs/config';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get notifications for the current user
   */
  @Get()
  async getNotifications(
    @Request() req,
    @Query() query: GetNotificationsQueryDto,
  ) {
    const filter: NotificationFilter = {
      status: query.status as NotificationStatus | undefined,
      type: query.type as NotificationType | undefined,
      unreadOnly: query.unreadOnly,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
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
    @Body() updates: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(req.user.id, updates);
  }

  /**
   * Register push token
   */
  @Patch('push-token')
  async registerPushToken(
    @Request() req,
    @Body() body: RegisterPushTokenDto,
  ) {
    return this.notificationsService.updatePreferences(req.user.id, {
      pushToken: body.token,
    });
  }

  /**
   * Test notification (development only)
   */
  @Get('test')
  async testNotification(@Request() req) {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new NotFoundException();
    }

    const notification = await this.notificationsService.send({
      userId: req.user.id,
      type: NotificationType.SYSTEM_UPDATE,
      title: 'Test Notification',
      message:
        'This is a test notification to verify the system is working correctly.',
      data: { test: true, timestamp: new Date().toISOString() },
    });

    return { success: true, notification };
  }
}
