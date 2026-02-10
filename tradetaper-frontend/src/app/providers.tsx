'use client';

import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { store } from '@/store/store';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { loadUserFromStorage } from '@/store/features/authSlice';
import { setupAuthInterceptors, initializeApiSecurity } from '@/services/api';

function ReduxProviderWithInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load user from storage on app initialization
    store.dispatch(loadUserFromStorage());

    // Setup auth interceptors to attach JWT token to requests
    setupAuthInterceptors(() => store.getState());

    // SECURITY: Initialize CSRF protection
    initializeApiSecurity().catch((error) => {
      console.error('Failed to initialize API security:', error);
    });
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
          {children}
        </CurrencyProvider>
      </ReduxProviderWithInit>
    </QueryClientProvider>
  );
} 