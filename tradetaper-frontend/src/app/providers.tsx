'use client';

import { Provider as ReduxProvider } from 'react-redux';
import { useEffect } from 'react';
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
  return (
    <ReduxProviderWithInit>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </ReduxProviderWithInit>
  );
} 