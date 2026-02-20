'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchPreferences, updatePreferences } from '@/store/features/notificationsSlice';
import { NotificationPreference, NotificationType, ChannelPreference } from '@/services/notificationService';
import {
  FaBell,
  FaMobile,
  FaEnvelope,
  FaCalendarAlt,
  FaChartLine,
  FaBrain,
  FaCog,
  FaMoon,
  FaClock,
  FaSave,
  FaUsers,
} from 'react-icons/fa';

export default function NotificationSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const { preferences, isLoadingPreferences } = useSelector(
    (state: RootState) => state.notifications
  );

  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreference>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchPreferences());
  }, [dispatch]);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(updatePreferences(localPrefs)).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
    setIsSaving(false);
  };

  const updateChannelPref = (
    type: NotificationType,
    channel: keyof ChannelPreference,
    value: boolean
  ) => {
    setLocalPrefs((prev) => ({
      ...prev,
      channelPreferences: {
        ...(prev.channelPreferences || {}),
        [type]: {
          ...(prev.channelPreferences?.[type] || { inApp: true, push: false, email: false }),
          [channel]: value,
        },
      },
    }));
  };

  const notificationGroups = [
    {
      title: 'Trade Notifications',
      icon: <FaChartLine className="text-emerald-500" />,
      types: [
        { type: NotificationType.TRADE_CREATED, label: 'Trade Created' },
        { type: NotificationType.TRADE_UPDATED, label: 'Trade Updated' },
        { type: NotificationType.TRADE_CLOSED, label: 'Trade Closed' },
        { type: NotificationType.MT5_SYNC_COMPLETE, label: 'MT5 Sync Complete' },
        { type: NotificationType.MT5_SYNC_ERROR, label: 'MT5 Sync Error' },
      ],
    },
    {
      title: 'Economic Calendar',
      icon: <FaCalendarAlt className="text-orange-500" />,
      types: [
        { type: NotificationType.ECONOMIC_EVENT_1H, label: '1 Hour Before Event' },
        { type: NotificationType.ECONOMIC_EVENT_15M, label: '15 Minutes Before Event' },
        { type: NotificationType.ECONOMIC_EVENT_NOW, label: 'Event Starting Now' },
      ],
    },
    {
      title: 'AI & Strategy',
      icon: <FaBrain className="text-purple-500" />,
      types: [
        { type: NotificationType.AI_INSIGHT, label: 'AI Insights' },
        { type: NotificationType.STRATEGY_ALERT, label: 'Strategy Alerts' },
      ],
    },
    {
      title: 'System',
      icon: <FaCog className="text-gray-500" />,
      types: [
        { type: NotificationType.SYSTEM_UPDATE, label: 'System Updates' },
        { type: NotificationType.SUBSCRIPTION_EXPIRY, label: 'Subscription Expiry' },
      ],
    },
    {
      title: 'Community',
      icon: <FaUsers className="text-emerald-500" />,
      types: [
        { type: NotificationType.COMMUNITY_POST, label: 'New Community Posts' },
        { type: NotificationType.COMMUNITY_REPLY, label: 'Replies to Your Posts' },
        { type: NotificationType.COMMUNITY_MENTION, label: 'Mentions' },
      ],
    },
  ];

  if (isLoadingPreferences && !preferences) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure how and when you receive notifications
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            saveSuccess
              ? 'bg-green-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          } disabled:opacity-50`}
        >
          <FaSave className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Master Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <FaBell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Enable Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Master toggle for all notifications
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPrefs.enabled ?? true}
              onChange={(e) => setLocalPrefs({ ...localPrefs, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Economic Alert Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <FaCalendarAlt className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Economic Event Alerts
          </h3>
        </div>

        <div className="space-y-4">
          {/* Alert Timing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.economicAlert1h ?? true}
                onChange={(e) => setLocalPrefs({ ...localPrefs, economicAlert1h: e.target.checked })}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                1 hour before
              </span>
            </label>

            <label className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.economicAlert15m ?? true}
                onChange={(e) => setLocalPrefs({ ...localPrefs, economicAlert15m: e.target.checked })}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                15 minutes before
              </span>
            </label>

            <label className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.economicAlertNow ?? false}
                onChange={(e) => setLocalPrefs({ ...localPrefs, economicAlertNow: e.target.checked })}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                When event starts
              </span>
            </label>
          </div>

          {/* Event Importance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Importance
            </label>
            <div className="flex flex-wrap gap-2">
              {['high', 'medium', 'low'].map((level) => {
                const isSelected = localPrefs.economicEventImportance?.includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => {
                      const current = localPrefs.economicEventImportance || ['high', 'medium'];
                      const updated = isSelected
                        ? current.filter((l) => l !== level)
                        : [...current, level];
                      setLocalPrefs({ ...localPrefs, economicEventImportance: updated });
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? level === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : level === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)} Impact
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Channel Preferences by Type */}
      {notificationGroups.map((group) => (
        <div
          key={group.title}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            {group.icon}
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {group.title}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="pb-3 font-medium">Notification Type</th>
                  <th className="pb-3 font-medium text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <FaBell className="w-3.5 h-3.5" />
                      <span>In-App</span>
                    </div>
                  </th>
                  <th className="pb-3 font-medium text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <FaMobile className="w-3.5 h-3.5" />
                      <span>Push</span>
                    </div>
                  </th>
                  <th className="pb-3 font-medium text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <FaEnvelope className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.types.map(({ type, label }) => {
                  const pref = localPrefs.channelPreferences?.[type] || {
                    inApp: true,
                    push: false,
                    email: false,
                  };

                  return (
                    <tr
                      key={type}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-4 text-sm text-gray-900 dark:text-white">
                        {label}
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="checkbox"
                          checked={pref.inApp}
                          onChange={(e) => updateChannelPref(type, 'inApp', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="checkbox"
                          checked={pref.push}
                          onChange={(e) => updateChannelPref(type, 'push', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="checkbox"
                          checked={pref.email}
                          onChange={(e) => updateChannelPref(type, 'email', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaMoon className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Quiet Hours
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pause push and email notifications during specific hours
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPrefs.quietHoursEnabled ?? false}
              onChange={(e) => setLocalPrefs({ ...localPrefs, quietHoursEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {localPrefs.quietHoursEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={localPrefs.quietHoursStart || '22:00'}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, quietHoursStart: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={localPrefs.quietHoursEnd || '08:00'}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, quietHoursEnd: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
