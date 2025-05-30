// src/store/StoreProvider.tsx
"use client"; // This is a client component

import { useEffect,useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store'; // Adjust path if necessary
import { loadUserFromStorage } from './features/authSlice';
// If you have preloaded state or need to initialize parts of the store
// import { initializeSomeState } from './features/someSlice';

export default function StoreProvider({
  // preloadedState, // Optional: for preloading state from server components
  children,
}: {
  // preloadedState?: Partial<RootState>;
  children: React.ReactNode;
}) {
  const storeRef = useRef<typeof store | null>(null);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = store; // Use the global store instance
    storeRef.current.dispatch(loadUserFromStorage());
    // Or, if you need to create a new store per request or with preloadedState:
    // storeRef.current = configureStore({
    //   reducer: { /* your reducers */ },
    //   preloadedState,
    // });
    // Example: if (preloadedState) storeRef.current.dispatch(initializeSomeState(preloadedState.some));
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}