// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import tradesReducer from './features/tradesSlice';
import accountReducer from './features/accountSlice';
import subscriptionReducer from './features/subscriptionSlice';
import mt5AccountsReducer from './features/mt5AccountsSlice';
import { setupAuthInterceptors } from '@/services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trades: tradesReducer,
    accounts: accountReducer,
    subscription: subscriptionReducer,
    mt5Accounts: mt5AccountsReducer,
  },
});

setupAuthInterceptors(store.getState);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;