import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Core Services
import { AgentRegistry } from './core/agent-registry.service';
import { MessageBusService } from './core/message-bus.service';
import { ConsensusOrchestratorService } from './core/consensus-orchestrator.service';

// LLM Services
import { LLMCostManagerService } from './llm/llm-cost-manager.service';
import { SemanticCacheService } from './llm/semantic-cache.service';
import { MultiModelOrchestratorService } from './llm/multi-model-orchestrator.service';

// Trading Agents
import { MarketSentimentAgent } from './trading/market-sentiment-agent';

// Common
import { SecretsModule } from '../common/secrets/secrets.module';
import { AiQuotaService } from '../ai/ai-quota.service';

/**
 * Agents Module
 *
 * Central module for the multi-agent orchestration system.
 * Registers all agents, core services, and LLM infrastructure.
 *
 * This module is marked as @Global so all agents and services
 * are available throughout the application without explicit imports.
 */
@Global()
@Module({
  imports: [ConfigModule, SecretsModule],
  providers: [
    // Core Infrastructure
    AgentRegistry,
    MessageBusService,
    ConsensusOrchestratorService,

    // LLM Services
    LLMCostManagerService,
    SemanticCacheService,
    MultiModelOrchestratorService,

    // Cost Controls
    AiQuotaService,

    // Trading Agents
    MarketSentimentAgent,

    // Agent Initialization Provider
    {
      provide: 'AGENT_INITIALIZER',
      useFactory: async (
        registry: AgentRegistry,
        marketSentimentAgent: MarketSentimentAgent,
        // Add other agents here as they're created
      ) => {
        // Register all agents with the registry
        registry.registerAgent(marketSentimentAgent);

        // TODO: Register additional agents:
        // registry.registerAgent(technicalAnalysisAgent);
        // registry.registerAgent(riskManagementAgent);
        // registry.registerAgent(economicEventsAgent);
        // registry.registerAgent(tradePredictionAgent);

        return registry;
      },
      inject: [
        AgentRegistry,
        MarketSentimentAgent,
        // Add other agents here
      ],
    },
  ],
  exports: [
    AgentRegistry,
    MessageBusService,
    ConsensusOrchestratorService,
    LLMCostManagerService,
    SemanticCacheService,
    MultiModelOrchestratorService,
    MarketSentimentAgent,
    AiQuotaService,
  ],
})
export class AgentsModule {}
