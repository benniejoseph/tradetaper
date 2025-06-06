'use client';

import { Provider as ReduxProvider } from 'react-redux';
import { useEffect } from 'react';
import { store } from '@/store/store';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { loadUserFromStorage } from '@/store/features/authSlice';

function ReduxProviderWithInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load user from storage on app initialization
    store.dispatch(loadUserFromStorage());
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