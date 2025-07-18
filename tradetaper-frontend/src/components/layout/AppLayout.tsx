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

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Initialize WebSocket connection for the entire app
  useWebSocket({
    enabled: true,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error),
  });

  // Fetch MT5 accounts and regular accounts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMT5Accounts());
      dispatch(fetchAccounts());
    }
  }, [dispatch, isAuthenticated]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          isMobile={isMobile}
          onExpandChange={setIsSidebarExpanded}
        />
        
        {/* Main Content Area */}
        <div className={`transition-all duration-500 ${
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
          <main className="p-4 md:p-6 lg:p-8 max-w-full">
            <div className="max-w-7xl mx-auto">
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