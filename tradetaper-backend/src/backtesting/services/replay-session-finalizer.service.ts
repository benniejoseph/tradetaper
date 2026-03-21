import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplaySession } from '../entities/replay-session.entity';
import { ReplaySessionService } from './replay-session.service';

@Injectable()
export class ReplaySessionFinalizerService {
  private readonly logger = new Logger(ReplaySessionFinalizerService.name);
  private isRunning = false;

  constructor(
    @InjectRepository(ReplaySession)
    private readonly replaySessionRepo: Repository<ReplaySession>,
    private readonly replaySessionService: ReplaySessionService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async finalizeCompletedSessionsWithoutReport(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const sessions = await this.replaySessionRepo
        .createQueryBuilder('session')
        .where('session.status = :status', { status: 'completed' })
        .andWhere('session."reviewReport" IS NULL')
        .orderBy('session."updatedAt"', 'ASC')
        .limit(25)
        .getMany();

      if (sessions.length === 0) {
        return;
      }

      let finalized = 0;
      let failed = 0;

      for (const session of sessions) {
        try {
          await this.replaySessionService.generateSessionReviewReport(
            session.id,
            session.userId,
          );
          finalized += 1;
        } catch (error) {
          failed += 1;
          const message =
            error instanceof Error ? error.message : 'Unknown finalizer error';
          this.logger.warn(
            `[Scheduler] Failed auto-finalize for session ${session.id}: ${message}`,
          );
        }
      }

      this.logger.log(
        `[Scheduler] Replay finalizer processed=${sessions.length}, finalized=${finalized}, failed=${failed}`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
