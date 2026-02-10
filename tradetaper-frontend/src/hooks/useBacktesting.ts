import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backtestingService } from '@/services/backtestingService';
import {
  BacktestTrade,
  CreateBacktestTradeDto,
  BacktestStats,
  AnalysisData,
} from '@/types/backtesting';

// Query keys
export const backtestingKeys = {
  all: ['backtesting'] as const,
  trades: (filters?: any, pagination?: any) =>
    [...backtestingKeys.all, 'trades', filters, pagination] as const,
  trade: (id: string) => [...backtestingKeys.all, 'trade', id] as const,
  stats: (strategyId?: string) =>
    strategyId
      ? [...backtestingKeys.all, 'stats', strategyId]
      : [...backtestingKeys.all, 'stats', 'overall'],
  analysis: (strategyId: string) => [...backtestingKeys.all, 'analysis', strategyId] as const,
  symbols: () => [...backtestingKeys.all, 'symbols'] as const,
};

// ============ QUERY HOOKS ============

/**
 * Hook to fetch backtest trades with filters and pagination
 * Cache: 5 minutes
 */
export function useBacktestTrades(
  filters?: {
    strategyId?: string;
    symbol?: string;
    session?: string;
    timeframe?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
  },
  pagination?: {
    page?: number;
    limit?: number;
  },
) {
  return useQuery({
    queryKey: backtestingKeys.trades(filters, pagination),
    queryFn: () => backtestingService.getTrades(filters, pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single backtest trade
 * Cache: 5 minutes
 */
export function useBacktestTrade(id: string) {
  return useQuery({
    queryKey: backtestingKeys.trade(id),
    queryFn: () => backtestingService.getTrade(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id, // Only run if id exists
  });
}

/**
 * Hook to fetch backtest stats (overall or strategy-specific)
 * Cache: 2 minutes
 */
export function useBacktestStats(strategyId?: string) {
  return useQuery({
    queryKey: backtestingKeys.stats(strategyId),
    queryFn: () =>
      strategyId
        ? backtestingService.getStrategyStats(strategyId)
        : backtestingService.getOverallStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: strategyId !== undefined, // Only run if we have a strategyId or want overall
  });
}

/**
 * Hook to fetch strategy analysis data
 * Cache: 5 minutes
 */
export function useBacktestAnalysis(strategyId: string) {
  return useQuery({
    queryKey: backtestingKeys.analysis(strategyId),
    queryFn: () => backtestingService.getAnalysisData(strategyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!strategyId, // Only run if strategyId exists
  });
}

/**
 * Hook to fetch available symbols
 * Cache: 10 minutes (symbols don't change often)
 */
export function useBacktestSymbols() {
  return useQuery({
    queryKey: backtestingKeys.symbols(),
    queryFn: () => backtestingService.getSymbols(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============ MUTATION HOOKS ============

/**
 * Hook to create a new backtest trade
 * Invalidates: trades list, stats, analysis
 */
export function useCreateBacktestTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBacktestTradeDto) => backtestingService.createTrade(data),
    onSuccess: (newTrade) => {
      // Invalidate trades list
      queryClient.invalidateQueries({ queryKey: backtestingKeys.all });

      // Optionally add optimistic update
      queryClient.setQueryData<BacktestTrade[]>(
        backtestingKeys.trades({ strategyId: newTrade.strategyId }),
        (old) => (old ? [newTrade, ...old] : [newTrade])
      );
    },
  });
}

/**
 * Hook to update a backtest trade
 * Invalidates: specific trade, trades list, stats, analysis
 */
export function useUpdateBacktestTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBacktestTradeDto> }) =>
      backtestingService.updateTrade(id, data),
    onSuccess: (updatedTrade, variables) => {
      // Update the specific trade cache
      queryClient.setQueryData(backtestingKeys.trade(variables.id), updatedTrade);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: backtestingKeys.all });
    },
  });
}

/**
 * Hook to delete a backtest trade
 * Invalidates: trades list, stats, analysis
 */
export function useDeleteBacktestTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => backtestingService.deleteTrade(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: backtestingKeys.trade(id) });

      // Invalidate trades list and stats
      queryClient.invalidateQueries({ queryKey: backtestingKeys.all });
    },
  });
}

// ============ UTILITY HOOKS ============

/**
 * Hook to manually refetch all backtesting data
 */
export function useRefreshBacktesting() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: backtestingKeys.all });
  };
}

/**
 * Hook to prefetch trades (useful for background loading)
 */
export function usePrefetchBacktestTrades() {
  const queryClient = useQueryClient();

  return (filters?: any) => {
    queryClient.prefetchQuery({
      queryKey: backtestingKeys.trades(filters),
      queryFn: () => backtestingService.getTrades(filters),
      staleTime: 5 * 60 * 1000,
    });
  };
}
