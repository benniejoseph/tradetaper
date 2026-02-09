import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import {
  AIMarketPredictionService,
  AIMarketPrediction,
} from '../../market-intelligence/ai-market-prediction.service';

/**
 * Market Analyst Agent
 *
 * Provides market analysis and predictions for trading instruments.
 * Wraps the existing AIMarketPredictionService with agent capabilities.
 *
 * Capabilities:
 * - market-prediction: Generate market predictions for symbols
 * - market-analysis: Analyze market conditions
 */
@Injectable()
export class MarketAnalystAgent extends BaseAgent {
  readonly agentId = 'market-analyst-agent';
  readonly name = 'Market Analyst Agent';
  readonly priority = 20;

  readonly capabilities: AgentCapability[] = [
    {
      id: 'market-prediction',
      description:
        'Generate AI-powered market predictions for trading instruments',
      keywords: [
        'prediction',
        'forecast',
        'market',
        'direction',
        'bullish',
        'bearish',
        'price',
      ],
    },
    {
      id: 'market-analysis',
      description: 'Analyze current market conditions and technical indicators',
      keywords: [
        'analysis',
        'technical',
        'fundamental',
        'sentiment',
        'trend',
        'volatility',
      ],
    },
  ];

  constructor(
    registry: AgentRegistryService,
    eventBus: EventBusService,
    private readonly predictionService: AIMarketPredictionService,
  ) {
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
      case 'predict':
      case 'get-prediction':
        return this.getPrediction(payload.symbol, context);

      case 'multi-predict':
        return this.getMultiplePredictions(payload.symbols, context);

      case 'analyze':
        return this.analyzeMarket(payload.symbol, context);

      default:
        // Default: if symbol provided, generate prediction
        if (payload.symbol) {
          return this.getPrediction(payload.symbol, context);
        }

        return {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${payload.action}. Supported: predict, multi-predict, analyze`,
          },
        };
    }
  }

  /**
   * Get prediction for a single symbol
   */
  private async getPrediction(
    symbol: string,
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const prediction =
        await this.predictionService.generateMarketPrediction(symbol);

      // Share prediction with other agents
      this.emit(
        'event',
        {
          type: 'market-prediction-generated',
          symbol,
          prediction: {
            direction: prediction.prediction.direction,
            confidence: prediction.prediction.confidence,
          },
        },
        context,
      );

      // Alert on high-confidence signals
      if (prediction.prediction.confidence >= 80) {
        this.emitAlert(
          {
            type: 'high-confidence-signal',
            message: `High confidence ${prediction.prediction.direction} signal on ${symbol}`,
            prediction,
          },
          context,
          'high',
        );
      }

      return {
        success: true,
        data: {
          prediction,
          tradingRecommendation: this.generateTradingRecommendation(prediction),
          sharedState: {
            lastMarketPrediction: {
              symbol,
              direction: prediction.prediction.direction,
              confidence: prediction.prediction.confidence,
              timestamp: new Date(),
            },
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PREDICTION_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to generate prediction',
        },
      };
    }
  }

  /**
   * Get predictions for multiple symbols
   */
  private async getMultiplePredictions(
    symbols: string[],
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      if (!symbols || symbols.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_SYMBOLS',
            message: 'No symbols provided for prediction',
          },
        };
      }

      const predictions =
        await this.predictionService.generateMultiSymbolPredictions(symbols);

      // Find best opportunities
      const bullishOpportunities = predictions
        .filter(
          (p) =>
            p.prediction.direction === 'bullish' &&
            p.prediction.confidence >= 70,
        )
        .sort((a, b) => b.prediction.confidence - a.prediction.confidence);

      const bearishOpportunities = predictions
        .filter(
          (p) =>
            p.prediction.direction === 'bearish' &&
            p.prediction.confidence >= 70,
        )
        .sort((a, b) => b.prediction.confidence - a.prediction.confidence);

      return {
        success: true,
        data: {
          predictions,
          summary: {
            totalSymbols: symbols.length,
            bullishCount: predictions.filter(
              (p) => p.prediction.direction === 'bullish',
            ).length,
            bearishCount: predictions.filter(
              (p) => p.prediction.direction === 'bearish',
            ).length,
            neutralCount: predictions.filter(
              (p) => p.prediction.direction === 'neutral',
            ).length,
          },
          topOpportunities: {
            bullish: bullishOpportunities.slice(0, 3),
            bearish: bearishOpportunities.slice(0, 3),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MULTI_PREDICTION_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to generate predictions',
        },
      };
    }
  }

  /**
   * Analyze market conditions for a symbol
   */
  private async analyzeMarket(
    symbol: string,
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const prediction =
        await this.predictionService.generateMarketPrediction(symbol);

      return {
        success: true,
        data: {
          symbol,
          analysis: {
            trend: prediction.technicalAnalysis.trend,
            momentum: prediction.technicalAnalysis.momentum,
            volatility: prediction.technicalAnalysis.volatility,
            keyLevels: prediction.technicalAnalysis.keyLevels,
            fundamentals: prediction.fundamentalFactors,
            riskFactors: prediction.riskFactors,
          },
          recommendation: this.generateTradingRecommendation(prediction),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message:
            error instanceof Error ? error.message : 'Failed to analyze market',
        },
      };
    }
  }

  /**
   * Generate actionable trading recommendation
   */
  private generateTradingRecommendation(prediction: AIMarketPrediction): {
    action: 'buy' | 'sell' | 'wait' | 'hold';
    confidence: 'low' | 'medium' | 'high';
    rationale: string;
  } {
    const { direction, confidence } = prediction.prediction;
    const { volatility } = prediction.technicalAnalysis;

    // Determine action
    let action: 'buy' | 'sell' | 'wait' | 'hold' = 'wait';
    let confidenceLevel: 'low' | 'medium' | 'high' = 'low';

    if (confidence >= 75) {
      confidenceLevel = 'high';
      if (direction === 'bullish') action = 'buy';
      else if (direction === 'bearish') action = 'sell';
    } else if (confidence >= 60) {
      confidenceLevel = 'medium';
      if (direction !== 'neutral' && volatility !== 'high') {
        action = direction === 'bullish' ? 'buy' : 'sell';
      } else {
        action = 'hold';
      }
    } else {
      action = 'wait';
      confidenceLevel = 'low';
    }

    return {
      action,
      confidence: confidenceLevel,
      rationale: prediction.rationale,
    };
  }

  /**
   * React to events from other agents
   */
  protected async onEvent(message: AgentMessage): Promise<void> {
    // React to trade events - could update predictions based on closed trades
    if (message.payload?.type === 'trade-closed') {
      this.logger.debug(
        `Trade closed on ${message.payload.symbol}, could update predictions`,
      );
    }
  }
}
