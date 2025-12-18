import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IAgent,
  AgentCapability,
  AgentHealth,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';

/**
 * Base Agent Class
 * 
 * Abstract base implementation that all TradeTaper agents should extend.
 * Provides common functionality for registration, health checks, and event handling.
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class MyAgent extends BaseAgent {
 *   readonly agentId = 'my-agent';
 *   readonly name = 'My Agent';
 *   readonly capabilities = [{ id: 'my-capability', description: '...', keywords: ['...'] }];
 *   readonly priority = 10;
 *   
 *   protected async processMessage(message: AgentMessage): Promise<AgentResponse> {
 *     // Your logic here
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseAgent implements IAgent, OnModuleInit {
  protected readonly logger: Logger;
  protected lastHealthCheck: Date = new Date();
  
  /** Unique agent identifier - must be overridden */
  abstract readonly agentId: string;
  
  /** Human-readable name - must be overridden */
  abstract readonly name: string;
  
  /** Agent capabilities for routing - must be overridden */
  abstract readonly capabilities: AgentCapability[];
  
  /** Agent priority (higher = preferred) */
  readonly priority: number = 10;
  
  constructor(
    protected readonly registry: AgentRegistryService,
    protected readonly eventBus: EventBusService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }
  
  /**
   * Called when module initializes - registers this agent
   */
  async onModuleInit(): Promise<void> {
    await this.registry.register(this);
    this.setupEventSubscriptions();
  }
  
  /**
   * Optional: Called after registration
   */
  async onInit(): Promise<void> {
    this.logger.log(`${this.name} initialized`);
  }
  
  /**
   * Optional: Called on shutdown
   */
  async onDestroy(): Promise<void> {
    this.logger.log(`${this.name} shutting down`);
  }
  
  /**
   * Get agent health status
   */
  getHealth(): AgentHealth {
    return {
      status: 'healthy',
      lastCheck: this.lastHealthCheck,
      details: {
        agentId: this.agentId,
        capabilities: this.capabilities.map(c => c.id),
      },
    };
  }
  
  /**
   * Handle incoming message - wraps processMessage with error handling
   */
  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();
    this.lastHealthCheck = new Date();
    
    try {
      this.logger.debug(`Processing message ${message.id} from ${message.sourceAgent}`);
      
      const response = await this.processMessage(message);
      
      return {
        ...response,
        metrics: {
          ...response.metrics,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error(`Error processing message ${message.id}:`, error);
      
      return {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        metrics: {
          processingTimeMs: Date.now() - startTime,
        },
      };
    }
  }
  
  /**
   * Process message - must be implemented by subclasses
   */
  protected abstract processMessage(message: AgentMessage): Promise<AgentResponse>;
  
  /**
   * Setup event subscriptions - override to subscribe to specific events
   */
  protected setupEventSubscriptions(): void {
    // Subscribe to messages targeted at this agent
    this.eventBus.subscribeToAgent(this.agentId).subscribe(message => {
      // Messages are already handled by orchestrator calling handleMessage
      // This is for event-based reactions
      if (message.type === 'event') {
        this.onEvent(message).catch(err => {
          this.logger.error('Event handling error:', err);
        });
      }
    });
  }
  
  /**
   * Handle events - override to react to broadcast events
   */
  protected async onEvent(message: AgentMessage): Promise<void> {
    // Default: no-op, subclasses can override
  }
  
  /**
   * Emit an event to the event bus
   */
  protected emit(type: AgentMessage['type'], payload: any, context: AgentMessage['context']): void {
    this.eventBus.publish({
      id: `${this.agentId}-${Date.now()}`,
      sourceAgent: this.agentId,
      type,
      payload,
      context,
      metadata: {
        timestamp: new Date(),
        priority: 'medium',
      },
    });
  }
  
  /**
   * Emit an alert
   */
  protected emitAlert(payload: any, context: AgentMessage['context'], priority: 'high' | 'critical' = 'high'): void {
    this.eventBus.publish({
      id: `${this.agentId}-alert-${Date.now()}`,
      sourceAgent: this.agentId,
      type: 'alert',
      payload,
      context,
      metadata: {
        timestamp: new Date(),
        priority,
      },
    });
  }
}
