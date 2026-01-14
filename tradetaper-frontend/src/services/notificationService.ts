import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: 'in_app' | 'push' | 'email';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'delivered' | 'read' | 'failed';
  data?: Record<string, any>;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  icon?: string;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  TRADE_CREATED = 'trade_created',
  TRADE_UPDATED = 'trade_updated',
  TRADE_CLOSED = 'trade_closed',
  MT5_SYNC_COMPLETE = 'mt5_sync_complete',
  MT5_SYNC_ERROR = 'mt5_sync_error',
  ECONOMIC_EVENT_1H = 'economic_event_1h',
  ECONOMIC_EVENT_15M = 'economic_event_15m',
  ECONOMIC_EVENT_NOW = 'economic_event_now',
  AI_INSIGHT = 'ai_insight',
  STRATEGY_ALERT = 'strategy_alert',
  SYSTEM_UPDATE = 'system_update',
  SUBSCRIPTION_EXPIRY = 'subscription_expiry',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  ACCOUNT_LINKED = 'account_linked',
  ACCOUNT_UNLINKED = 'account_unlinked',
}

export interface ChannelPreference {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  enabled: boolean;
  channelPreferences: Record<NotificationType, ChannelPreference>;
  economicAlert1h: boolean;
  economicAlert15m: boolean;
  economicAlertNow: boolean;
  economicEventImportance: string[];
  economicEventCurrencies?: string[];
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  dailyDigestEnabled: boolean;
  dailyDigestTime?: string;
  pushToken?: string;
  emailEnabled: boolean;
}

export interface NotificationFilter {
  status?: string;
  type?: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

class NotificationService {
  /**
   * Get notifications for the current user
   */
  async getNotifications(filter: NotificationFilter = {}): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.type) params.append('type', filter.type);
    if (filter.unreadOnly) params.append('unreadOnly', 'true');
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ markedAsRead: number }> {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreference> {
    const response = await api.get('/notifications/preferences');
    return response.data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(updates: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const response = await api.patch('/notifications/preferences', updates);
    return response.data;
  }

  /**
   * Register push token
   */
  async registerPushToken(token: string): Promise<NotificationPreference> {
    const response = await api.patch('/notifications/push-token', { token });
    return response.data;
  }

  /**
   * Test notification (development)
   */
  async testNotification(): Promise<{ success: boolean; notification: Notification }> {
    const response = await api.get('/notifications/test');
    return response.data;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
