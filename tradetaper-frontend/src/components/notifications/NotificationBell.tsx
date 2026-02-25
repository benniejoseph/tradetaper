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

import { getNotificationStyle } from '@/utils/notificationUtils';

export default function NotificationBell() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Use safe selector with fallback
  const notifications = useSelector((state: RootState) => state.notifications?.notifications || []);
  const unreadCount = useSelector((state: RootState) => state.notifications?.unreadCount || 0);
  const isLoading = useSelector((state: RootState) => state.notifications?.isLoading || false);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount with error handling
  useEffect(() => {
    try {
      dispatch(fetchUnreadCount()).catch((err: any) =>
        console.error('Failed to fetch unread count:', err)
      );
      dispatch(fetchNotifications({ limit: 10 })).catch((err: any) =>
        console.error('Failed to fetch notifications:', err)
      );
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
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

  const recentNotifications = notifications.slice(0, 5);

  // Debug log when isOpen changes
  useEffect(() => {
    console.log('NotificationBell isOpen state changed to:', isOpen);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
        type="button"
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
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
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
              recentNotifications.map((notification: Notification) => {
                const style = getNotificationStyle(notification);
                const isUnread = notification.status !== 'read';

                return (
                  <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                    bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                    ${isUnread ? 'shadow-sm ring-1 ring-emerald-500/20' : 'shadow-sm'}
                  `}
                >
                  {/* Icon */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${style.bg} ${style.color}
                  `}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-col gap-0.5">
                       <div className="flex items-center gap-2 flex-wrap">
                         {/* Severity Badge */}
                         {style.badge && (
                           <span className={`
                             ${style.bg} ${style.color}
                             px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-current/10
                           `}>
                             {style.badge}
                           </span>
                         )}
                         <p className={`text-sm leading-snug truncate ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                           {style.title || notification.title}
                         </p>
                       </div>
                       
                       <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                         {notification.message}
                       </p>
                       <p className="text-xs text-gray-400 mt-1.5 font-medium">
                         {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                       </p>
                    </div>
                  </div>

                  {/* Unread Indicator Dot */}
                  {isUnread && (
                    <div className="absolute top-3 right-3">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                  )}
                </div>
              );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
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
