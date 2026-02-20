import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { TerminalInstance } from '../entities/terminal-instance.entity';
import { TerminalTradeDto } from '../dto/terminal.dto';
import { TradesService } from '../../trades/trades.service';
import { TradeDirection, TradeStatus, AssetType } from '../../types/enums';
import { TerminalCommandsQueue } from './terminal-commands.queue';

export interface FailedTradeJob {
  terminalId: string;
  trade: TerminalTradeDto;
  reason?: string;
  receivedAt: string;
}

@Injectable()
export class TerminalFailedTradesQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TerminalFailedTradesQueue.name);
  private queue: Queue<FailedTradeJob>;
  private worker: Worker<FailedTradeJob>;
  private connection: Redis;
  private useInMemory = false;
  private inMemoryJobs: FailedTradeJob[] = [];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TerminalInstance)
    private readonly terminalRepository: Repository<TerminalInstance>,
    @Inject(forwardRef(() => TradesService))
    private readonly tradesService: TradesService,
    private readonly terminalCommandsQueue: TerminalCommandsQueue,
  ) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not configured. Failed trade retry queue will use in-memory processing.',
      );
      this.useInMemory = true;
      return;
    }

    try {
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      this.queue = new Queue('terminal-failed-trades', {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            age: 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 86400,
          },
        },
      });

      this.worker = new Worker(
        'terminal-failed-trades',
        async (job) => this.processFailedTradeJob(job),
        {
          connection: this.connection,
        },
      );

      this.worker.on('failed', (job, error) => {
        this.logger.error(
          `Failed trade retry job ${job?.id} failed: ${error.message}`,
          error.stack,
        );
      });

      this.logger.log('Terminal Failed Trades Queue initialized');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Terminal Failed Trades Queue: ${error.message}`,
        error.stack,
      );
      this.logger.warn(
        'Falling back to in-memory retry processing (NOT RECOMMENDED FOR PRODUCTION)',
      );
      this.useInMemory = true;
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.connection) {
      await this.connection.quit();
    }
    this.inMemoryJobs = [];
  }

  async queueFailedTrade(
    terminalId: string,
    trade: TerminalTradeDto,
    reason?: string,
  ): Promise<void> {
    const payload: FailedTradeJob = {
      terminalId,
      trade,
      reason,
      receivedAt: new Date().toISOString(),
    };

    if (!this.queue && this.useInMemory) {
      this.inMemoryJobs.push(payload);
      this.logger.warn(
        `Queued failed trade for terminal ${terminalId} (in-memory retry)`,
      );
      setTimeout(() => {
        const job = this.inMemoryJobs.shift();
        if (job) {
          this.processFailedTradeJob({ data: job } as Job<FailedTradeJob>);
        }
      }, 5000);
      return;
    }

    if (!this.queue) {
      this.logger.warn(
        `Cannot queue failed trade for terminal ${terminalId} - queue not initialized`,
      );
      return;
    }

    const sanitizeJobId = (value: string) =>
      value.replace(/[^a-zA-Z0-9_-]/g, '-');

    await this.queue.add(
      'retry-trade',
      payload,
      {
        jobId: sanitizeJobId(
          `${terminalId}_${trade.ticket}_${trade.positionId || 'legacy'}`,
        ),
      },
    );
  }

  private async processFailedTradeJob(job: Job<FailedTradeJob>): Promise<void> {
    const { terminalId, trade } = job.data;

    const terminal = await this.terminalRepository.findOne({
      where: { id: terminalId },
      relations: ['account'],
    });

    if (!terminal || !terminal.account) {
      this.logger.warn(
        `Skipping failed trade retry: terminal ${terminalId} not found`,
      );
      return;
    }

    if (trade.positionId) {
      await this.processPositionTradeRetry(terminal, trade);
      return;
    }

    const existing = await this.tradesService.findDuplicate(
      terminal.account.userId,
      trade.symbol,
      new Date(trade.openTime || Date.now()),
      trade.ticket,
    );

    if (existing) {
      return;
    }

    await this.tradesService.create(
      {
        symbol: trade.symbol,
        assetType: this.detectAssetType(trade.symbol),
        side: trade.type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT,
        status: trade.closeTime ? TradeStatus.CLOSED : TradeStatus.OPEN,
        openTime: trade.openTime || new Date().toISOString(),
        closeTime: trade.closeTime,
        openPrice: trade.openPrice || 0,
        closePrice: trade.closePrice,
        quantity: trade.volume || 0,
        commission: trade.commission,
        notes: `Auto-synced from MT5 retry. Ticket: ${trade.ticket}`,
        accountId: terminal.accountId,
      },
      { id: terminal.account.userId } as any,
    );
  }

  private async processPositionTradeRetry(
    terminal: TerminalInstance,
    trade: TerminalTradeDto,
  ): Promise<void> {
    const normalizeTerminalTime = (
      value?: string | number | Date,
    ): string | undefined => {
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
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
      return value;
    };

    const normalizedOpenTime = normalizeTerminalTime(trade.openTime);

    const positionIdString = trade.positionId!.toString();
    const existingTrade = await this.tradesService.findOneByExternalId(
      terminal.account.userId,
      positionIdString,
      terminal.accountId,
    );

    const isEntry = trade.entryType === 0;
    const isExit = trade.entryType === 1;

    if (isEntry) {
      if (existingTrade) {
        const entryUpdates: Record<string, any> = {};

        if (!existingTrade.openTime && normalizedOpenTime) {
          entryUpdates.openTime = normalizedOpenTime;
        }
        if (!existingTrade.openPrice && trade.openPrice) {
          entryUpdates.openPrice = trade.openPrice;
        }
        if (!existingTrade.quantity && trade.volume) {
          entryUpdates.quantity = trade.volume;
        }
        if (!existingTrade.side && trade.type) {
          entryUpdates.side =
            trade.type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT;
        }
        if (!existingTrade.stopLoss && trade.stopLoss) {
          entryUpdates.stopLoss = trade.stopLoss;
        }
        if (!existingTrade.takeProfit && trade.takeProfit) {
          entryUpdates.takeProfit = trade.takeProfit;
        }
        if (!existingTrade.contractSize && trade.contractSize) {
          entryUpdates.contractSize = trade.contractSize;
        }
        if (!existingTrade.externalDealId && trade.ticket) {
          entryUpdates.externalDealId = trade.ticket;
        }
        if (!existingTrade.mt5Magic && trade.magic) {
          entryUpdates.mt5Magic = trade.magic;
        }

        if (Object.keys(entryUpdates).length > 0) {
          await this.tradesService.updateFromSync(
            existingTrade.id,
            entryUpdates,
          );
        }
        return;
      }

      await this.tradesService.create(
        {
          symbol: trade.symbol,
          assetType: this.detectAssetType(trade.symbol),
          side:
            trade.type === 'BUY'
              ? TradeDirection.LONG
              : TradeDirection.SHORT,
          status: TradeStatus.OPEN,
          openTime: normalizedOpenTime || new Date().toISOString(),
          openPrice: trade.openPrice || 0,
          quantity: trade.volume || 0,
          commission: trade.commission,
          swap: trade.swap,
          notes: `Auto-synced via Position ID retry: ${trade.positionId}`,
          accountId: terminal.accountId,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          externalId: positionIdString,
          externalDealId: trade.ticket,
          mt5Magic: trade.magic,
          contractSize: trade.contractSize,
        },
        { id: terminal.account.userId } as any,
      );
      return;
    }

    if (isExit) {
      if (existingTrade) {
        await this.tradesService.update(
          existingTrade.id,
          {
            status: TradeStatus.CLOSED,
            closeTime: normalizedOpenTime,
            closePrice: trade.openPrice,
            profitOrLoss: trade.profit,
            commission:
              parseFloat(String(existingTrade.commission || 0)) +
              (trade.commission || 0),
            swap:
              parseFloat(String(existingTrade.swap || 0)) +
              (trade.swap || 0),
            contractSize: trade.contractSize,
          },
          { id: terminal.account.userId } as any,
          { changeSource: 'mt5' },
        );

        if (terminal.status === 'RUNNING') {
          const entryTime = existingTrade.openTime
            ? new Date(existingTrade.openTime)
            : new Date();
          const exitTime = normalizedOpenTime
            ? new Date(normalizedOpenTime)
            : new Date();
          const bufferMs = 2 * 60 * 60 * 1000;
          const startTime = new Date(entryTime.getTime() - bufferMs);
          const endTime = new Date(exitTime.getTime() + bufferMs);
          const formatMt5Time = (value: Date) =>
            value
              .toISOString()
              .replace('T', ' ')
              .substring(0, 19)
              .replace(/-/g, '.');
          const startStr = formatMt5Time(startTime);
          const endStr = formatMt5Time(endTime);
          const payload = `${trade.symbol},1m,${startStr},${endStr},${existingTrade.id}`;
          await this.terminalCommandsQueue.queueCommand(
            terminal.id,
            'FETCH_CANDLES',
            payload,
          );
        }
        return;
      }

      await this.tradesService.create(
        {
          symbol: trade.symbol,
          assetType: this.detectAssetType(trade.symbol),
          side:
            trade.type === 'SELL'
              ? TradeDirection.LONG
              : TradeDirection.SHORT,
          status: TradeStatus.CLOSED,
          openTime: normalizedOpenTime || new Date().toISOString(),
          closeTime: normalizedOpenTime,
          openPrice: 0,
          closePrice: trade.openPrice,
          quantity: trade.volume || 0,
          profitOrLoss: trade.profit,
          commission: trade.commission,
          swap: trade.swap,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          notes: `Orphan Exit Synced (Retry). Position ID: ${trade.positionId}`,
          accountId: terminal.accountId,
          externalId: positionIdString,
          externalDealId: trade.ticket,
          mt5Magic: trade.magic,
        },
        { id: terminal.account.userId } as any,
      );
    }
  }

  private detectAssetType(symbol: string): AssetType {
    const upper = symbol.toUpperCase();
    const forexPairs = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    const forexMatch = forexPairs.filter((c) => upper.includes(c)).length >= 2;

    if (forexMatch && upper.length <= 7) return AssetType.FOREX;
    if (upper.includes('BTC') || upper.includes('ETH')) return AssetType.CRYPTO;
    if (upper.includes('XAU') || upper.includes('GOLD'))
      return AssetType.COMMODITIES;

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
}
