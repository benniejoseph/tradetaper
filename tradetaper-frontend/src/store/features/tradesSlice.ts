/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/features/tradesSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authApiClient } from '@/services/api'; // Use authenticated client
import { Trade, CreateTradePayload, UpdateTradePayload, AssetType, TradeDirection, TradeStatus } from '@/types/trade';
// import { RootState } from '../store';

export interface TradeFilters { // New interface for filters
  dateFrom?: string; // ISO string
  dateTo?: string;   // ISO string
  assetType?: AssetType | '';
  symbol?: string;
  direction?: TradeDirection | '';
  status?: TradeStatus | '';
}

export interface AnalyticsDateRangeFilter { // New interface for analytics page date range
  analyticsDateFrom?: string; // ISO string YYYY-MM-DD
  analyticsDateTo?: string;   // ISO string YYYY-MM-DD
}

interface TradesState {
  trades: Trade[];
  isLoading: boolean;
  error: string | null;
  currentTrade: Trade | null;
  filters: TradeFilters; // For the /trades page list
  analyticsFilters: AnalyticsDateRangeFilter; // For the /analytics page
}

const initialState: TradesState = {
  trades: [],
  isLoading: false,
  error: null,
  currentTrade: null,
  filters: { /* ... existing initial filters ... */ },
  analyticsFilters: { // Initial analytics filter state
    analyticsDateFrom: '', // Default to no filter
    analyticsDateTo: '',   // Default to no filter
  },
};

// Async Thunks for API calls
export const fetchTrades = createAsyncThunk<Trade[], void, { rejectValue: string }>(
  'trades/fetchTrades',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApiClient.get<Trade[]>('/trades');
      console.log('Raw fetchTrades from API:', response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch trades');
    }
  }
);

export const fetchTradeById = createAsyncThunk<Trade, string, { rejectValue: string }>(
  'trades/fetchTradeById',
  async (tradeId, { rejectWithValue }) => {
    try {
      const response = await authApiClient.get<Trade>(`/trades/${tradeId}`);
      console.log('Raw fetchTradeById from API:', response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch trade');
    }
  }
);

export const createTrade = createAsyncThunk<Trade, CreateTradePayload, { rejectValue: string }>(
  'trades/createTrade',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authApiClient.post<Trade>('/trades', payload);
      console.log('Raw createTrade from API:', response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create trade');
    }
  }
);

export const updateTrade = createAsyncThunk<Trade, { id: string; payload: UpdateTradePayload }, { rejectValue: string }>(
  'trades/updateTrade',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await authApiClient.patch<Trade>(`/trades/${id}`, payload);
      console.log('Raw updateTrade from API:', response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update trade');
    }
  }
);

export const deleteTrade = createAsyncThunk<string, string, { rejectValue: string }>( // Returns deleted trade ID on success
  'trades/deleteTrade',
  async (tradeId, { rejectWithValue }) => {
    try {
      await authApiClient.delete(`/trades/${tradeId}`);
      // console.log('Raw deleteTrade from API:', response?.data);
      return tradeId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete trade');
    }
  }
);


const tradesSlice = createSlice({
  name: 'trades',
  initialState,
  reducers: {
    clearTradesError(state) {
      state.error = null;
    },
    setCurrentTrade(state, action: PayloadAction<Trade | null>) {
        state.currentTrade = action.payload;
    },
    setTradeFilters(state, action: PayloadAction<Partial<TradeFilters>>) { // Action to update filters
      state.filters = { ...state.filters, ...action.payload };
    },
    resetTradeFilters(state) { // Action to reset filters
        state.filters = initialState.filters;
    },
    setAnalyticsDateFilters(state, action: PayloadAction<Partial<AnalyticsDateRangeFilter>>) {
      state.analyticsFilters = { ...state.analyticsFilters, ...action.payload };
    },
    resetAnalyticsDateFilters(state) {
        state.analyticsFilters = initialState.analyticsFilters;
    }
    // You can add more specific reducers if needed
  },
  extraReducers: (builder) => {
    builder
      // fetchTrades
      .addCase(fetchTrades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrades.fulfilled, (state, action: PayloadAction<Trade[]>) => {
        state.isLoading = false;
        state.trades = action.payload;
      })
      .addCase(fetchTrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchTradeById
      .addCase(fetchTradeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTradeById.fulfilled, (state, action: PayloadAction<Trade>) => {
        state.isLoading = false;
        state.currentTrade = action.payload;
      })
      .addCase(fetchTradeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // createTrade
      .addCase(createTrade.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTrade.fulfilled, (state, action: PayloadAction<Trade>) => {
        state.isLoading = false;
        state.trades.unshift(action.payload); // Add to the beginning of the list
      })
      .addCase(createTrade.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // updateTrade
      .addCase(updateTrade.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTrade.fulfilled, (state, action: PayloadAction<Trade>) => {
        state.isLoading = false;
        const index = state.trades.findIndex(trade => trade.id === action.payload.id);
        if (index !== -1) {
          state.trades[index] = action.payload;
        }
        if (state.currentTrade?.id === action.payload.id) {
            state.currentTrade = action.payload;
        }
      })
      .addCase(updateTrade.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // deleteTrade
      .addCase(deleteTrade.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTrade.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.trades = state.trades.filter(trade => trade.id !== action.payload);
        if (state.currentTrade?.id === action.payload) {
            state.currentTrade = null;
        }
      })
      .addCase(deleteTrade.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTradesError, setCurrentTrade, setTradeFilters, resetTradeFilters, setAnalyticsDateFilters, resetAnalyticsDateFilters } = tradesSlice.actions;
export default tradesSlice.reducer;