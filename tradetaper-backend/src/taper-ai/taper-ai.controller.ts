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
import { DeskOrchestratorService } from './desk-orchestrator.service';
import { CreateDeskRunDto } from './dto/create-desk-run.dto';

@Controller('taper-ai/desk')
@UseGuards(JwtAuthGuard)
export class TaperAiController {
  constructor(
    @InjectRepository(DeskRun)
    private readonly deskRunRepo: Repository<DeskRun>,
    private readonly desk: DeskOrchestratorService,
  ) {}

  /**
   * Start a Desk run for a symbol. Returns immediately with the pending
   * run; the client polls GET /:id (or listens on websocket later).
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
    await this.desk.startRun(run);
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
