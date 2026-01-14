'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/store/features/notificationsSlice';
import { Notification, NotificationType } from '@/services/notificationService';
import { useRouter } from 'next/navigation';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaChartLine,
  FaCalendarAlt,
  FaBrain,
  FaCog,
  FaExclamationTriangle,
  FaLink,
  FaSync,
  FaFilter,
  FaInbox,
} from 'react-icons/fa';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface NotificationListProps {
  showFilters?: boolean;
}

export default function NotificationList({ showFilters = true }: NotificationListProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { notifications, unreadCount, total, isLoading, hasMore } = useSelector(
    (state: RootState) => state.notifications
  );

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchNotifications({
      limit: 50,
      unreadOnly: filter === 'unread',
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }));
  }, [dispatch, filter, typeFilter]);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status !== 'read') {
      dispatch(markNotificationAsRead(notification.id));
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(markNotificationAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const loadMore = () => {
    dispatch(fetchNotifications({
      limit: 50,
      offset: notifications.length,
      unreadOnly: filter === 'unread',
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TRADE_CREATED:
      case NotificationType.TRADE_UPDATED:
      case NotificationType.TRADE_CLOSED:
        return <FaChartLine className="text-emerald-500" />;
      case NotificationType.MT5_SYNC_COMPLETE:
        return <FaSync className="text-blue-500" />;
      case NotificationType.MT5_SYNC_ERROR:
        return <FaExclamationTriangle className="text-red-500" />;
      case NotificationType.ECONOMIC_EVENT_1H:
      case NotificationType.ECONOMIC_EVENT_15M:
      case NotificationType.ECONOMIC_EVENT_NOW:
        return <FaCalendarAlt className="text-orange-500" />;
      case NotificationType.AI_INSIGHT:
        return <FaBrain className="text-purple-500" />;
      case NotificationType.STRATEGY_ALERT:
        return <FaExclamationTriangle className="text-yellow-500" />;
      case NotificationType.SYSTEM_UPDATE:
        return <FaCog className="text-gray-500" />;
      case NotificationType.ACCOUNT_LINKED:
      case NotificationType.ACCOUNT_UNLINKED:
        return <FaLink className="text-blue-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      default:
        return 'border-l-4 border-transparent';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, yyyy HH:mm');
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    let key: string;

    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else {
      key = format(date, 'MMMM d, yyyy');
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'trade_created', label: 'Trade Created' },
    { value: 'trade_updated', label: 'Trade Updated' },
    { value: 'economic_event_1h', label: 'Economic (1hr)' },
    { value: 'economic_event_15m', label: 'Economic (15min)' },
    { value: 'ai_insight', label: 'AI Insights' },
    { value: 'system_update', label: 'System' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <FaCheckDouble className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Read/Unread Filter */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'unread'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            {notificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading && notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <FaInbox className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'unread'
                ? "You've read all your notifications!"
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedNotifications).map(([date, items]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {date}
                  </span>
                </div>

                {/* Notifications for this date */}
                {items.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      flex items-start space-x-4 px-4 py-4 cursor-pointer
                      hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                      border-b border-gray-100 dark:border-gray-700/50 last:border-b-0
                      ${notification.status !== 'read' ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}
                      ${getPriorityStyles(notification.priority)}
                    `}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-medium text-gray-900 dark:text-white ${
                            notification.status !== 'read' ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-4">
                          {notification.status !== 'read' && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                              className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {notification.status !== 'read' && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
