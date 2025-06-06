// src/store/features/mt5AccountsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MT5Account, CreateMT5AccountPayload, UpdateMT5AccountPayload } from '@/types/mt5Account';
import { MT5AccountsService } from '@/services/mt5AccountsService';
import { RootState } from '../store';
import toast from 'react-hot-toast';

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

// Async Thunks
export const fetchMT5Accounts = createAsyncThunk(
  'mt5Accounts/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const accounts = await MT5AccountsService.getAccounts();
      return accounts;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch MT5 accounts');
    }
  }
);

export const createMT5Account = createAsyncThunk(
  'mt5Accounts/createAccount',
  async (accountData: CreateMT5AccountPayload, { rejectWithValue }) => {
    try {
      const newAccount = await MT5AccountsService.createAccount(accountData);
      toast.success('MT5 account created successfully');
      return newAccount;
    } catch (error) {
      toast.error((error as Error).message || 'Failed to create MT5 account');
      return rejectWithValue((error as Error).message || 'Failed to create MT5 account');
    }
  }
);

export const updateMT5Account = createAsyncThunk(
  'mt5Accounts/updateAccount',
  async ({ id, data }: { id: string; data: UpdateMT5AccountPayload }, { rejectWithValue }) => {
    try {
      const updatedAccount = await MT5AccountsService.updateAccount(id, data);
      toast.success('MT5 account updated successfully');
      return updatedAccount;
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update MT5 account');
      return rejectWithValue((error as Error).message || 'Failed to update MT5 account');
    }
  }
);

export const deleteMT5Account = createAsyncThunk(
  'mt5Accounts/deleteAccount',
  async (id: string, { rejectWithValue }) => {
    try {
      await MT5AccountsService.deleteAccount(id);
      toast.success('MT5 account deleted successfully');
      return id;
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete MT5 account');
      return rejectWithValue((error as Error).message || 'Failed to delete MT5 account');
    }
  }
);

export const syncMT5Account = createAsyncThunk(
  'mt5Accounts/syncAccount',
  async (id: string, { rejectWithValue }) => {
    try {
      const updatedAccount = await MT5AccountsService.syncAccount(id);
      toast.success('MT5 account synced successfully');
      return updatedAccount;
    } catch (error) {
      toast.error((error as Error).message || 'Failed to sync MT5 account');
      return rejectWithValue((error as Error).message || 'Failed to sync MT5 account');
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
      .addCase(syncMT5Account.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.accounts.findIndex((acc) => acc.id === action.payload.id);
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
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