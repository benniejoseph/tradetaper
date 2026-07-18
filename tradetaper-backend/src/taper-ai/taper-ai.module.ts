// src/taper-ai/taper-ai.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeskRun } from './entities/desk-run.entity';
import { DeskOrchestratorService } from './desk-orchestrator.service';
import { TaperAiController } from './taper-ai.controller';
import { AgentsModule } from '../agents/agents.module';
import { MarketIntelligenceModule } from '../market-intelligence/market-intelligence.module';

/**
 * TaperAI — the AI research desk sub-product.
 *
 * Multi-agent pipeline (analysts → bull/bear debate → personas → trader →
 * risk → PM) producing explainable, conviction-scored Thesis Cards.
 * See docs/taperai/PRODUCT_PLAN.md for the full roadmap.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DeskRun]),
    AgentsModule, // MultiModelOrchestratorService (LLM routing, cost, cache)
    MarketIntelligenceModule, // quotes + sentiment context
  ],
  controllers: [TaperAiController],
  providers: [DeskOrchestratorService],
  exports: [DeskOrchestratorService],
})
export class TaperAiModule {}
