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
  total: number;
  page: number;
  limit: number;
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
  total: 0,
  page: 1,
  limit: 10,
};

// Helper function to transform API response to frontend Trade interface
function transformApiTradeToFrontend(apiTrade: any): Trade {
  return {
    id: apiTrade.id,
    userId: apiTrade.userId,
    assetType: apiTrade.assetType,
    symbol: apiTrade.symbol,
    direction: apiTrade.side, // API: side → Frontend: direction
    status: apiTrade.status,
    entryDate: apiTrade.openTime, // API: openTime → Frontend: entryDate
    entryPrice: parseFloat(apiTrade.openPrice), // API: openPrice → Frontend: entryPrice (ensure number)
    exitDate: apiTrade.closeTime, // API: closeTime → Frontend: exitDate
    exitPrice: apiTrade.closePrice ? parseFloat(apiTrade.closePrice) : undefined, // API: closePrice → Frontend: exitPrice
    quantity: parseFloat(apiTrade.quantity), // Ensure number
    stopLoss: apiTrade.stopLoss ? parseFloat(apiTrade.stopLoss) : undefined,
    takeProfit: apiTrade.takeProfit ? parseFloat(apiTrade.takeProfit) : undefined,
    commission: apiTrade.commission ? parseFloat(apiTrade.commission) : undefined,
    notes: apiTrade.notes,
    profitOrLoss: apiTrade.profitOrLoss ? parseFloat(apiTrade.profitOrLoss) : undefined,
    rMultiple: apiTrade.rMultiple ? parseFloat(apiTrade.rMultiple) : undefined,
    ictConcept: apiTrade.ictConcept,
    session: apiTrade.session,
    setupDetails: apiTrade.setupDetails,
    mistakesMade: apiTrade.mistakesMade,
    lessonsLearned: apiTrade.lessonsLearned,
    imageUrl: apiTrade.imageUrl,
    tags: apiTrade.tags || [],
    createdAt: apiTrade.createdAt,
    updatedAt: apiTrade.updatedAt,
    accountId: apiTrade.accountId,
    isStarred: apiTrade.isStarred || false,
  };
}

// Helper function to transform frontend payload to backend API format
function transformFrontendToApiPayload(frontendPayload: CreateTradePayload | UpdateTradePayload): any {
  // Helper function to convert datetime-local input to ISO 8601 string
  const formatDateTimeForAPI = (dateTimeString?: string): string | undefined => {
    if (!dateTimeString) return undefined;
    try {
      // If the string is already in ISO format, return as is
      if (dateTimeString.includes('T') && (dateTimeString.includes('Z') || dateTimeString.includes('+') || dateTimeString.includes('-'))) {
        return dateTimeString;
      }
      // If it's datetime-local format (YYYY-MM-DDTHH:mm), convert to ISO 8601
      const date = new Date(dateTimeString);
      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date for API:', dateTimeString, error);
      return undefined;
    }
  };

  return {
    assetType: frontendPayload.assetType,
    symbol: frontendPayload.symbol,
    side: frontendPayload.direction, // Frontend: direction → API: side
    status: frontendPayload.status,
    openTime: formatDateTimeForAPI(frontendPayload.entryDate), // Frontend: entryDate → API: openTime
    openPrice: frontendPayload.entryPrice, // Frontend: entryPrice → API: openPrice
    closeTime: formatDateTimeForAPI(frontendPayload.exitDate), // Frontend: exitDate → API: closeTime
    closePrice: frontendPayload.exitPrice, // Frontend: exitPrice → API: closePrice
    quantity: frontendPayload.quantity,
    stopLoss: frontendPayload.stopLoss,
    takeProfit: frontendPayload.takeProfit,
    commission: frontendPayload.commission,
    notes: frontendPayload.notes,
    ictConcept: frontendPayload.ictConcept,
    session: frontendPayload.session,
    setupDetails: frontendPayload.setupDetails,
    mistakesMade: frontendPayload.mistakesMade,
    lessonsLearned: frontendPayload.lessonsLearned,
    imageUrl: frontendPayload.imageUrl,
    tagNames: frontendPayload.tagNames,
    accountId: frontendPayload.accountId,
    isStarred: frontendPayload.isStarred,
  };
}

// Async Thunks for API calls
export const fetchTrades = createAsyncThunk<
  { data: Trade[]; total: number; page: number; limit: number },
  { accountId?: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  'trades/fetchTrades',
  async ({ accountId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      let url = `/trades?page=${page}&limit=${limit}`;
      if (accountId) {
        url += `&accountId=${accountId}`;
      }
      const response = await authApiClient.get<any>(url);
      console.log(`Raw fetchTrades from API (accountId: ${accountId || 'all'}):`, response.data);

      const transformedTrades = response.data.data.map(transformApiTradeToFrontend);
      console.log('Transformed trades for frontend:', transformedTrades);

      return {
        data: transformedTrades,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch trades');
    }
  }
);

export const fetchTradeById = createAsyncThunk<Trade, string, { rejectValue: string }>(
  'trades/fetchTradeById',
  async (tradeId, { rejectWithValue }) => {
    try {
      const response = await authApiClient.get<any>(`/trades/${tradeId}`);
      console.log('Raw fetchTradeById from API:', response.data);
      
      // Transform API response to frontend format
      const transformedTrade = transformApiTradeToFrontend(response.data);
      console.log('Transformed trade for frontend:', transformedTrade);
      
      return transformedTrade;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch trade');
    }
  }
);

export const createTrade = createAsyncThunk<Trade, CreateTradePayload, { rejectValue: string }>(
  'trades/createTrade',
  async (payload, { rejectWithValue }) => {
    try {
      // Transform frontend payload to backend API format
      const apiPayload = transformFrontendToApiPayload(payload);
      console.log('Frontend payload:', payload);
      console.log('Transformed API payload:', apiPayload);
      
      const response = await authApiClient.post<any>('/trades', apiPayload);
      console.log('Raw createTrade from API:', response.data);
      
      // Transform API response to frontend format
      const transformedTrade = transformApiTradeToFrontend(response.data);
      console.log('Transformed created trade for frontend:', transformedTrade);
      
      return transformedTrade;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create trade');
    }
  }
);

export const updateTrade = createAsyncThunk<Trade, { id: string; payload: UpdateTradePayload }, { rejectValue: string }>(
  'trades/updateTrade',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      // Transform frontend payload to backend API format
      const apiPayload = transformFrontendToApiPayload(payload);
      console.log('Frontend updateTrade payload:', payload);
      console.log('Transformed updateTrade API payload:', apiPayload);
      
      const response = await authApiClient.patch<any>(`/trades/${id}`, apiPayload);
      console.log('Raw updateTrade from API:', response.data);
      
      // Transform API response to frontend format
      const transformedTrade = transformApiTradeToFrontend(response.data);
      console.log('Transformed updated trade for frontend:', transformedTrade);
      
      return transformedTrade;
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

export const analyzeChart = createAsyncThunk<any, File, { rejectValue: string }>(
  'trades/analyzeChart',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authApiClient.post<any>('/trades/analyze-chart', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to analyze chart');
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
    },
    // WebSocket real-time actions
    addTrade(state, action: PayloadAction<Trade>) {
      // Add new trade to the beginning of the list if it doesn't exist
      const existingIndex = state.trades.findIndex(trade => trade.id === action.payload.id);
      if (existingIndex === -1) {
        state.trades.unshift(action.payload);
      }
    },
    updateTradeRealtime(state, action: PayloadAction<Trade>) {
      // Update existing trade
      const index = state.trades.findIndex(trade => trade.id === action.payload.id);
      if (index !== -1) {
        state.trades[index] = action.payload;
      }
      if (state.currentTrade?.id === action.payload.id) {
        state.currentTrade = action.payload;
      }
    },
    removeTrade(state, action: PayloadAction<string>) {
      // Remove trade by ID
      state.trades = state.trades.filter(trade => trade.id !== action.payload);
      if (state.currentTrade?.id === action.payload) {
        state.currentTrade = null;
      }
    },
    setTrades(state, action: PayloadAction<Trade[]>) {
      // Replace all trades (useful for initial load or refresh)
      state.trades = action.payload;
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
      .addCase(fetchTrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trades = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
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
      })
      // analyzeChart
      .addCase(analyzeChart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(analyzeChart.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        // Handle the analyzed chart data if needed, e.g., update a temporary state or log it
        console.log('Chart analysis successful:', action.payload);
      })
      .addCase(analyzeChart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTradesError, setCurrentTrade, setTradeFilters, resetTradeFilters, setAnalyticsDateFilters, resetAnalyticsDateFilters, addTrade, updateTradeRealtime, removeTrade, setTrades } = tradesSlice.actions;
export default tradesSlice.reducer;