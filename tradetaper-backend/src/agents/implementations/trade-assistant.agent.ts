import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { GeminiPredictionService } from '../../predictive-trades/gemini-prediction.service';
import { CreatePredictionDto } from '../../predictive-trades/dto/create-prediction.dto';

/**
 * Trade Assistant Agent
 *
 * Provides AI-powered trade predictions and assistance:
 * - Probability of profit analysis
 * - Predicted outcome (win/loss/neutral)
 * - Confidence scoring
 *
 * Capabilities:
 * - trade-prediction: Predict trade outcome probability
 */
@Injectable()
export class TradeAssistantAgent extends BaseAgent {
  readonly agentId = 'trade-assistant-agent';
  readonly name = 'Trade Assistant Agent';
  readonly priority = 20;

  readonly capabilities: AgentCapability[] = [
    {
      id: 'trade-prediction',
      description: 'Predict probability of profit for trade setups using AI',
      keywords: [
        'predict',
        'probability',
        'outcome',
        'trade',
        'setup',
        'win',
        'loss',
        'analysis',
      ],
    },
  ];

  constructor(
    registry: AgentRegistryService,
    eventBus: EventBusService,
    private readonly predictionService: GeminiPredictionService,
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
      case 'analyze':
        return this.predictTradeOutcome(payload, context);

      default:
        // Try to predict if we have required trade parameters
        if (payload.instrument && payload.direction && payload.entryPrice) {
          return this.predictTradeOutcome(payload, context);
        }

        return {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${payload.action}. Supported: predict, analyze`,
          },
        };
    }
  }

  /**
   * Predict trade outcome using Gemini AI
   */
  private async predictTradeOutcome(
    data: {
      instrument: string;
      direction: 'buy' | 'sell';
      entryPrice: number;
      stopLoss: number;
      takeProfit: number;
      expectedDurationHours?: number;
    },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      // Validate required fields
      if (
        !data.instrument ||
        !data.direction ||
        !data.entryPrice ||
        !data.stopLoss ||
        !data.takeProfit
      ) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message:
              'Required: instrument, direction, entryPrice, stopLoss, takeProfit',
          },
        };
      }

      // Calculate risk/reward ratio
      const riskDistance = Math.abs(data.entryPrice - data.stopLoss);
      const rewardDistance = Math.abs(data.takeProfit - data.entryPrice);
      const riskRewardRatio = rewardDistance / riskDistance;

      // Create prediction DTO
      const predictionDto: CreatePredictionDto = {
        instrument: data.instrument,
        direction: data.direction,
        entryPrice: data.entryPrice,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        expectedDurationHours: data.expectedDurationHours,
      };

      // Get prediction from Gemini
      const prediction =
        await this.predictionService.generatePrediction(predictionDto);

      // Emit event for other agents
      this.emit(
        'event',
        {
          type: 'trade-prediction-generated',
          instrument: data.instrument,
          direction: data.direction,
          probabilityOfProfit: prediction.probabilityOfProfit,
          predictedOutcome: prediction.predictedOutcome,
        },
        context,
      );

      // Alert on high-confidence predictions
      if (
        prediction.confidence >= 0.8 &&
        prediction.probabilityOfProfit >= 0.7
      ) {
        this.emitAlert(
          {
            type: 'high-probability-trade',
            message: `High probability ${data.direction} on ${data.instrument}`,
            prediction,
          },
          context,
          'high',
        );
      }

      // Alert on low probability trades
      if (prediction.probabilityOfProfit < 0.4) {
        this.emitAlert(
          {
            type: 'low-probability-trade',
            message: `Low probability trade detected on ${data.instrument}`,
            prediction,
          },
          context,
          'high',
        );
      }

      return {
        success: true,
        data: {
          tradeSetup: {
            instrument: data.instrument,
            direction: data.direction,
            entryPrice: data.entryPrice,
            stopLoss: data.stopLoss,
            takeProfit: data.takeProfit,
          },
          analysis: {
            riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
            riskPips: parseFloat(riskDistance.toFixed(5)),
            rewardPips: parseFloat(rewardDistance.toFixed(5)),
          },
          prediction: {
            probabilityOfProfit: prediction.probabilityOfProfit,
            expectedPnL: prediction.expectedPnL,
            predictedOutcome: prediction.predictedOutcome,
            confidence: prediction.confidence,
          },
          recommendation: this.generateRecommendation(
            prediction,
            riskRewardRatio,
          ),
          sharedState: {
            lastTradePrediction: {
              instrument: data.instrument,
              direction: data.direction,
              probability: prediction.probabilityOfProfit,
              outcome: prediction.predictedOutcome,
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
            error instanceof Error ? error.message : 'Trade prediction failed',
        },
      };
    }
  }

  /**
   * Generate trading recommendation based on prediction
   */
  private generateRecommendation(
    prediction: {
      probabilityOfProfit: number;
      predictedOutcome: string;
      confidence: number;
    },
    riskRewardRatio: number,
  ): {
    action: 'take' | 'skip' | 'review';
    confidence: 'high' | 'medium' | 'low';
    reasons: string[];
  } {
    const reasons: string[] = [];
    let action: 'take' | 'skip' | 'review';
    let confidence: 'high' | 'medium' | 'low';

    // Evaluate probability
    if (prediction.probabilityOfProfit >= 0.7) {
      reasons.push(
        `High probability of profit (${(prediction.probabilityOfProfit * 100).toFixed(0)}%)`,
      );
    } else if (prediction.probabilityOfProfit < 0.4) {
      reasons.push(
        `Low probability of profit (${(prediction.probabilityOfProfit * 100).toFixed(0)}%)`,
      );
    }

    // Evaluate R:R ratio
    if (riskRewardRatio >= 2) {
      reasons.push(`Excellent R:R ratio (1:${riskRewardRatio.toFixed(1)})`);
    } else if (riskRewardRatio < 1.5) {
      reasons.push(`R:R ratio below optimal (1:${riskRewardRatio.toFixed(1)})`);
    }

    // Evaluate confidence
    if (prediction.confidence >= 0.8) {
      reasons.push('High AI confidence in prediction');
    } else if (prediction.confidence < 0.5) {
      reasons.push('Low AI confidence - consider additional analysis');
    }

    // Determine action
    if (
      prediction.probabilityOfProfit >= 0.65 &&
      riskRewardRatio >= 1.5 &&
      prediction.confidence >= 0.6
    ) {
      action = 'take';
      confidence = prediction.confidence >= 0.8 ? 'high' : 'medium';
    } else if (prediction.probabilityOfProfit < 0.4 || riskRewardRatio < 1) {
      action = 'skip';
      confidence = prediction.confidence >= 0.7 ? 'high' : 'medium';
    } else {
      action = 'review';
      confidence = 'low';
    }

    return { action, confidence, reasons };
  }

  /**
   * React to events from other agents
   */
  protected async onEvent(message: AgentMessage): Promise<void> {
    // Could react to market predictions to validate trade setups
    if (message.payload?.type === 'market-prediction-generated') {
      this.logger.debug(
        `Market prediction received for ${message.payload.symbol}`,
      );
    }
  }
}
