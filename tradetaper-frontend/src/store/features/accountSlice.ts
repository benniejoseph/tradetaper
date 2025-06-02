import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface Account {
  id: string;
  name: string;
  balance: number;
  // In a real scenario, balance might be fetched or stored here too
  // balance: number; 
}

// Payload for adding an account, ID will be generated
type AddAccountPayload = Omit<Account, 'id'>;

// Payload for updating an account, ID is required to find the account
type UpdateAccountPayload = Partial<Omit<Account, 'id'>> & { id: string };

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  accounts: [
    { id: 'acc_binance_main', name: 'Binance Main', balance: 6578.98 },
    { id: 'acc_kucoin_spot', name: 'KuCoin Spot', balance: 12345.67 },
    { id: 'acc_bybit_futures', name: 'Bybit Futures', balance: 888.88 },
  ],
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
    addAccount: (state, action: PayloadAction<AddAccountPayload>) => {
      const newAccount: Account = {
        id: `acc_${new Date().getTime()}_${Math.random().toString(36).substring(2, 7)}`, // Generate a simple unique ID
        ...action.payload,
      };
      state.accounts.push(newAccount);
      // If no account was selected, select the newly added one.
      if (!state.selectedAccountId) {
        state.selectedAccountId = newAccount.id;
      }
    },
    updateAccount: (state, action: PayloadAction<UpdateAccountPayload>) => {
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
    // Placeholder for future async fetching
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  // Extra reducers for async thunks would go here if we had them for fetching accounts
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