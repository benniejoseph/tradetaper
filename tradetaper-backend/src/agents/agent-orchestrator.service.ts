import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentMessage,
  AgentResponse,
  MessageContext,
  IAgent,
} from './interfaces/agent.interface';
import { EventBusService } from './event-bus.service';
import { AgentRegistryService } from './agent-registry.service';

/**
 * Agent Orchestrator Service - Central coordinator for multi-agent workflows
 * 
 * Responsibilities:
 * - Route messages to appropriate agents
 * - Coordinate multi-agent workflows
 * - Track conversation context
 * - Handle errors and fallbacks
 */
@Injectable()
export class AgentOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  
  /** Active conversation contexts */
  private readonly contexts = new Map<string, MessageContext>();
  
  constructor(
    private readonly eventBus: EventBusService,
    private readonly registry: AgentRegistryService,
  ) {}
  
  async onModuleInit() {
    this.logger.log('Agent Orchestrator initialized');
    
    // Subscribe to all events for logging and monitoring
    this.eventBus.events$.subscribe(message => {
      this.logger.debug(
        `[Event] ${message.sourceAgent} -> ${message.targetAgent || '*'}: ${message.type}`,
      );
    });
  }
  
  /**
   * Create a new conversation context
   */
  createContext(userId: string, sessionId?: string): MessageContext {
    const context: MessageContext = {
      userId,
      sessionId: sessionId || uuidv4(),
      correlationId: uuidv4(),
      sharedState: {},
    };
    
    this.contexts.set(context.sessionId, context);
    this.logger.debug(`Created context for session ${context.sessionId}`);
    
    return context;
  }
  
  /**
   * Get or create a conversation context
   */
  getOrCreateContext(userId: string, sessionId?: string): MessageContext {
    if (sessionId && this.contexts.has(sessionId)) {
      return this.contexts.get(sessionId)!;
    }
    return this.createContext(userId, sessionId);
  }
  
  /**
   * Route a request to the appropriate agent based on capability
   */
  async routeToCapability(
    capabilityId: string,
    payload: any,
    context: MessageContext,
  ): Promise<AgentResponse> {
    const agent = this.registry.findBestAgent(capabilityId);
    
    if (!agent) {
      this.logger.warn(`No agent found for capability: ${capabilityId}`);
      return {
        success: false,
        error: {
          code: 'NO_AGENT_AVAILABLE',
          message: `No agent available for capability: ${capabilityId}`,
        },
      };
    }
    
    return this.sendToAgent(agent.agentId, payload, context);
  }
  
  /**
   * Send a message directly to a specific agent
   */
  async sendToAgent(
    agentId: string,
    payload: any,
    context: MessageContext,
  ): Promise<AgentResponse> {
    const agent = this.registry.getAgent(agentId);
    
    if (!agent) {
      return {
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent not found: ${agentId}`,
        },
      };
    }
    
    const message = this.createMessage('orchestrator', agentId, 'request', payload, context);
    
    try {
      const startTime = Date.now();
      
      // Publish to event bus for observability
      this.eventBus.publish(message);
      
      // Direct call to agent
      const response = await agent.handleMessage(message);
      
      // Record metrics
      this.registry.recordMessage(agentId, response.success);
      
      // Update shared state if agent provides it
      if (response.data?.sharedState) {
        context.sharedState = {
          ...context.sharedState,
          ...response.data.sharedState,
        };
      }
      
      // Handle forwarding to other agents
      if (response.forwardTo && response.forwardTo.length > 0) {
        await this.handleForwarding(response.forwardTo, context);
      }
      
      this.logger.debug(
        `Agent ${agentId} processed message in ${Date.now() - startTime}ms`,
      );
      
      return response;
    } catch (error) {
      this.registry.recordMessage(agentId, false);
      this.logger.error(`Error from agent ${agentId}:`, error);
      
      return {
        success: false,
        error: {
          code: 'AGENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }
  
  /**
   * Broadcast a message to all agents or agents with specific capability
   */
  async broadcast(
    payload: any,
    context: MessageContext,
    capabilityFilter?: string,
  ): Promise<Map<string, AgentResponse>> {
    const agents = capabilityFilter
      ? this.registry.findAgentsByCapability(capabilityFilter)
      : this.registry.getActiveAgents();
    
    const results = new Map<string, AgentResponse>();
    
    const message = this.createMessage('orchestrator', undefined, 'event', payload, context);
    this.eventBus.publish(message);
    
    // Process in parallel
    await Promise.all(
      agents.map(async agent => {
        try {
          const response = await agent.handleMessage(message);
          results.set(agent.agentId, response);
        } catch (error) {
          results.set(agent.agentId, {
            success: false,
            error: {
              code: 'BROADCAST_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }),
    );
    
    return results;
  }
  
  /**
   * Execute a multi-agent workflow
   */
  async executeWorkflow(
    steps: Array<{ capability: string; transform?: (prev: any) => any }>,
    initialPayload: any,
    context: MessageContext,
  ): Promise<AgentResponse> {
    let currentPayload = initialPayload;
    let lastResponse: AgentResponse = { success: true };
    
    for (const step of steps) {
      const payload = step.transform 
        ? step.transform(lastResponse.data || currentPayload)
        : currentPayload;
      
      lastResponse = await this.routeToCapability(step.capability, payload, context);
      
      if (!lastResponse.success) {
        this.logger.warn(`Workflow failed at step: ${step.capability}`);
        return lastResponse;
      }
      
      currentPayload = lastResponse.data;
    }
    
    return lastResponse;
  }
  
  /**
   * Handle forwarding requests to other agents
   */
  private async handleForwarding(
    forwards: Array<{ agentId: string; payload: any }>,
    context: MessageContext,
  ): Promise<void> {
    for (const forward of forwards) {
      // Fire and forget - results handled asynchronously
      this.sendToAgent(forward.agentId, forward.payload, context).catch(err => {
        this.logger.error(`Forwarding to ${forward.agentId} failed:`, err);
      });
    }
  }
  
  /**
   * Create a standardized message
   */
  private createMessage(
    source: string,
    target: string | undefined,
    type: AgentMessage['type'],
    payload: any,
    context: MessageContext,
  ): AgentMessage {
    return {
      id: uuidv4(),
      sourceAgent: source,
      targetAgent: target,
      type,
      payload,
      context: {
        ...context,
        correlationId: context.correlationId || uuidv4(),
      },
      metadata: {
        timestamp: new Date(),
        priority: 'medium',
        maxRetries: 3,
        retryCount: 0,
      },
    };
  }
  
  /**
   * Get orchestrator statistics
   */
  getStats() {
    return {
      activeContexts: this.contexts.size,
      registryStats: this.registry.getStats(),
      eventBusMessages: this.eventBus.getMessageCount(),
    };
  }
  
  /**
   * Cleanup old contexts (call periodically)
   */
  cleanupOldContexts(maxAgeMs: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;
    
    // For now just clear all - in production would track lastAccess
    if (this.contexts.size > 1000) {
      this.contexts.clear();
      cleaned = this.contexts.size;
    }
    
    return cleaned;
  }
}
