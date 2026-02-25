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
import { TradeProcessorService } from '../trade-processor.service';

export interface FailedTradeJob {
  terminalId: string;
  trade: TerminalTradeDto;
  reason?: string;
  receivedAt: string;
}

@Injectable()
export class TerminalFailedTradesQueue
  implements OnModuleInit, OnModuleDestroy
{
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
    private readonly tradeProcessorService: TradeProcessorService,
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

    await this.queue.add('retry-trade', payload, {
      jobId: sanitizeJobId(
        `${terminalId}_${trade.ticket}_${trade.positionId || 'legacy'}`,
      ),
    });
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

    // Position-based trades: delegate to TradeProcessorService
    if (trade.positionId) {
      const positionIdString = trade.positionId.toString();
      const existingTrade =
        (await this.tradesService.findOneByExternalId(
          terminal.account.userId,
          positionIdString,
          terminal.accountId,
        )) ?? undefined;

      if (trade.entryType === 0) {
        await this.tradeProcessorService.processEntryDeal(
          trade,
          existingTrade,
          terminal.accountId,
          terminal.account.userId,
          'local_ea',
        );
      } else if (trade.entryType === 1) {
        await this.tradeProcessorService.processExitDeal(
          trade,
          existingTrade,
          terminal.accountId,
          terminal.account.userId,
          terminal.id,
          'local_ea',
        );
      } else if (trade.entryType === 2) {
        await this.tradeProcessorService.processInOutDeal(
          trade,
          existingTrade,
          terminal.accountId,
          terminal.account.userId,
          terminal.id,
          'local_ea',
        );
      }
      return;
    }

    // Legacy ticket-based retry
    const existing = await this.tradesService.findDuplicate(
      terminal.account.userId,
      trade.symbol,
      new Date(trade.openTime || Date.now()),
      trade.ticket,
    );

    if (existing) return;

    await this.tradesService.create(
      {
        symbol: trade.symbol,
        assetType: this.tradeProcessorService.detectAssetType(trade.symbol),
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
        syncSource: 'local_ea',
      },
      { id: terminal.account.userId } as any,
    );
  }
}
