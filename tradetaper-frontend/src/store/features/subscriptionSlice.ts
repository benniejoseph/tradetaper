import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Subscription, BillingInfo } from '@/types/pricing';
import { pricingApi } from '@/services/pricingApi';

interface SubscriptionState {
  currentSubscription: Subscription | null;
  billingInfo: BillingInfo | null;
  usage: {
    currentPeriodTrades: number;
    tradeLimit: number;
    accountsUsed: number;
    accountLimit: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  currentSubscription: null,
  billingInfo: null,
  usage: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCurrentSubscription = createAsyncThunk(
  'subscription/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      return await pricingApi.getCurrentSubscription();
    } catch {
      return rejectWithValue('Failed to fetch subscription');
    }
  }
);

export const fetchBillingInfo = createAsyncThunk(
  'subscription/fetchBillingInfo',
  async (_, { rejectWithValue }) => {
    try {
      return await pricingApi.getBillingInfo();
    } catch {
      return rejectWithValue('Failed to fetch billing info');
    }
  }
);

export const fetchUsage = createAsyncThunk(
  'subscription/fetchUsage',
  async (_, { rejectWithValue }) => {
    try {
      return await pricingApi.getUsage();
    } catch {
      return rejectWithValue('Failed to fetch usage');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscription/cancel',
  async (_, { rejectWithValue }) => {
    try {
      await pricingApi.cancelSubscription();
      return true;
    } catch {
      return rejectWithValue('Failed to cancel subscription');
    }
  }
);

export const reactivateSubscription = createAsyncThunk(
  'subscription/reactivate',
  async (_, { rejectWithValue }) => {
    try {
      await pricingApi.reactivateSubscription();
      return true;
    } catch {
      return rejectWithValue('Failed to reactivate subscription');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSubscription: (state, action: PayloadAction<Subscription | null>) => {
      state.currentSubscription = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current subscription
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch billing info
      .addCase(fetchBillingInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBillingInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.billingInfo = action.payload;
        state.currentSubscription = action.payload.subscription;
      })
      .addCase(fetchBillingInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch usage
      .addCase(fetchUsage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.usage = action.payload;
      })
      .addCase(fetchUsage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.isLoading = false;
        if (state.currentSubscription) {
          state.currentSubscription.cancelAtPeriodEnd = true;
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Reactivate subscription
      .addCase(reactivateSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reactivateSubscription.fulfilled, (state) => {
        state.isLoading = false;
        if (state.currentSubscription) {
          state.currentSubscription.cancelAtPeriodEnd = false;
        }
      })
      .addCase(reactivateSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

// Selectors
export const selectCurrentSubscription = (state: { subscription: SubscriptionState }) => 
  state.subscription.currentSubscription;

export const selectBillingInfo = (state: { subscription: SubscriptionState }) => 
  state.subscription.billingInfo;

export const selectUsage = (state: { subscription: SubscriptionState }) => 
  state.subscription.usage;

export const selectSubscriptionLoading = (state: { subscription: SubscriptionState }) => 
  state.subscription.isLoading;

export const selectSubscriptionError = (state: { subscription: SubscriptionState }) => 
  state.subscription.error; 