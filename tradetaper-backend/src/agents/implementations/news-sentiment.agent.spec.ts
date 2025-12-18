import { Test, TestingModule } from '@nestjs/testing';
import { NewsSentimentAgent } from './news-sentiment.agent';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { AgentMessage } from '../interfaces/agent.interface';

describe('NewsSentimentAgent', () => {
  let agent: NewsSentimentAgent;

  beforeEach(async () => {
    const mockRegistry = {
      register: jest.fn(),
      recordMessage: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      subscribeToAgent: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsSentimentAgent,
        { provide: AgentRegistryService, useValue: mockRegistry },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    agent = module.get<NewsSentimentAgent>(NewsSentimentAgent);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  it('should have correct capabilities', () => {
    const capIds = agent.capabilities.map(c => c.id);
    expect(capIds).toContain('news-analysis');
    expect(capIds).toContain('sentiment-scoring');
  });

  describe('handleMessage - analyze-news', () => {
    it('should return news analysis for known symbols', async () => {
      const message: AgentMessage = {
        id: 'test-1',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'analyze-news', symbol: 'XAUUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.symbol).toBe('XAUUSD');
      expect(response.data.news.length).toBeGreaterThan(0);
      expect(response.data.summary).toBeDefined();
    });

    it('should handle unknown symbols gracefully', async () => {
      const message: AgentMessage = {
        id: 'test-2',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'analyze-news', symbol: 'UNKNOWNSYM' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.news).toEqual([]);
      expect(response.data.message).toContain('No recent news');
    });
  });

  describe('handleMessage - get-sentiment', () => {
    it('should return sentiment scores', async () => {
      const message: AgentMessage = {
        id: 'test-3',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'get-sentiment', symbol: 'BTCUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.sentiment).toBeDefined();
      expect(response.data.sentiment.overallScore).toBeDefined();
      expect(response.data.sentiment.level).toBeDefined();
      expect(response.data.sentiment.components).toBeDefined();
    });

    it('should categorize sentiment level correctly', async () => {
      const message: AgentMessage = {
        id: 'test-4',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'get-sentiment', symbol: 'EURUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      const validLevels = ['extreme_fear', 'fear', 'neutral', 'greed', 'extreme_greed'];
      expect(validLevels).toContain(response.data.sentiment.level);
    });
  });

  describe('handleMessage - full-analysis', () => {
    it('should combine news and sentiment', async () => {
      const message: AgentMessage = {
        id: 'test-5',
        sourceAgent: 'test',
        type: 'request',
        payload: { action: 'full-analysis', symbol: 'XAUUSD' },
        context: { userId: 'u1', sessionId: 's1', correlationId: 'c1' },
        metadata: { timestamp: new Date(), priority: 'medium' },
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.news).toBeDefined();
      expect(response.data.sentiment).toBeDefined();
      expect(response.data.tradingBias).toBeDefined();
      expect(['bullish', 'bearish', 'neutral']).toContain(response.data.tradingBias);
    });
  });
});
