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
import { Notification } from '@/services/notificationService';
import { useRouter } from 'next/navigation';
import {
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaInbox,
} from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotificationStyle } from '@/utils/notificationUtils';

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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchNotifications({
      limit: 50,
      unreadOnly: filter === 'unread',
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }));
  }, [dispatch, filter, typeFilter]);

  const handleNotificationClick = async (notification: Notification) => {
    const isUnread = notification.status === 'delivered' && !notification.readAt;
    if (isUnread) {
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

  const visibleNotifications = notifications.filter((notification) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
    );
  });

  // Group notifications by date
  const groupedNotifications = visibleNotifications.reduce((groups, notification) => {
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
    { value: 'mt5_sync_error', label: 'MT5 Sync' },
    { value: 'economic_event_1h', label: 'Economic Cal' },
    { value: 'ai_insight', label: 'AI Insights' },
    { value: 'subscription_reminder', label: 'Billing' },
    { value: 'system_update', label: 'System' },
    { value: 'community_post', label: 'Community' },
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
            <div className="flex bg-gray-100 dark:bg-black dark:ring-1 dark:ring-white/10 rounded-xl p-1">
              {['all', 'unread'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as 'all' | 'unread')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === f
                      ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications"
                className="px-3 py-1.5 bg-transparent text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              />
              <div className="relative">
                 <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-transparent text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                >
                  {notificationTypes.map((type) => (
                    <option key={type.value} value={type.value} className="bg-white dark:bg-black">
                      {type.label}
                    </option>
                  ))}
                </select>
                 <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
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
        ) : visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50 dark:bg-black rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-gray-300 dark:text-gray-500">
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
              <div className="sticky top-[72px] z-10 py-2 bg-gray-50/95 dark:bg-black/95 backdrop-blur-sm mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pl-1">
                  {date}
                </h3>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((notification) => {
                    const style = getNotificationStyle(notification);
                    const isUnread =
                      notification.status === 'delivered' && !notification.readAt;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          group relative flex items-start gap-4 p-5 rounded-xl cursor-pointer transition-all duration-200
                          bg-white dark:bg-black border border-gray-200 dark:border-white/10
                          hover:shadow-md hover:border-gray-300 dark:hover:border-emerald-500/30
                          ${isUnread ? 'shadow-sm ring-1 ring-emerald-500/20' : 'shadow-sm'}
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
                               <div className="flex items-center gap-2 flex-wrap">
                                 {/* Severity Badge */}
                                 {style.badge && (
                                   <span className={`
                                     ${style.bg} ${style.color}
                                     px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-current/10
                                   `}>
                                     {style.badge}
                                   </span>
                                 )}
                                 <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                   {style.title || notification.title}
                                 </p>
                               </div>
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
                                      className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-black rounded-md transition-colors"
                                      title="Mark as read"
                                    >
                                      <FaCheck className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDelete(e, notification.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-black rounded-md transition-colors"
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
                             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-black" />
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
               className="px-6 py-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-950 transition-colors shadow-sm"
             >
               {isLoading ? 'Loading...' : 'Load Older Notifications'}
             </button>
         </div>
      )}
    </div>
  );
}
