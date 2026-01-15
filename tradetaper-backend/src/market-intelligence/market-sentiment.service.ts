import { Injectable, Logger } from '@nestjs/common';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { MarketDataAggregatorService } from './market-data-aggregator.service';

export interface AssetSentiment {
  symbol: string;
  sentimentScore: number; // 0-100 (0=Bearish, 100=Bullish)
  sentiment: 'bullish' | 'bearish' | 'neutral';
  rationale: string;
  keyLevels: number[];
  trend: 'up' | 'down' | 'ranging';
}

export interface MarketSentimentReport {
  timestamp: string;
  globalSentiment: {
    score: number;
    description: string; // "Risk-On", "Risk-Off", "Uncertain"
    summary: string;
  };
  assets: AssetSentiment[];
}

@Injectable()
export class MarketSentimentService {
  private readonly logger = new Logger(MarketSentimentService.name);

  constructor(
    private readonly orchestrator: MultiModelOrchestratorService,
    private readonly dataAggregator: MarketDataAggregatorService,
  ) {}

  async generateSentimentReport(): Promise<MarketSentimentReport> {
    const assets = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'AUDUSD', 'NAS100'];
    
    // 1. Fetch Real Data Context (Price, recent change)
    // We can use dataAggregator to get prices if available.
    // For now, prompt LLM to use its internal knowledge + provided price (if we have it).
    // Or just ask LLM for "current sentiment based on recent news/events" (Agents have tools?).
    // If Orchestrator has tools, it can fetch search.
    
    // Simplification: We prompt LLM to act as analyst.
    
    const prompt = `
      You are an expert Chief Market Analyst. Provide a comprehensive sentiment report for the following assets:
      ${assets.join(', ')}.

      Analyze the current global macro environment (Interest rates, Geopolitics, Economic Data).
      For each asset, determine the sentiment/bias.

      Return a JSON object with this structure:
      {
        "globalSentiment": {
          "score": number (0-100, 100=Max Risk On),
          "description": string (e.g. "Risk-Off driven by inflation fears"),
          "summary": string (2 sentences)
        },
        "assets": [
           {
             "symbol": string,
             "sentimentScore": number (0-100),
             "sentiment": "bullish" | "bearish" | "neutral",
             "rationale": string (concise, max 20 words),
             "keyLevels": number[] (nearest support/resistance),
             "trend": "up" | "down" | "ranging"
           }
        ]
      }
    `;

    try {
      const response = await this.orchestrator.complete({
        prompt,
        taskComplexity: 'medium', // Use stronger model for analysis
        requireJson: true
      });

      const jsonStr = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);

      return {
        timestamp: new Date().toISOString(),
        globalSentiment: data.globalSentiment,
        assets: data.assets
      };

    } catch (error) {
       this.logger.error('Failed to generate sentiment report', error);
       // Return Mock Fallback
       return this.getMockReport();
    }
  }

  private getMockReport(): MarketSentimentReport {
    return {
      timestamp: new Date().toISOString(),
      globalSentiment: { score: 50, description: 'Neutral', summary: 'Market awaits key data.' },
      assets: [
        { symbol: 'XAUUSD', sentimentScore: 55, sentiment: 'neutral', rationale: 'Consolidating below 2050', keyLevels: [2040, 2060], trend: 'ranging' },
        { symbol: 'EURUSD', sentimentScore: 40, sentiment: 'bearish', rationale: 'Strong dollar pressure', keyLevels: [1.0800, 1.0900], trend: 'down' },
        // ... extend if needed
      ]
    };
  }
}
