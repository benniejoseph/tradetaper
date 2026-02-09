import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';

/**
 * News & Sentiment Agent
 *
 * Analyzes market news and sentiment for trading insights.
 * This is a foundation agent that can be extended with actual news APIs.
 *
 * Capabilities:
 * - news-analysis: Analyze news impact on instruments
 * - sentiment-scoring: Score market sentiment
 */
@Injectable()
export class NewsSentimentAgent extends BaseAgent {
  readonly agentId = 'news-sentiment-agent';
  readonly name = 'News & Sentiment Agent';
  readonly priority = 12;

  readonly capabilities: AgentCapability[] = [
    {
      id: 'news-analysis',
      description:
        'Analyze recent news and their potential impact on trading instruments',
      keywords: ['news', 'headlines', 'events', 'impact', 'analysis'],
    },
    {
      id: 'sentiment-scoring',
      description:
        'Score market sentiment for instruments based on various data sources',
      keywords: ['sentiment', 'mood', 'bullish', 'bearish', 'score', 'social'],
    },
  ];

  // Simulated news data - in production, integrate with news APIs
  private readonly mockNewsData = new Map<string, any[]>([
    [
      'XAUUSD',
      [
        {
          headline: 'Fed signals potential rate pause',
          impact: 'bullish',
          weight: 0.7,
        },
        {
          headline: 'Dollar weakens on economic data',
          impact: 'bullish',
          weight: 0.6,
        },
        {
          headline: 'Global uncertainty drives safe-haven demand',
          impact: 'bullish',
          weight: 0.8,
        },
      ],
    ],
    [
      'EURUSD',
      [
        {
          headline: 'ECB maintains hawkish stance',
          impact: 'bullish',
          weight: 0.6,
        },
        {
          headline: 'US jobs data exceeds expectations',
          impact: 'bearish',
          weight: 0.7,
        },
      ],
    ],
    [
      'BTCUSD',
      [
        {
          headline: 'Institutional adoption continues to grow',
          impact: 'bullish',
          weight: 0.8,
        },
        {
          headline: 'Regulatory clarity improves in major markets',
          impact: 'bullish',
          weight: 0.6,
        },
        {
          headline: 'Whale movements detected on-chain',
          impact: 'neutral',
          weight: 0.4,
        },
      ],
    ],
  ]);

  constructor(registry: AgentRegistryService, eventBus: EventBusService) {
    super(registry, eventBus);
  }

  /**
   * Process incoming messages
   */
  protected async processMessage(
    message: AgentMessage,
  ): Promise<AgentResponse> {
    const { payload, context } = message;

    switch (payload.action) {
      case 'analyze-news':
      case 'get-news':
        return this.analyzeNews(payload.symbol || payload.instrument, context);

      case 'get-sentiment':
      case 'score-sentiment':
        return this.scoreSentiment(
          payload.symbol || payload.instrument,
          context,
        );

      case 'full-analysis':
        return this.fullSentimentAnalysis(
          payload.symbol || payload.instrument,
          context,
        );

      default:
        // Default: if symbol provided, do full analysis
        if (payload.symbol || payload.instrument) {
          return this.fullSentimentAnalysis(
            payload.symbol || payload.instrument,
            context,
          );
        }

        return {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${payload.action}. Supported: analyze-news, get-sentiment, full-analysis`,
          },
        };
    }
  }

  /**
   * Analyze news for a symbol
   */
  private async analyzeNews(
    symbol: string,
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    const news = this.getNewsForSymbol(symbol);

    if (news.length === 0) {
      return {
        success: true,
        data: {
          symbol,
          news: [],
          message: 'No recent news available for this instrument',
        },
      };
    }

    // Calculate overall news impact
    const bullishNews = news.filter((n) => n.impact === 'bullish');
    const bearishNews = news.filter((n) => n.impact === 'bearish');

    const bullishWeight = bullishNews.reduce((sum, n) => sum + n.weight, 0);
    const bearishWeight = bearishNews.reduce((sum, n) => sum + n.weight, 0);

    const netImpact = bullishWeight - bearishWeight;
    const overallImpact =
      netImpact > 0.3 ? 'bullish' : netImpact < -0.3 ? 'bearish' : 'neutral';

    return {
      success: true,
      data: {
        symbol,
        news: news.map((n) => ({
          headline: n.headline,
          impact: n.impact,
          significance:
            n.weight >= 0.7 ? 'high' : n.weight >= 0.5 ? 'medium' : 'low',
        })),
        summary: {
          totalArticles: news.length,
          bullishCount: bullishNews.length,
          bearishCount: bearishNews.length,
          overallImpact,
          netScore: parseFloat(netImpact.toFixed(2)),
        },
      },
    };
  }

  /**
   * Score market sentiment for a symbol
   */
  private async scoreSentiment(
    symbol: string,
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    // Calculate sentiment score from various factors
    const newsScore = this.calculateNewsScore(symbol);
    const socialScore = this.simulateSocialScore(symbol);
    const technicalSentiment = this.simulateTechnicalSentiment(symbol);

    // Weighted average
    const overallScore =
      newsScore * 0.4 + socialScore * 0.3 + technicalSentiment * 0.3;

    // Determine sentiment level
    let sentimentLevel:
      | 'extreme_fear'
      | 'fear'
      | 'neutral'
      | 'greed'
      | 'extreme_greed';
    if (overallScore <= -60) sentimentLevel = 'extreme_fear';
    else if (overallScore <= -20) sentimentLevel = 'fear';
    else if (overallScore <= 20) sentimentLevel = 'neutral';
    else if (overallScore <= 60) sentimentLevel = 'greed';
    else sentimentLevel = 'extreme_greed';

    // Emit sentiment event
    this.emit(
      'event',
      {
        type: 'sentiment-calculated',
        symbol,
        score: overallScore,
        level: sentimentLevel,
      },
      context,
    );

    return {
      success: true,
      data: {
        symbol,
        sentiment: {
          overallScore: parseFloat(overallScore.toFixed(1)),
          level: sentimentLevel,
          components: {
            news: parseFloat(newsScore.toFixed(1)),
            social: parseFloat(socialScore.toFixed(1)),
            technical: parseFloat(technicalSentiment.toFixed(1)),
          },
        },
        interpretation: this.interpretSentiment(sentimentLevel),
        sharedState: {
          lastSentimentAnalysis: {
            symbol,
            score: overallScore,
            level: sentimentLevel,
            timestamp: new Date(),
          },
        },
      },
    };
  }

  /**
   * Full sentiment analysis combining news and sentiment
   */
  private async fullSentimentAnalysis(
    symbol: string,
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    const newsResult = await this.analyzeNews(symbol, context);
    const sentimentResult = await this.scoreSentiment(symbol, context);

    if (!newsResult.success || !sentimentResult.success) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: 'Failed to complete full sentiment analysis',
        },
      };
    }

    // Generate trading bias based on combined analysis
    const sentimentScore = sentimentResult.data?.sentiment?.overallScore || 0;
    const newsImpact = newsResult.data?.summary?.overallImpact || 'neutral';

    let tradingBias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (sentimentScore > 20 && newsImpact === 'bullish')
      tradingBias = 'bullish';
    else if (sentimentScore < -20 && newsImpact === 'bearish')
      tradingBias = 'bearish';
    else if (sentimentScore > 40 || newsImpact === 'bullish')
      tradingBias = 'bullish';
    else if (sentimentScore < -40 || newsImpact === 'bearish')
      tradingBias = 'bearish';

    return {
      success: true,
      data: {
        symbol,
        news: newsResult.data,
        sentiment: sentimentResult.data?.sentiment,
        tradingBias,
        recommendation: this.generateSentimentRecommendation(
          tradingBias,
          sentimentScore,
        ),
      },
    };
  }

  // === Helper Methods ===

  private getNewsForSymbol(symbol: string): any[] {
    // Normalize symbol
    const normalizedSymbol = symbol.toUpperCase().replace(/[^A-Z]/g, '');
    return this.mockNewsData.get(normalizedSymbol) || [];
  }

  private calculateNewsScore(symbol: string): number {
    const news = this.getNewsForSymbol(symbol);
    if (news.length === 0) return 0;

    let score = 0;
    for (const item of news) {
      if (item.impact === 'bullish') score += item.weight * 100;
      else if (item.impact === 'bearish') score -= item.weight * 100;
    }
    return score / news.length;
  }

  private simulateSocialScore(symbol: string): number {
    // Simulate social sentiment (-100 to 100)
    const baseScores: Record<string, number> = {
      XAUUSD: 25,
      EURUSD: -10,
      BTCUSD: 45,
    };
    const base = baseScores[symbol.toUpperCase()] || 0;
    const noise = (Math.random() - 0.5) * 20;
    return Math.max(-100, Math.min(100, base + noise));
  }

  private simulateTechnicalSentiment(symbol: string): number {
    // Simulate technical sentiment based on "market structure"
    const baseScores: Record<string, number> = {
      XAUUSD: 30,
      EURUSD: 5,
      BTCUSD: 20,
    };
    const base = baseScores[symbol.toUpperCase()] || 0;
    const noise = (Math.random() - 0.5) * 30;
    return Math.max(-100, Math.min(100, base + noise));
  }

  private interpretSentiment(level: string): string {
    const interpretations: Record<string, string> = {
      extreme_fear:
        'Market is in extreme fear - potential contrarian buy opportunity',
      fear: 'Bearish sentiment dominates - proceed with caution on longs',
      neutral: 'Mixed sentiment - wait for clearer signals',
      greed:
        'Bullish sentiment - momentum favors upside but watch for reversals',
      extreme_greed:
        'Market may be overextended - consider taking profits on longs',
    };
    return interpretations[level] || 'Unable to interpret sentiment';
  }

  private generateSentimentRecommendation(
    bias: 'bullish' | 'bearish' | 'neutral',
    score: number,
  ): string {
    if (bias === 'bullish' && score > 40) {
      return 'Strong bullish sentiment - look for long entries on pullbacks';
    } else if (bias === 'bearish' && score < -40) {
      return 'Strong bearish sentiment - look for short entries on rallies';
    } else if (bias === 'bullish') {
      return 'Mild bullish bias - consider longs but with tight risk management';
    } else if (bias === 'bearish') {
      return 'Mild bearish bias - consider shorts but with tight risk management';
    } else {
      return 'Neutral sentiment - wait for clearer directional signals';
    }
  }

  /**
   * React to events from other agents
   */
  protected async onEvent(message: AgentMessage): Promise<void> {
    // Could react to market predictions to provide sentiment context
    if (message.payload?.type === 'market-prediction-generated') {
      this.logger.debug(`Could enrich prediction with sentiment data`);
    }
  }
}
