// src/components/layout/AppLayout.tsx
"use client";
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import ProtectedRoute from '../auth/ProtectedRoute'; // We'll wrap content with ProtectedRoute

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ProtectedRoute> {/* Ensure only authenticated users see this layout */}
      <div className="flex min-h-screen bg-gray-900 text-white">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* This is where the page content will go */}
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}