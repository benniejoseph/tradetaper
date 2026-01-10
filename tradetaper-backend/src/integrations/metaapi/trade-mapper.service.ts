// src/integrations/metaapi/trade-mapper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MT5Deal } from './metaapi.service';
import { TradeDirection, TradeStatus, AssetType } from '../../types/enums';

export interface MappedTrade {
  symbol: string;
  direction: TradeDirection;
  assetType: AssetType;
  status: TradeStatus;
  entryPrice: number;
  exitPrice: number | null;
  entryDate: Date;
  exitDate: Date | null;
  quantity: number;
  lotSize: number;
  realizedPnL: number;
  commission: number;
  swap: number;
  notes: string;
  externalId: string; // MT5 position ID
  externalDealId: string; // MT5 deal ID
  mt5Magic: number | null;
  marginUsed: number;
}

interface PositionGroup {
  positionId: string;
  symbol: string;
  entryDeals: MT5Deal[];
  exitDeals: MT5Deal[];
}

@Injectable()
export class TradeMapperService {
  private readonly logger = new Logger(TradeMapperService.name);

  /**
   * Map MT5 deals to TradeTaper trade format
   * Groups related deals by position ID to create complete trades
   */
  mapMT5DealToTrade(deal: MT5Deal, userId: string, leverage: number = 100): MappedTrade {
    // Basic calculation for margin used: (Price * Quantity * ContractSize) / Leverage
    // Assuming standard forex contract size of 100,000 for now. 
    // TODO: Fetch symbol info for accurate contract size (Index vs Forex vs Crypto)
    const contractSize = 100000; 
    const marginUsed = (deal.price * deal.volume * contractSize) / leverage;

    return {
      symbol: deal.symbol,
      direction: deal.type === 'DEAL_TYPE_BUY' ? TradeDirection.LONG : TradeDirection.SHORT,
      assetType: AssetType.FOREX, // Defaulting to Forex, logic needs improvement based on symbol
      status: TradeStatus.CLOSED,
      entryPrice: deal.price,
      exitPrice: deal.price, // Placeholder, actual exit price comes from exit deal in groupDealsByPosition logic if used
      entryDate: new Date(deal.time),
      exitDate: new Date(deal.time),
      quantity: deal.volume,
      lotSize: deal.volume,
      realizedPnL: deal.profit,
      commission: deal.commission,
      swap: deal.swap,
      notes: Object.keys(deal).filter(k => !['price','volume','symbol','time','profit','commission','swap'].includes(k)).map(k => `${k}: ${deal[k]}`).join(', '),
      externalId: deal.positionId,
      externalDealId: deal.id,
      mt5Magic: deal.magic ?? null,
      marginUsed: parseFloat(marginUsed.toFixed(2))
    };
  }

  mapDealsToTrades(deals: MT5Deal[], leverage: number = 100): MappedTrade[] {
    this.logger.log(`Mapping ${deals.length} MT5 deals to trades`);

    // Group deals by position ID
    const positionGroups = this.groupDealsByPosition(deals);
    
    // Convert each position group to a trade
    const trades: MappedTrade[] = [];
    
    for (const group of Object.values(positionGroups)) {
      if (group.entryDeals.length > 0) {
        trades.push(this.createTradeFromGroup(group, leverage));
      }
    }
    
    return trades;
  }

  /**
   * Group deals by their position ID
   */
  private groupDealsByPosition(deals: MT5Deal[]): Record<string, PositionGroup> {
    const groups: Record<string, PositionGroup> = {};

    for (const deal of deals) {
      // Skip balance, credit, and other non-trade deals
      if (!deal.positionId || deal.positionId === '0') {
        continue;
      }

      if (!groups[deal.positionId]) {
        groups[deal.positionId] = {
          positionId: deal.positionId,
          symbol: deal.symbol,
          entryDeals: [],
          exitDeals: [],
        };
      }

      // Categorize by entry type
      if (deal.entryType === 'DEAL_ENTRY_IN') {
        groups[deal.positionId].entryDeals.push(deal);
      } else if (deal.entryType === 'DEAL_ENTRY_OUT') {
        groups[deal.positionId].exitDeals.push(deal);
      }
    }

    return groups;
  }

  private createTradeFromGroup(group: PositionGroup, leverage: number = 100): MappedTrade {
    const { entryDeals, exitDeals } = group;
    
    // Calculate weighted average entry price
    const totalEntryVolume = entryDeals.reduce((sum, d) => sum + d.volume, 0);
    const entryPrice = entryDeals.reduce(
      (sum, d) => sum + d.price * d.volume,
      0,
    ) / totalEntryVolume;
    
    const entryDate = new Date(Math.min(...entryDeals.map(d => d.time.getTime())));
    
    let exitPrice: number | null = null;
    let exitDate: Date | null = null;
    let status = TradeStatus.OPEN;

    if (exitDeals.length > 0) {
      const totalExitVolume = exitDeals.reduce((sum, d) => sum + d.volume, 0);
      exitPrice = exitDeals.reduce(
        (sum, d) => sum + d.price * d.volume,
        0,
      ) / totalExitVolume;
      exitDate = new Date(Math.max(...exitDeals.map(d => d.time.getTime())));
      
      // If total exit volume matches entry, it's closed. Otherwise partial.
      // For simplicity here, if there are exit deals, we consider it closed or at least updated.
      // In a real scenario, we might split trades or check volumes strictly.
      if (totalExitVolume >= totalEntryVolume * 0.99) {
         status = TradeStatus.CLOSED;
      }
    }

    const realizedPnL = exitDeals.reduce((sum, d) => sum + d.profit, 0);
    const commission = [...entryDeals, ...exitDeals].reduce((sum, d) => sum + d.commission, 0);
    const swap = [...entryDeals, ...exitDeals].reduce((sum, d) => sum + d.swap, 0);

    const firstDeal = entryDeals[0];
    
    // Margin Calculation (Average Entry Price * Total Volume * ContractSize) / Leverage
    const contractSize = 100000; // Todo: dynamic
    const marginUsed = (entryPrice * totalEntryVolume * contractSize) / leverage;

    return {
      symbol: group.symbol,
      direction: firstDeal.type === 'DEAL_TYPE_BUY' ? TradeDirection.LONG : TradeDirection.SHORT,
      assetType: AssetType.FOREX, // TODO: improve logic
      status,
      entryPrice,
      exitPrice,
      entryDate,
      exitDate,
      quantity: totalEntryVolume,
      lotSize: totalEntryVolume,
      realizedPnL,
      commission,
      swap,
      notes: `Aggregated from ${entryDeals.length} entries and ${exitDeals.length} exits`,
      externalId: group.positionId,
      externalDealId: firstDeal.id, // Primary deal ID
      mt5Magic: firstDeal.magic || null,
      marginUsed: parseFloat(marginUsed.toFixed(2))
    };
  }

  /**
   * Map MT5 deal type to trade direction
   */
  private mapDealTypeToDirection(dealType: string): TradeDirection | null {
    switch (dealType) {
      case 'DEAL_TYPE_BUY':
        return TradeDirection.LONG;
      case 'DEAL_TYPE_SELL':
        return TradeDirection.SHORT;
      default:
        return null;
    }
  }

  /**
   * Detect asset type from symbol
   */
  private detectAssetType(symbol: string): AssetType {
    const upperSymbol = symbol.toUpperCase();

    // Crypto
    if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || 
        upperSymbol.includes('CRYPTO') || upperSymbol.endsWith('USDT')) {
      return AssetType.CRYPTO;
    }

    // Commodities
    if (upperSymbol.includes('XAU') || upperSymbol.includes('GOLD') ||
        upperSymbol.includes('XAG') || upperSymbol.includes('SILVER') ||
        upperSymbol.includes('OIL') || upperSymbol.includes('BRENT') ||
        upperSymbol.includes('WTI')) {
      return AssetType.COMMODITIES;
    }

    // Indices
    if (upperSymbol.includes('US30') || upperSymbol.includes('US500') ||
        upperSymbol.includes('NAS') || upperSymbol.includes('SPX') ||
        upperSymbol.includes('DAX') || upperSymbol.includes('FTSE')) {
      return AssetType.FUTURES;
    }

    // Forex (default for most pairs)
    if (upperSymbol.length === 6 && !upperSymbol.includes('.')) {
      return AssetType.FOREX;
    }

    // Stocks (if has dot like AAPL.US)
    if (upperSymbol.includes('.')) {
      return AssetType.STOCK;
    }

    return AssetType.FOREX; // Default
  }
}
