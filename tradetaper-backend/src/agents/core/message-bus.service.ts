import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter } from 'events';
import { AgentMessage, TaskPriority } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent Message Bus Service
 * 
 * Provides event-driven communication between agents.
 * Uses in-memory EventEmitter for now, can be upgraded to Redis Pub/Sub or RabbitMQ.
 * 
 * Features:
 * - Publish/Subscribe messaging
 * - Point-to-point messaging
 * - Broadcast messaging
 * - Message priority handling
 * - Message persistence (via cache)
 * - Correlation ID for tracing
 */
@Injectable()
export class MessageBusService implements OnModuleDestroy {
  private readonly logger = new Logger(MessageBusService.name);
  private readonly eventEmitter = new EventEmitter();
  private readonly messageHistory = new Map<string, AgentMessage[]>();
  private readonly maxHistorySize = 1000;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Set max listeners to prevent memory leaks with many agents
    this.eventEmitter.setMaxListeners(100);
    
    this.logger.log('Message Bus initialized');
  }

  /**
   * Publish a message to a channel
   */
  async publish(
    channel: string,
    from: string,
    data: any,
    options: {
      to?: string | string[];
      type?: 'request' | 'response' | 'broadcast' | 'notification';
      correlationId?: string;
      priority?: TaskPriority;
    } = {}
  ): Promise<string> {
    const message: AgentMessage = {
      id: uuidv4(),
      from,
      to: options.to || '*', // Broadcast if no recipient
      type: options.type || 'broadcast',
      channel,
      data,
      timestamp: new Date(),
      correlationId: options.correlationId,
      priority: options.priority || TaskPriority.MEDIUM,
    };
    
    // Store message in history
    this.addToHistory(channel, message);
    
    // Persist important messages
    if (message.priority && message.priority >= TaskPriority.HIGH) {
      await this.persistMessage(message);
    }
    
    // Emit event
    this.eventEmitter.emit(channel, message);
    
    // If point-to-point, emit to specific agent channel
    if (typeof message.to === 'string' && message.to !== '*') {
      const agentChannel = `agent:${message.to}`;
      this.eventEmitter.emit(agentChannel, message);
    }
    
    this.logger.debug(
      `Published message ${message.id} to ${channel} (from: ${from}, to: ${message.to})`
    );
    
    return message.id;
  }

  /**
   * Subscribe to a channel
   */
  subscribe(
    channel: string,
    handler: (message: AgentMessage) => void | Promise<void>,
  ): () => void {
    const wrappedHandler = async (message: AgentMessage) => {
      try {
        await handler(message);
      } catch (error) {
        this.logger.error(
          `Error in message handler for channel ${channel}: ${error.message}`,
          error.stack
        );
      }
    };
    
    this.eventEmitter.on(channel, wrappedHandler);
    
    this.logger.debug(`Subscribed to channel: ${channel}`);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(channel, wrappedHandler);
      this.logger.debug(`Unsubscribed from channel: ${channel}`);
    };
  }

  /**
   * Subscribe to agent-specific messages
   */
  subscribeToAgent(
    agentName: string,
    handler: (message: AgentMessage) => void | Promise<void>,
  ): () => void {
    return this.subscribe(`agent:${agentName}`, handler);
  }

  /**
   * Send a request and wait for response
   */
  async request<T = any>(
    channel: string,
    from: string,
    to: string,
    data: any,
    timeout: number = 30000,
  ): Promise<T> {
    const correlationId = uuidv4();
    const responseChannel = `response:${correlationId}`;
    
    return new Promise<T>(async (resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.eventEmitter.off(responseChannel, responseHandler);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
      
      // Set up response handler
      const responseHandler = (message: AgentMessage) => {
        clearTimeout(timeoutId);
        this.eventEmitter.off(responseChannel, responseHandler);
        
        if (message.data.error) {
          reject(new Error(message.data.error));
        } else {
          resolve(message.data as T);
        }
      };
      
      this.eventEmitter.once(responseChannel, responseHandler);
      
      // Send request
      await this.publish(channel, from, data, {
        to,
        type: 'request',
        correlationId,
      });
    });
  }

  /**
   * Send a response to a request
   */
  async respond(
    originalMessage: AgentMessage,
    from: string,
    data: any,
  ): Promise<void> {
    if (!originalMessage.correlationId) {
      throw new Error('Cannot respond to message without correlationId');
    }
    
    const responseChannel = `response:${originalMessage.correlationId}`;
    
    await this.publish(responseChannel, from, data, {
      to: originalMessage.from,
      type: 'response',
      correlationId: originalMessage.correlationId,
    });
  }

  /**
   * Broadcast a message to all subscribers of a channel
   */
  async broadcast(
    channel: string,
    from: string,
    data: any,
    priority: TaskPriority = TaskPriority.MEDIUM,
  ): Promise<string> {
    return this.publish(channel, from, data, {
      type: 'broadcast',
      priority,
    });
  }

  /**
   * Get message history for a channel
   */
  getMessageHistory(channel: string, limit: number = 50): AgentMessage[] {
    const history = this.messageHistory.get(channel) || [];
    return history.slice(-limit);
  }

  /**
   * Get messages by correlation ID (for tracing)
   */
  getMessagesByCorrelation(correlationId: string): AgentMessage[] {
    const messages: AgentMessage[] = [];
    
    for (const history of this.messageHistory.values()) {
      messages.push(
        ...history.filter(m => m.correlationId === correlationId)
      );
    }
    
    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Add message to history
   */
  private addToHistory(channel: string, message: AgentMessage): void {
    if (!this.messageHistory.has(channel)) {
      this.messageHistory.set(channel, []);
    }
    
    const history = this.messageHistory.get(channel);
    if (history) {
      history.push(message);
      
      // Limit history size
      if (history.length > this.maxHistorySize) {
        history.shift();
      }
    }
  }

  /**
   * Persist important messages to cache
   */
  private async persistMessage(message: AgentMessage): Promise<void> {
    try {
      const key = `message:${message.id}`;
      await this.cacheManager.set(key, message, 3600000); // 1 hour TTL
    } catch (error) {
      this.logger.error(`Failed to persist message: ${error.message}`);
    }
  }

  /**
   * Get statistics about message bus
   */
  getStats() {
    let totalMessages = 0;
    const channelStats = new Map<string, number>();
    
    for (const [channel, messages] of this.messageHistory.entries()) {
      totalMessages += messages.length;
      channelStats.set(channel, messages.length);
    }
    
    return {
      totalMessages,
      totalChannels: this.messageHistory.size,
      channelStats: Object.fromEntries(channelStats),
      listenerCount: this.eventEmitter.eventNames().length,
    };
  }

  /**
   * Clear message history
   */
  clearHistory(channel?: string): void {
    if (channel) {
      this.messageHistory.delete(channel);
      this.logger.log(`Cleared history for channel: ${channel}`);
    } else {
      this.messageHistory.clear();
      this.logger.log('Cleared all message history');
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('Shutting down message bus...');
    this.eventEmitter.removeAllListeners();
    this.messageHistory.clear();
    this.logger.log('Message bus shut down');
  }
}

