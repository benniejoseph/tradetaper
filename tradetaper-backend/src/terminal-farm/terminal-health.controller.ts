// src/terminal-farm/terminal-health.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { TerminalFarmService } from './terminal-farm.service';
import { TerminalCommandsQueue } from './queue/terminal-commands.queue';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  TerminalInstance,
  TerminalStatus,
} from './entities/terminal-instance.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Terminal Farm Health Check Controller
 *
 * Provides health status and metrics for MT5 terminal integration
 * Used for monitoring, alerting, and debugging
 */
@Controller('terminal-farm/health')
@UseGuards(JwtAuthGuard)
export class TerminalHealthController {
  constructor(
    @InjectRepository(TerminalInstance)
    private readonly terminalRepository: Repository<TerminalInstance>,
    private readonly terminalCommandsQueue: TerminalCommandsQueue,
  ) {}

  /**
   * Get overall health status
   * Available to all authenticated users
   */
  @Get()
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    terminals: {
      total: number;
      running: number;
      stopped: number;
      error: number;
      stale: number;
    };
    queue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    timestamp: Date;
  }> {
    // Get terminal statistics
    const allTerminals = await this.terminalRepository.find();
    const runningTerminals = allTerminals.filter(
      (t) => t.status === TerminalStatus.RUNNING,
    );
    const stoppedTerminals = allTerminals.filter(
      (t) => t.status === TerminalStatus.STOPPED,
    );
    const errorTerminals = allTerminals.filter(
      (t) => t.status === TerminalStatus.ERROR,
    );

    // Check for stale terminals (no heartbeat in 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const staleTerminals = runningTerminals.filter(
      (t) => !t.lastHeartbeat || t.lastHeartbeat < fiveMinutesAgo,
    );

    // Get queue statistics
    const queueStats = await this.terminalCommandsQueue.getStats();

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (errorTerminals.length > 0 || staleTerminals.length > 0) {
      status = 'degraded';
    }

    if (
      errorTerminals.length > runningTerminals.length * 0.5 ||
      staleTerminals.length > runningTerminals.length * 0.5
    ) {
      status = 'unhealthy';
    }

    return {
      status,
      terminals: {
        total: allTerminals.length,
        running: runningTerminals.length,
        stopped: stoppedTerminals.length,
        error: errorTerminals.length,
        stale: staleTerminals.length,
      },
      queue: queueStats,
      timestamp: new Date(),
    };
  }

  /**
   * Get detailed terminal list
   * Authenticated users only
   */
  @Get('terminals')
  async getTerminals(): Promise<any[]> {
    const terminals = await this.terminalRepository.find({
      relations: ['account'],
      order: { lastHeartbeat: 'DESC' },
    });

    return terminals.map((t) => ({
      id: t.id,
      accountId: t.accountId,
      accountName: t.account?.accountName || 'Unknown',
      status: t.status,
      lastHeartbeat: t.lastHeartbeat,
      lastSyncAt: t.lastSyncAt,
      errorMessage: t.errorMessage,
      containerId: t.containerId,
      createdAt: t.createdAt,
    }));
  }

  /**
   * Get queue details
   * Authenticated users only
   */
  @Get('queue')
  async getQueueDetails() {
    return await this.terminalCommandsQueue.getStats();
  }
}
