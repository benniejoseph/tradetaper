'use client';

import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { store } from '@/store/store';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { fetchCurrentUser, logout } from '@/store/features/authSlice';
import { setupAuthInterceptors, initializeApiSecurity } from '@/services/api';
import { ThemeProvider } from '@/components/theme-provider';
import React from 'react';
import {
  initializeClientObservability,
  syncObservabilityUser,
} from '@/lib/observability/client';

function ReduxProviderWithInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeClientObservability();

    let lastObservedUserId: string | null = null;
    let lastObservedEmail: string | null = null;
    const syncCurrentUser = () => {
      const currentUser = store.getState().auth.user;
      const currentUserId = currentUser?.id ?? null;
      const currentUserEmail = currentUser?.email ?? null;

      if (
        currentUserId === lastObservedUserId &&
        currentUserEmail === lastObservedEmail
      ) {
        return;
      }

      lastObservedUserId = currentUserId;
      lastObservedEmail = currentUserEmail;
      syncObservabilityUser(
        currentUser
          ? {
              id: currentUser.id,
              email: currentUser.email,
            }
          : null,
      );
    };

    syncCurrentUser();
    const unsubscribe = store.subscribe(syncCurrentUser);

    setupAuthInterceptors(() => store.getState(), () => {
      store.dispatch(logout());
    });

    const bootstrapAuth = async () => {
      await initializeApiSecurity().catch((error: unknown) => {
        console.error('Failed to initialize API security:', error);
      });
      await store.dispatch(fetchCurrentUser());
    };

    void bootstrapAuth();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ReduxProvider store={store}>
      {children}
    </ReduxProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance (only once per app)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReduxProviderWithInit>
        <CurrencyProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </CurrencyProvider>
      </ReduxProviderWithInit>
    </QueryClientProvider>
  );
} 
