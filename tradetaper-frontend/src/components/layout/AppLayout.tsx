// src/components/layout/AppLayout.tsx
"use client";
import React, { ReactNode, useState } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize WebSocket connection for the entire app
  useWebSocket({
    enabled: true,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error),
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Main Content Area */}
        <div className="md:ml-64">
          {/* Content Header */}
          <ContentHeader toggleSidebar={toggleSidebar} />
          
          {/* Page Content */}
          <main className="p-4 md:p-6 lg:p-8 max-w-full">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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