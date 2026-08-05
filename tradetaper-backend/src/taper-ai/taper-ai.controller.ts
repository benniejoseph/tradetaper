// src/taper-ai/taper-ai.controller.ts
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeskRun } from './entities/desk-run.entity';
import { DeskTaskQueueService } from './desk-task-queue.service';
import { CreateDeskRunDto } from './dto/create-desk-run.dto';

@Controller('taper-ai/desk')
@UseGuards(JwtAuthGuard)
export class TaperAiController {
  constructor(
    @InjectRepository(DeskRun)
    private readonly deskRunRepo: Repository<DeskRun>,
    private readonly taskQueue: DeskTaskQueueService,
  ) {}

  /**
   * Start a Desk run for a symbol. Returns immediately with the pending
   * run; the client polls GET /:id (or listens on websocket later).
   * Execution itself happens via Cloud Tasks (DeskInternalController), not
   * in-process — see DeskTaskQueueService for why.
   * Strict throttle: each run fires ~12 LLM calls.
   */
  @Post('runs')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async createRun(
    @Request() req: any,
    @Body() dto: CreateDeskRunDto,
  ): Promise<DeskRun> {
    const run = await this.deskRunRepo.save(
      this.deskRunRepo.create({
        userId: req.user.id,
        symbol: dto.symbol.toUpperCase(),
        personas: dto.personas ?? [],
        status: 'pending',
      }),
    );
    try {
      await this.taskQueue.enqueueRun(run.id);
    } catch (err: any) {
      // Without this, a Cloud Tasks misconfiguration would leave the run
      // silently stuck in 'pending' forever with no execution ever
      // triggered — fail it visibly instead.
      run.status = 'failed';
      run.error = `Failed to enqueue: ${err.message}`;
      await this.deskRunRepo.save(run);
    }
    return run;
  }

  @Get('runs')
  async listRuns(
    @Request() req: any,
    @Query('symbol') symbol?: string,
  ): Promise<DeskRun[]> {
    return this.deskRunRepo.find({
      where: {
        userId: req.user.id,
        ...(symbol ? { symbol: symbol.toUpperCase() } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 50,
      // List view: omit heavy stage transcripts
      select: [
        'id',
        'symbol',
        'status',
        'personas',
        'direction',
        'conviction',
        'verdict',
        'totalCostUsd',
        'durationMs',
        'createdAt',
        'completedAt',
      ],
    });
  }

  @Get('runs/:id')
  async getRun(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeskRun> {
    const run = await this.deskRunRepo.findOneBy({
      id,
      userId: req.user.id,
    });
    if (!run) throw new NotFoundException('Desk run not found');
    return run;
  }
}
