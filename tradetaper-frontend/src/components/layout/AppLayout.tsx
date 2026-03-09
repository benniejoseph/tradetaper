// src/components/layout/AppLayout.tsx
"use client";
import React, { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchMT5Accounts, selectSelectedMT5AccountId } from '@/store/features/mt5AccountsSlice';
import { fetchAccounts, selectSelectedAccountId } from '@/store/features/accountSlice';
import { fetchTrades } from '@/store/features/tradesSlice';
import Sidebar from './Sidebar';
// import Header from './Header'; // This is the existing mobile-only header, currently commented out
import ContentHeader from './ContentHeader'; // Import the new ContentHeader
import ProtectedRoute from '../auth/ProtectedRoute';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Toaster, toast } from 'react-hot-toast';
import NotificationToast from '@/components/notifications/NotificationToast';
import { Notification } from '@/services/notificationService';
import {
  fetchNotifications,
  fetchUnreadCount,
  addNotification,
  notificationRead,
  allNotificationsRead,
} from '@/store/features/notificationsSlice';
import { TrialBanner } from '@/components/common/TrialBanner';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const notifications = useSelector(
    (state: RootState) => state.notifications?.notifications || [],
  );
  const selectedRegularAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const { page: tradesPage, limit: tradesLimit, lastFetchIncludeTags } = useSelector((state: RootState) => state.trades);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const tradesRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedNotificationsRef = useRef(false);

  const showNotificationToast = useCallback(
    (notification: Notification) => {
      toast.custom(
        (t) => <NotificationToast t={t} notification={notification} />,
        {
          id: `notification-${notification.id}`,
          duration: 5000,
          position: isMobile ? 'top-center' : 'top-right',
        },
      );
    },
    [isMobile],
  );

  const normalizeRealtimeNotification = useCallback(
    (payload: unknown): Notification | null => {
      if (!payload || typeof payload !== 'object') {
        return null;
      }

      const data = payload as Partial<Notification>;
      if (!data.id || !data.type || !data.title || !data.message) {
        return null;
      }

      return {
        id: data.id,
        userId: data.userId || '',
        type: data.type,
        title: data.title,
        message: data.message,
        channel: data.channel || 'in_app',
        priority: data.priority || 'normal',
        status: data.status || 'delivered',
        data: data.data || {},
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        actionUrl: data.actionUrl,
        icon: data.icon,
        scheduledFor: data.scheduledFor,
        sentAt: data.sentAt || new Date().toISOString(),
        readAt: data.readAt,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    },
    [],
  );

  // Setup WebSocket connection for real-time notifications
  const { isConnected, subscribe } = useWebSocket({
    autoConnect: isAuthenticated,
    namespace: '/notifications',
    onConnect: () => {
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ limit: 20, offset: 0 }));
    },
  });

  // Setup WebSocket connection for real-time trade updates
  const { isConnected: isTradesSocketConnected, subscribe: subscribeTrades } = useWebSocket({
    autoConnect: isAuthenticated,
    namespace: '/trades',
  });

  const refreshTradesData = useCallback(() => {
    const accountId = selectedRegularAccountId || selectedMT5AccountId || undefined;
    dispatch(
      fetchTrades({
        accountId,
        page: tradesPage || 1,
        limit: Math.min(tradesLimit || 1000, 1000),
        includeTags: lastFetchIncludeTags,
        force: true,
      }),
    );
  }, [
    dispatch,
    selectedRegularAccountId,
    selectedMT5AccountId,
    tradesPage,
    tradesLimit,
    lastFetchIncludeTags,
  ]);

  const scheduleTradesRefresh = useCallback(() => {
    if (tradesRefreshTimeoutRef.current) return;

    tradesRefreshTimeoutRef.current = setTimeout(() => {
      tradesRefreshTimeoutRef.current = null;
      refreshTradesData();
    }, 600);
  }, [refreshTradesData]);

  // Fetch MT5 accounts and regular accounts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMT5Accounts());
      dispatch(fetchAccounts());
    }
  }, [dispatch, isAuthenticated]);

  // Subscribe to WebSocket notification events
  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;

    const unsubscribeNew = subscribe('notification:new', (data: unknown) => {
      const notification = normalizeRealtimeNotification(data);
      if (!notification) return;
      dispatch(addNotification(notification));
    });

    const unsubscribeRead = subscribe('notification:read', (data: unknown) => {
      dispatch(notificationRead(data as { id: string }));
    });

    const unsubscribeReadAll = subscribe('notification:readAll', () => {
      dispatch(allNotificationsRead());
    });

    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeReadAll();
    };
  }, [
    isConnected,
    isAuthenticated,
    subscribe,
    dispatch,
    normalizeRealtimeNotification,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      seenNotificationIdsRef.current.clear();
      hasHydratedNotificationsRef.current = false;
      return;
    }

    if (!hasHydratedNotificationsRef.current) {
      notifications.forEach((notification) => {
        seenNotificationIdsRef.current.add(notification.id);
      });
      hasHydratedNotificationsRef.current = true;
      return;
    }

    const now = Date.now();
    const recentWindowMs = 15 * 60 * 1000;

    notifications.forEach((notification) => {
      if (seenNotificationIdsRef.current.has(notification.id)) {
        return;
      }

      seenNotificationIdsRef.current.add(notification.id);

      const isUnreadDelivered =
        notification.status === 'delivered' && !notification.readAt;
      if (!isUnreadDelivered) {
        return;
      }

      const createdAtMs = Date.parse(notification.createdAt);
      const isRecent =
        Number.isFinite(createdAtMs) && now - createdAtMs <= recentWindowMs;
      if (!isRecent) {
        return;
      }

      showNotificationToast(notification);
    });
  }, [isAuthenticated, notifications, showNotificationToast]);

  useEffect(() => {
    if (!isAuthenticated || isConnected) {
      if (notificationPollRef.current) {
        clearInterval(notificationPollRef.current);
        notificationPollRef.current = null;
      }
      return;
    }

    const refresh = () => {
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ limit: 20, offset: 0 }));
    };

    refresh();
    notificationPollRef.current = setInterval(refresh, 60000);

    return () => {
      if (notificationPollRef.current) {
        clearInterval(notificationPollRef.current);
        notificationPollRef.current = null;
      }
    };
  }, [dispatch, isAuthenticated, isConnected]);

  // Subscribe to trade websocket events and refresh store (debounced) to keep dashboard/pages live.
  useEffect(() => {
    if (!isTradesSocketConnected || !isAuthenticated) return;

    const unsubscribeCreated = subscribeTrades('trade:created', () => scheduleTradesRefresh());
    const unsubscribeUpdated = subscribeTrades('trade:updated', () => scheduleTradesRefresh());
    const unsubscribeDeleted = subscribeTrades('trade:deleted', () => scheduleTradesRefresh());
    const unsubscribeBulk = subscribeTrades('trades:bulk', () => scheduleTradesRefresh());

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeBulk();
    };
  }, [isTradesSocketConnected, isAuthenticated, subscribeTrades, scheduleTradesRefresh]);

  useEffect(() => {
    return () => {
      if (tradesRefreshTimeoutRef.current) {
        clearTimeout(tradesRefreshTimeoutRef.current);
      }
      if (notificationPollRef.current) {
        clearInterval(notificationPollRef.current);
      }
    };
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-white dark:bg-black">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          isMobile={isMobile}
          onExpandChange={setIsSidebarExpanded}
        />
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-500 overflow-hidden ${
          isMobile 
            ? 'ml-0' 
            : isSidebarExpanded 
              ? 'ml-72' 
              : 'ml-20'
        }`}>
          {/* Trial Banner — visible only when status is 'trialing' */}
          <TrialBanner />

          {/* Content Header */}
          <ContentHeader
            toggleSidebar={toggleSidebar} 
            isMobile={isMobile}
            isSidebarExpanded={isSidebarExpanded}
          />
          
          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-full h-full overflow-auto">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </div>

        {/* Global Toast Notifications */}
        <Toaster
          position={isMobile ? "top-center" : "top-right"}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(3, 3, 3, 0.92)',
              color: '#F3F4F6',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.55), 0 10px 10px -5px rgba(0, 0, 0, 0.45)',
              maxWidth: isMobile ? '90vw' : '400px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
