import { Test, TestingModule } from '@nestjs/testing';
import { AgentRegistryService } from './agent-registry.service';
import { IAgent, AgentCapability, AgentHealth, AgentMessage, AgentResponse } from './interfaces/agent.interface';

class MockAgent implements IAgent {
  agentId = 'mock-agent';
  name = 'Mock Agent';
  priority = 10;
  capabilities: AgentCapability[] = [
    { id: 'test-capability', description: 'Test capability', keywords: ['test'] },
  ];

  getHealth(): AgentHealth {
    return { status: 'healthy', lastCheck: new Date() };
  }

  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    return { success: true, data: { received: message.payload } };
  }
}

class MockAgentWithInit implements IAgent {
  agentId = 'mock-agent-init';
  name = 'Mock Agent With Init';
  priority = 15;
  capabilities: AgentCapability[] = [
    { id: 'test-capability', description: 'Test', keywords: ['test'] },
    { id: 'advanced', description: 'Advanced', keywords: ['advanced'] },
  ];
  initialized = false;
  destroyed = false;

  getHealth(): AgentHealth {
    return { status: 'healthy', lastCheck: new Date() };
  }

  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    return { success: true };
  }

  async onInit(): Promise<void> {
    this.initialized = true;
  }

  async onDestroy(): Promise<void> {
    this.destroyed = true;
  }
}

describe('AgentRegistryService', () => {
  let service: AgentRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentRegistryService],
    }).compile();

    service = module.get<AgentRegistryService>(AgentRegistryService);
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register an agent', async () => {
      const agent = new MockAgent();
      await service.register(agent);

      const registered = service.getAgent('mock-agent');
      expect(registered).toBeDefined();
      expect(registered?.agentId).toBe('mock-agent');
    });

    it('should call onInit if agent has it', async () => {
      const agent = new MockAgentWithInit();
      await service.register(agent);

      expect(agent.initialized).toBe(true);
    });

    it('should set agent status to active after registration', async () => {
      const agent = new MockAgent();
      await service.register(agent);

      const registration = service.getRegistration('mock-agent');
      expect(registration?.status).toBe('active');
    });
  });

  describe('unregister', () => {
    it('should unregister an agent', async () => {
      const agent = new MockAgent();
      await service.register(agent);
      await service.unregister('mock-agent');

      const registered = service.getAgent('mock-agent');
      expect(registered).toBeUndefined();
    });

    it('should call onDestroy if agent has it', async () => {
      const agent = new MockAgentWithInit();
      await service.register(agent);
      await service.unregister('mock-agent-init');

      expect(agent.destroyed).toBe(true);
    });
  });

  describe('findAgentsByCapability', () => {
    it('should find agents by capability', async () => {
      await service.register(new MockAgent());
      await service.register(new MockAgentWithInit());

      const agents = service.findAgentsByCapability('test-capability');
      expect(agents.length).toBe(2);
    });

    it('should return empty array for unknown capability', () => {
      const agents = service.findAgentsByCapability('unknown');
      expect(agents.length).toBe(0);
    });

    it('should sort agents by priority (highest first)', async () => {
      await service.register(new MockAgent()); // priority 10
      await service.register(new MockAgentWithInit()); // priority 15

      const agents = service.findAgentsByCapability('test-capability');
      expect(agents[0].priority).toBe(15);
      expect(agents[1].priority).toBe(10);
    });
  });

  describe('findBestAgent', () => {
    it('should return highest priority agent for capability', async () => {
      await service.register(new MockAgent());
      await service.register(new MockAgentWithInit());

      const best = service.findBestAgent('test-capability');
      expect(best?.agentId).toBe('mock-agent-init');
    });
  });

  describe('getStats', () => {
    it('should return registry statistics', async () => {
      await service.register(new MockAgent());
      await service.register(new MockAgentWithInit());

      const stats = service.getStats();
      expect(stats.totalAgents).toBe(2);
      expect(stats.activeAgents).toBe(2);
      expect(stats.totalCapabilities).toBeGreaterThanOrEqual(2);
    });
  });

  describe('recordMessage', () => {
    it('should increment message count', async () => {
      await service.register(new MockAgent());
      
      service.recordMessage('mock-agent', true);
      service.recordMessage('mock-agent', true);
      
      const registration = service.getRegistration('mock-agent');
      expect(registration?.messageCount).toBe(2);
    });

    it('should increment error count on failure', async () => {
      await service.register(new MockAgent());
      
      service.recordMessage('mock-agent', false);
      
      const registration = service.getRegistration('mock-agent');
      expect(registration?.errorCount).toBe(1);
    });
  });
});
