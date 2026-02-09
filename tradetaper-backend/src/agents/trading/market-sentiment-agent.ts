import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../core/base-agent';
import {
  AgentCapability,
  AgentConfig,
  AgentResponse,
  MarketContext,
  Task,
  TradePrediction,
} from '../core/types';
import { MultiModelOrchestratorService } from '../llm/multi-model-orchestrator.service';

/**
 * Market Sentiment Agent
 *
 * Specialized agent for analyzing market sentiment from news, social media,
 * and economic indicators.
 *
 * Capabilities:
 * - News sentiment analysis
 * - Social sentiment aggregation
 * - Fear & Greed index interpretation
 * - Market mood assessment
 */
@Injectable()
export class MarketSentimentAgent extends BaseAgent {
  constructor(private readonly llmOrchestrator: MultiModelOrchestratorService) {
    const config: AgentConfig = {
      name: 'market-sentiment-analyzer',
      type: 'sentiment-analysis',
      capabilities: [
        {
          name: 'news-sentiment',
          proficiency: 0.92,
          cost: 0.001,
          avgExecutionTime: 2000,
        },
        {
          name: 'social-sentiment',
          proficiency: 0.85,
          cost: 0.001,
          avgExecutionTime: 1500,
        },
        {
          name: 'market-mood',
          proficiency: 0.88,
          cost: 0.0005,
          avgExecutionTime: 1000,
        },
      ],
      maxConcurrentTasks: 5,
      timeout: 30000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
      },
    };

    super(config);
  }

  protected async executeTask(task: Task): Promise<AgentResponse> {
    this.logger.log(
      `Analyzing market sentiment for: ${JSON.stringify(task.data)}`,
    );

    const { symbol, news, marketData } = task.data as {
      symbol: string;
      news: any[];
      marketData: any;
    };

    // Analyze sentiment using LLM
    const sentiment = await this.analyzeSentiment(symbol, news, marketData);

    return {
      success: true,
      data: sentiment,
      metadata: {
        executionTime: 0, // Will be set by base class
        confidence: sentiment.confidence,
      },
    };
  }

  private async analyzeSentiment(
    symbol: string,
    news: any[],
    marketData: any,
  ): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    confidence: number;
    reasoning: string;
    factors: string[];
  }> {
    // Prepare prompt for LLM
    const newsText = news
      .slice(0, 10)
      .map((n) => `- ${n.title}: ${n.content?.substring(0, 200) || ''}`)
      .join('\n');

    const prompt = `Analyze the market sentiment for ${symbol} based on the following information:

Recent News:
${newsText}

Market Data:
- Current Price: ${marketData.price}
- 24h Change: ${marketData.changePercent}%
- Volume: ${marketData.volume}

Provide a comprehensive sentiment analysis in JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "score": 0.0 to 1.0 (bearish < 0.3, neutral 0.3-0.7, bullish > 0.7),
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of sentiment",
  "factors": ["factor1", "factor2", "factor3"]
}`;

    try {
      const response = await this.llmOrchestrator.complete({
        prompt,
        taskComplexity: 'medium',
        optimizeFor: 'cost',
        requireJson: true,
        maxTokens: 500,
      });

      const result = JSON.parse(response.content);

      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0.5,
        confidence: result.confidence || 0.7,
        reasoning:
          result.reasoning || 'Market analysis based on available data',
        factors: result.factors || [],
      };
    } catch (error) {
      this.logger.error(`Sentiment analysis failed: ${error.message}`);

      // Fallback to simple heuristic
      return this.fallbackSentiment(marketData);
    }
  }

  private fallbackSentiment(marketData: any): any {
    const changePercent = marketData.changePercent || 0;

    let sentiment: 'bullish' | 'bearish' | 'neutral';
    let score: number;

    if (changePercent > 2) {
      sentiment = 'bullish';
      score = 0.75;
    } else if (changePercent < -2) {
      sentiment = 'bearish';
      score = 0.25;
    } else {
      sentiment = 'neutral';
      score = 0.5;
    }

    return {
      sentiment,
      score,
      confidence: 0.6,
      reasoning: 'Fallback analysis based on price movement',
      factors: ['price-action'],
    };
  }
}
