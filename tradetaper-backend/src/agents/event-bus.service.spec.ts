import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from './event-bus.service';
import { AgentMessage } from './interfaces/agent.interface';

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventBusService],
    }).compile();

    service = module.get<EventBusService>(EventBusService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should publish messages to subscribers', (done) => {
      const testMessage: AgentMessage = {
        id: 'test-msg-1',
        sourceAgent: 'test-agent',
        targetAgent: 'receiver-agent',
        type: 'request',
        payload: { data: 'test' },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: {
          timestamp: new Date(),
          priority: 'medium',
        },
      };

      service.events$.subscribe((msg) => {
        expect(msg.id).toBe(testMessage.id);
        expect(msg.sourceAgent).toBe(testMessage.sourceAgent);
        done();
      });

      service.publish(testMessage);
    });

    it('should increment message count', () => {
      const initialCount = service.getMessageCount();

      service.publish({
        id: 'test-1',
        sourceAgent: 'agent',
        type: 'event',
        payload: {},
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'low' },
      });

      expect(service.getMessageCount()).toBe(initialCount + 1);
    });
  });

  describe('subscribeToAgent', () => {
    it('should filter messages for specific agent', (done) => {
      const targetAgentId = 'target-agent';
      const receivedMessages: AgentMessage[] = [];

      service.subscribeToAgent(targetAgentId).subscribe((msg) => {
        receivedMessages.push(msg);
      });

      // Message for target agent
      service.publish({
        id: 'msg-1',
        sourceAgent: 'sender',
        targetAgent: targetAgentId,
        type: 'request',
        payload: {},
        context: { userId: 'u', sessionId: 's', correlationId: 'c' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      });

      // Message for different agent
      service.publish({
        id: 'msg-2',
        sourceAgent: 'sender',
        targetAgent: 'other-agent',
        type: 'request',
        payload: {},
        context: { userId: 'u', sessionId: 's', correlationId: 'c' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      });

      // Broadcast (should be received by target)
      service.publish({
        id: 'msg-3',
        sourceAgent: 'sender',
        type: 'event',
        payload: {},
        context: { userId: 'u', sessionId: 's', correlationId: 'c' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      });

      setTimeout(() => {
        expect(receivedMessages.length).toBe(2);
        expect(receivedMessages[0].id).toBe('msg-1');
        expect(receivedMessages[1].id).toBe('msg-3');
        done();
      }, 50);
    });
  });

  describe('subscribeToType', () => {
    it('should filter messages by type', (done) => {
      const receivedAlerts: AgentMessage[] = [];

      service.subscribeToType('alert').subscribe((msg) => {
        receivedAlerts.push(msg);
      });

      service.publish({
        id: 'alert-1',
        sourceAgent: 'sender',
        type: 'alert',
        payload: {},
        context: { userId: 'u', sessionId: 's', correlationId: 'c' },
        metadata: { timestamp: new Date(), priority: 'high' },
      });

      service.publish({
        id: 'event-1',
        sourceAgent: 'sender',
        type: 'event',
        payload: {},
        context: { userId: 'u', sessionId: 's', correlationId: 'c' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      });

      setTimeout(() => {
        expect(receivedAlerts.length).toBe(1);
        expect(receivedAlerts[0].type).toBe('alert');
        done();
      }, 50);
    });
  });
});
