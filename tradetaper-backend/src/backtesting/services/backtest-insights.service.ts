import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BacktestStats, DimensionStats } from '../backtesting.service';

export interface BacktestInsightsRequest {
  stats: BacktestStats;
  dimensionAnalysis: {
    bySymbol: DimensionStats[];
    bySession: DimensionStats[];
    byTimeframe: DimensionStats[];
    byKillZone: DimensionStats[];
    byDayOfWeek: DimensionStats[];
    bySetup: DimensionStats[];
  };
  tradeCount: number;
  dateRange: {
    start: Date;
    end: Date;
  } | null;
}

@Injectable()
export class BacktestInsightsService {
  private readonly logger = new Logger(BacktestInsightsService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not found - AI insights will be unavailable',
      );
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async *generateInsights(
    data: BacktestInsightsRequest,
  ): AsyncGenerator<string> {
    if (!this.genAI) {
      yield 'AI insights are currently unavailable. Please configure GEMINI_API_KEY.';
      return;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const prompt = this.buildPrompt(data);

      this.logger.log('Generating AI insights for backtest data');

      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }

      this.logger.log('AI insights generation complete');
    } catch (error) {
      this.logger.error(`Failed to generate insights: ${error.message}`);
      yield `\n\nError generating insights: ${error.message}`;
    }
  }

  private buildPrompt(data: BacktestInsightsRequest): string {
    const { stats, dimensionAnalysis, tradeCount, dateRange } = data;

    // Find best and worst performing dimensions
    const bestSymbol = dimensionAnalysis.bySymbol[0];
    const worstSymbol =
      dimensionAnalysis.bySymbol[dimensionAnalysis.bySymbol.length - 1];
    const bestSession = dimensionAnalysis.bySession[0];
    const bestTimeframe = dimensionAnalysis.byTimeframe[0];
    const bestSetup = dimensionAnalysis.bySetup[0];

    // Identify areas needing improvement
    const weakAreas: string[] = [];
    if (stats.winRate < 50) weakAreas.push('win rate');
    if (stats.profitFactor < 1.5) weakAreas.push('profit factor');
    if (stats.averageRMultiple < 1.5) weakAreas.push('risk-reward ratio');
    if (stats.ruleFollowingRate < 80)
      weakAreas.push('discipline/rule following');
    if (stats.averageChecklistScore < 70)
      weakAreas.push('pre-trade checklist completion');

    const prompt = `You are an expert ICT (Inner Circle Trader) trading coach analyzing backtesting results. Provide actionable insights and recommendations based on this data.

**BACKTEST OVERVIEW**
- Total Trades: ${tradeCount}
- Date Range: ${dateRange ? `${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}` : 'N/A'}
- Win Rate: ${stats.winRate.toFixed(2)}%
- Profit Factor: ${stats.profitFactor.toFixed(2)}
- Total P&L: $${stats.totalPnlDollars.toFixed(2)}
- Average R-Multiple: ${stats.averageRMultiple.toFixed(2)}R

**PERFORMANCE METRICS**
- Wins: ${stats.wins} | Losses: ${stats.losses} | Breakevens: ${stats.breakevens}
- Average Win: $${stats.averageWin.toFixed(2)}
- Average Loss: $${stats.averageLoss.toFixed(2)}
- Max Consecutive Wins: ${stats.maxConsecutiveWins}
- Max Consecutive Losses: ${stats.maxConsecutiveLosses}

**DISCIPLINE & EXECUTION**
- Rule Following Rate: ${stats.ruleFollowingRate.toFixed(2)}%
- Average Entry Quality: ${stats.averageEntryQuality.toFixed(2)}/10
- Average Checklist Score: ${stats.averageChecklistScore.toFixed(2)}%

**DIMENSION ANALYSIS**
${bestSymbol ? `- Best Symbol: ${bestSymbol.value} (${bestSymbol.winRate.toFixed(1)}% win rate, ${bestSymbol.trades} trades)` : ''}
${worstSymbol ? `- Worst Symbol: ${worstSymbol.value} (${worstSymbol.winRate.toFixed(1)}% win rate, ${worstSymbol.trades} trades)` : ''}
${bestSession ? `- Best Session: ${bestSession.value} (${bestSession.winRate.toFixed(1)}% win rate, ${bestSession.trades} trades)` : ''}
${bestTimeframe ? `- Best Timeframe: ${bestTimeframe.value} (${bestTimeframe.winRate.toFixed(1)}% win rate, ${bestTimeframe.trades} trades)` : ''}
${bestSetup ? `- Best Setup: ${bestSetup.value} (${bestSetup.winRate.toFixed(1)}% win rate, ${bestSetup.trades} trades)` : ''}

**AREAS NEEDING IMPROVEMENT**
${weakAreas.length > 0 ? weakAreas.map((area, i) => `${i + 1}. ${area}`).join('\n') : 'Overall strong performance across all areas'}

**YOUR TASK:**
Provide a comprehensive analysis with the following sections:

1. **Overall Assessment** (2-3 sentences)
   - Is this strategy profitable and tradeable?
   - What's the overall quality of execution?

2. **Key Strengths** (3-5 bullet points)
   - What's working well?
   - Which setups/sessions/symbols should be prioritized?

3. **Critical Weaknesses** (3-5 bullet points)
   - What needs immediate attention?
   - Which setups/sessions/symbols should be avoided or refined?

4. **ICT-Specific Recommendations** (5-7 specific actions)
   - Focus on ICT concepts: kill zones, order blocks, FVGs, premium/discount, etc.
   - Provide concrete, actionable advice
   - Prioritize high-impact improvements

5. **Next Steps** (3 bullet points)
   - Immediate actions to take
   - Focus areas for next backtest session

Keep your response focused, practical, and specific to ICT concepts. Use a professional yet encouraging tone.`;

    return prompt;
  }
}
