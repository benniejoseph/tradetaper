import { Injectable, Logger } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';

/**
 * Risk Manager Agent
 *
 * NEW agent providing comprehensive trading risk management:
 * - Position sizing calculations
 * - Portfolio risk analysis
 * - Drawdown monitoring
 * - Risk/reward assessment
 *
 * Capabilities:
 * - risk-calculation: Calculate position sizes and risk metrics
 * - portfolio-risk: Analyze overall portfolio risk
 * - trade-assessment: Assess risk/reward of proposed trades
 */
@Injectable()
export class RiskManagerAgent extends BaseAgent {
  readonly agentId = 'risk-manager-agent';
  readonly name = 'Risk Manager Agent';
  readonly priority = 25; // High priority - risk is critical

  readonly capabilities: AgentCapability[] = [
    {
      id: 'risk-calculation',
      description:
        'Calculate optimal position sizes based on account risk parameters',
      keywords: [
        'position',
        'size',
        'lot',
        'units',
        'risk',
        'percentage',
        'calculate',
      ],
    },
    {
      id: 'portfolio-risk',
      description: 'Analyze overall portfolio risk, correlation, and exposure',
      keywords: [
        'portfolio',
        'exposure',
        'correlation',
        'drawdown',
        'diversification',
      ],
    },
    {
      id: 'trade-assessment',
      description: 'Assess risk/reward ratio and viability of proposed trades',
      keywords: [
        'assessment',
        'risk-reward',
        'ratio',
        'viability',
        'stop-loss',
        'take-profit',
      ],
    },
  ];

  // Risk parameters (could be made configurable per user)
  private readonly DEFAULT_RISK_PERCENT = 1; // 1% per trade
  private readonly MAX_RISK_PERCENT = 5; // Maximum 5% per trade
  private readonly MAX_PORTFOLIO_RISK = 10; // Maximum 10% total portfolio risk
  private readonly MIN_RISK_REWARD_RATIO = 1.5; // Minimum 1:1.5 R:R

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
      case 'calculate-position':
        return this.calculatePositionSize(payload, context);

      case 'assess-trade':
        return this.assessTradeRisk(payload, context);

      case 'portfolio-analysis':
        return this.analyzePortfolioRisk(payload, context);

      case 'check-drawdown':
        return this.checkDrawdown(payload, context);

      case 'get-risk-rules':
        return this.getRiskRules(context);

      default:
        // Default: if we have trade parameters, assess the trade
        if (payload.entryPrice && payload.stopLoss) {
          return this.assessTradeRisk(payload, context);
        }

        return {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${payload.action}. Supported: calculate-position, assess-trade, portfolio-analysis, check-drawdown`,
          },
        };
    }
  }

  /**
   * Calculate optimal position size
   */
  private async calculatePositionSize(
    data: {
      accountBalance: number;
      riskPercent?: number;
      entryPrice: number;
      stopLoss: number;
      symbol?: string;
      pipValue?: number;
    },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const { accountBalance, entryPrice, stopLoss, symbol = 'UNKNOWN' } = data;
      const riskPercent = Math.min(
        data.riskPercent || this.DEFAULT_RISK_PERCENT,
        this.MAX_RISK_PERCENT,
      );

      // Calculate risk amount in account currency
      const riskAmount = accountBalance * (riskPercent / 100);

      // Calculate stop loss distance
      const stopDistance = Math.abs(entryPrice - stopLoss);
      const stopDistancePercent = (stopDistance / entryPrice) * 100;

      // Calculate position size
      const pipValue =
        data.pipValue || this.estimatePipValue(symbol, entryPrice);
      const positionSize = riskAmount / stopDistance;

      // Calculate lots for forex (standard lot = 100,000 units)
      const standardLots = positionSize / 100000;
      const miniLots = positionSize / 10000;
      const microLots = positionSize / 1000;

      const calculation = {
        symbol,
        accountBalance,
        riskPercent,
        riskAmount,
        entryPrice,
        stopLoss,
        stopDistance,
        stopDistancePercent: stopDistancePercent.toFixed(2),
        positionSize: Math.round(positionSize),
        lots: {
          standard: parseFloat(standardLots.toFixed(2)),
          mini: parseFloat(miniLots.toFixed(2)),
          micro: parseFloat(microLots.toFixed(2)),
        },
        recommendation: this.getPositionRecommendation(
          riskPercent,
          stopDistancePercent,
        ),
      };

      // Share with other agents
      this.emit(
        'event',
        {
          type: 'position-calculated',
          symbol,
          riskAmount,
          positionSize: calculation.positionSize,
        },
        context,
      );

      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CALCULATION_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Position calculation failed',
        },
      };
    }
  }

  /**
   * Assess trade risk/reward
   */
  private async assessTradeRisk(
    data: {
      symbol?: string;
      direction?: 'buy' | 'sell';
      entryPrice: number;
      stopLoss: number;
      takeProfit?: number;
      accountBalance?: number;
      existingRisk?: number;
    },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const { entryPrice, stopLoss, takeProfit, symbol = 'UNKNOWN' } = data;
      const direction =
        data.direction || (entryPrice > stopLoss ? 'buy' : 'sell');

      // Calculate risk metrics
      const riskDistance = Math.abs(entryPrice - stopLoss);
      const riskPercent = (riskDistance / entryPrice) * 100;

      let rewardDistance = 0;
      let riskRewardRatio = 0;

      if (takeProfit) {
        rewardDistance = Math.abs(takeProfit - entryPrice);
        riskRewardRatio = rewardDistance / riskDistance;
      }

      // Assess trade viability
      const assessment = this.assessViability(
        riskPercent,
        riskRewardRatio,
        data.existingRisk,
      );

      // Emit alert if trade is high risk
      if (assessment.verdict === 'reject' || assessment.verdict === 'caution') {
        this.emitAlert(
          {
            type: 'trade-risk-warning',
            message: `Trade on ${symbol} flagged: ${assessment.verdict}`,
            reasons: assessment.warnings,
            symbol,
          },
          context,
          assessment.verdict === 'reject' ? 'critical' : 'high',
        );
      }

      const result = {
        symbol,
        direction,
        entryPrice,
        stopLoss,
        takeProfit,
        metrics: {
          riskDistance: parseFloat(riskDistance.toFixed(5)),
          riskPercent: parseFloat(riskPercent.toFixed(2)),
          rewardDistance: takeProfit
            ? parseFloat(rewardDistance.toFixed(5))
            : null,
          riskRewardRatio: takeProfit
            ? parseFloat(riskRewardRatio.toFixed(2))
            : null,
        },
        assessment,
        suggestions: this.generateSuggestions(
          entryPrice,
          stopLoss,
          takeProfit,
          riskRewardRatio,
        ),
      };

      return {
        success: true,
        data: result,
        // Share assessment with shared state
        forwardTo: context.sharedState?.lastMarketPrediction
          ? undefined
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ASSESSMENT_FAILED',
          message:
            error instanceof Error ? error.message : 'Trade assessment failed',
        },
      };
    }
  }

  /**
   * Analyze portfolio risk exposure
   */
  private async analyzePortfolioRisk(
    data: {
      openTrades: Array<{
        symbol: string;
        direction: 'buy' | 'sell';
        size: number;
        entryPrice: number;
        currentPrice: number;
        stopLoss?: number;
      }>;
      accountBalance: number;
    },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const { openTrades, accountBalance } = data;

      if (!openTrades || openTrades.length === 0) {
        return {
          success: true,
          data: {
            totalExposure: 0,
            riskPercentage: 0,
            status: 'no-positions',
            message: 'No open trades to analyze',
          },
        };
      }

      // Calculate total risk exposure
      let totalRiskAmount = 0;
      let totalUnrealizedPnL = 0;
      const tradeRisks: any[] = [];

      for (const trade of openTrades) {
        const unrealizedPnL =
          (trade.currentPrice - trade.entryPrice) *
          trade.size *
          (trade.direction === 'buy' ? 1 : -1);
        totalUnrealizedPnL += unrealizedPnL;

        if (trade.stopLoss) {
          const riskAmount =
            Math.abs(trade.entryPrice - trade.stopLoss) * trade.size;
          totalRiskAmount += riskAmount;
          tradeRisks.push({
            symbol: trade.symbol,
            direction: trade.direction,
            riskAmount,
            unrealizedPnL,
          });
        }
      }

      const totalRiskPercent = (totalRiskAmount / accountBalance) * 100;
      const unrealizedPnLPercent = (totalUnrealizedPnL / accountBalance) * 100;

      // Determine risk status
      let status: 'safe' | 'moderate' | 'high' | 'critical' = 'safe';
      if (totalRiskPercent >= this.MAX_PORTFOLIO_RISK) {
        status = 'critical';
      } else if (totalRiskPercent >= this.MAX_PORTFOLIO_RISK * 0.7) {
        status = 'high';
      } else if (totalRiskPercent >= this.MAX_PORTFOLIO_RISK * 0.4) {
        status = 'moderate';
      }

      // Emit alert if portfolio risk is too high
      if (status === 'critical' || status === 'high') {
        this.emitAlert(
          {
            type: 'portfolio-risk-alert',
            message: `Portfolio risk at ${totalRiskPercent.toFixed(1)}% - ${status}`,
            totalRiskPercent,
            status,
          },
          context,
          status === 'critical' ? 'critical' : 'high',
        );
      }

      return {
        success: true,
        data: {
          summary: {
            openTradeCount: openTrades.length,
            totalRiskAmount: parseFloat(totalRiskAmount.toFixed(2)),
            totalRiskPercent: parseFloat(totalRiskPercent.toFixed(2)),
            totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(2)),
            unrealizedPnLPercent: parseFloat(unrealizedPnLPercent.toFixed(2)),
          },
          status,
          tradeRisks,
          recommendations: this.getPortfolioRecommendations(
            status,
            totalRiskPercent,
          ),
          sharedState: {
            portfolioRisk: {
              totalRiskPercent,
              status,
              timestamp: new Date(),
            },
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PORTFOLIO_ANALYSIS_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Portfolio analysis failed',
        },
      };
    }
  }

  /**
   * Check account drawdown
   */
  private async checkDrawdown(
    data: {
      currentBalance: number;
      peakBalance: number;
      initialBalance?: number;
    },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    const { currentBalance, peakBalance, initialBalance } = data;

    // Calculate drawdowns
    const drawdownFromPeak =
      ((peakBalance - currentBalance) / peakBalance) * 100;
    const drawdownFromInitial = initialBalance
      ? ((initialBalance - currentBalance) / initialBalance) * 100
      : null;

    // Determine severity
    let severity: 'normal' | 'warning' | 'danger' | 'critical' = 'normal';
    if (drawdownFromPeak >= 20) severity = 'critical';
    else if (drawdownFromPeak >= 10) severity = 'danger';
    else if (drawdownFromPeak >= 5) severity = 'warning';

    // Emit alert for significant drawdown
    if (severity === 'danger' || severity === 'critical') {
      this.emitAlert(
        {
          type: 'drawdown-alert',
          message: `Account drawdown at ${drawdownFromPeak.toFixed(1)}%`,
          drawdownFromPeak,
          severity,
        },
        context,
        severity === 'critical' ? 'critical' : 'high',
      );
    }

    return {
      success: true,
      data: {
        currentBalance,
        peakBalance,
        drawdownFromPeak: parseFloat(drawdownFromPeak.toFixed(2)),
        drawdownFromInitial: drawdownFromInitial
          ? parseFloat(drawdownFromInitial.toFixed(2))
          : null,
        severity,
        recommendations: this.getDrawdownRecommendations(
          severity,
          drawdownFromPeak,
        ),
      },
    };
  }

  /**
   * Get trading risk rules
   */
  private async getRiskRules(
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    return {
      success: true,
      data: {
        rules: {
          maxRiskPerTrade: `${this.MAX_RISK_PERCENT}%`,
          recommendedRiskPerTrade: `${this.DEFAULT_RISK_PERCENT}%`,
          maxPortfolioRisk: `${this.MAX_PORTFOLIO_RISK}%`,
          minRiskRewardRatio: `1:${this.MIN_RISK_REWARD_RATIO}`,
        },
        guidance: [
          'Never risk more than 1-2% of account on a single trade',
          'Ensure risk/reward ratio is at least 1:1.5 for each trade',
          'Keep total portfolio risk below 10%',
          'Reduce position sizes during drawdowns',
          'Consider correlation between open positions',
        ],
      },
    };
  }

  // === Helper Methods ===

  private estimatePipValue(symbol: string, price: number): number {
    // Simplified pip value estimation
    if (symbol.includes('JPY')) return 0.01;
    if (symbol === 'XAUUSD') return 0.01;
    return 0.0001;
  }

  private getPositionRecommendation(
    riskPercent: number,
    stopDistancePercent: number,
  ): string {
    if (riskPercent > 3) {
      return 'Risk is HIGH - consider reducing risk percentage';
    }
    if (stopDistancePercent > 2) {
      return 'Wide stop loss - tight stops recommended for better R:R';
    }
    if (riskPercent <= 1) {
      return 'Conservative risk level - good for capital preservation';
    }
    return 'Position size within acceptable parameters';
  }

  private assessViability(
    riskPercent: number,
    riskRewardRatio: number,
    existingRisk?: number,
  ): {
    verdict: 'approve' | 'caution' | 'reject';
    score: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let score = 100;

    // Check risk percent
    if (riskPercent > 5) {
      warnings.push('Stop loss too wide - risk exceeds 5%');
      score -= 40;
    } else if (riskPercent > 2) {
      warnings.push('Consider tighter stop loss');
      score -= 15;
    }

    // Check R:R ratio
    if (riskRewardRatio > 0) {
      if (riskRewardRatio < 1) {
        warnings.push('Risk/Reward below 1:1 - avoid this trade');
        score -= 50;
      } else if (riskRewardRatio < this.MIN_RISK_REWARD_RATIO) {
        warnings.push(`R:R below minimum ${this.MIN_RISK_REWARD_RATIO}`);
        score -= 20;
      }
    }

    // Check portfolio exposure
    if (existingRisk && existingRisk > this.MAX_PORTFOLIO_RISK * 0.6) {
      warnings.push('Adding to already elevated portfolio risk');
      score -= 25;
    }

    let verdict: 'approve' | 'caution' | 'reject' = 'approve';
    if (score < 50) verdict = 'reject';
    else if (score < 75) verdict = 'caution';

    return { verdict, score, warnings };
  }

  private generateSuggestions(
    entry: number,
    sl: number,
    tp: number | undefined,
    rrRatio: number,
  ): string[] {
    const suggestions: string[] = [];
    const riskDistance = Math.abs(entry - sl);

    if (!tp) {
      // Suggest take profit levels
      suggestions.push(
        `Suggested TP (1.5 R:R): ${(entry + riskDistance * 1.5 * (entry > sl ? 1 : -1)).toFixed(5)}`,
      );
      suggestions.push(
        `Suggested TP (2.0 R:R): ${(entry + riskDistance * 2.0 * (entry > sl ? 1 : -1)).toFixed(5)}`,
      );
    } else if (rrRatio < this.MIN_RISK_REWARD_RATIO) {
      const betterTP =
        entry +
        riskDistance * this.MIN_RISK_REWARD_RATIO * (entry > sl ? 1 : -1);
      suggestions.push(
        `Consider TP at ${betterTP.toFixed(5)} for ${this.MIN_RISK_REWARD_RATIO} R:R`,
      );
    }

    return suggestions;
  }

  private getPortfolioRecommendations(
    status: string,
    riskPercent: number,
  ): string[] {
    switch (status) {
      case 'critical':
        return [
          'REDUCE POSITIONS IMMEDIATELY',
          'Close weakest trades to reduce exposure',
          'Do not add new positions until risk is below 7%',
        ];
      case 'high':
        return [
          'Consider reducing some positions',
          'Avoid adding new trades without closing existing ones',
          'Tighten stops on profitable trades',
        ];
      case 'moderate':
        return ['Monitor positions closely', 'Be selective with new trades'];
      default:
        return ['Portfolio risk within acceptable limits'];
    }
  }

  private getDrawdownRecommendations(
    severity: string,
    drawdown: number,
  ): string[] {
    switch (severity) {
      case 'critical':
        return [
          'STOP TRADING - Review your strategy',
          'Reduce position sizes by 50% when resuming',
          'Consider taking a break from live trading',
        ];
      case 'danger':
        return [
          'Reduce trade frequency',
          'Lower risk per trade to 0.5%',
          'Review recent trades for patterns',
        ];
      case 'warning':
        return [
          'Be more selective with entries',
          'Consider reducing position sizes',
        ];
      default:
        return ['Drawdown within normal parameters'];
    }
  }

  /**
   * React to events from other agents
   */
  protected async onEvent(message: AgentMessage): Promise<void> {
    // React to trade events
    if (message.payload?.type === 'trade-opened') {
      this.logger.debug(`Trade opened - could validate against risk rules`);
    }

    // React to market predictions
    if (message.payload?.type === 'market-prediction-generated') {
      this.logger.debug(
        `Market prediction received for ${message.payload.symbol}`,
      );
    }
  }
}
