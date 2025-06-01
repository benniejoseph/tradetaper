// src/app/(app)/layout.tsx
import AppLayout from '@/components/layout/AppLayout'; // Path to your AppLayout component
import ErrorBoundary from '@/components/common/ErrorBoundary'; // Import ErrorBoundary
import React from 'react';

// Optional: If you want specific metadata for all pages within this (app) group
// export const metadata: Metadata = {
//   title: 'Tradetaper App', // Example, will be appended to root metadata title
// };

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout wraps children with ErrorBoundary and AppLayout
  // AppLayout itself contains ProtectedRoute and the Sidebar + main content structure
  return (
    <ErrorBoundary>
      <AppLayout>{children}</AppLayout>
    </ErrorBoundary>
  );
}