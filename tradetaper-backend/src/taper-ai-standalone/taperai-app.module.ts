// src/taper-ai-standalone/taperai-app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../database/database.module';
import { AgentsModule } from '../agents/agents.module';
import { TaperAiModule } from '../taper-ai/taper-ai.module';
import { TaperAiJwtStrategy } from './jwt.strategy';

/**
 * Standalone TaperAI Desk service.
 *
 * Runs ONLY the TaperAI research-desk surface as its own Cloud Run service,
 * so the main TradeTaper backend stays completely untouched. Shares the
 * production database (desk runs table is additive) and validates the same
 * JWTs the main backend issues. No cron jobs, no websockets, no terminal
 * farm — nothing from the wider app tree is loaded.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: 600 }),
    PassportModule,
    DatabaseModule,
    AgentsModule, // LLM orchestrator (Claude + Gemini), cost manager, cache
    TaperAiModule,
  ],
  providers: [TaperAiJwtStrategy],
})
export class TaperAiAppModule {}
