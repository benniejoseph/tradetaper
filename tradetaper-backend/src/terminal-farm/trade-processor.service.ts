// src/terminal-farm/trade-processor.service.ts
//
// Extracted shared trade processing logic used by both
// TerminalFarmService.processTrades() and TerminalFailedTradesQueue retry worker.
// Single source of truth for: normalizeTerminalTime, detectAssetType,
// processEntryDeal, processExitDeal, processOrphanExit.

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { TradesService } from '../trades/trades.service';
import { Trade } from '../trades/entities/trade.entity';
import { TradeStatus, TradeDirection, AssetType } from '../types/enums';
import { TerminalCommandsQueue } from './queue/terminal-commands.queue';
import { TerminalTradeDto } from './dto/terminal.dto';

export interface ProcessDealResult {
  action: 'created' | 'updated' | 'skipped' | 'conflict';
  trade?: Trade;
  reason?: string;
}

@Injectable()
export class TradeProcessorService {
  private readonly logger = new Logger(TradeProcessorService.name);

  constructor(
    @Inject(forwardRef(() => TradesService))
    private readonly tradesService: TradesService,
    private readonly terminalCommandsQueue: TerminalCommandsQueue,
  ) {}

  // ─── Shared Utilities ───────────────────────────────────────────

  normalizeTerminalTime(value?: string | number | Date): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') {
      const ms = value < 1e12 ? value * 1000 : value;
      return new Date(ms).toISOString();
    }
    if (typeof value === 'string') {
      const numeric = Number(value);
      if (!Number.isNaN(numeric) && value.trim() !== '') {
        const ms = numeric < 1e12 ? numeric * 1000 : numeric;
        return new Date(ms).toISOString();
      }
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return undefined; // Return undefined instead of raw value for type safety
  }

  detectAssetType(symbol: string): AssetType {
    // Strip common broker suffixes (e.g., .i, m, _SB, .raw, .pro)
    const upper = symbol
      .toUpperCase()
      .replace(/[._](I|M|SB|RAW|PRO|ECN|STD)$/i, '');

    const forexPairs = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    const forexMatch = forexPairs.filter((c) => upper.includes(c)).length >= 2;
    if (forexMatch && upper.length <= 7) return AssetType.FOREX;

    // Crypto
    if (
      ['BTC', 'ETH', 'LTC', 'XRP', 'ADA', 'SOL', 'DOGE'].some((c) =>
        upper.includes(c),
      )
    )
      return AssetType.CRYPTO;

    // Commodities
    if (
      [
        'XAU',
        'GOLD',
        'XAG',
        'SILVER',
        'OIL',
        'BRENT',
        'WTI',
        'USOIL',
        'UKOIL',
        'NGAS',
        'COPPER',
      ].some((c) => upper.includes(c))
    )
      return AssetType.COMMODITIES;

    // Indices
    const indices = [
      'US30',
      'DJ30',
      'NAS100',
      'NDX',
      'USTEC',
      'SPX',
      'SP500',
      'US500',
      'GER30',
      'GER40',
      'DE30',
      'DE40',
      'UK100',
      'JP225',
      'JPN225',
      'AUS200',
      'FRA40',
      'HK50',
      'CHINA50',
    ];
    if (indices.some((i) => upper.includes(i))) return AssetType.INDICES;

    return AssetType.FOREX; // Default fallback
  }

  // ─── Deal Processing ───────────────────────────────────────────

  /**
   * Process an entry deal (DEAL_ENTRY_IN).
   * Either creates a new OPEN trade or patches an existing one.
   */
  async processEntryDeal(
    trade: TerminalTradeDto,
    existingTrade: Trade | undefined,
    accountId: string,
    userId: string,
    syncSource: 'local_ea' | 'metaapi',
  ): Promise<ProcessDealResult> {
    const normalizedOpenTime = this.normalizeTerminalTime(trade.openTime);
    const positionIdString = trade.positionId!.toString();

    // Check syncSource conflict
    if (
      existingTrade &&
      existingTrade.syncSource &&
      existingTrade.syncSource !== syncSource
    ) {
      this.logger.warn(
        `SyncSource conflict for position ${positionIdString}: existing=${existingTrade.syncSource}, incoming=${syncSource}. Skipping.`,
      );
      return {
        action: 'conflict',
        reason: `Already synced via ${existingTrade.syncSource}`,
      };
    }

    if (existingTrade) {
      // Patch-update missing fields
      const entryUpdates: Record<string, any> = {};

      if (!existingTrade.openTime && normalizedOpenTime)
        entryUpdates.openTime = normalizedOpenTime;
      if (!existingTrade.openPrice && trade.openPrice)
        entryUpdates.openPrice = trade.openPrice;
      if (!existingTrade.quantity && trade.volume)
        entryUpdates.quantity = trade.volume;
      if (!existingTrade.side && trade.type) {
        entryUpdates.side =
          trade.type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT;
      }
      if (!existingTrade.stopLoss && trade.stopLoss)
        entryUpdates.stopLoss = trade.stopLoss;
      if (!existingTrade.takeProfit && trade.takeProfit)
        entryUpdates.takeProfit = trade.takeProfit;
      if (!existingTrade.contractSize && trade.contractSize)
        entryUpdates.contractSize = trade.contractSize;
      if (!existingTrade.externalDealId && trade.ticket)
        entryUpdates.externalDealId = trade.ticket;
      if (!existingTrade.mt5Magic && trade.magic)
        entryUpdates.mt5Magic = trade.magic;

      if (Object.keys(entryUpdates).length > 0) {
        const updated = await this.tradesService.updateFromSync(
          existingTrade.id,
          entryUpdates,
        );
        return { action: 'updated', trade: updated };
      }

      return { action: 'skipped' };
    }

    // Create new OPEN trade
    const createdTrade = await this.tradesService.create(
      {
        symbol: trade.symbol,
        assetType: this.detectAssetType(trade.symbol),
        side: trade.type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT,
        status: TradeStatus.OPEN,
        openTime: normalizedOpenTime || new Date().toISOString(),
        openPrice: trade.openPrice || 0,
        quantity: trade.volume || 0,
        commission: trade.commission,
        swap: trade.swap,
        notes: `Auto-synced via Position ID: ${trade.positionId}`,
        accountId,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        externalId: positionIdString,
        externalDealId: trade.ticket,
        mt5Magic: trade.magic,
        contractSize: trade.contractSize,
        syncSource,
      },
      { id: userId } as any,
    );

    return { action: 'created', trade: createdTrade };
  }

  /**
   * Process an exit deal (DEAL_ENTRY_OUT).
   * Closes an existing OPEN trade, or creates an orphan if entry is missing.
   */
  async processExitDeal(
    trade: TerminalTradeDto,
    existingTrade: Trade | undefined,
    accountId: string,
    userId: string,
    terminalId: string,
    syncSource: 'local_ea' | 'metaapi',
  ): Promise<ProcessDealResult> {
    const normalizedOpenTime = this.normalizeTerminalTime(trade.openTime);
    const positionIdString = trade.positionId!.toString();

    if (existingTrade) {
      // Check syncSource conflict
      if (existingTrade.syncSource && existingTrade.syncSource !== syncSource) {
        this.logger.warn(
          `SyncSource conflict for exit on position ${positionIdString}: existing=${existingTrade.syncSource}, incoming=${syncSource}. Skipping.`,
        );
        return {
          action: 'conflict',
          reason: `Already synced via ${existingTrade.syncSource}`,
        };
      }

      if (
        existingTrade.status === TradeStatus.CLOSED &&
        existingTrade.contractSize
      ) {
        return { action: 'skipped' };
      }

      const updatedTrade = await this.tradesService.update(
        existingTrade.id,
        {
          status: TradeStatus.CLOSED,
          closeTime: normalizedOpenTime,
          closePrice: trade.openPrice, // MT5 Deal Price = execution price
          profitOrLoss: trade.profit,
          commission:
            parseFloat(String(existingTrade.commission || 0)) +
            (trade.commission || 0),
          swap: parseFloat(String(existingTrade.swap || 0)) + (trade.swap || 0),
          contractSize: trade.contractSize,
        },
        { id: userId } as any,
        { changeSource: 'mt5' },
      );

      // Queue FETCH_CANDLES for the closed trade
      this.queueCandleFetch(
        terminalId,
        trade.symbol,
        existingTrade.openTime,
        normalizedOpenTime,
        existingTrade.id,
      );

      return { action: 'updated', trade: updatedTrade };
    }

    // Orphan exit: entry was missed
    return this.processOrphanExit(trade, accountId, userId, syncSource);
  }

  /**
   * Process a DEAL_ENTRY_INOUT (partial close / reverse).
   * Closes the existing trade and opens a new one with remaining volume. [FIX #9]
   */
  async processInOutDeal(
    trade: TerminalTradeDto,
    existingTrade: Trade | undefined,
    accountId: string,
    userId: string,
    terminalId: string,
    syncSource: 'local_ea' | 'metaapi',
  ): Promise<ProcessDealResult> {
    // Step 1: Close the existing trade (or create orphan exit)
    const exitResult = await this.processExitDeal(
      trade,
      existingTrade,
      accountId,
      userId,
      terminalId,
      syncSource,
    );

    if (exitResult.action === 'conflict' || exitResult.action === 'skipped') {
      return exitResult;
    }

    // Step 2: [FIX #9] Calculate remaining volume and open a new trade if applicable
    const closedVolume = trade.volume || 0;
    const originalVolume = existingTrade?.quantity
      ? parseFloat(String(existingTrade.quantity))
      : 0;
    const remainingVolume = Math.round((originalVolume - closedVolume) * 100000) / 100000; // 5dp precision

    if (remainingVolume > 0.001) {
      this.logger.log(
        `INOUT partial close: ${closedVolume} lots closed, opening new ${remainingVolume} lot position for ${trade.symbol}`,
      );

      // The remaining position has the same direction and entry price
      const normalizedTime = this.normalizeTerminalTime(trade.openTime);
      await this.tradesService.create(
        {
          symbol: trade.symbol,
          assetType: this.detectAssetType(trade.symbol),
          side: existingTrade?.side ?? (trade.type === 'BUY' ? 'LONG' as any : 'SHORT' as any),
          status: 'OPEN' as any,
          openTime: existingTrade?.openTime
            ? new Date(existingTrade.openTime).toISOString()
            : normalizedTime || new Date().toISOString(),
          openPrice: existingTrade?.openPrice ?? trade.openPrice ?? 0,
          quantity: remainingVolume,
          stopLoss: existingTrade?.stopLoss ?? undefined,
          takeProfit: existingTrade?.takeProfit ?? undefined,
          notes: `Partial close remainder. Original position ID: ${trade.positionId}. Closed ${closedVolume} lots.`,
          accountId,
          externalId: `${trade.positionId}_partial_${Date.now()}`, // unique ID for the remnant
          mt5Magic: trade.magic,
          contractSize: trade.contractSize,
          syncSource,
        },
        { id: userId } as any,
      );
    } else {
      this.logger.log(
        `INOUT treated as full close for position ${trade.positionId} (remaining=${remainingVolume})`,
      );
    }

    return exitResult;
  }

  /**
   * Create a standalone CLOSED trade when exit arrives without a matching entry.
   * Flagged with a note so analytics can identify/exclude these.
   */
  async processOrphanExit(
    trade: TerminalTradeDto,
    accountId: string,
    userId: string,
    syncSource: 'local_ea' | 'metaapi',
  ): Promise<ProcessDealResult> {
    const normalizedOpenTime = this.normalizeTerminalTime(trade.openTime);
    const positionIdString = trade.positionId!.toString();

    const createdTrade = await this.tradesService.create(
      {
        symbol: trade.symbol,
        assetType: this.detectAssetType(trade.symbol),
        // Invert: if exit is SELL, position was LONG; if exit is BUY, position was SHORT
        side:
          trade.type === 'SELL' ? TradeDirection.LONG : TradeDirection.SHORT,
        status: TradeStatus.CLOSED,
        openTime: normalizedOpenTime || new Date().toISOString(),
        closeTime: normalizedOpenTime,
        openPrice: 0, // Unknown — flagged as orphan
        closePrice: trade.openPrice,
        quantity: trade.volume || 0,
        profitOrLoss: trade.profit,
        commission: trade.commission,
        swap: trade.swap,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        notes: `⚠️ Orphan Exit (entry missing). Position ID: ${trade.positionId}`,
        accountId,
        externalId: positionIdString,
        externalDealId: trade.ticket,
        mt5Magic: trade.magic,
        syncSource,
      },
      { id: userId } as any,
    );

    return { action: 'created', trade: createdTrade };
  }

  // ─── Helpers ────────────────────────────────────────────────────

  /**
   * Queue a FETCH_CANDLES command for a closed trade (±2h buffer around entry/exit).
   */
  private queueCandleFetch(
    terminalId: string,
    symbol: string,
    entryTime: Date | string | undefined,
    exitTimeStr: string | undefined,
    tradeId: string,
  ): void {
    const entry = entryTime ? new Date(entryTime) : new Date();
    const exit = exitTimeStr ? new Date(exitTimeStr) : new Date();
    const bufferMs = 2 * 60 * 60 * 1000; // 2 hours

    const startTime = new Date(entry.getTime() - bufferMs);
    const endTime = new Date(exit.getTime() + bufferMs);

    const formatMt5Time = (d: Date) =>
      d.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');

    const payload = `${symbol},1m,${formatMt5Time(startTime)},${formatMt5Time(endTime)},${tradeId}`;

    this.terminalCommandsQueue.queueCommand(
      terminalId,
      'FETCH_CANDLES',
      payload,
    );
    this.logger.debug(`Queued FETCH_CANDLES for closed trade ${tradeId}`);
  }
}
