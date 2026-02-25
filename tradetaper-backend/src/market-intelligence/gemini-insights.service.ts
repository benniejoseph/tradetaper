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
        modelPreference: 'gemini-3-pro-preview', // User requested model
        taskComplexity: 'complex', // Upgrade complexity
        requireJson: true,
        optimizeFor: 'quality', // Optimize for quality
      });

      const text = response.content;

      // robust JSON extraction
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
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

      return {
        traderScore: 0,
        scoreReasoning: userMessage,
        insights: [],
      };
    }
  }
}
