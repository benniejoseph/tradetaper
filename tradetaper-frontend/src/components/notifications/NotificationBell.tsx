'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/store/features/notificationsSlice';
import { Notification, NotificationType } from '@/services/notificationService';
import { useRouter } from 'next/navigation';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTimes,
  FaChartLine,
  FaCalendarAlt,
  FaBrain,
  FaCog,
  FaExclamationTriangle,
  FaLink,
  FaSync,
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { notifications, unreadCount, isLoading } = useSelector(
    (state: RootState) => state.notifications
  );

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchUnreadCount());
    dispatch(fetchNotifications({ limit: 10 }));
  }, [dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.status !== 'read') {
      dispatch(markNotificationAsRead(notification.id));
    }

    // Navigate if there's an action URL
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
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
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default:
        return '';
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <FaBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <FaCheckDouble className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                Loading...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FaBell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    flex items-start space-x-3 px-4 py-3 cursor-pointer
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    ${notification.status !== 'read' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}
                    ${getPriorityStyles(notification.priority)}
                  `}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 dark:text-white truncate ${
                      notification.status !== 'read' ? 'font-semibold' : ''
                    }`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {notification.status !== 'read' && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  router.push('/notifications');
                  setIsOpen(false);
                }}
                className="w-full py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
