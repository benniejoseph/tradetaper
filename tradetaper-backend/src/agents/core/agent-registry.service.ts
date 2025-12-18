import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { BaseAgent } from './base-agent';
import { AgentHealthCheck, AgentStatus, Task } from './types';

/**
 * Agent Registry Service
 * 
 * Central registry for all agents in the multi-agent system.
 * Provides discovery, registration, and management of agents.
 * 
 * Features:
 * - Agent registration and discovery
 * - Capability-based agent lookup
 * - Health monitoring
 * - Load balancing support
 * - Lifecycle management
 */
@Injectable()
export class AgentRegistry implements OnModuleDestroy {
  private readonly logger = new Logger(AgentRegistry.name);
  private readonly agents = new Map<string, BaseAgent>();
  private readonly agentsByType = new Map<string, BaseAgent[]>();
  private readonly agentsByCapability = new Map<string, BaseAgent[]>();

  /**
   * Register an agent in the registry
   */
  registerAgent(agent: BaseAgent): void {
    const name = agent.getName();
    const type = agent.getType();
    
    if (this.agents.has(name)) {
      throw new Error(`Agent with name '${name}' is already registered`);
    }
    
    // Add to main registry
    this.agents.set(name, agent);
    
    // Index by type
    if (!this.agentsByType.has(type)) {
      this.agentsByType.set(type, []);
    }
    this.agentsByType.get(type)?.push(agent);
    
    // Index by capabilities
    for (const capability of agent.getCapabilities()) {
      if (!this.agentsByCapability.has(capability.name)) {
        this.agentsByCapability.set(capability.name, []);
      }
      this.agentsByCapability.get(capability.name)?.push(agent);
    }
    
    this.logger.log(
      `Registered agent: ${name} (type: ${type}, capabilities: ${agent.getCapabilities().map(c => c.name).join(', ')})`
    );
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(name: string): void {
    const agent = this.agents.get(name);
    if (!agent) {
      return;
    }
    
    // Remove from main registry
    this.agents.delete(name);
    
    // Remove from type index
    const type = agent.getType();
    const typeAgents = this.agentsByType.get(type) || [];
    this.agentsByType.set(
      type,
      typeAgents.filter(a => a.getName() !== name)
    );
    
    // Remove from capability index
    for (const capability of agent.getCapabilities()) {
      const capAgents = this.agentsByCapability.get(capability.name) || [];
      this.agentsByCapability.set(
        capability.name,
        capAgents.filter(a => a.getName() !== name)
      );
    }
    
    this.logger.log(`Unregistered agent: ${name}`);
  }

  /**
   * Get agent by name
   */
  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): BaseAgent[] {
    return this.agentsByType.get(type) || [];
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: string): BaseAgent[] {
    return this.agentsByCapability.get(capability) || [];
  }

  /**
   * Find best agent for a task based on multiple factors
   */
  findBestAgentForTask(task: Task): BaseAgent | null {
    // Get agents that have all required capabilities
    const candidateAgents = this.findCandidateAgents(task.requiredCapabilities);
    
    if (candidateAgents.length === 0) {
      return null;
    }
    
    // Score each agent based on multiple factors
    const scoredAgents = candidateAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, task),
    }));
    
    // Sort by score (highest first) and return best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    
    return scoredAgents[0].agent;
  }

  /**
   * Find agents that have all required capabilities
   */
  private findCandidateAgents(requiredCapabilities: string[]): BaseAgent[] {
    if (requiredCapabilities.length === 0) {
      return this.getAllAgents().filter(agent => agent.canAcceptTask());
    }
    
    // Get agents that have the first capability
    let candidates = this.getAgentsByCapability(requiredCapabilities[0]) || [];
    
    // Filter to agents that have ALL required capabilities
    candidates = candidates.filter(agent => {
      return requiredCapabilities.every(cap => agent.hasCapability(cap));
    });
    
    // Filter to agents that can accept tasks
    return candidates.filter(agent => agent.canAcceptTask());
  }

  /**
   * Calculate a score for how suitable an agent is for a task
   */
  private calculateAgentScore(agent: BaseAgent, task: Task): number {
    const metrics = agent.getMetrics();
    
    // Factor 1: Proficiency (40% weight)
    let avgProficiency = 0;
    for (const capability of task.requiredCapabilities) {
      avgProficiency += agent.getProficiency(capability);
    }
    avgProficiency /= task.requiredCapabilities.length || 1;
    const proficiencyScore = avgProficiency * 0.4;
    
    // Factor 2: Current load (30% weight) - prefer less loaded agents
    const loadScore = (1 - metrics.currentLoad) * 0.3;
    
    // Factor 3: Success rate (20% weight)
    const reliabilityScore = metrics.successRate * 0.2;
    
    // Factor 4: Response time (10% weight) - prefer faster agents
    const maxResponseTime = 10000; // 10 seconds
    const speedScore = Math.max(0, 1 - metrics.avgResponseTime / maxResponseTime) * 0.1;
    
    return proficiencyScore + loadScore + reliabilityScore + speedScore;
  }

  /**
   * Get health status of all agents
   */
  async getHealthStatus(): Promise<AgentHealthCheck[]> {
    const healthChecks: AgentHealthCheck[] = [];
    
    for (const agent of this.agents.values()) {
      const startTime = Date.now();
      const isHealthy = await agent.healthCheck();
      const responseTime = Date.now() - startTime;
      
      const metrics = agent.getMetrics();
      const status = agent.getStatus();
      
      let healthStatus: 'healthy' | 'degraded' | 'unhealthy';
      const issues: string[] = [];
      
      if (!isHealthy || status === AgentStatus.OFFLINE || status === AgentStatus.FAILED) {
        healthStatus = 'unhealthy';
        issues.push(`Status: ${status}`);
      } else if (metrics.successRate < 0.8) {
        healthStatus = 'degraded';
        issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
      } else if (metrics.currentLoad > 0.9) {
        healthStatus = 'degraded';
        issues.push(`High load: ${(metrics.currentLoad * 100).toFixed(1)}%`);
      } else if (responseTime > 5000) {
        healthStatus = 'degraded';
        issues.push(`Slow response: ${responseTime}ms`);
      } else {
        healthStatus = 'healthy';
      }
      
      healthChecks.push({
        agent: agent.getName(),
        status: healthStatus,
        responseTime,
        lastCheck: new Date(),
        metrics,
        issues: issues.length > 0 ? issues : undefined,
      });
    }
    
    return healthChecks;
  }

  /**
   * Get system-wide statistics
   */
  getSystemStats() {
    const agents = this.getAllAgents();
    
    const stats = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.getStatus() !== AgentStatus.OFFLINE).length,
      idleAgents: agents.filter(a => a.getStatus() === AgentStatus.IDLE).length,
      busyAgents: agents.filter(a => a.getStatus() === AgentStatus.BUSY).length,
      failedAgents: agents.filter(a => a.getStatus() === AgentStatus.FAILED).length,
      totalCapabilities: this.agentsByCapability.size,
      agentTypes: this.agentsByType.size,
      averageLoad: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      overallSuccessRate: 0,
      totalTokensUsed: 0,
      totalCost: 0,
    };
    
    let totalLoad = 0;
    let totalTasks = 0;
    
    for (const agent of agents) {
      const metrics = agent.getMetrics();
      totalLoad += metrics.currentLoad;
      stats.totalTasksCompleted += metrics.completedTasks;
      stats.totalTasksFailed += metrics.failedTasks;
      totalTasks += metrics.totalTasks;
      stats.totalTokensUsed += metrics.totalTokensUsed || 0;
      stats.totalCost += metrics.totalCost || 0;
    }
    
    stats.averageLoad = agents.length > 0 ? totalLoad / agents.length : 0;
    stats.overallSuccessRate = totalTasks > 0 ? stats.totalTasksCompleted / totalTasks : 0;
    
    return stats;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('Shutting down all agents...');
    
    const shutdownPromises = Array.from(this.agents.values()).map(agent =>
      agent.shutdown().catch(err => {
        this.logger.error(`Error shutting down agent ${agent.getName()}: ${err.message}`);
      })
    );
    
    await Promise.all(shutdownPromises);
    
    this.agents.clear();
    this.agentsByType.clear();
    this.agentsByCapability.clear();
    
    this.logger.log('All agents shut down');
  }
}

