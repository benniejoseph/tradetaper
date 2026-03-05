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
  const selectedRegularAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const { page: tradesPage, limit: tradesLimit, lastFetchIncludeTags } = useSelector((state: RootState) => state.trades);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const tradesRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Setup WebSocket connection for real-time notifications
  const { isConnected, subscribe } = useWebSocket({
    autoConnect: isAuthenticated,
    namespace: '/notifications',
    onConnect: () => console.log('📡 WebSocket connected for notifications'),
    onDisconnect: () => console.log('📡 WebSocket disconnected'),
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
      const notification = data as Notification;
      console.log('🔔 New notification received:', data);
      dispatch(addNotification(notification));
      
      // Spawn custom toast
      toast.custom((t) => (
        <NotificationToast t={t} notification={notification} />
      ), { 
        duration: 5000,
        position: isMobile ? 'top-center' : 'top-right'
      });
    });

    const unsubscribeRead = subscribe('notification:read', (data: unknown) => {
      console.log('✅ Notification marked as read:', data);
      dispatch(notificationRead(data as { id: string }));
    });

    const unsubscribeReadAll = subscribe('notification:readAll', () => {
      console.log('✅ All notifications marked as read');
      dispatch(allNotificationsRead());
    });

    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeReadAll();
    };
  }, [isConnected, isAuthenticated, subscribe, dispatch, isMobile]);

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
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
