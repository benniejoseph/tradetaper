/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/features/tradesSlice.ts
import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { authApiClient } from '@/services/api'; // Use authenticated client
import { Trade, CreateTradePayload, UpdateTradePayload, AssetType, TradeDirection, TradeStatus } from '@/types/trade';
import { RootState } from '../store';

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
  lastFetchKey: string | null;
  lastFetchAt: number | null;
  lastFetchIncludeTags: boolean;
  summary: any | null;
  summaryLoading: boolean;
  summaryError: string | null;
  lastSummaryKey: string | null;
  lastSummaryAt: number | null;
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
  lastFetchKey: null,
  lastFetchAt: null,
  lastFetchIncludeTags: false,
  summary: null,
  summaryLoading: false,
  summaryError: null,
  lastSummaryKey: null,
  lastSummaryAt: null,
};

// Helper function to transform API response to frontend Trade interface
function transformApiTradeToFrontend(apiTrade: any): Trade {
  if (!apiTrade) {
    console.error('transformApiTradeToFrontend received null/undefined trade');
    throw new Error('Invalid trade data: trade is null or undefined');
  }

  try {
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
      account: apiTrade.account,
      marginUsed: apiTrade.marginUsed ? parseFloat(apiTrade.marginUsed) : undefined,
      // Psychology & Emotion fields
      emotionBefore: apiTrade.emotionBefore,
      emotionDuring: apiTrade.emotionDuring,
      emotionAfter: apiTrade.emotionAfter,
      confidenceLevel: apiTrade.confidenceLevel != null ? Number(apiTrade.confidenceLevel) : undefined,
      followedPlan: apiTrade.followedPlan,
      ruleViolations: apiTrade.ruleViolations,
      // Performance Metrics
      plannedRR: apiTrade.plannedRR ? parseFloat(apiTrade.plannedRR) : undefined,
      executionGrade: apiTrade.executionGrade,
      // Market Context
      marketCondition: apiTrade.marketCondition,
      timeframe: apiTrade.timeframe,
      htfBias: apiTrade.htfBias,
      newsImpact: apiTrade.newsImpact,
      // Pre-Trade Checklist
      entryReason: apiTrade.entryReason,
      confirmations: apiTrade.confirmations,
      hesitated: apiTrade.hesitated,
      preparedToLose: apiTrade.preparedToLose,
      // Environmental Factors
      sleepQuality: apiTrade.sleepQuality != null ? Number(apiTrade.sleepQuality) : undefined,
      energyLevel: apiTrade.energyLevel != null ? Number(apiTrade.energyLevel) : undefined,
      distractionLevel: apiTrade.distractionLevel != null ? Number(apiTrade.distractionLevel) : undefined,
      tradingEnvironment: apiTrade.tradingEnvironment,
      // Strategy
      strategyId: apiTrade.strategyId,
      strategy: apiTrade.strategy,
    };
  } catch (error) {
    console.error('Error transforming trade:', apiTrade, error);
    throw error;
  }
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

  const sanitizeVal = (val: any) => val === '' ? undefined : val;

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
    // Psychology & Emotion fields
    emotionBefore: sanitizeVal((frontendPayload as any).emotionBefore),
    emotionDuring: sanitizeVal((frontendPayload as any).emotionDuring),
    emotionAfter: sanitizeVal((frontendPayload as any).emotionAfter),
    confidenceLevel: sanitizeVal((frontendPayload as any).confidenceLevel),
    followedPlan: sanitizeVal((frontendPayload as any).followedPlan),
    ruleViolations: sanitizeVal((frontendPayload as any).ruleViolations),
    // Performance Metrics
    plannedRR: sanitizeVal((frontendPayload as any).plannedRR),
    executionGrade: sanitizeVal((frontendPayload as any).executionGrade),
    // Market Context
    marketCondition: sanitizeVal((frontendPayload as any).marketCondition),
    timeframe: sanitizeVal((frontendPayload as any).timeframe),
    htfBias: sanitizeVal((frontendPayload as any).htfBias),
    newsImpact: sanitizeVal((frontendPayload as any).newsImpact),
    // Pre-Trade Checklist
    entryReason: sanitizeVal((frontendPayload as any).entryReason),
    confirmations: sanitizeVal((frontendPayload as any).confirmations),
    hesitated: sanitizeVal((frontendPayload as any).hesitated),
    preparedToLose: sanitizeVal((frontendPayload as any).preparedToLose),
    // Environmental Factors
    sleepQuality: sanitizeVal((frontendPayload as any).sleepQuality),
    energyLevel: sanitizeVal((frontendPayload as any).energyLevel),
    distractionLevel: sanitizeVal((frontendPayload as any).distractionLevel),
    tradingEnvironment: sanitizeVal((frontendPayload as any).tradingEnvironment),
    // Strategy
    strategyId: sanitizeVal((frontendPayload as any).strategyId),
    // Financial
    swap: (frontendPayload as any).swap,
    profitOrLoss: (frontendPayload as any).profitOrLoss,
  };
}

// Async Thunks for API calls
const normalizeErrorMessage = (error: any, fallback: string) => {
  const raw = error?.response?.data?.message ?? error?.message ?? fallback;
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return item;
      if (item?.field && Array.isArray(item?.errors)) return `${item.field}: ${item.errors.join(', ')}`;
      return JSON.stringify(item);
    }).join(' | ');
  }
  if (raw && typeof raw === 'object') {
    try {
      if ((raw as any).field && Array.isArray((raw as any).errors)) {
        return `${(raw as any).field}: ${(raw as any).errors.join(', ')}`;
      }
      return JSON.stringify(raw);
    } catch {
      return fallback;
    }
  }
  return String(raw);
};
export const fetchTrades = createAsyncThunk<
  { data: Trade[]; total: number; page: number; limit: number },
  {
    accountId?: string;
    page?: number;
    limit?: number;
    includeTags?: boolean;
    force?: boolean;
    status?: string;
    direction?: string;
    assetType?: string;
    symbol?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    isStarred?: boolean;
    minPnl?: number;
    maxPnl?: number;
    minDuration?: number;
    maxDuration?: number;
    sortBy?: string;
    sortDir?: string;
  },
  { rejectValue: string }
>(
  'trades/fetchTrades',
  async (
    {
      accountId,
      page = 1,
      limit = 10,
      includeTags = false,
      status,
      direction,
      assetType,
      symbol,
      search,
      dateFrom,
      dateTo,
      isStarred,
      minPnl,
      maxPnl,
      minDuration,
      maxDuration,
      sortBy,
      sortDir,
    },
    { rejectWithValue },
  ) => {
    try {
      let url = `/trades/list?page=${page}&limit=${limit}`;
      if (accountId) {
        url += `&accountId=${accountId}`;
      }
      if (includeTags) {
        url += `&includeTags=true`;
      }
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }
      if (direction) {
        url += `&direction=${encodeURIComponent(direction)}`;
      }
      if (assetType) {
        url += `&assetType=${encodeURIComponent(assetType)}`;
      }
      if (symbol) {
        url += `&symbol=${encodeURIComponent(symbol)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (dateFrom) {
        url += `&from=${encodeURIComponent(dateFrom)}`;
      }
      if (dateTo) {
        url += `&to=${encodeURIComponent(dateTo)}`;
      }
      if (isStarred) {
        url += `&isStarred=true`;
      }
      if (Number.isFinite(minPnl)) {
        url += `&minPnl=${minPnl}`;
      }
      if (Number.isFinite(maxPnl)) {
        url += `&maxPnl=${maxPnl}`;
      }
      if (Number.isFinite(minDuration)) {
        url += `&minDuration=${minDuration}`;
      }
      if (Number.isFinite(maxDuration)) {
        url += `&maxDuration=${maxDuration}`;
      }
      if (sortBy) {
        url += `&sortBy=${encodeURIComponent(sortBy)}`;
      }
      if (sortDir) {
        url += `&sortDir=${encodeURIComponent(sortDir)}`;
      }
      const response = await authApiClient.get<any>(url);
      const transformedTrades = response.data.data.map(transformApiTradeToFrontend);

      return {
        data: transformedTrades,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
      };
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to fetch trades'));
    }
  },
  {
    condition: (args, { getState }) => {
      if (args?.force) return true;
      const state = getState() as RootState;
      const accountKey = args?.accountId || 'all';
      const page = args?.page ?? 1;
      const limit = args?.limit ?? 10;
      const includeTags = Boolean(args?.includeTags);
      const filterKey = [
        accountKey,
        page,
        limit,
        includeTags ? 'tags' : 'no-tags',
        args?.status || '',
        args?.direction || '',
        args?.assetType || '',
        args?.symbol || '',
        args?.search || '',
        args?.dateFrom || '',
        args?.dateTo || '',
        args?.isStarred ? 'starred' : '',
        Number.isFinite(args?.minPnl) ? `minPnl:${args?.minPnl}` : '',
        Number.isFinite(args?.maxPnl) ? `maxPnl:${args?.maxPnl}` : '',
        Number.isFinite(args?.minDuration) ? `minDur:${args?.minDuration}` : '',
        Number.isFinite(args?.maxDuration) ? `maxDur:${args?.maxDuration}` : '',
        args?.sortBy || '',
        args?.sortDir || '',
      ].join('|');
      const fetchKey = `account:${filterKey}`;
      const isFresh = state.trades.lastFetchAt && Date.now() - state.trades.lastFetchAt < 60_000;
      if (
        state.trades.trades.length > 0 &&
        state.trades.lastFetchKey === fetchKey &&
        isFresh &&
        state.trades.lastFetchIncludeTags === includeTags
      ) {
        return false;
      }
      return true;
    },
  }
);

export const fetchTradeById = createAsyncThunk<Trade, string, { rejectValue: string }>(
  'trades/fetchTradeById',
  async (tradeId, { rejectWithValue }) => {
    try {
      const response = await authApiClient.get<any>(`/trades/${tradeId}`);
      
      // Transform API response to frontend format
      const transformedTrade = transformApiTradeToFrontend(response.data);
      
      return transformedTrade;
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to fetch trade'));
    }
  }
);

export const createTrade = createAsyncThunk<Trade, CreateTradePayload, { rejectValue: string }>(
  'trades/createTrade',
  async (payload, { rejectWithValue }) => {
    try {
      // Transform frontend payload to backend API format
      const apiPayload = transformFrontendToApiPayload(payload);
      const response = await authApiClient.post<any>('/trades', apiPayload);
      
      // Transform API response to frontend format
      const transformedTrade = transformApiTradeToFrontend(response.data);
      
      return transformedTrade;
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to create trade'));
    }
  }
);

export const updateTrade = createAsyncThunk<Trade, { id: string; payload: UpdateTradePayload }, { rejectValue: string }>(
  'trades/updateTrade',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      // Transform frontend payload to backend API format
      const apiPayload = transformFrontendToApiPayload(payload);
      
      const response = await authApiClient.patch<any>(`/trades/${id}`, apiPayload);
      
      // Transform API response to frontend format
      const transformedTrade = transformApiTradeToFrontend(response.data);
      
      return transformedTrade;
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to update trade'));
    }
  }
);

// Returns deleted trade ID on success
export const deleteTrade = createAsyncThunk<string, string, { rejectValue: string }>( 
  'trades/deleteTrade',
  async (tradeId, { rejectWithValue }) => {
    try {
      await authApiClient.delete(`/trades/${tradeId}`);
      // console.log('Raw deleteTrade from API:', response?.data);
      return tradeId;
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to delete trade'));
    }
  }
);

// Bulk delete trades
export const deleteTrades = createAsyncThunk<string[], string[], { rejectValue: string }>(
  'trades/deleteTrades',
  async (tradeIds, { rejectWithValue }) => {
    try {
      await authApiClient.post('/trades/bulk/delete', { tradeIds });
      return tradeIds;
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to delete trades'));
    }
  }
);

export const bulkUpdateTrades = createAsyncThunk<Trade[], { ids: string[]; data: Partial<UpdateTradePayload> }, { rejectValue: string }>(
  'trades/bulkUpdateTrades',
  async ({ ids, data }, { rejectWithValue }) => {
    try {
      // Transform frontend data to backend format for each ID
      const updates = ids.map(id => ({
        id,
        data: transformFrontendToApiPayload(data)
      }));

      const response = await authApiClient.post<any>('/trades/bulk/update', { updates });

      const transformedTrades = response.data.trades.map(transformApiTradeToFrontend);
      return transformedTrades;
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to bulk update trades'));
    }
  }
);

export const groupTrades = createAsyncThunk<{ groupId: string; tradeIds: string[]; updatedCount: number }, { tradeIds: string[] }, { rejectValue: string }>(
  'trades/groupTrades',
  async ({ tradeIds }, { rejectWithValue }) => {
    try {
      const response = await authApiClient.patch<any>('/trades/group', { tradeIds });
      return { groupId: response.data.groupId, tradeIds, updatedCount: response.data.updatedCount };
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to group trades'));
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

export const fetchTradesSummary = createAsyncThunk<
  any,
  {
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    direction?: string;
    assetType?: string;
    symbol?: string;
    search?: string;
    isStarred?: boolean;
    minPnl?: number;
    maxPnl?: number;
    minDuration?: number;
    maxDuration?: number;
    force?: boolean;
  },
  { rejectValue: string }
>(
  'trades/fetchTradesSummary',
  async (
    {
      accountId,
      dateFrom,
      dateTo,
      status,
      direction,
      assetType,
      symbol,
      search,
      isStarred,
      minPnl,
      maxPnl,
      minDuration,
      maxDuration,
    },
    { rejectWithValue },
  ) => {
    try {
      let url = `/trades/summary?`;
      const params: string[] = [];
      if (accountId) params.push(`accountId=${accountId}`);
      if (dateFrom) params.push(`from=${encodeURIComponent(dateFrom)}`);
      if (dateTo) params.push(`to=${encodeURIComponent(dateTo)}`);
      if (status) params.push(`status=${encodeURIComponent(status)}`);
      if (direction) params.push(`direction=${encodeURIComponent(direction)}`);
      if (assetType) params.push(`assetType=${encodeURIComponent(assetType)}`);
      if (symbol) params.push(`symbol=${encodeURIComponent(symbol)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (isStarred) params.push(`isStarred=true`);
      if (Number.isFinite(minPnl)) params.push(`minPnl=${minPnl}`);
      if (Number.isFinite(maxPnl)) params.push(`maxPnl=${maxPnl}`);
      if (Number.isFinite(minDuration)) params.push(`minDuration=${minDuration}`);
      if (Number.isFinite(maxDuration)) params.push(`maxDuration=${maxDuration}`);
      url += params.join('&');

      const response = await authApiClient.get<any>(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(normalizeErrorMessage(error, 'Failed to fetch trade summary'));
    }
  },
  {
    condition: (args, { getState }) => {
      if (args?.force) return true;
      const state = getState() as RootState;
      const accountKey = args?.accountId || 'all';
      const filterKey = [
        accountKey,
        args?.dateFrom || '',
        args?.dateTo || '',
        args?.status || '',
        args?.direction || '',
        args?.assetType || '',
        args?.symbol || '',
        args?.search || '',
        args?.isStarred ? 'starred' : '',
        Number.isFinite(args?.minPnl) ? `minPnl:${args?.minPnl}` : '',
        Number.isFinite(args?.maxPnl) ? `maxPnl:${args?.maxPnl}` : '',
        Number.isFinite(args?.minDuration) ? `minDur:${args?.minDuration}` : '',
        Number.isFinite(args?.maxDuration) ? `maxDur:${args?.maxDuration}` : '',
      ].join('|');
      const isFresh = state.trades.lastSummaryAt && Date.now() - state.trades.lastSummaryAt < 60_000;
      if (state.trades.summary && state.trades.lastSummaryKey === filterKey && isFresh) {
        return false;
      }
      return true;
    },
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
      const accountKey = (action.meta.arg as any)?.accountId || 'all';
      const filterKey = [
        accountKey,
        action.payload.page,
        action.payload.limit,
        (action.meta.arg as any)?.includeTags ? 'tags' : 'no-tags',
        (action.meta.arg as any)?.status || '',
        (action.meta.arg as any)?.direction || '',
        (action.meta.arg as any)?.assetType || '',
        (action.meta.arg as any)?.symbol || '',
        (action.meta.arg as any)?.search || '',
        (action.meta.arg as any)?.dateFrom || '',
        (action.meta.arg as any)?.dateTo || '',
        (action.meta.arg as any)?.isStarred ? 'starred' : '',
      ].join('|');
      state.lastFetchKey = `account:${filterKey}`;
      state.lastFetchAt = Date.now();
      // includeTags tracked in action.meta.arg
      state.lastFetchIncludeTags = Boolean((action.meta.arg as any)?.includeTags);
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
      // deleteTrades (bulk)
      .addCase(deleteTrades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTrades.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.isLoading = false;
        state.trades = state.trades.filter(trade => !action.payload.includes(trade.id));
        if (state.currentTrade && action.payload.includes(state.currentTrade.id)) {
            state.currentTrade = null;
        }
      })
      .addCase(deleteTrades.rejected, (state, action) => {
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
        // Chart analysis data handled by caller if needed
      })
      .addCase(analyzeChart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchTradesSummary
      .addCase(fetchTradesSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchTradesSummary.fulfilled, (state, action: any) => {
        state.summaryLoading = false;
        state.summary = action.payload;
        const accountKey = action.meta.arg?.accountId || 'all';
        const filterKey = [
          accountKey,
          action.meta.arg?.dateFrom || '',
          action.meta.arg?.dateTo || '',
          action.meta.arg?.status || '',
          action.meta.arg?.direction || '',
          action.meta.arg?.assetType || '',
          action.meta.arg?.symbol || '',
          action.meta.arg?.search || '',
          action.meta.arg?.isStarred ? 'starred' : '',
          Number.isFinite(action.meta.arg?.minPnl) ? `minPnl:${action.meta.arg?.minPnl}` : '',
          Number.isFinite(action.meta.arg?.maxPnl) ? `maxPnl:${action.meta.arg?.maxPnl}` : '',
          Number.isFinite(action.meta.arg?.minDuration) ? `minDur:${action.meta.arg?.minDuration}` : '',
          Number.isFinite(action.meta.arg?.maxDuration) ? `maxDur:${action.meta.arg?.maxDuration}` : '',
        ].join('|');
        state.lastSummaryKey = filterKey;
        state.lastSummaryAt = Date.now();
      })
      .addCase(fetchTradesSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload as string;
      })
      // bulkUpdateTrades
      .addCase(bulkUpdateTrades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateTrades.fulfilled, (state, action: PayloadAction<Trade[]>) => {
        state.isLoading = false;
        // Update local state for each updated trade
        action.payload.forEach(updatedTrade => {
          const index = state.trades.findIndex(t => t.id === updatedTrade.id);
          if (index !== -1) {
            state.trades[index] = updatedTrade;
          }
          if (state.currentTrade?.id === updatedTrade.id) {
            state.currentTrade = updatedTrade;
          }
        });
      })
      .addCase(bulkUpdateTrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // groupTrades
      .addCase(groupTrades.fulfilled, (state, action) => {
        const { groupId, tradeIds } = action.payload;
        tradeIds.forEach((id, index) => {
          const trade = state.trades.find(t => t.id === id);
          if (trade) {
            trade.groupId = groupId;
            trade.isGroupLeader = index === 0;
          }
          if (state.currentTrade?.id === id) {
            state.currentTrade.groupId = groupId;
            state.currentTrade.isGroupLeader = index === 0;
          }
        });
      });
  },
});

export const { clearTradesError, setCurrentTrade, setTradeFilters, resetTradeFilters, setAnalyticsDateFilters, resetAnalyticsDateFilters, addTrade, updateTradeRealtime, removeTrade, setTrades } = tradesSlice.actions;
const selectTradesState = (state: RootState) => state.trades;

export const selectAllTrades = createSelector(
  [selectTradesState],
  (tradesState) => tradesState.trades
);

export const selectTradesLoading = createSelector(
  [selectTradesState],
  (tradesState) => tradesState.isLoading
);

export const selectTradesError = createSelector(
  [selectTradesState],
  (tradesState) => tradesState.error
);

export const selectTotalTrades = createSelector(
  [selectTradesState],
  (tradesState) => tradesState.total
);

export const selectCurrentPage = createSelector(
  [selectTradesState],
  (tradesState) => tradesState.page
);

export const selectTradesLimit = createSelector(
  [selectTradesState],
  (tradesState) => tradesState.limit
);

export default tradesSlice.reducer;
