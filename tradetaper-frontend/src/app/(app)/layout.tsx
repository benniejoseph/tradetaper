// src/app/(app)/layout.tsx
import AppLayout from '@/components/layout/AppLayout'; // Path to your AppLayout component
import ErrorBoundary from '@/components/common/ErrorBoundary'; // Import ErrorBoundary
import { AppProviders } from '@/app/providers';
import type { Metadata } from 'next';
import React from 'react';
import './app-only.css';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout wraps children with ErrorBoundary and AppLayout
  // AppLayout itself contains ProtectedRoute and the Sidebar + main content structure
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppLayout>{children}</AppLayout>
      </ErrorBoundary>
    </AppProviders>
  );
}
