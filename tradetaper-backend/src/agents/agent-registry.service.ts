import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IAgent,
  AgentRegistration,
  AgentStatus,
  AgentCapability,
} from './interfaces/agent.interface';

/**
 * Agent Registry Service - Manages agent registration, discovery, and lifecycle
 *
 * Provides a central registry for all agents in the system.
 * Enables capability-based routing and health monitoring.
 */
@Injectable()
export class AgentRegistryService implements OnModuleInit {
  private readonly logger = new Logger(AgentRegistryService.name);

  /** Registry of all agents */
  private readonly registry = new Map<string, AgentRegistration>();

  /** Capability index for fast routing */
  private readonly capabilityIndex = new Map<string, Set<string>>();

  async onModuleInit() {
    this.logger.log('Agent Registry initialized');
  }

  /**
   * Register an agent with the system
   */
  async register(agent: IAgent): Promise<void> {
    if (this.registry.has(agent.agentId)) {
      this.logger.warn(
        `Agent ${agent.agentId} already registered, updating...`,
      );
    }

    const registration: AgentRegistration = {
      agent,
      status: 'initializing',
      registeredAt: new Date(),
      lastActiveAt: new Date(),
      messageCount: 0,
      errorCount: 0,
    };

    this.registry.set(agent.agentId, registration);

    // Index capabilities for routing
    for (const capability of agent.capabilities) {
      if (!this.capabilityIndex.has(capability.id)) {
        this.capabilityIndex.set(capability.id, new Set());
      }
      this.capabilityIndex.get(capability.id)!.add(agent.agentId);
    }

    // Initialize agent if it has onInit
    if (agent.onInit) {
      try {
        await agent.onInit();
        registration.status = 'active';
        this.logger.log(
          `Agent ${agent.name} (${agent.agentId}) registered and active`,
        );
      } catch (error) {
        registration.status = 'error';
        this.logger.error(
          `Agent ${agent.agentId} failed to initialize:`,
          error,
        );
        throw error;
      }
    } else {
      registration.status = 'active';
      this.logger.log(`Agent ${agent.name} (${agent.agentId}) registered`);
    }
  }

  /**
   * Unregister an agent
   */
  async unregister(agentId: string): Promise<void> {
    const registration = this.registry.get(agentId);
    if (!registration) {
      this.logger.warn(`Agent ${agentId} not found in registry`);
      return;
    }

    registration.status = 'shutdown';

    // Call onDestroy if available
    if (registration.agent.onDestroy) {
      try {
        await registration.agent.onDestroy();
      } catch (error) {
        this.logger.error(`Error during ${agentId} shutdown:`, error);
      }
    }

    // Remove from capability index
    for (const capability of registration.agent.capabilities) {
      this.capabilityIndex.get(capability.id)?.delete(agentId);
    }

    this.registry.delete(agentId);
    this.logger.log(`Agent ${agentId} unregistered`);
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): IAgent | undefined {
    return this.registry.get(agentId)?.agent;
  }

  /**
   * Get agent registration by ID
   */
  getRegistration(agentId: string): AgentRegistration | undefined {
    return this.registry.get(agentId);
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): IAgent[] {
    return Array.from(this.registry.values())
      .filter((reg) => reg.status === 'active')
      .map((reg) => reg.agent);
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capabilityId: string): IAgent[] {
    const agentIds = this.capabilityIndex.get(capabilityId);
    if (!agentIds) return [];

    return Array.from(agentIds)
      .map((id) => this.registry.get(id))
      .filter(
        (reg): reg is AgentRegistration =>
          reg !== undefined && reg.status === 'active',
      )
      .sort((a, b) => b.agent.priority - a.agent.priority)
      .map((reg) => reg.agent);
  }

  /**
   * Find best agent for a capability (highest priority)
   */
  findBestAgent(capabilityId: string): IAgent | undefined {
    const agents = this.findAgentsByCapability(capabilityId);
    return agents[0];
  }

  /**
   * Update agent status
   */
  updateStatus(agentId: string, status: AgentStatus): void {
    const registration = this.registry.get(agentId);
    if (registration) {
      registration.status = status;
      registration.lastActiveAt = new Date();
    }
  }

  /**
   * Record message handling for metrics
   */
  recordMessage(agentId: string, success: boolean): void {
    const registration = this.registry.get(agentId);
    if (registration) {
      registration.messageCount++;
      registration.lastActiveAt = new Date();
      if (!success) {
        registration.errorCount++;
      }
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    totalCapabilities: number;
    agentStats: Array<{
      agentId: string;
      name: string;
      status: AgentStatus;
      messageCount: number;
      errorCount: number;
    }>;
  } {
    const stats = Array.from(this.registry.values()).map((reg) => ({
      agentId: reg.agent.agentId,
      name: reg.agent.name,
      status: reg.status,
      messageCount: reg.messageCount,
      errorCount: reg.errorCount,
    }));

    return {
      totalAgents: this.registry.size,
      activeAgents: stats.filter((s) => s.status === 'active').length,
      totalCapabilities: this.capabilityIndex.size,
      agentStats: stats,
    };
  }
}
