import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplaySession } from '../entities/replay-session.entity';

export interface CreateSessionDto {
  userId: string;
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  startingBalance?: number;
}

export interface UpdateSessionDto {
  trades?: Record<string, unknown>[];
  endingBalance?: number;
  totalPnl?: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  winRate?: number;
  status?: 'in_progress' | 'completed' | 'abandoned';
}

@Injectable()
export class ReplaySessionService {
  private readonly logger = new Logger(ReplaySessionService.name);

  constructor(
    @InjectRepository(ReplaySession)
    private replaySessionRepo: Repository<ReplaySession>,
  ) {}

  /**
   * Create a new replay session
   */
  async createSession(data: CreateSessionDto): Promise<ReplaySession> {
    const session = this.replaySessionRepo.create({
      userId: data.userId,
      symbol: data.symbol,
      timeframe: data.timeframe,
      startDate: data.startDate,
      endDate: data.endDate,
      startingBalance: data.startingBalance || 100000,
      status: 'in_progress',
      trades: [],
    });

    await this.replaySessionRepo.save(session);
    this.logger.log(`Created replay session: ${session.id}`);
    return session;
  }

  /**
   * Update an existing replay session
   */
  async updateSession(
    sessionId: string,
    data: UpdateSessionDto,
  ): Promise<ReplaySession> {
    const session = await this.replaySessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    // Update fields
    if (data.trades !== undefined) session.trades = data.trades;
    if (data.endingBalance !== undefined)
      session.endingBalance = data.endingBalance;
    if (data.totalPnl !== undefined) session.totalPnl = data.totalPnl;
    if (data.totalTrades !== undefined) session.totalTrades = data.totalTrades;
    if (data.winningTrades !== undefined)
      session.winningTrades = data.winningTrades;
    if (data.losingTrades !== undefined)
      session.losingTrades = data.losingTrades;
    if (data.winRate !== undefined) session.winRate = data.winRate;
    if (data.status !== undefined) session.status = data.status;

    await this.replaySessionRepo.save(session);
    this.logger.log(`Updated replay session: ${sessionId}`);
    return session;
  }

  /**
   * Complete a replay session with final stats
   */
  async completeSession(
    sessionId: string,
    finalStats: {
      endingBalance: number;
      trades: any[];
    },
  ): Promise<ReplaySession> {
    const session = await this.replaySessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    // Calculate final stats
    const totalTrades = finalStats.trades.length;
    const winningTrades = finalStats.trades.filter((t) => t.pnl > 0).length;
    const losingTrades = finalStats.trades.filter((t) => t.pnl < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalPnl = finalStats.endingBalance - session.startingBalance;

    session.endingBalance = finalStats.endingBalance;
    session.trades = finalStats.trades;
    session.totalTrades = totalTrades;
    session.winningTrades = winningTrades;
    session.losingTrades = losingTrades;
    session.winRate = winRate;
    session.totalPnl = totalPnl;
    session.status = 'completed';

    await this.replaySessionRepo.save(session);
    this.logger.log(`Completed replay session: ${sessionId}`);
    return session;
  }

  /**
   * Get a single replay session
   */
  async getSession(sessionId: string): Promise<ReplaySession> {
    const session = await this.replaySessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Get all replay sessions for a user
   */
  async getUserSessions(userId: string): Promise<ReplaySession[]> {
    return this.replaySessionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete a replay session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const result = await this.replaySessionRepo.delete(sessionId);

    if (result.affected === 0) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    this.logger.log(`Deleted replay session: ${sessionId}`);
  }

  /**
   * Abandon a session (mark as abandoned without deleting)
   */
  async abandonSession(sessionId: string): Promise<ReplaySession> {
    const session = await this.getSession(sessionId);
    session.status = 'abandoned';
    await this.replaySessionRepo.save(session);
    return session;
  }
}
