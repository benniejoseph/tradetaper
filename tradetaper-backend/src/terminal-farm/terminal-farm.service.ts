// src/terminal-farm/terminal-farm.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  TerminalInstance,
  TerminalStatus,
} from './entities/terminal-instance.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import {
  CreateTerminalDto,
  TerminalHeartbeatDto,
  TerminalSyncDto,
  TerminalPositionsDto,
  TerminalResponseDto,
  TerminalCandlesSyncDto,
  EnableAutoSyncDto,
} from './dto/terminal.dto';
import { TradesService } from '../trades/trades.service';
import { TradeStatus, TradeDirection, AssetType } from '../types/enums';
import { TerminalCommandsQueue } from './queue/terminal-commands.queue';
import { TerminalFailedTradesQueue } from './queue/terminal-failed-trades.queue';
import { TerminalTokenService } from './terminal-token.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';

@Injectable()
export class TerminalFarmService {
  // ... (imports fixed)

  private readonly logger = new Logger(TerminalFarmService.name);

  constructor(
    @InjectRepository(TerminalInstance)
    private readonly terminalRepository: Repository<TerminalInstance>,
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepository: Repository<MT5Account>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TradesService))
    private readonly tradesService: TradesService,
    private readonly terminalCommandsQueue: TerminalCommandsQueue,
    private readonly terminalFailedTradesQueue: TerminalFailedTradesQueue,
    private readonly terminalTokenService: TerminalTokenService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Find running terminal for an account
   */
  async findTerminalForAccount(
    accountId: string,
  ): Promise<TerminalInstance | null> {
    return this.terminalRepository.findOne({
      where: { accountId },
    });
  }

  /**
   * Enable auto-sync for an account (provision a terminal)
   */
  async enableAutoSync(
    accountId: string,
    userId: string,
    dto: EnableAutoSyncDto,
  ): Promise<TerminalResponseDto> {
    try {
      this.logger.log(`Enabling auto-sync for account ${accountId}`);

      // Verify account ownership
      const account = await this.mt5AccountRepository.findOne({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Check if terminal already exists
      let terminal = await this.terminalRepository.findOne({
        where: { accountId },
      });

      if (terminal) {
        if (terminal.status === TerminalStatus.RUNNING) {
          throw new BadRequestException('Auto-sync is already enabled');
        }
        // Restart stopped terminal
        terminal.status = TerminalStatus.PENDING;
        terminal.errorMessage = null as any; // Clear error on restart
      } else {
        // Create new terminal instance
        terminal = this.terminalRepository.create({
          accountId,
          status: TerminalStatus.PENDING,
        });
      }

      await this.terminalRepository.save(terminal);

      // Trigger terminal provisioning (async)
      this.provisionTerminal(terminal.id, account, dto).catch((err) => {
        this.logger.error(`Failed to provision terminal: ${err.message}`);
      });

      return this.mapToResponse(terminal, account);
    } catch (error) {
      this.logger.error(`enableAutoSync FAILED: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Disable auto-sync (teardown terminal)
   */
  async disableAutoSync(accountId: string, userId: string): Promise<void> {
    this.logger.log(`Disabling auto-sync for account ${accountId}`);

    // Verify account ownership
    const account = await this.mt5AccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const terminal = await this.terminalRepository.findOne({
      where: { accountId },
    });

    if (!terminal) {
      throw new NotFoundException('Auto-sync is not enabled');
    }

    // Mark for stopping
    terminal.status = TerminalStatus.STOPPING;
    await this.terminalRepository.save(terminal);

    // Trigger terminal teardown (async)
    this.teardownTerminal(terminal.id).catch((err) => {
      this.logger.error(`Failed to teardown terminal: ${err.message}`);
    });
  }

  /**
   * Get terminal status for an account
   */
  async getTerminalStatus(
    accountId: string,
    userId: string,
  ): Promise<TerminalResponseDto | null> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const terminal = await this.terminalRepository.findOne({
      where: { accountId },
    });

    if (!terminal) {
      return null;
    }

    return this.mapToResponse(terminal, account);
  }

  async getTerminalAuthToken(
    accountId: string,
    userId: string,
  ): Promise<{ token: string }> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const terminal = await this.terminalRepository.findOne({
      where: { accountId },
    });

    if (!terminal) {
      throw new NotFoundException('Auto-sync is not enabled');
    }

    const token = this.terminalTokenService.signTerminalToken(terminal.id);
    return { token };
  }

  /**
   * Queue a command for a terminal
   * UPDATED: Now uses persistent Redis queue via TerminalCommandsQueue
   */
  async queueCommand(
    terminalId: string,
    command: string,
    payload: string,
  ): Promise<void> {
    await this.terminalCommandsQueue.queueCommand(terminalId, command, payload);
    this.logger.debug(`Queued command ${command} for terminal ${terminalId}`);
  }

  /**
   * Process heartbeat from terminal EA
   */
  async processHeartbeat(data: TerminalHeartbeatDto): Promise<any> {
    this.logger.debug(`Heartbeat from terminal ${data.terminalId}`);

    const terminal = await this.terminalRepository.findOne({
      where: { id: data.terminalId },
      relations: ['account'],
    });

    if (!terminal) {
      this.logger.warn(`Unknown terminal: ${data.terminalId}`);
      return { success: false, error: 'Unknown terminal' };
    }

    // Update heartbeat
    terminal.lastHeartbeat = new Date();

    if (terminal.status !== TerminalStatus.RUNNING) {
      terminal.status = TerminalStatus.RUNNING;
    }

    await this.terminalRepository.save(terminal);

    // Update account info if provided
    if (data.accountInfo && terminal.account) {
      await this.mt5AccountRepository.update(terminal.accountId, {
        balance: data.accountInfo.balance,
        equity: data.accountInfo.equity,
      });
    }

    // Check for queued commands (now from Redis queue)
    const nextCmd = await this.terminalCommandsQueue.getNextCommand(
      data.terminalId,
    );

    if (nextCmd) {
      this.logger.log(
        `Dispatching command ${nextCmd.command} to terminal ${data.terminalId}`,
      );
      return {
        success: true,
        command: nextCmd.command,
        payload: nextCmd.payload,
      };
    }

    return { success: true };
  }

  /**
   * Process trade sync from terminal EA
   * OPTIMIZED: Uses batch queries to prevent N+1 problem
   */
  async processTrades(
    data: TerminalSyncDto,
  ): Promise<{ imported: number; skipped: number; failed: number }> {
    this.logger.log(
      `Trade sync from terminal ${data.terminalId}: ${data.trades.length} trades`,
    );

    const terminal = await this.terminalRepository.findOne({
      where: { id: data.terminalId },
      relations: ['account'],
    });

    if (!terminal || !terminal.account) {
      throw new NotFoundException('Terminal not found');
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    // OPTIMIZATION: Batch fetch all external IDs upfront to prevent N+1 queries
    const positionIds = data.trades
      .filter((t) => t.positionId)
      .map((t) => t.positionId!.toString());

    const existingTradesMap = new Map<string, any>();

    if (positionIds.length > 0) {
      const existingTrades = await this.tradesService.findManyByExternalIds(
        terminal.account.userId,
        positionIds,
      );

      // Create a map for O(1) lookup
      existingTrades.forEach((trade) => {
        if (trade.externalId) {
          existingTradesMap.set(trade.externalId, trade);
        }
      });

      this.logger.debug(
        `Fetched ${existingTrades.length} existing trades for batch processing`,
      );
    }

    const duplicateCache = new Set<string>();
    for (const trade of data.trades) {
      try {
        // --- 1. Position-Based Logic (New) ---
        if (trade.positionId) {
          const positionIdString = trade.positionId.toString();

          // Use pre-fetched map instead of individual query
          const existingTrade = existingTradesMap.get(positionIdString);

          const isEntry = trade.entryType === 0; // DEAL_ENTRY_IN
          const isExit = trade.entryType === 1; // DEAL_ENTRY_OUT

          if (isEntry) {
            // If it's an entry and we already have it, skip (idempotent)
            if (existingTrade) {
              // Optional: Update open fields if they changed?
              // For now, assume Entry is immutable once recorded.
              skipped++;
              continue;
            }

            // Create New OPEN Trade
            await this.tradesService.create(
              {
                symbol: trade.symbol,
                assetType: this.detectAssetType(trade.symbol),
                side:
                  trade.type === 'BUY'
                    ? TradeDirection.LONG
                    : TradeDirection.SHORT,
                status: TradeStatus.OPEN, // Explicitly OPEN
                openTime: trade.openTime || new Date().toISOString(),
                // No close time yet
                openPrice: trade.openPrice || 0,
                // No close price yet
                quantity: trade.volume || 0,
                commission: trade.commission,
                swap: trade.swap,
                notes: `Auto-synced via Position ID: ${trade.positionId}`,
                accountId: terminal.accountId,
                stopLoss: trade.stopLoss,
                takeProfit: trade.takeProfit,
                externalId: positionIdString, // The common link
                externalDealId: trade.ticket, // The entry ticket
                mt5Magic: trade.magic,
                contractSize: trade.contractSize,
              },
              { id: terminal.account.userId } as any,
            );
            imported++;
          } else if (isExit) {
            // If it's an exit, we need to close the existing trade
            if (existingTrade) {
              // Only update if it's not already closed (or if we want to update the close info)
              // OR if it's missing contractSize (Self-healing for legacy trades)
              if (
                existingTrade.status !== TradeStatus.CLOSED ||
                !existingTrade.contractSize
              ) {
                await this.tradesService.update(
                  existingTrade.id, // We need ID, assuming findOneByExternalId returns broad entity or we fetch it
                  {
                    status: TradeStatus.CLOSED,
                    closeTime: trade.openTime, // MT5 "Time" is the event time
                    closePrice: trade.openPrice, // MT5 Deal Price is the execution price
                    profitOrLoss: trade.profit, // Final profit is on the exit deal
                    commission:
                      parseFloat(String(existingTrade.commission || 0)) +
                      (trade.commission || 0), // Accumulate
                    swap:
                      parseFloat(String(existingTrade.swap || 0)) +
                      (trade.swap || 0), // Accumulate
                    contractSize: trade.contractSize,
                    // We typically don't update SL/TP on close, but we could if the exit deal has it (unlikely helpful vs entry)
                  },

                  { id: terminal.account.userId } as any,
                );
                imported++;

                // Queue FETCH_CANDLES command for this closed trade (2h before entry, 2h after exit)
                const entryTime = existingTrade.openTime
                  ? new Date(existingTrade.openTime)
                  : new Date();
                const exitTime = trade.openTime
                  ? new Date(trade.openTime)
                  : new Date();
                const bufferMs = 2 * 60 * 60 * 1000; // 2 hours

                const startTime = new Date(entryTime.getTime() - bufferMs);
                const endTime = new Date(exitTime.getTime() + bufferMs);

                const startStr = startTime
                  .toISOString()
                  .replace('T', ' ')
                  .substring(0, 19);
                const endStr = endTime
                  .toISOString()
                  .replace('T', ' ')
                  .substring(0, 19);
                const payload = `${trade.symbol},1m,${startStr},${endStr},${existingTrade.id}`;

                this.queueCommand(terminal.id, 'FETCH_CANDLES', payload);
                this.logger.debug(
                  `Queued FETCH_CANDLES for closed trade ${existingTrade.id}`,
                );
              } else {
                skipped++; // Already closed
              }
            } else {
              // Edge Case: Exit arrived but we missed the Entry?
              // Create a standalone CLOSED trade so user sees the PnL
              await this.tradesService.create(
                {
                  symbol: trade.symbol,
                  assetType: this.detectAssetType(trade.symbol),
                  // If Exit is SELL, Position was BUY.
                  // actually, MT5 Exit Deal Type is the direction of the *closing* order?
                  // No, DEAL_TYPE_BUY means we bought. If we bought to close, we were Short.
                  // This is tricky without knowing the specific MT5 Deal Type semantics for 'entry out'.
                  // Usually: Exit Deal Type is opposite to Position Type.
                  // Safest assumption: If EntryType=OUT and Type=SELL, we Sold to Close -> Position was LONG.
                  // If EntryType=OUT and Type=BUY, we Bought to Close -> Position was SHORT.

                  // Let's invert the side for the record if it's an orphan exit
                  side:
                    trade.type === 'SELL'
                      ? TradeDirection.LONG
                      : TradeDirection.SHORT,

                  status: TradeStatus.CLOSED,
                  openTime: trade.openTime || new Date().toISOString(), // Use execution time as fallback
                  closeTime: trade.openTime,
                  openPrice: 0, // Unknown
                  closePrice: trade.openPrice,
                  quantity: trade.volume || 0,
                  profitOrLoss: trade.profit,
                  commission: trade.commission,
                  swap: trade.swap,
                  stopLoss: trade.stopLoss,
                  takeProfit: trade.takeProfit,
                  notes: `Orphan Exit Synced (Entry missing). Position ID: ${trade.positionId}`,
                  accountId: terminal.accountId,
                  externalId: positionIdString,
                  externalDealId: trade.ticket, // Exit ticket
                  mt5Magic: trade.magic,
                },
                { id: terminal.account.userId } as any,
              );
              imported++;
            }
          }
          continue; // Done with this trade (Position Logic)
        }

        // --- 2. Legacy Ticket-Based Logic (Fallback) ---
        // Check for duplicate by ticket
        const duplicateKey = `${trade.ticket}:${trade.symbol}:${trade.openTime || ''}`;
        if (duplicateCache.has(duplicateKey)) {
          skipped++;
          continue;
        }
        duplicateCache.add(duplicateKey);

        const existing = await this.tradesService.findDuplicate(
          terminal.account.userId,
          trade.symbol,
          new Date(trade.openTime || Date.now()),
          trade.ticket,
        );

        if (existing) {
          skipped++;
          continue;
        }

        // Create trade (Legacy)
        await this.tradesService.create(
          {
            symbol: trade.symbol,
            assetType: this.detectAssetType(trade.symbol),
            side:
              trade.type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT,
            status: trade.closeTime ? TradeStatus.CLOSED : TradeStatus.OPEN,
            openTime: trade.openTime || new Date().toISOString(),
            closeTime: trade.closeTime,
            openPrice: trade.openPrice || 0,
            closePrice: trade.closePrice,
            quantity: trade.volume || 0,
            commission: trade.commission,
            notes: `Auto-synced from MT5. Ticket: ${trade.ticket}`,
            accountId: terminal.accountId,
          },
          { id: terminal.account.userId } as any,
        );

        imported++;
      } catch (error) {
        this.logger.error(
          `Failed to import trade ${trade.ticket}: ${error.message}`,
          error.stack,
        );
        failed++;
        await this.terminalFailedTradesQueue.queueFailedTrade(
          terminal.id,
          trade,
          error.message,
        );

        // Send MT5_SYNC_ERROR notification
        try {
          await this.notificationsService.send({
            userId: terminal.account.userId,
            type: NotificationType.MT5_SYNC_ERROR,
            title: 'MT5 Sync Error',
            message: `Failed to sync trade ${trade.ticket}: ${error.message}`,
            priority: NotificationPriority.HIGH,
            data: {
              terminalId: terminal.id,
              accountId: terminal.accountId,
              tradeTicket: trade.ticket,
              symbol: trade.symbol,
              error: error.message,
            },
          });
        } catch (notifError) {
          this.logger.error(`Failed to send MT5 sync error notification: ${notifError.message}`);
        }
      }
    }

    // Update sync time
    terminal.lastSyncAt = new Date();
    await this.terminalRepository.save(terminal);

    this.logger.log(
      `Trade sync complete: ${imported} imported, ${skipped} skipped, ${failed} failed`,
    );

    // Send MT5_SYNC_COMPLETE notification
    try {
      await this.notificationsService.send({
        userId: terminal.account.userId,
        type: NotificationType.MT5_SYNC_COMPLETE,
        title: 'MT5 Sync Complete',
        message: `Successfully synced ${imported} trades from MT5${imported > 0 ? `. ${skipped} skipped, ${failed} failed.` : ''}`,
        data: {
          terminalId: terminal.id,
          accountId: terminal.accountId,
          accountName: terminal.account.accountName,
          imported,
          skipped,
          failed,
          syncTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send MT5 sync complete notification: ${error.message}`);
    }

    return { imported, skipped, failed };
  }

  /**
   * Process live positions from terminal EA
   */
  async processPositions(data: TerminalPositionsDto): Promise<void> {
    this.logger.debug(
      `Positions update from terminal ${data.terminalId}: ${data.positions.length} positions`,
    );

    const terminal = await this.terminalRepository.findOne({
      where: { id: data.terminalId },
    });

    if (!terminal) {
      return;
    }

    // Store positions in metadata for now
    // In a full implementation, you might want a separate positions table
    terminal.metadata = {
      ...terminal.metadata,
      livePositions: data.positions,
      positionsUpdatedAt: new Date().toISOString(),
    };

    await this.terminalRepository.save(terminal);
  }

  /**
   * Process candle data from terminal EA
   */
  async processCandles(data: TerminalCandlesSyncDto): Promise<void> {
    this.logger.log(
      `Candle sync from terminal ${data.terminalId}: ${data.candles.length} candles for trade ${data.tradeId}`,
    );

    const terminal = await this.terminalRepository.findOne({
      where: { id: data.terminalId },
    });

    if (!terminal) {
      throw new NotFoundException('Terminal not found');
    }

    // Save to trade
    await this.tradesService.saveExecutionCandles(data.tradeId, data.candles);
  }

  /**
   * Provision a new terminal container
   */
  private async provisionTerminal(
    terminalId: string,
    account: MT5Account,
    credentials?: EnableAutoSyncDto,
  ): Promise<void> {
    this.logger.log(
      `Provisioning terminal ${terminalId} for account ${account.id}`,
    );

    if (credentials) {
      this.logger.log(
        `Using provided credentials for Server: ${credentials.server}, Login: ${credentials.login}`,
      );
    }

    const terminal = await this.terminalRepository.findOne({
      where: { id: terminalId },
    });

    if (!terminal) return;

    try {
      terminal.status = TerminalStatus.STARTING;
      await this.terminalRepository.save(terminal);

      // Orchestrator integration (if configured) or fallback to simulation.
      const orchestratorUrl = this.configService.get(
        'TERMINAL_ORCHESTRATOR_URL',
      );

      if (orchestratorUrl) {
        try {
          const response = await fetch(`${orchestratorUrl}/terminals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              terminalId,
              accountId: account.id,
              server: credentials?.server,
              login: credentials?.login,
              password: credentials?.password,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Orchestrator error ${response.status}: ${errorText}`,
            );
          }

          const result = await response.json();
          terminal.containerId = result.containerId || result.container_id;
          terminal.status = TerminalStatus.RUNNING;
          terminal.lastHeartbeat = new Date();
          await this.terminalRepository.save(terminal);

          this.logger.log(
            `Terminal ${terminalId} provisioned via orchestrator`,
          );
          return;
        } catch (error) {
          this.logger.error(
            `Orchestrator provisioning failed: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      }

      // Fallback: simulate successful start for dev environments
      terminal.status = TerminalStatus.RUNNING;
      terminal.containerId = `sim-${Date.now()}`;
      terminal.lastHeartbeat = new Date();
      await this.terminalRepository.save(terminal);

      this.logger.log(`Terminal ${terminalId} provisioned successfully`);
    } catch (error) {
      terminal.status = TerminalStatus.ERROR;
      terminal.errorMessage = error.message;
      await this.terminalRepository.save(terminal);
      throw error;
    }
  }

  /**
   * Teardown a terminal container
   */
  private async teardownTerminal(terminalId: string): Promise<void> {
    this.logger.log(`Tearing down terminal ${terminalId}`);

    const terminal = await this.terminalRepository.findOne({
      where: { id: terminalId },
    });

    if (!terminal) return;

    try {
      // In a full implementation, call Docker API to stop/remove container
      const orchestratorUrl = this.configService.get(
        'TERMINAL_ORCHESTRATOR_URL',
      );

      if (orchestratorUrl && terminal.containerId) {
        const response = await fetch(
          `${orchestratorUrl}/terminals/${terminal.containerId}`,
          { method: 'DELETE' },
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Orchestrator teardown error ${response.status}: ${errorText}`,
          );
        }
      }

      terminal.status = TerminalStatus.STOPPED;
      terminal.containerId = null as any; // Clear container ID
      await this.terminalRepository.save(terminal);

      this.logger.log(`Terminal ${terminalId} torn down successfully`);
    } catch (error) {
      terminal.status = TerminalStatus.ERROR;
      terminal.errorMessage = error.message;
      await this.terminalRepository.save(terminal);
      throw error;
    }
  }

  /**
   * Detect asset type from symbol
   */
  private detectAssetType(symbol: string): AssetType {
    const upper = symbol.toUpperCase();
    const forexPairs = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    const forexMatch = forexPairs.filter((c) => upper.includes(c)).length >= 2;

    if (forexMatch && upper.length <= 7) return AssetType.FOREX;
    if (upper.includes('BTC') || upper.includes('ETH')) return AssetType.CRYPTO;
    if (upper.includes('XAU') || upper.includes('GOLD'))
      return AssetType.COMMODITIES;

    // Indices Common Symbols
    const indices = [
      'US30',
      'DJ30',
      'NAS100',
      'NDX',
      'SPX',
      'SP500',
      'GER30',
      'DE30',
      'UK100',
      'JP225',
    ];
    if (indices.some((i) => upper.includes(i))) return AssetType.INDICES;

    return AssetType.FOREX;
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponse(
    terminal: TerminalInstance,
    account: MT5Account,
  ): TerminalResponseDto {
    return {
      id: terminal.id,
      accountId: terminal.accountId,
      accountName: account.accountName,
      status: terminal.status,
      containerId: terminal.containerId,
      lastHeartbeat: terminal.lastHeartbeat,
      lastSyncAt: terminal.lastSyncAt,
      createdAt: terminal.createdAt,
    };
  }
}
