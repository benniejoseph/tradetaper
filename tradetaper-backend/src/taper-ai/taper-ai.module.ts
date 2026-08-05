// src/taper-ai/taper-ai.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeskRun } from './entities/desk-run.entity';
import { DeskOrchestratorService } from './desk-orchestrator.service';
import { DeskTaskQueueService } from './desk-task-queue.service';
import { TaperAiMarketDataService } from './market-data.service';
import { TaperAiController } from './taper-ai.controller';
import { DeskInternalController } from './desk-internal.controller';
import { InternalTaskGuard } from './guards/internal-task.guard';
import { AgentsModule } from '../agents/agents.module';

/**
 * TaperAI — the AI research desk sub-product.
 *
 * Multi-agent pipeline (analysts → bull/bear debate → personas → trader →
 * risk → PM) producing explainable, conviction-scored Thesis Cards.
 * Self-contained: market data comes from TaperAiMarketDataService (no
 * dependency on the wider TradeTaper module tree), so this module can run
 * inside the main app or as the standalone taperai-desk service.
 * See docs/taperai/PRODUCT_PLAN.md for the full roadmap.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DeskRun]),
    AgentsModule, // MultiModelOrchestratorService (LLM routing, cost, cache)
  ],
  controllers: [TaperAiController, DeskInternalController],
  providers: [
    DeskOrchestratorService,
    DeskTaskQueueService,
    TaperAiMarketDataService,
    InternalTaskGuard,
  ],
  exports: [DeskOrchestratorService],
})
export class TaperAiModule {}
