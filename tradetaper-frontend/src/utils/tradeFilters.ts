import { Trade, TradeStatus } from '@/types/trade';
import { parseISO, isAfter, isBefore, endOfDay, subMonths, subWeeks, subDays, isValid } from 'date-fns';

export const filterByAccount = (trades: Trade[], accountId: string | null) => {
  if (!accountId) return trades;
  return trades.filter(trade => trade.accountId === accountId);
};

export const filterByPosition = (trades: Trade[], positionFilter: 'all' | 'open' | 'closed') => {
  if (positionFilter === 'all') return trades;
  return trades.filter(trade => 
    positionFilter === 'open' ? trade.status === TradeStatus.OPEN : trade.status === TradeStatus.CLOSED
  );
};

export const filterByTimeRange = (trades: Trade[], timeFilter: 'all' | '1m' | '7d' | '1d') => {
  if (timeFilter === 'all') return trades;
  
  const now = new Date();
  const cutOffDate = timeFilter === '1m' ? subMonths(now, 1) :
                    timeFilter === '7d' ? subWeeks(now, 1) :
                    timeFilter === '1d' ? subDays(now, 1) : null;
  
  if (!cutOffDate) return trades;
  
  return trades.filter(trade => {
    if (!trade.entryDate) return false;
    try {
      const entryD = parseISO(trade.entryDate);
      return isValid(entryD) && isAfter(entryD, cutOffDate);
    } catch {
      return false;
    }
  });
};

export const filterByCustomDateRange = (trades: Trade[], customRange: { from?: Date; to?: Date }) => {
  let filtered = trades;
  
  if (customRange.from) {
    filtered = filtered.filter(trade => {
      if (!trade.entryDate) return false;
      try {
        const entryD = parseISO(trade.entryDate);
        return isValid(entryD) && !isBefore(entryD, customRange.from!);
      } catch { return false; }
    });
  }
  
  if (customRange.to) {
    filtered = filtered.filter(trade => {
      if (!trade.entryDate) return false;
      try {
        const entryD = parseISO(trade.entryDate);
        const toDateEndOfDay = endOfDay(customRange.to!);
        return isValid(entryD) && !isAfter(entryD, toDateEndOfDay);
      } catch { return false; }
    });
  }
  
  return filtered;
};

export const filterBySearch = (trades: Trade[], searchQuery: string) => {
  if (!searchQuery.trim()) return trades;
  
  const lowerSearchQuery = searchQuery.toLowerCase();
  return trades.filter(trade => 
    trade.symbol.toLowerCase().includes(lowerSearchQuery) ||
    (trade.notes && trade.notes.toLowerCase().includes(lowerSearchQuery)) ||
    (trade.setupDetails && trade.setupDetails.toLowerCase().includes(lowerSearchQuery))
  );
};

export const filterByStarred = (trades: Trade[], showOnlyStarred: boolean) => {
  return showOnlyStarred ? trades.filter(trade => trade.isStarred === true) : trades;
};

// Combined filtering function for complex scenarios
export const applyAllFilters = (
  trades: Trade[],
  filters: {
    accountId: string | null;
    positionFilter: 'all' | 'open' | 'closed';
    timeFilter: 'all' | '1m' | '7d' | '1d';
    customDateRange: { from?: Date; to?: Date };
    searchQuery: string;
    showOnlyStarred: boolean;
  }
) => {
  let result = trades;
  
  result = filterByAccount(result, filters.accountId);
  result = filterByPosition(result, filters.positionFilter);
  result = filterByTimeRange(result, filters.timeFilter);
  result = filterByCustomDateRange(result, filters.customDateRange);
  result = filterBySearch(result, filters.searchQuery);
  result = filterByStarred(result, filters.showOnlyStarred);
  
  // Sort by newest first
  return [...result].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}; 