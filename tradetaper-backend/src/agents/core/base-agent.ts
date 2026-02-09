import { Logger } from '@nestjs/common';
import {
  AgentCapability,
  AgentConfig,
  AgentMetrics,
  AgentResponse,
  AgentStatus,
  Task,
  TaskStatus,
} from './types';

/**
 * Base Agent Class
 *
 * All specialized agents inherit from this base class.
 * Provides common functionality for task execution, metrics tracking, and lifecycle management.
 */
export abstract class BaseAgent {
  protected readonly logger: Logger;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected metrics: AgentMetrics;
  protected currentTasks: Map<string, Task> = new Map();

  constructor(protected readonly config: AgentConfig) {
    this.logger = new Logger(this.config.name);
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): AgentMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgResponseTime: 0,
      successRate: 1.0,
      currentLoad: 0,
      lastActive: new Date(),
      totalTokensUsed: 0,
      totalCost: 0,
    };
  }

  /**
   * Abstract method that must be implemented by each agent
   */
  protected abstract executeTask(task: Task): Promise<AgentResponse>;

  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get agent type
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapability[] {
    return this.config.capabilities;
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent metrics
   */
  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if agent can handle a specific capability
   */
  hasCapability(capabilityName: string): boolean {
    return this.config.capabilities.some((cap) => cap.name === capabilityName);
  }

  /**
   * Get proficiency for a specific capability
   */
  getProficiency(capabilityName: string): number {
    const capability = this.config.capabilities.find(
      (cap) => cap.name === capabilityName,
    );
    return capability?.proficiency || 0;
  }

  /**
   * Check if agent can accept more tasks
   */
  canAcceptTask(): boolean {
    return (
      this.status !== AgentStatus.OFFLINE &&
      this.status !== AgentStatus.FAILED &&
      this.currentTasks.size < this.config.maxConcurrentTasks
    );
  }

  /**
   * Assign a task to this agent
   */
  async assignTask(task: Task): Promise<void> {
    if (!this.canAcceptTask()) {
      throw new Error(
        `Agent ${this.config.name} cannot accept task: ` +
          `status=${this.status}, load=${this.currentTasks.size}/${this.config.maxConcurrentTasks}`,
      );
    }

    task.status = TaskStatus.ASSIGNED;
    task.assignedAgent = this.config.name;
    this.currentTasks.set(task.id, task);

    this.updateLoad();
    this.logger.log(`Task ${task.id} assigned`);
  }

  /**
   * Execute a task with error handling, retries, and metrics
   */
  async execute(task: Task): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Executing task ${task.id} (type: ${task.type})`);

      task.status = TaskStatus.IN_PROGRESS;
      task.startedAt = new Date();
      this.status = AgentStatus.BUSY;

      // Execute with timeout
      const response = await this.executeWithTimeout(task);

      // Update task
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.result = response.data;

      // Update metrics
      const executionTime = Date.now() - startTime;
      this.updateMetrics(true, executionTime, response.metadata);

      this.logger.log(
        `Task ${task.id} completed in ${executionTime}ms (confidence: ${response.metadata?.confidence || 'N/A'})`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Task ${task.id} failed: ${error.message}`,
        error.stack,
      );

      task.status = TaskStatus.FAILED;
      task.error = error.message;
      task.completedAt = new Date();

      const executionTime = Date.now() - startTime;
      this.updateMetrics(false, executionTime);

      return {
        success: false,
        error: error.message,
        metadata: { executionTime },
      };
    } finally {
      this.currentTasks.delete(task.id);
      this.status =
        this.currentTasks.size > 0 ? AgentStatus.BUSY : AgentStatus.IDLE;
      this.updateLoad();
      this.metrics.lastActive = new Date();
    }
  }

  /**
   * Execute task with timeout protection
   */
  private async executeWithTimeout(task: Task): Promise<AgentResponse> {
    return Promise.race([
      this.executeTask(task),
      new Promise<AgentResponse>((_, reject) =>
        setTimeout(
          () => reject(new Error('Task execution timeout')),
          this.config.timeout,
        ),
      ),
    ]);
  }

  /**
   * Update agent metrics after task execution
   */
  private updateMetrics(
    success: boolean,
    executionTime: number,
    metadata?: Record<string, any>,
  ): void {
    this.metrics.totalTasks++;

    if (success) {
      this.metrics.completedTasks++;
    } else {
      this.metrics.failedTasks++;
    }

    // Update average response time (exponential moving average)
    const alpha = 0.2; // Smoothing factor
    this.metrics.avgResponseTime =
      alpha * executionTime + (1 - alpha) * this.metrics.avgResponseTime;

    // Update success rate
    this.metrics.successRate =
      this.metrics.completedTasks / this.metrics.totalTasks;

    // Update token usage and cost if available
    if (metadata?.tokensUsed) {
      this.metrics.totalTokensUsed =
        (this.metrics.totalTokensUsed || 0) + metadata.tokensUsed;
    }

    if (metadata?.cost) {
      this.metrics.totalCost = (this.metrics.totalCost || 0) + metadata.cost;
    }
  }

  /**
   * Update current load percentage
   */
  private updateLoad(): void {
    this.metrics.currentLoad =
      this.currentTasks.size / this.config.maxConcurrentTasks;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Override in subclass for custom health checks
      return (
        this.status !== AgentStatus.OFFLINE &&
        this.status !== AgentStatus.FAILED
      );
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Shutdown agent gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.warn('Agent shutting down...');
    this.status = AgentStatus.OFFLINE;

    // Wait for current tasks to complete (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.currentTasks.size > 0 && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.currentTasks.size > 0) {
      this.logger.warn(
        `Agent shutdown with ${this.currentTasks.size} tasks still in progress`,
      );
    }

    this.logger.log('Agent shutdown complete');
  }
}
