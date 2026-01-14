'use client';

import React, { useState } from 'react';
import NotificationList from '@/components/notifications/NotificationList';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import { FaBell, FaCog } from 'react-icons/fa';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
