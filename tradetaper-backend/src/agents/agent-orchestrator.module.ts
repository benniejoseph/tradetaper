import { Module, Global } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { AgentRegistryService } from './agent-registry.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { AgentsController } from './agents.controller';

/**
 * Agent Orchestrator Module
 *
 * Core module for multi-agent coordination in TradeTaper.
 * Provides:
 * - EventBus: Pub/sub messaging between agents
 * - AgentRegistry: Agent discovery and lifecycle management
 * - AgentOrchestrator: Central coordination and routing
 *
 * This module is marked as @Global so agents can inject
 * orchestration services from anywhere in the application.
 */
@Global()
@Module({
  controllers: [AgentsController],
  providers: [EventBusService, AgentRegistryService, AgentOrchestratorService],
  exports: [EventBusService, AgentRegistryService, AgentOrchestratorService],
})
export class AgentOrchestratorModule {}
