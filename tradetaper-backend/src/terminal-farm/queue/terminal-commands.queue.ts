// src/terminal-farm/queue/terminal-commands.queue.ts
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

/**
 * Terminal Commands Queue Service
 *
 * Manages persistent command queue for MT5 terminals using Redis/BullMQ.
 * Replaces in-memory queue to support:
 * - Persistence across server restarts
 * - Horizontal scaling
 * - Automatic retry logic
 * - Job scheduling and prioritization
 */

export interface TerminalCommand {
  terminalId: string;
  command: string;
  payload: string;
  timestamp?: Date;
}

@Injectable()
export class TerminalCommandsQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TerminalCommandsQueue.name);
  private queue: Queue<TerminalCommand>;
  private connection: Redis;
  private readonly inMemoryQueue = new Map<string, TerminalCommand[]>();
  private useInMemory = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not configured. Using fallback in-memory queue. ' +
          'Configure REDIS_URL for production persistence.',
      );
      this.useInMemory = true;
      return;
    }

    try {
      // Create Redis connection
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      // Create BullMQ queue
      this.queue = new Queue('terminal-commands', {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3, // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2s, then 4s, then 8s
          },
          removeOnComplete: {
            age: 3600, // Remove completed jobs after 1 hour
            count: 1000, // Keep max 1000 completed jobs
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours for debugging
          },
        },
      });

      this.logger.log(
        'Terminal Commands Queue initialized with Redis persistence',
      );

      // Log queue events
      this.queue.on('error', (error) => {
        this.logger.error(`Queue error: ${error.message}`, error.stack);
      });
    } catch (error) {
      this.logger.error(
        `Failed to initialize Terminal Commands Queue: ${error.message}`,
        error.stack,
      );
      this.logger.warn(
        'Falling back to in-memory queue (NOT RECOMMENDED FOR PRODUCTION)',
      );
      this.useInMemory = true;
    }
  }

  async onModuleDestroy() {
    if (this.queue) {
      await this.queue.close();
      this.logger.log('Terminal Commands Queue closed');
    }
    if (this.connection) {
      await this.connection.quit();
      this.logger.log('Redis connection closed');
    }
    this.inMemoryQueue.clear();
  }

  /**
   * Queue a command for a terminal
   * Commands are persisted in Redis and survive server restarts
   */
  async queueCommand(
    terminalId: string,
    command: string,
    payload: string,
  ): Promise<void> {
    if (!this.queue && this.useInMemory) {
      const queue = this.inMemoryQueue.get(terminalId) ?? [];
      queue.push({
        terminalId,
        command,
        payload,
        timestamp: new Date(),
      });
      this.inMemoryQueue.set(terminalId, queue);
      this.logger.debug(
        `Queued command ${command} for terminal ${terminalId} (in-memory)`,
      );
      return;
    }
    if (!this.queue) {
      this.logger.warn(
        `Cannot queue command ${command} for terminal ${terminalId} - queue not initialized`,
      );
      return;
    }

    const sanitizeJobId = (value: string) =>
      value.replace(/[^a-zA-Z0-9_-]/g, '-');

    try {
      await this.queue.add(
        'execute-command',
        {
          terminalId,
          command,
          payload,
          timestamp: new Date(),
        },
        {
          // Priority: higher number = higher priority
          priority: command === 'FETCH_CANDLES' ? 5 : 10,
          // Job ID ensures idempotency for duplicate commands
          jobId: sanitizeJobId(
            `${terminalId}_${command}_${payload.substring(0, 50)}`,
          ),
        },
      );

      this.logger.debug(`Queued command ${command} for terminal ${terminalId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue command ${command}: ${error.message}`,
        error.stack,
      );
    }
  }

  isUsingInMemory(): boolean {
    return this.useInMemory || !this.queue;
  }

  /**
   * Get next command for a terminal (called during heartbeat)
   * Returns null if no commands pending
   */
  async getNextCommand(terminalId: string): Promise<TerminalCommand | null> {
    if (!this.queue && this.useInMemory) {
      const queue = this.inMemoryQueue.get(terminalId);
      if (!queue || queue.length === 0) {
        return null;
      }
      const command = queue.shift()!;
      if (queue.length === 0) {
        this.inMemoryQueue.delete(terminalId);
      } else {
        this.inMemoryQueue.set(terminalId, queue);
      }
      this.logger.debug(
        `Dispatched command ${command.command} to terminal ${terminalId} (in-memory)`,
      );
      return command;
    }
    if (!this.queue) {
      return null;
    }

    try {
      // Get all waiting jobs for this terminal
      const waitingJobs = await this.queue.getWaiting();

      // Find first job for this terminal
      const job = waitingJobs.find((j) => j.data.terminalId === terminalId);

      if (!job) {
        return null;
      }

      // Remove job once dispatched (we are the consumer)
      await job.remove();

      this.logger.debug(
        `Dispatched command ${job.data.command} to terminal ${terminalId}`,
      );

      return job.data;
    } catch (error) {
      this.logger.error(
        `Failed to get next command for terminal ${terminalId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    if (!this.queue && this.useInMemory) {
      const waiting = Array.from(this.inMemoryQueue.values()).reduce(
        (count, queue) => count + queue.length,
        0,
      );
      return { waiting, active: 0, completed: 0, failed: 0 };
    }
    if (!this.queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Clear all commands for a terminal
   */
  async clearTerminalCommands(terminalId: string): Promise<number> {
    if (!this.queue && this.useInMemory) {
      const queue = this.inMemoryQueue.get(terminalId);
      if (!queue) {
        return 0;
      }
      const cleared = queue.length;
      this.inMemoryQueue.delete(terminalId);
      this.logger.log(
        `Cleared ${cleared} commands for terminal ${terminalId} (in-memory)`,
      );
      return cleared;
    }
    if (!this.queue) {
      return 0;
    }

    try {
      const waitingJobs = await this.queue.getWaiting();
      const terminalJobs = waitingJobs.filter(
        (j) => j.data.terminalId === terminalId,
      );

      for (const job of terminalJobs) {
        await job.remove();
      }

      this.logger.log(
        `Cleared ${terminalJobs.length} commands for terminal ${terminalId}`,
      );

      return terminalJobs.length;
    } catch (error) {
      this.logger.error(
        `Failed to clear commands for terminal ${terminalId}: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }
}
