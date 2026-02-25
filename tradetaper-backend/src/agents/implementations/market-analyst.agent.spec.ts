import { Test, TestingModule } from '@nestjs/testing';
import { MarketAnalystAgent } from './market-analyst.agent';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { AIMarketPredictionService } from '../../market-intelligence/ai-market-prediction.service';
import { AgentMessage } from '../interfaces/agent.interface';

describe('MarketAnalystAgent', () => {
  let agent: MarketAnalystAgent;
  let mockPredictionService: jest.Mocked<AIMarketPredictionService>;

  beforeEach(async () => {
    const mockRegistry = {
      register: jest.fn(),
      recordMessage: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      subscribeToAgent: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    };

    mockPredictionService = {
      generateMarketPrediction: jest.fn().mockResolvedValue({
        symbol: 'EURUSD',
        timeframe: '1H',
        prediction: {
          direction: 'bullish',
          confidence: 75,
          targetPrice: 1.1,
          timeToTarget: 24,
        },
        technicalAnalysis: {
          rsi: 55,
          macd: { value: 0.001, signal: 0.0005, histogram: 0.0005 },
          trend: 'bullish',
          momentum: 'positive',
          volatility: 'medium',
          keyLevels: { support: [1.08], resistance: [1.12] },
        },
        fundamentalFactors: {
          economic: 20,
          geopolitical: 10,
          sentiment: 30,
        },
        riskFactors: ['Fed meeting upcoming'],
        rationale: 'Bullish momentum continues',
        timestamp: new Date(),
      }),
      generateMultiSymbolPredictions: jest.fn().mockResolvedValue([]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketAnalystAgent,
        { provide: AgentRegistryService, useValue: mockRegistry },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: AIMarketPredictionService, useValue: mockPredictionService },
      ],
    }).compile();

    agent = module.get<MarketAnalystAgent>(MarketAnalystAgent);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  it('should have correct agent metadata', () => {
    expect(agent.agentId).toBe('market-analyst-agent');
    expect(agent.name).toBe('Market Analyst Agent');
    expect(agent.capabilities.map((c) => c.id)).toContain('market-prediction');
  });

  describe('handleMessage - predict', () => {
    it('should generate prediction for symbol', async () => {
      const message: AgentMessage = {
        id: 'test-1',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'predict', symbol: 'EURUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.prediction).toBeDefined();
      expect(response.data.tradingRecommendation).toBeDefined();
      expect(
        mockPredictionService.generateMarketPrediction,
      ).toHaveBeenCalledWith('EURUSD');
    });

    it('should generate trading recommendation', async () => {
      const message: AgentMessage = {
        id: 'test-2',
        sourceAgent: 'test',
        type: 'request',
        payload: { symbol: 'EURUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.tradingRecommendation).toBeDefined();
      expect(response.data.tradingRecommendation.action).toBeDefined();
      expect(response.data.tradingRecommendation.confidence).toBeDefined();
    });
  });

  describe('handleMessage - analyze', () => {
    it('should return market analysis', async () => {
      const message: AgentMessage = {
        id: 'test-3',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'analyze', symbol: 'GBPUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.analysis).toBeDefined();
      expect(response.data.analysis.trend).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle prediction service errors', async () => {
      mockPredictionService.generateMarketPrediction.mockRejectedValueOnce(
        new Error('API error'),
      );

      const message: AgentMessage = {
        id: 'test-4',
        sourceAgent: 'test',
        type: 'request',
        payload: { symbol: 'EURUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('PREDICTION_FAILED');
    });
  });
});
