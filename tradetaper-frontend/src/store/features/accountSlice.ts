import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { authApiClient } from '@/services/api';

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  description?: string;
  target?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  name: string;
  balance: number;
  currency?: string;
  description?: string;
  target?: number;
  isActive?: boolean;
}

export interface UpdateAccountPayload {
  id: string;
  name?: string;
  balance?: number;
  currency?: string;
  description?: string;
  target?: number;
  isActive?: boolean;
}

// Fetch all accounts for the authenticated user
export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAccounts',
  async () => {
    const response = await authApiClient.get('/users/accounts');
    return response.data as Account[];
  }
);

// Create a new account
export const createAccount = createAsyncThunk(
  'accounts/createAccount',
  async (accountData: CreateAccountPayload) => {
    const response = await authApiClient.post('/users/accounts', accountData);
    return response.data as Account;
  }
);

// Update an existing account
export const updateAccountThunk = createAsyncThunk(
  'accounts/updateAccount',
  async ({ id, ...updateData }: UpdateAccountPayload & { id: string }) => {
    const response = await authApiClient.put(`/users/accounts/${id}`, updateData);
    return response.data as Account;
  }
);

// Delete an account
export const deleteAccountThunk = createAsyncThunk(
  'accounts/deleteAccount',
  async (id: string) => {
    await authApiClient.delete(`/users/accounts/${id}`);
    return id;
  }
);

// Payload for updating an account, ID is required to find the account
type UpdateAccountSlicePayload = Partial<Omit<Account, 'id'>> & { id: string };

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  accounts: [],
  selectedAccountId: null, // Default to show all trades from all accounts
  isLoading: false,
  error: null,
};

const accountSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<Account[]>) => {
      state.accounts = action.payload;
      // Only set a default selected account if the current one is invalid, but don't auto-select if null
      if (state.selectedAccountId && !state.accounts.find(acc => acc.id === state.selectedAccountId)) {
        state.selectedAccountId = null; // Reset to null if current selection is invalid
      }
    },
    setSelectedAccount: (state, action: PayloadAction<string | null>) => {
      if (action.payload === null) {
        // Allow setting to null for "All Accounts"
        state.selectedAccountId = null;
      } else if (state.accounts.find(acc => acc.id === action.payload)) {
        state.selectedAccountId = action.payload;
      } else {
        console.warn(`Attempted to select non-existent account ID: ${action.payload}`);
      }
    },
    addAccount: (state, action: PayloadAction<Account>) => {
      state.accounts.push(action.payload);
      // If no account was selected, select the newly added one.
      if (!state.selectedAccountId) {
        state.selectedAccountId = action.payload.id;
      }
    },
    updateAccount: (state, action: PayloadAction<UpdateAccountSlicePayload>) => {
      const index = state.accounts.findIndex(acc => acc.id === action.payload.id);
      if (index !== -1) {
        // Merge existing account with payload fields
        state.accounts[index] = { ...state.accounts[index], ...action.payload };
      } else {
        console.warn(`Attempted to update non-existent account ID: ${action.payload.id}`);
      }
    },
    deleteAccount: (state, action: PayloadAction<string>) => { // Payload is accountId to delete
      const accountIdToDelete = action.payload;
      state.accounts = state.accounts.filter(acc => acc.id !== accountIdToDelete);
      // If the deleted account was the selected one, set to null (All Accounts)
      if (state.selectedAccountId === accountIdToDelete) {
        state.selectedAccountId = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        // Reset selected account if it no longer exists
        if (state.selectedAccountId && !action.payload.find(acc => acc.id === state.selectedAccountId)) {
          state.selectedAccountId = null;
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch accounts';
      })
      // Create account
      .addCase(createAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts.push(action.payload);
        // If no account was selected, select the newly created one
        if (!state.selectedAccountId) {
          state.selectedAccountId = action.payload.id;
        }
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create account';
      })
      // Update account
      .addCase(updateAccountThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAccountThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.accounts.findIndex(acc => acc.id === action.payload.id);
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(updateAccountThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update account';
      })
      // Delete account
      .addCase(deleteAccountThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccountThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = state.accounts.filter(acc => acc.id !== action.payload);
        // If the deleted account was selected, reset to null
        if (state.selectedAccountId === action.payload) {
          state.selectedAccountId = null;
        }
      })
      .addCase(deleteAccountThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete account';
      });
  },
});

export const { setAccounts, setSelectedAccount, addAccount, updateAccount, deleteAccount, setLoading, setError } = accountSlice.actions;

// Selectors
export const selectAvailableAccounts = (state: RootState) => state.accounts.accounts;
export const selectSelectedAccountId = (state: RootState) => state.accounts.selectedAccountId;
export const selectSelectedAccount = (state: RootState) => {
  const selectedId = state.accounts.selectedAccountId;
  return state.accounts.accounts.find(acc => acc.id === selectedId) || null;
};
export const selectAccountsLoading = (state: RootState) => state.accounts.isLoading;
export const selectAccountsError = (state: RootState) => state.accounts.error;

export default accountSlice.reducer; 