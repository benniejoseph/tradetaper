// src/components/layout/AppLayout.tsx
"use client";
import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
// import Header from './Header'; // This is the existing mobile-only header, currently commented out
import ContentHeader from './ContentHeader'; // Import the new ContentHeader
import ProtectedRoute from '../auth/ProtectedRoute';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[var(--color-light-secondary)] text-[var(--color-text-dark-primary)] dark:bg-dark-primary dark:text-text-light-primary">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <div className="flex flex-col flex-1">
          {/* New ContentHeader - will contain logo, account, global actions, and mobile nav toggle */}
          <ContentHeader isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          
          {/* Existing mobile-only Header - for now, kept for ThemeToggleButton, might be merged/removed later */}
          {/* We need to ensure it doesn't clash or become redundant with ContentHeader on mobile */}
          {/* For now, let's hide it completely and integrate its necessary parts (like theme toggle) elsewhere if ContentHeader takes over fully */}
          {/* <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} /> */}
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {/* This is where the page content will go */}
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}