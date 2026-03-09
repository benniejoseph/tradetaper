'use client';

import React, { useState } from 'react';
import NotificationList from '@/components/notifications/NotificationList';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import { FaBell, FaCog } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);
  const totalCount = useSelector((state: RootState) => state.notifications.total);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unreadCount} unread of {totalCount} total notifications
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live updates enabled
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-black dark:hover:ring-1 dark:hover:ring-white/10'
            }`}
          >
            <FaBell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-black dark:hover:ring-1 dark:hover:ring-white/10'
            }`}
          >
            <FaCog className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'notifications' ? (
          <NotificationList />
        ) : (
          <NotificationSettings />
        )}
      </div>
    </div>
  );
}
