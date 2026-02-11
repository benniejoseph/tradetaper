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
  FaInbox,
  FaCircle,
} from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationListProps {
  showFilters?: boolean;
}

export default function NotificationList({ showFilters = true }: NotificationListProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { notifications, unreadCount, isLoading, hasMore } = useSelector(
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

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(markNotificationAsRead(id));
  };

  const loadMore = () => {
    dispatch(fetchNotifications({
      limit: 50,
      offset: notifications.length,
      unreadOnly: filter === 'unread',
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }));
  };

  // Helper: Icon & Color logic
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TRADE_CREATED:
      case NotificationType.TRADE_UPDATED:
      case NotificationType.TRADE_CLOSED:
        return { icon: <FaChartLine />, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
      case NotificationType.MT5_SYNC_COMPLETE:
        return { icon: <FaSync />, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
      case NotificationType.MT5_SYNC_ERROR:
        return { icon: <FaExclamationTriangle />, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
      case NotificationType.ECONOMIC_EVENT_1H:
      case NotificationType.ECONOMIC_EVENT_15M:
      case NotificationType.ECONOMIC_EVENT_NOW:
        return { icon: <FaCalendarAlt />, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
      case NotificationType.AI_INSIGHT:
        return { icon: <FaBrain />, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
      case NotificationType.STRATEGY_ALERT:
        return { icon: <FaExclamationTriangle />, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
      case NotificationType.ACCOUNT_LINKED:
      case NotificationType.ACCOUNT_UNLINKED:
        return { icon: <FaLink />, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
      default:
        return { icon: <FaBell />, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' };
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    let key: string;
    if (isToday(date)) key = 'Today';
    else if (isYesterday(date)) key = 'Yesterday';
    else key = format(date, 'MMMM d, yyyy');

    if (!groups[key]) groups[key] = [];
    groups[key].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'trade_created', label: 'Trade Activity' },
    { value: 'economic_event_1h', label: 'Economic Cal' },
    { value: 'ai_insight', label: 'AI Insights' },
    { value: 'system_update', label: 'System' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Feed</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
             Stay updated with your trading activity and alerts.
           </p>
        </div>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="group flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
            >
              <FaCheckDouble className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-1">
            {/* Filter Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {['all', 'unread'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as 'all' | 'unread')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === f
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Type Select */}
            <div className="relative">
               <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-transparent text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
              >
                {notificationTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-white dark:bg-gray-800">
                    {type.label}
                  </option>
                ))}
              </select>
               <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
            </div>
        </div>
      )}

      {/* Notification Stream */}
      <div className="space-y-8">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
             <p className="text-gray-400 text-sm">Loading feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700/50">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-300 dark:text-gray-500">
              <FaInbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              All caught up!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              {filter === 'unread' 
                ? "No unread notifications to display." 
                : "Your activity feed is empty right now."}
            </p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date} className="relative">
              <div className="sticky top-[72px] z-10 py-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pl-1">
                  {date}
                </h3>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((notification) => {
                    const style = getNotificationStyle(notification.type);
                    const isUnread = notification.status !== 'read';

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          group relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200
                          ${isUnread 
                            ? 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700' 
                            : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        {/* Icon */}
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg
                          ${style.bg} ${style.color}
                        `}>
                          {style.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                             <div>
                               <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                 {notification.title}
                               </p>
                               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                 {notification.message}
                               </p>
                               <p className="text-xs text-gray-400 mt-2 font-medium">
                                 {format(new Date(notification.createdAt), 'h:mm a')}
                               </p>
                             </div>
                             
                             {/* Actions (visible on hover or always for unread) */}
                             <div className="flex flex-col items-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                  {isUnread && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(e, notification.id)}
                                      className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                                      title="Mark as read"
                                    >
                                      <FaCheck className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDelete(e, notification.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                    title="Delete"
                                  >
                                    <FaTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Unread Indicator Dot */}
                        {isUnread && (
                          <div className="absolute top-5 right-4 sm:static sm:top-auto sm:right-auto sm:mt-2">
                             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && (
         <div className="flex justify-center pt-4 pb-8">
            <button
               onClick={loadMore}
               disabled={isLoading}
               className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
             >
               {isLoading ? 'Loading...' : 'Load Older Notifications'}
             </button>
         </div>
      )}
    </div>
  );
}
