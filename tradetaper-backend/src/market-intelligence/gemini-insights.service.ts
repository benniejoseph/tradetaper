import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Trade } from '../trades/entities/trade.entity';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';

export interface AIInsight {
  type: 'STRENGTH' | 'WEAKNESS' | 'FOCUS_AREA';
  title: string;
  description: string;
  actionableStep?: string;
}

export interface TraderCoachingReport {
  traderScore: number;
  scoreReasoning: string;
  insights: AIInsight[];
}

@Injectable()
export class GeminiInsightsService {
  private readonly logger = new Logger(GeminiInsightsService.name);

  constructor(
    private configService: ConfigService,
    private orchestrator: MultiModelOrchestratorService, // Injection
  ) {}

  private clampScore(score: number): number {
    if (!Number.isFinite(score)) return 50;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private parseReportFromModelOutput(text: string): TraderCoachingReport | null {
    const candidates: string[] = [];
    if (typeof text === 'string' && text.trim().length > 0) {
      candidates.push(text.trim());

      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced?.[1]) {
        candidates.unshift(fenced[1].trim());
      }

      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        candidates.push(text.substring(jsonStart, jsonEnd + 1).trim());
      }
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === 'object') {
          return parsed as TraderCoachingReport;
        }
      } catch {
        // try next candidate
      }
    }

    return null;
  }

  private buildFallbackReport(
    trades: Trade[],
    reason?: string,
  ): TraderCoachingReport {
    const closedTrades = trades.filter(
      (t) => t?.status === 'Closed' && Number.isFinite(Number(t?.profitOrLoss)),
    );

    if (closedTrades.length === 0) {
      return {
        traderScore: 50,
        scoreReasoning:
          reason ||
          'Not enough closed-trade data yet. Add more completed trades for richer AI insights.',
        insights: [
          {
            type: 'FOCUS_AREA',
            title: 'Build Your Dataset',
            description:
              'Log at least 5 completed trades with notes to unlock account-specific coaching.',
            actionableStep:
              'Capture setup reason, mistake made, and lesson learned for each trade.',
          },
        ],
      };
    }

    const wins = closedTrades.filter((t) => Number(t.profitOrLoss || 0) > 0);
    const losses = closedTrades.filter((t) => Number(t.profitOrLoss || 0) < 0);
    const grossProfit = wins.reduce(
      (sum, t) => sum + Number(t.profitOrLoss || 0),
      0,
    );
    const grossLossAbs = Math.abs(
      losses.reduce((sum, t) => sum + Number(t.profitOrLoss || 0), 0),
    );
    const winRate = (wins.length / closedTrades.length) * 100;
    const profitFactor = grossLossAbs > 0 ? grossProfit / grossLossAbs : 0;
    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLossAbs / losses.length : 0;

    const score = this.clampScore(winRate * 0.65 + Math.min(profitFactor, 2) * 17.5);

    const strengthDescription =
      winRate >= 50
        ? `Your win rate is ${winRate.toFixed(1)}% across ${closedTrades.length} closed trades, showing solid setup selection.`
        : `You are consistently closing trades and collecting execution data (${closedTrades.length} closed trades), which is essential for improvement.`;

    const weaknessDescription =
      avgLoss > 0 && avgLoss > avgWin
        ? `Average loss (${avgLoss.toFixed(2)}) is larger than average win (${avgWin.toFixed(2)}), which drags expectancy.`
        : `Loss clusters still appear in your recent sample. Focus on reducing consecutive emotional trades.`;

    const focusStep =
      avgLoss > avgWin
        ? 'Reduce position size after one loss and require one A+ confirmation before the next entry.'
        : 'Journal one repeatable edge and execute only that edge for your next 10 trades.';

    const fallbackReason = reason
      ? ` (${reason})`
      : '';

    return {
      traderScore: score,
      scoreReasoning: `Using deterministic coaching from recent closed trades${fallbackReason}. Win rate ${winRate.toFixed(1)}%, profit factor ${profitFactor.toFixed(2)}.`,
      insights: [
        {
          type: 'STRENGTH',
          title: 'Execution Consistency',
          description: strengthDescription,
          actionableStep:
            'Keep tagging your best setups so this edge stays measurable.',
        },
        {
          type: 'WEAKNESS',
          title: 'Risk Asymmetry',
          description: weaknessDescription,
          actionableStep:
            'Enforce a hard max loss per trade and stop trading after two consecutive losses.',
        },
        {
          type: 'FOCUS_AREA',
          title: 'Next 10 Trades Plan',
          description:
            'Use a single repeatable playbook and review outcomes daily.',
          actionableStep: focusStep,
        },
      ],
    };
  }

  async analyzeTradePatterns(trades: Trade[]): Promise<TraderCoachingReport> {
    if (trades.length < 5) {
      return {
        traderScore: 50,
        scoreReasoning: 'Insufficient data (need at least 5 trades).',
        insights: [
          {
            type: 'FOCUS_AREA',
            title: 'Gather Data',
            description: 'Log more trades to unlock AI insights.',
          },
        ],
      };
    }

    // Limit to last 50 trades to respect token limits and relevance
    const recentTrades = trades.slice(0, 100).map((t) => ({
      symbol: t.symbol,
      side: t.side,
      pnl: t.profitOrLoss,
      time: t.openTime,
      concept: t.ictConcept,
      session: t.session,
      mistakes: t.mistakesMade,
      lessons: t.lessonsLearned,
    }));

    const prompt = `
      You are an elite ICT (Inner Circle Trader) Trading Psychologist and Mentor.
      Your goal is to mold the student into a professional, profitable trader by analyzing their trade history.

      DATA TO ANALYZE (Recent 100 Trades):
      ${JSON.stringify(recentTrades)}

      ANALYSIS GUIDELINES:
      1. **ICT Concepts**: specific focus on adherence to Killzones (London/NY), PD Arrays (Order Blocks, FVG), and Market Structure shifts.
      2. **Psychology**: deeply analyze "mistakes" vs "lessons" to gauge self-awareness and improvement.
      3. **Risk**: Evaluate PnL distribution. Are winners > losers? Are losses clustered (tilt)?

      OUTPUT REQUIREMENTS:
      1. **Trader Score (0-100)**: 
         - < 50: Gambler/Tilt prone.
         - 50-70: Developing Student.
         - 70-90: Profitable/Consistent.
         - > 90: ICT Charter Member Status.
      2. **Insights**:
         - **STRENGTH**: Identify the ONE thing they are mastering (e.g., "High Winrate in NY Killzone", "Excellent reaction to H4 Order Blocks").
         - **WEAKNESS**: Identify the ONE leak draining their account (e.g., "Overtrading after 11AM EST", "Fading trends without MSS"). BE SPECIFIC.
         - **FOCUS AREA**: A concrete technical or psychological homework assignment (e.g., "Only filter trades at Equilibrium or Discount this week", "Stop trading after 2 consecutive losses").

      Submit response as strictly valid JSON:
      {
        "traderScore": number,
        "scoreReasoning": "Detailed explanation of the score, referencing specific ICT habits observed.",
        "insights": [
          { 
            "type": "STRENGTH", 
            "title": "Short summarization", 
            "description": "Detailed analysis of why this is a strength, citing trade behavior.", 
            "actionableStep": "How to double down on this." 
          },
          { 
            "type": "WEAKNESS", 
            "title": "Short summarization", 
            "description": "Detailed analysis of the leak. Be tough but fair.", 
            "actionableStep": "Specific rule to fix this." 
          },
          { 
            "type": "FOCUS_AREA", 
            "title": "Short summarization", 
            "description": "The specific assignment for the week.", 
            "actionableStep": "The concrete action to take." 
          }
        ]
      }
    `;

    try {
      const response = await this.orchestrator.complete({
        prompt: prompt,
        modelPreference: 'gemini-1.5-pro',
        taskComplexity: 'complex', // Upgrade complexity
        requireJson: true,
        optimizeFor: 'quality', // Optimize for quality
      });

      const text = response.content;
      const parsed = this.parseReportFromModelOutput(text);
      if (parsed) {
        return {
          traderScore: this.clampScore(Number(parsed.traderScore)),
          scoreReasoning:
            parsed.scoreReasoning?.trim() ||
            'AI generated a partial response. Showing cleaned output.',
          insights:
            Array.isArray(parsed.insights) && parsed.insights.length > 0
              ? parsed.insights.slice(0, 3).map((insight) => ({
                  type:
                    insight?.type === 'STRENGTH' ||
                    insight?.type === 'WEAKNESS' ||
                    insight?.type === 'FOCUS_AREA'
                      ? insight.type
                      : 'FOCUS_AREA',
                  title: insight?.title || 'Trading Insight',
                  description:
                    insight?.description ||
                    'Keep logging high-quality trades to improve analysis depth.',
                  actionableStep: insight?.actionableStep,
                }))
              : this.buildFallbackReport(trades).insights,
        };
      }

      throw new Error('No valid JSON object found in response');
    } catch (error) {
      this.logger.error(`AI Analysis failed: ${error.message}`);

      // Determine user-friendly error message
      let userMessage = 'AI Analysis Failed';
      if (error.message.includes('429')) {
        userMessage = 'AI Usage Limit Exceeded (Please try again later)';
      } else if (error.message.includes('404')) {
        userMessage = 'AI Model Unavailable';
      }
      return this.buildFallbackReport(trades, userMessage);
    }
  }
}
