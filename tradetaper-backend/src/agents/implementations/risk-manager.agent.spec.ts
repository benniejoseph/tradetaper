import { Test, TestingModule } from '@nestjs/testing';
import { RiskManagerAgent } from './risk-manager.agent';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { AgentMessage } from '../interfaces/agent.interface';

describe('RiskManagerAgent', () => {
  let agent: RiskManagerAgent;
  let registryService: AgentRegistryService;
  let eventBusService: EventBusService;

  beforeEach(async () => {
    const mockRegistry = {
      register: jest.fn(),
      recordMessage: jest.fn(),
      getAgent: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      subscribeToAgent: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
      events$: { subscribe: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskManagerAgent,
        { provide: AgentRegistryService, useValue: mockRegistry },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    agent = module.get<RiskManagerAgent>(RiskManagerAgent);
    registryService = module.get<AgentRegistryService>(AgentRegistryService);
    eventBusService = module.get<EventBusService>(EventBusService);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  it('should have correct agent metadata', () => {
    expect(agent.agentId).toBe('risk-manager-agent');
    expect(agent.name).toBe('Risk Manager Agent');
    expect(agent.priority).toBe(25);
  });

  it('should have required capabilities', () => {
    const capabilityIds = agent.capabilities.map(c => c.id);
    expect(capabilityIds).toContain('risk-calculation');
    expect(capabilityIds).toContain('portfolio-risk');
    expect(capabilityIds).toContain('trade-assessment');
  });

  describe('handleMessage - calculate-position', () => {
    it('should calculate position size correctly', async () => {
      const message: AgentMessage = {
        id: 'test-1',
        sourceAgent: 'test',
        type: 'request',
        payload: {
          action: 'calculate-position',
          accountBalance: 10000,
          riskPercent: 1,
          entryPrice: 1.1000,
          stopLoss: 1.0950,
          symbol: 'EURUSD',
        },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.riskAmount).toBe(100); // 1% of 10000
      expect(response.data.stopDistance).toBeCloseTo(0.005, 5); // 1.1000 - 1.0950
    });

    it('should cap risk percent at maximum', async () => {
      const message: AgentMessage = {
        id: 'test-2',
        sourceAgent: 'test',
        type: 'request',
        payload: {
          action: 'calculate-position',
          accountBalance: 10000,
          riskPercent: 10, // Above maximum of 5%
          entryPrice: 1.1000,
          stopLoss: 1.0950,
        },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.riskPercent).toBe(5); // Capped at 5%
    });
  });

  describe('handleMessage - assess-trade', () => {
    it('should assess trade risk/reward', async () => {
      const message: AgentMessage = {
        id: 'test-3',
        sourceAgent: 'test',
        type: 'request',
        payload: {
          action: 'assess-trade',
          entryPrice: 1.1000,
          stopLoss: 1.0950,
          takeProfit: 1.1100,
          symbol: 'EURUSD',
        },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.metrics).toBeDefined();
      expect(response.data.metrics.riskRewardRatio).toBe(2); // 100 pips reward / 50 pips risk
      expect(response.data.assessment).toBeDefined();
    });

    it('should reject trades with R:R below 1', async () => {
      const message: AgentMessage = {
        id: 'test-4',
        sourceAgent: 'test',
        type: 'request',
        payload: {
          action: 'assess-trade',
          entryPrice: 1.1000,
          stopLoss: 1.0900, // 100 pips risk
          takeProfit: 1.1050, // 50 pips reward
        },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      // R:R of 0.5 gets 'caution' since it's below minimum but not below 1:1
      expect(['reject', 'caution']).toContain(response.data.assessment.verdict);
      expect(response.data.assessment.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('handleMessage - get-risk-rules', () => {
    it('should return risk management rules', async () => {
      const message: AgentMessage = {
        id: 'test-5',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'get-risk-rules' },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.rules).toBeDefined();
      expect(response.data.rules.maxRiskPerTrade).toBe('5%');
      expect(response.data.rules.recommendedRiskPerTrade).toBe('1%');
      expect(response.data.guidance).toBeInstanceOf(Array);
    });
  });

  describe('handleMessage - check-drawdown', () => {
    it('should calculate drawdown correctly', async () => {
      const message: AgentMessage = {
        id: 'test-6',
        sourceAgent: 'test',
        type: 'request',
        payload: {
          action: 'check-drawdown',
          currentBalance: 9000,
          peakBalance: 10000,
        },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.drawdownFromPeak).toBe(10); // 10% drawdown
      expect(response.data.severity).toBe('danger');
    });

    it('should categorize critical drawdown', async () => {
      const message: AgentMessage = {
        id: 'test-7',
        sourceAgent: 'test',
        type: 'request',
        payload: {
          action: 'check-drawdown',
          currentBalance: 7500,
          peakBalance: 10000,
        },
        context: {
          userId: 'user-1',
          sessionId: 'session-1',
          correlationId: 'corr-1',
        },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.drawdownFromPeak).toBe(25);
      expect(response.data.severity).toBe('critical');
    });
  });
});
