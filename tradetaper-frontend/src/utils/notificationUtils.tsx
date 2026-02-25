import React from 'react';
import { Notification, NotificationType } from '@/services/notificationService';
import {
  FaBell,
  FaChartLine,
  FaCalendarAlt,
  FaBrain,
  FaCog,
  FaExclamationTriangle,
  FaLink,
  FaSync,
} from 'react-icons/fa';

// Helper: Parse economic event data from title or type
export const getEconomicInfo = (notification: Notification): { severity: 'High' | 'Medium' | 'Low', title: string } => {
  let title = notification.title;
  let severity: 'High' | 'Medium' | 'Low' = 'Low';

  // 1. Try to determine severity from priority field
  if (notification.priority === 'urgent') severity = 'High';
  else if (notification.priority === 'high') severity = 'High';
  else if (notification.priority === 'normal') severity = 'Medium';
  else if (notification.priority === 'low') severity = 'Low';

  // 2. Fallback: Parse from emoji in title if priority didn't give High/Medium
  if (title.includes('🔴') || title.includes('High Impact')) severity = 'High';
  else if (title.includes('🟠') || title.includes('Medium Impact')) severity = 'Medium';
  else if (title.includes('🟡') || title.includes('Low Impact')) severity = 'Low';

  // Clean title - Remove emoji warnings and other indicators
  title = title.replace(/^[🔴🟠🟡🟧🟨⚠️\s]+|[🔴🟠🟡🟧🟨⚠️\s]+$/g, '').trim();

  return { title, severity };
};

// Helper: Icon & Color logic
export const getNotificationStyle = (notification: Notification) => {
  const isEconomic = notification.type.startsWith('economic_event');
  
  if (isEconomic) {
    const { severity, title } = getEconomicInfo(notification);
    switch (severity) {
      case 'High':
        return { icon: <FaCalendarAlt />, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/10', badge: 'High', title };
      case 'Medium':
        return { icon: <FaCalendarAlt />, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10', badge: 'Medium', title };
      case 'Low':
        return { icon: <FaCalendarAlt />, color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/10', badge: 'Low', title };
    }
  }

  switch (notification.type) {
    case NotificationType.TRADE_CREATED:
    case NotificationType.TRADE_UPDATED:
    case NotificationType.TRADE_CLOSED:
      return { icon: <FaChartLine />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
    case NotificationType.MT5_SYNC_COMPLETE:
      return { icon: <FaSync />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-emerald-900/20' };
    case NotificationType.MT5_SYNC_ERROR:
      return { icon: <FaExclamationTriangle />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
    case NotificationType.ECONOMIC_EVENT_1H:
    case NotificationType.ECONOMIC_EVENT_15M:
    case NotificationType.ECONOMIC_EVENT_NOW:
      return { icon: <FaCalendarAlt />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    case NotificationType.AI_INSIGHT:
      return { icon: <FaBrain />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-emerald-900/20' };
    case NotificationType.STRATEGY_ALERT:
      return { icon: <FaExclamationTriangle />, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
    case NotificationType.SYSTEM_UPDATE:
      return { icon: <FaCog />, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' };
    case NotificationType.ACCOUNT_LINKED:
    case NotificationType.ACCOUNT_UNLINKED:
      return { icon: <FaLink />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-emerald-900/20' };
    default:
      return { icon: <FaBell />, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' };
  }
};
