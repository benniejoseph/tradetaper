import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';
import { AgentMessage } from './interfaces/agent.interface';

/**
 * Event Bus Service - Pub/Sub messaging between agents
 *
 * Provides decoupled communication using RxJS subjects.
 * Agents can publish messages and subscribe to specific message types or agent sources.
 */
@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);

  /** Main event stream */
  private readonly eventSubject = new Subject<AgentMessage>();

  /** Observable for subscribers */
  readonly events$: Observable<AgentMessage> = this.eventSubject.asObservable();

  /** Message counter for metrics */
  private messageCount = 0;

  async onModuleInit() {
    this.logger.log('EventBus initialized - Multi-agent communication ready');
  }

  async onModuleDestroy() {
    this.logger.log('EventBus shutting down');
    this.eventSubject.complete();
  }

  /**
   * Publish a message to the event bus
   */
  publish(message: AgentMessage): void {
    this.messageCount++;
    this.logger.debug(
      `[${message.id}] ${message.sourceAgent} -> ${message.targetAgent || 'broadcast'}: ${message.type}`,
    );
    this.eventSubject.next(message);
  }

  /**
   * Subscribe to messages for a specific agent
   */
  subscribeToAgent(agentId: string): Observable<AgentMessage> {
    return this.events$.pipe(
      filter((msg) => !msg.targetAgent || msg.targetAgent === agentId),
    );
  }

  /**
   * Subscribe to messages of a specific type
   */
  subscribeToType(type: AgentMessage['type']): Observable<AgentMessage> {
    return this.events$.pipe(filter((msg) => msg.type === type));
  }

  /**
   * Subscribe to messages from a specific source agent
   */
  subscribeToSource(sourceAgentId: string): Observable<AgentMessage> {
    return this.events$.pipe(
      filter((msg) => msg.sourceAgent === sourceAgentId),
    );
  }

  /**
   * Subscribe to high-priority alerts
   */
  subscribeToAlerts(): Observable<AgentMessage> {
    return this.events$.pipe(
      filter(
        (msg) => msg.type === 'alert' || msg.metadata.priority === 'critical',
      ),
    );
  }

  /**
   * Subscribe with custom filter
   */
  subscribeWithFilter(
    predicate: (message: AgentMessage) => boolean,
  ): Observable<AgentMessage> {
    return this.events$.pipe(filter(predicate));
  }

  /**
   * Get current message count for metrics
   */
  getMessageCount(): number {
    return this.messageCount;
  }
}
