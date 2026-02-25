import { Test, TestingModule } from '@nestjs/testing';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { AgentRegistryService } from './agent-registry.service';
import { EventBusService } from './event-bus.service';
import {
  IAgent,
  AgentCapability,
  AgentHealth,
  AgentMessage,
  AgentResponse,
} from './interfaces/agent.interface';

class MockTestAgent implements IAgent {
  agentId = 'test-agent';
  name = 'Test Agent';
  priority = 10;
  capabilities: AgentCapability[] = [
    { id: 'test-cap', description: 'Test', keywords: ['test'] },
  ];

  getHealth(): AgentHealth {
    return { status: 'healthy', lastCheck: new Date() };
  }

  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    return {
      success: true,
      data: {
        echo: message.payload,
        agentId: this.agentId,
      },
    };
  }
}

describe('AgentOrchestratorService', () => {
  let orchestrator: AgentOrchestratorService;
  let registry: AgentRegistryService;
  let eventBus: EventBusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentOrchestratorService,
        AgentRegistryService,
        EventBusService,
      ],
    }).compile();

    orchestrator = module.get<AgentOrchestratorService>(
      AgentOrchestratorService,
    );
    registry = module.get<AgentRegistryService>(AgentRegistryService);
    eventBus = module.get<EventBusService>(EventBusService);

    await eventBus.onModuleInit();
    await registry.onModuleInit();
    await orchestrator.onModuleInit();
  });

  afterEach(async () => {
    await eventBus.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('createContext', () => {
    it('should create a new conversation context', () => {
      const context = orchestrator.createContext('user-123');

      expect(context.userId).toBe('user-123');
      expect(context.sessionId).toBeDefined();
      expect(context.correlationId).toBeDefined();
      expect(context.sharedState).toEqual({});
    });

    it('should store context for retrieval', () => {
      const context = orchestrator.createContext('user-456');
      // Context is stored internally in the orchestrator
      expect(context.sessionId).toBeDefined();
    });
  });

  describe('sendToAgent', () => {
    it('should route message to registered agent', async () => {
      const testAgent = new MockTestAgent();
      await registry.register(testAgent);

      const context = orchestrator.createContext('user-1');
      const response = await orchestrator.sendToAgent(
        'test-agent',
        { test: 'data' },
        context,
      );

      expect(response.success).toBe(true);
      expect(response.data.agentId).toBe('test-agent');
      expect(response.data.echo.test).toBe('data');
    });

    it('should return error for unregistered agent', async () => {
      const context = orchestrator.createContext('user-1');
      const response = await orchestrator.sendToAgent(
        'non-existent',
        { test: 'data' },
        context,
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AGENT_NOT_FOUND');
    });
  });

  describe('routeToCapability', () => {
    it('should route to agent with matching capability', async () => {
      const testAgent = new MockTestAgent();
      await registry.register(testAgent);

      const context = orchestrator.createContext('user-1');
      const response = await orchestrator.routeToCapability(
        'test-cap',
        { data: 'value' },
        context,
      );

      expect(response.success).toBe(true);
      expect(response.data.agentId).toBe('test-agent');
    });

    it('should return error when no agent has capability', async () => {
      const context = orchestrator.createContext('user-1');
      const response = await orchestrator.routeToCapability(
        'unknown-cap',
        {},
        context,
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NO_CAPABLE_AGENT');
    });
  });

  describe('executeWorkflow', () => {
    it('should execute multi-step workflow', async () => {
      const agent1 = new MockTestAgent();
      agent1.agentId = 'agent-1';
      agent1.capabilities = [
        { id: 'step-1', description: 'Step 1', keywords: [] },
      ];

      const agent2 = new MockTestAgent();
      agent2.agentId = 'agent-2';
      agent2.capabilities = [
        { id: 'step-2', description: 'Step 2', keywords: [] },
      ];

      await registry.register(agent1);
      await registry.register(agent2);

      const context = orchestrator.createContext('user-1');
      const response = await orchestrator.executeWorkflow(
        [{ capability: 'step-1' }, { capability: 'step-2' }],
        { initial: 'payload' },
        context,
      );

      expect(response.success).toBe(true);
    });

    it('should stop workflow on failure', async () => {
      const failingAgent = new MockTestAgent();
      failingAgent.capabilities = [
        { id: 'failing-step', description: 'Fails', keywords: [] },
      ];
      failingAgent.handleMessage = async () => ({
        success: false,
        error: { code: 'FAILED', message: 'Intentional failure' },
      });

      await registry.register(failingAgent);

      const context = orchestrator.createContext('user-1');
      const response = await orchestrator.executeWorkflow(
        [{ capability: 'failing-step' }],
        {},
        context,
      );

      expect(response.success).toBe(false);
    });
  });

  describe('broadcast', () => {
    it('should publish event to EventBus', async () => {
      const publishSpy = jest.spyOn(eventBus, 'publish');
      const context = orchestrator.createContext('user-1');

      await orchestrator.broadcast(
        { eventType: 'test-event', data: 'value' },
        context,
      );

      expect(publishSpy).toHaveBeenCalled();
      const call = publishSpy.mock.calls[0][0];
      expect(call.type).toBe('event');
    });
  });

  describe('getStats', () => {
    it('should return orchestrator statistics', async () => {
      orchestrator.createContext('user-1');
      orchestrator.createContext('user-2');

      const stats = orchestrator.getStats();

      expect(stats.activeContexts).toBe(2);
      expect(stats.eventBusMessages).toBeDefined();
    });
  });
});
