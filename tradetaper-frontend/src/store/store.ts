// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import tradesReducer from './features/tradesSlice';
import accountReducer from './features/accountSlice';
import { setupAuthInterceptors } from '@/services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trades: tradesReducer,
    accounts: accountReducer,
  },
});

setupAuthInterceptors(store.getState, store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;