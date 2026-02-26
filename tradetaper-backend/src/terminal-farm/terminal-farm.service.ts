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
import { Trade } from '../trades/entities/trade.entity';
import { TradeStatus, TradeDirection, AssetType } from '../types/enums';
import { TerminalCommandsQueue } from './queue/terminal-commands.queue';
import { TerminalFailedTradesQueue } from './queue/terminal-failed-trades.queue';
import { TerminalTokenService } from './terminal-token.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationPriority,
} from '../notifications/entities/notification.entity';
import { MT5PositionsGateway } from '../websocket/mt5-positions.gateway';
import { TradeProcessorService } from './trade-processor.service';

@Injectable()
export class TerminalFarmService {
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
    private readonly mt5PositionsGateway: MT5PositionsGateway,
    private readonly tradeProcessorService: TradeProcessorService,
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

  async requestManualSync(
    accountId: string,
    userId: string,
  ): Promise<{ queued: boolean; message: string }> {
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
      throw new BadRequestException(
        'Auto-sync is not enabled for this account. Enable Auto-Sync first.',
      );
    }

    if (
      terminal.status === TerminalStatus.STOPPED ||
      terminal.status === TerminalStatus.ERROR
    ) {
      throw new BadRequestException(
        'Terminal is not running. Enable Auto-Sync to start it before syncing.',
      );
    }

    await this.queueCommand(terminal.id, 'SYNC_TRADES', '');
    this.logger.log(
      `Queued SYNC_TRADES for account ${accountId} (terminal ${terminal.id})`,
    );

    return {
      queued: true,
      message: 'Sync command queued. Trades will appear shortly.',
    };
  }

  /**
   * Get live positions for an MT5 account (from terminal metadata)
   */
  async getLivePositions(
    accountId: string,
    userId: string,
  ): Promise<{
    enabled: boolean;
    accountId?: string;
    accountName?: string;
    terminalId?: string;
    status?: TerminalStatus;
    lastHeartbeat?: Date;
    positionsUpdatedAt?: string;
    positions: any[];
  }> {
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
      return {
        enabled: false,
        accountId: account.id,
        accountName: account.accountName,
        positions: [],
      };
    }

    const livePositions = terminal.metadata?.livePositions || [];
    const positionsUpdatedAt = terminal.metadata?.positionsUpdatedAt;

    return {
      enabled: true,
      accountId: terminal.accountId,
      accountName: account.accountName,
      terminalId: terminal.id,
      status: terminal.status,
      lastHeartbeat: terminal.lastHeartbeat,
      positionsUpdatedAt,
      positions: livePositions,
    };
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

    if (this.terminalCommandsQueue.isUsingInMemory()) {
      const terminal = await this.terminalRepository.findOne({
        where: { id: terminalId },
      });
      if (terminal) {
        const pending = Array.isArray(terminal.metadata?.pendingCommands)
          ? terminal.metadata?.pendingCommands?.slice()
          : [];
        pending.push({
          command,
          payload,
          queuedAt: new Date().toISOString(),
        });
        terminal.metadata = {
          ...(terminal.metadata || {}),
          pendingCommands: pending,
        };
        await this.terminalRepository.save(terminal);
      }
    }
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

    // Check for queued commands from the primary queue
    const nextCmd = await this.terminalCommandsQueue.getNextCommand(
      data.terminalId,
    );

    // [FIX #11] Consolidate all metadata changes into a single save
    let pendingCommands = Array.isArray(terminal.metadata?.pendingCommands)
      ? [...terminal.metadata.pendingCommands]
      : [];

    // If the primary queue returned a command AND we're using in-memory mode, dequeue from metadata too
    if (nextCmd && this.terminalCommandsQueue.isUsingInMemory()) {
      const idx = pendingCommands.findIndex(
        (cmd) => cmd.command === nextCmd.command && cmd.payload === nextCmd.payload,
      );
      if (idx >= 0) pendingCommands.splice(idx, 1);
      terminal.metadata = { ...(terminal.metadata || {}), pendingCommands };
      await this.terminalRepository.save(terminal); // SINGLE save [FIX #11]

      this.logger.log(
        `Dispatching command ${nextCmd.command} to terminal ${data.terminalId}`,
      );
      return {
        success: true,
        command: nextCmd.command,
        payload: nextCmd.payload,
      };
    }

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

    // Fallback: consume from in-memory pendingCommands if Redis unavailable
    if (pendingCommands.length > 0) {
      const nextPending = pendingCommands.shift();
      terminal.metadata = { ...(terminal.metadata || {}), pendingCommands };
      await this.terminalRepository.save(terminal); // SINGLE save [FIX #11]
      return {
        success: true,
        command: nextPending.command,
        payload: nextPending.payload,
        fallback: true,
      };
    }

    return { success: true };
  }

  /**
   * Process trade sync from terminal EA
   * REFACTORED: Delegates to TradeProcessorService for individual trade processing.
   * Keeps batch prefetch logic and notification handling here.
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

    // BATCH: Pre-fetch all existing trades by position ID to prevent N+1 queries
    const positionIds = data.trades
      .filter((t) => t.positionId)
      .map((t) => t.positionId!.toString());

    const existingTradesMap = new Map<string, any>();

    if (positionIds.length > 0) {
      const existingTrades = await this.tradesService.findManyByExternalIds(
        terminal.account.userId,
        positionIds,
        terminal.accountId,
      );

      const groupedByExternalId = new Map<string, any[]>();
      existingTrades.forEach((trade) => {
        if (!trade.externalId) return;
        const list = groupedByExternalId.get(trade.externalId) || [];
        list.push(trade);
        groupedByExternalId.set(trade.externalId, list);
      });

      for (const [externalId, trades] of groupedByExternalId.entries()) {
        if (trades.length > 1) {
          const merged = await this.tradesService.mergeDuplicateExternalTrades(
            terminal.account.userId,
            externalId,
            terminal.accountId,
          );
          if (merged) existingTradesMap.set(externalId, merged);
        } else {
          existingTradesMap.set(externalId, trades[0]);
        }
      }

      this.logger.debug(
        `Fetched ${existingTrades.length} existing trades for batch processing`,
      );
    }

    const duplicateCache = new Set<string>();
    for (const trade of data.trades) {
      try {
        // --- Position-Based Logic (delegates to TradeProcessorService) ---
        if (trade.positionId) {
          const positionIdString = trade.positionId.toString();
          const existingTrade = existingTradesMap.get(positionIdString);

          let result;
          if (trade.entryType === 0) {
            // DEAL_ENTRY_IN
            result = await this.tradeProcessorService.processEntryDeal(
              trade,
              existingTrade,
              terminal.accountId,
              terminal.account.userId,
              'local_ea',
            );
          } else if (trade.entryType === 1) {
            // DEAL_ENTRY_OUT
            result = await this.tradeProcessorService.processExitDeal(
              trade,
              existingTrade,
              terminal.accountId,
              terminal.account.userId,
              terminal.id,
              'local_ea',
            );
          } else if (trade.entryType === 2) {
            // DEAL_ENTRY_INOUT (partial close / reverse)
            result = await this.tradeProcessorService.processInOutDeal(
              trade,
              existingTrade,
              terminal.accountId,
              terminal.account.userId,
              terminal.id,
              'local_ea',
            );
          } else {
            // Unknown entryType — skip
            skipped++;
            continue;
          }

          if (result.trade)
            existingTradesMap.set(positionIdString, result.trade);

          if (result.action === 'created' || result.action === 'updated')
            imported++;
          else if (result.action === 'skipped' || result.action === 'conflict')
            skipped++;

          continue;
        }

        // --- Legacy Ticket-Based Logic (fallback for trades without positionId) ---
        const normalizedOpenTime =
          this.tradeProcessorService.normalizeTerminalTime(trade.openTime);
        const normalizedCloseTime =
          this.tradeProcessorService.normalizeTerminalTime(trade.closeTime);
        const duplicateKey = `${trade.ticket}:${trade.symbol}:${normalizedOpenTime || ''}`;
        if (duplicateCache.has(duplicateKey)) {
          skipped++;
          continue;
        }
        duplicateCache.add(duplicateKey);

        const existing = await this.tradesService.findDuplicate(
          terminal.account.userId,
          trade.symbol,
          new Date(normalizedOpenTime || Date.now()),
          trade.ticket,
        );
        if (existing) {
          skipped++;
          continue;
        }

        await this.tradesService.create(
          {
            symbol: trade.symbol,
            assetType: this.tradeProcessorService.detectAssetType(trade.symbol),
            side:
              trade.type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT,
            status: trade.closeTime ? TradeStatus.CLOSED : TradeStatus.OPEN,
            openTime: normalizedOpenTime || new Date().toISOString(),
            closeTime: normalizedCloseTime,
            openPrice: trade.openPrice || 0,
            closePrice: trade.closePrice,
            quantity: trade.volume || 0,
            commission: trade.commission,
            notes: `Auto-synced from MT5. Ticket: ${trade.ticket}`,
            accountId: terminal.accountId,
            syncSource: 'local_ea',
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
          this.logger.error(
            `Failed to send MT5 sync error notification: ${notifError.message}`,
          );
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
      this.logger.error(
        `Failed to send MT5 sync complete notification: ${error.message}`,
      );
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

    const normalizeTargetValue = (value?: number | null) => {
      if (value === null || value === undefined) return null;
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric === 0) return null;
      return numeric;
    };

    const normalizedPositions = data.positions.map((position) => ({
      ...position,
      openTime: this.tradeProcessorService.normalizeTerminalTime(
        position.openTime,
      ),
      stopLoss: normalizeTargetValue(position.stopLoss),
      takeProfit: normalizeTargetValue(position.takeProfit),
    }));

    // Store positions in metadata for now
    // In a full implementation, you might want a separate positions table
    terminal.metadata = {
      ...terminal.metadata,
      livePositions: normalizedPositions,
      positionsUpdatedAt: new Date().toISOString(),
    };

    await this.terminalRepository.save(terminal);

    // [FIX #5] Read accountName from cached metadata first to avoid N+1 DB reads
    const cachedAccountName: string | undefined = (terminal.metadata as any)?.accountName;
    let accountId = terminal.accountId;
    let accountNameForEmit = cachedAccountName;

    if (!cachedAccountName) {
      const account = await this.mt5AccountRepository.findOne({
        where: { id: terminal.accountId },
        select: ['id', 'accountName', 'userId'],
      });
      if (!account) return;
      accountNameForEmit = account.accountName;
      accountId = account.id;

      // Warm the cache for next time
      terminal.metadata = { ...(terminal.metadata || {}), accountName: account.accountName };
      await this.terminalRepository.save(terminal);
    }

    const externalIds = normalizedPositions
      .map((pos) => pos.ticket?.toString())
      .filter(Boolean);

    if (externalIds.length > 0) {
      // We need userId to query trades — fetch from account only if not in cache
      const cachedUserId: string | undefined = (terminal.metadata as any)?.userId;
      let resolvedUserId = cachedUserId;
      if (!resolvedUserId) {
        const acct = await this.mt5AccountRepository.findOne({
          where: { id: terminal.accountId },
          select: ['id', 'userId'],
        });
        if (!acct) return;
        resolvedUserId = acct.userId;
        terminal.metadata = { ...(terminal.metadata || {}), userId: acct.userId };
        await this.terminalRepository.save(terminal);
      }

      const trades = await this.tradesService.findManyByExternalIds(
        resolvedUserId,
        externalIds,
        terminal.accountId,
      );
      const tradeMap = new Map(
        trades.map((trade) => [trade.externalId, trade]),
      );

      for (const position of normalizedPositions) {
        const externalId = position.ticket?.toString();
        if (!externalId) continue;
        const trade = tradeMap.get(externalId);
        if (!trade) continue;

        const updates: Partial<Trade> = {};
        const changes: Record<string, { from: unknown; to: unknown }> = {};

        const nextStopLoss = normalizeTargetValue(position.stopLoss);
        const nextTakeProfit = normalizeTargetValue(position.takeProfit);
        const nextQuantity = Number(position.volume);
        const nextOpenPrice = Number(position.openPrice);

        const currentStopLoss = normalizeTargetValue(trade.stopLoss);
        const currentTakeProfit = normalizeTargetValue(trade.takeProfit);
        const currentQuantity =
          trade.quantity === null || trade.quantity === undefined
            ? null
            : Number(trade.quantity);
        const currentOpenPrice =
          trade.openPrice === null || trade.openPrice === undefined
            ? null
            : Number(trade.openPrice);

        if (currentStopLoss !== nextStopLoss) {
          updates.stopLoss = nextStopLoss;
          changes.stopLoss = { from: currentStopLoss, to: nextStopLoss };
        }

        if (currentTakeProfit !== nextTakeProfit) {
          updates.takeProfit = nextTakeProfit;
          changes.takeProfit = { from: currentTakeProfit, to: nextTakeProfit };
        }

        if (Number.isFinite(nextQuantity) && currentQuantity !== nextQuantity) {
          updates.quantity = nextQuantity;
          changes.quantity = { from: trade.quantity, to: nextQuantity };
        }

        if (
          Number.isFinite(nextOpenPrice) &&
          currentOpenPrice !== nextOpenPrice
        ) {
          updates.openPrice = nextOpenPrice;
          changes.openPrice = { from: trade.openPrice, to: nextOpenPrice };
        }

        if (Object.keys(updates).length > 0) {
          await this.tradesService.updateFromSync(trade.id, updates, {
            source: 'mt5',
            changes,
            note: 'Live position update',
          });
        }
      }
    }

    this.mt5PositionsGateway.emitPositionsUpdate(terminal.accountId, {
      enabled: true,
      accountId: terminal.accountId,
      accountName: accountNameForEmit,
      terminalId: terminal.id,
      status: terminal.status,
      lastHeartbeat: terminal.lastHeartbeat,
      positionsUpdatedAt: terminal.metadata?.positionsUpdatedAt,
      positions: normalizedPositions,
    });
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
