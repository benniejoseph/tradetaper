import { Injectable, Logger } from '@nestjs/common';
import { CotDataService } from './cot-data.service';
import { MarketDataAggregatorService } from './market-data-aggregator.service';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { CotDataPoint } from './entities/cot-weekly-report.entity';

export interface CotAiSummary {
  symbol: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'Exhausted' | 'Trap';
  biasRating: number; // 0-100
  smartMoneyPositioning: string;
  retailDivergence: string;
  laggingDataContext: string; // Discussing Wednesday-Friday price action vs Tuesday COT
  predictedImpact: string;
  confidence: number;
}

@Injectable()
export class CotAnalysisService {
  private readonly logger = new Logger(CotAnalysisService.name);

  constructor(
    private readonly cotDataService: CotDataService,
    private readonly marketDataAggregator: MarketDataAggregatorService,
    private readonly orchestrator: MultiModelOrchestratorService,
  ) {}

  /**
   * Generates a comprehensive AI analysis bridging the lagging COT data with real-time price action.
   */
  async generateCotAiSummary(symbol: string): Promise<CotAiSummary | null> {
    try {
      // 1. Fetch 12-weeks of historical COT data to show trends rather than just a single snapshot
      const cotHistory = await this.cotDataService.getCotHistory(symbol, 12);
      if (cotHistory.length === 0) {
        this.logger.warn(`No COT history available to analyze for ${symbol}`);
        return null;
      }

      // 2. Fetch live quotes to identify divergence since Tuesday's reporting
      const liveQuote = await this.marketDataAggregator.getLiveQuote(symbol);

      return await this.generateAiPrompt(symbol, cotHistory, liveQuote);
    } catch (err) {
      this.logger.error(`Error generating COT AI Summary for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async generateAiPrompt(
    symbol: string,
    history: CotDataPoint[],
    liveQuote: any,
  ): Promise<CotAiSummary | null> {
    const latestCot = history[0];
    const previousCot = history[1]; // To calculate weekly delta

    const prompt = `
You are a senior hedge fund macro-strategist analyzing the weekly Commitment of Traders (COT) report.
Your goal is to identify extreme positioning, retail vs. smart money divergence, and price traps.

ANALYZE THE FOLLOWING ASSET: ${symbol}

COT REPORT DATA (As of ${latestCot.date.toISOString()}):
- Net Smart Money (Non-Commercial / Leveraged): ${latestCot.netNonCommercial} contracts
- Net Retail (Non-Reportable): ${latestCot.netNonReportable} contracts
- Open Interest: ${latestCot.openInterest}
- Delta from Previous Week Smart Money: ${previousCot ? latestCot.netNonCommercial - previousCot.netNonCommercial : 'N/A'}

LIVE MARKET DATA:
- Current Price: $${liveQuote ? liveQuote.bid : 'Data Unavailable'}
- Today's Change Percent: ${liveQuote ? liveQuote.changePercent : 'N/A'}%

CRITICAL EDGE CASE RULES:
1. THE LAGGING DATA REALITY: COT data is measured on Tuesday but released Friday. You MUST compare the "Live Market Price" to determine if Wednesday-Friday price action confirms or invalidates Tuesday's positioning. If Smart Money was heavily short on Tuesday, but the Live Price is surging aggressively green, this is a potential "Trap" or short squeeze.
2. RETAIL DIVERGENCE: Generally, Retail (Non-reportable) is wrong at extremes. If Retail is heavily long and Smart Money is heavily short, the bias should favor Smart Money.

Return JSON ONLY matching this schema:
{
  "symbol": "${symbol}",
  "sentiment": "Bullish|Bearish|Neutral|Exhausted|Trap",
  "biasRating": number (0-100 indicating strength of bias),
  "smartMoneyPositioning": "string (Short paragraph analyzing Hedge Fund positioning)",
  "retailDivergence": "string (Short paragraph analyzing if Retail is trapped)",
  "laggingDataContext": "string (Crucial paragraph comparing Tuesday's COT net-positioning vs Current Live Pricing momentum)",
  "predictedImpact": "string (Actionable short-term outlook based on this fusion)",
  "confidence": number (0-100)
}
    `;

    try {
      const response = await this.orchestrator.complete({
        prompt,
        modelPreference: 'gemini-2.0-flash',
        taskComplexity: 'complex',
        requireJson: true,
        optimizeFor: 'quality',
      });

      const parsed = typeof response.content === 'string' 
        ? JSON.parse(response.content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, ''))
        : response.content;

      // Ensure mapping adheres to the schema
      return {
        symbol,
        sentiment: parsed.sentiment || 'Neutral',
        biasRating: parsed.biasRating || 50,
        smartMoneyPositioning: parsed.smartMoneyPositioning || 'No distinct smart money positioning identified.',
        retailDivergence: parsed.retailDivergence || 'No significant retail divergence spotted.',
        laggingDataContext: parsed.laggingDataContext || 'Live price action aligns with the reporting period.',
        predictedImpact: parsed.predictedImpact || 'Neutral short-term outlook.',
        confidence: parsed.confidence || 50,
      };
    } catch (error) {
      this.logger.error(`AI Orchestrator failed to parse COT summary for ${symbol}: ${error.message}`);
      return null;
    }
  }
}
