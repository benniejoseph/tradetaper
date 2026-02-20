// src/store/features/mt5AccountsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { authApiClient } from '@/services/api';
import toast from 'react-hot-toast';

export interface MT5Account {
  id: string;
  userId?: string;
  accountName: string;
  server: string;
  login: string;
  isActive: boolean;
  isRealAccount?: boolean;
  balance?: number;
  equity?: number;
  currency?: string;
  connectionStatus?: string;
  deploymentState?: string;
  connectionState?: string;
  isStreamingActive?: boolean;
  lastSyncAt?: string;
  lastHeartbeatAt?: string;
  lastSyncError?: string;
  syncAttempts?: number;
  totalTradesImported?: number;
  metaApiAccountId?: string;
  provisioningProfileId?: string;
  region?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  target?: number;
}

export interface CreateMT5AccountPayload {
  accountName: string;
  server: string;
  login: string;
  password?: string;
  isRealAccount?: boolean;
  isActive?: boolean;
  target?: number;
}

export interface UpdateMT5AccountPayload {
  accountName?: string;
  server?: string;
  login?: string;
  password?: string;
  isActive?: boolean;
  target?: number;
}

interface MT5AccountsState {
  accounts: MT5Account[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MT5AccountsState = {
  accounts: [],
  selectedAccountId: null,
  isLoading: false,
  error: null,
};

// Fetch all MT5 accounts
export const fetchMT5Accounts = createAsyncThunk(
  'mt5Accounts/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApiClient.get('/mt5-accounts');
      return response.data as MT5Account[];
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch MT5 accounts';
      return rejectWithValue(message);
    }
  }
);

// Create new MT5 account
export const createMT5Account = createAsyncThunk(
  'mt5Accounts/createAccount',
  async (accountData: CreateMT5AccountPayload, { rejectWithValue }) => {
    try {
      const response = await authApiClient.post('/mt5-accounts/create', accountData);
      toast.success('MT5 account created successfully');
      return response.data as MT5Account;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create MT5 account';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update MT5 account
export const updateMT5Account = createAsyncThunk(
  'mt5Accounts/updateAccount',
  async ({ id, data }: { id: string; data: UpdateMT5AccountPayload }, { rejectWithValue }) => {
    try {
      const response = await authApiClient.put(`/mt5-accounts/${id}`, data);
      toast.success('MT5 account updated successfully');
      return response.data as MT5Account;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update MT5 account';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Delete MT5 account
export const deleteMT5Account = createAsyncThunk(
  'mt5Accounts/deleteAccount',
  async (id: string, { rejectWithValue }) => {
    try {
      await authApiClient.delete(`/mt5-accounts/${id}`);
      toast.success('MT5 account deleted successfully');
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete MT5 account';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Sync MT5 account (Terminal Farm)
export const syncMT5Account = createAsyncThunk(
  'mt5Accounts/syncAccount',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await authApiClient.post(`/mt5-accounts/${id}/sync`);
      toast.success('Sync requested. Trades will update shortly.');
      dispatch(fetchMT5Accounts());
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to sync MT5 account';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Slice
const mt5AccountsSlice = createSlice({
  name: 'mt5Accounts',
  initialState,
  reducers: {
    setSelectedMT5Account: (state, action: PayloadAction<string | null>) => {
      state.selectedAccountId = action.payload;
    },
    clearMT5Accounts: (state) => {
      state.accounts = [];
      state.selectedAccountId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch accounts
      .addCase(fetchMT5Accounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMT5Accounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        state.error = null;
      })
      .addCase(fetchMT5Accounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create account
      .addCase(createMT5Account.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMT5Account.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts.push(action.payload);
        state.selectedAccountId = action.payload.id;
        state.error = null;
      })
      .addCase(createMT5Account.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update account
      .addCase(updateMT5Account.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMT5Account.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.accounts.findIndex((acc) => acc.id === action.payload.id);
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateMT5Account.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete account
      .addCase(deleteMT5Account.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMT5Account.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = state.accounts.filter((acc) => acc.id !== action.payload);
        if (state.selectedAccountId === action.payload) {
          state.selectedAccountId = null;
        }
        state.error = null;
      })
      .addCase(deleteMT5Account.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Sync account
      .addCase(syncMT5Account.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncMT5Account.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(syncMT5Account.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions & Selectors
export const { setSelectedMT5Account, clearMT5Accounts } = mt5AccountsSlice.actions;

export const selectMT5Accounts = (state: RootState) => state.mt5Accounts.accounts;
export const selectSelectedMT5AccountId = (state: RootState) => state.mt5Accounts.selectedAccountId;
export const selectSelectedMT5Account = (state: RootState) => {
  const selectedId = state.mt5Accounts.selectedAccountId;
  return selectedId ? state.mt5Accounts.accounts.find((acc) => acc.id === selectedId) : null;
};
export const selectMT5AccountsLoading = (state: RootState) => state.mt5Accounts.isLoading;
export const selectMT5AccountsError = (state: RootState) => state.mt5Accounts.error;

export default mt5AccountsSlice.reducer;
