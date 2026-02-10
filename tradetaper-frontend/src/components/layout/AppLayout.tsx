// src/components/layout/AppLayout.tsx
"use client";
import React, { ReactNode, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchMT5Accounts } from '@/store/features/mt5AccountsSlice';
import { fetchAccounts } from '@/store/features/accountSlice';
import Sidebar from './Sidebar';
// import Header from './Header'; // This is the existing mobile-only header, currently commented out
import ContentHeader from './ContentHeader'; // Import the new ContentHeader
import ProtectedRoute from '../auth/ProtectedRoute';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Toaster } from 'react-hot-toast';
import {
  addNotification,
  notificationRead,
  allNotificationsRead,
} from '@/store/features/notificationsSlice';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Setup WebSocket connection for real-time notifications
  const { isConnected, subscribe } = useWebSocket({
    autoConnect: isAuthenticated,
    namespace: '/notifications',
    onConnect: () => console.log('📡 WebSocket connected for notifications'),
    onDisconnect: () => console.log('📡 WebSocket disconnected'),
  });

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

    const unsubscribeNew = subscribe('notification:new', (data: any) => {
      console.log('🔔 New notification received:', data);
      dispatch(addNotification(data));
    });

    const unsubscribeRead = subscribe('notification:read', (data: any) => {
      console.log('✅ Notification marked as read:', data);
      dispatch(notificationRead(data));
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
  }, [isConnected, isAuthenticated, subscribe, dispatch]);

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