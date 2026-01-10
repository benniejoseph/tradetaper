import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Trade } from '../trades/entities/trade.entity';

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
  private geminiPro: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured. AI Insights will be disabled.');
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  async analyzeTradePatterns(trades: Trade[]): Promise<TraderCoachingReport> {
    if (!this.geminiPro || trades.length < 5) {
      // Return a placeholder report if not enough data or no API key
      return {
        traderScore: 50,
        scoreReasoning: "Insufficient data (need at least 5 trades) or AI service unavailable.",
        insights: [
            { type: 'FOCUS_AREA', title: 'Gather Data', description: 'Log more trades to unlock AI insights.' }
        ]
      };
    }

    // Limit to last 50 trades to respect token limits and relevance
    const recentTrades = trades.slice(0, 50).map(t => ({
      symbol: t.symbol,
      side: t.side,
      pnl: t.profitOrLoss,
      time: t.openTime,
      concept: t.ictConcept,
      session: t.session,
      mistakes: t.mistakesMade,
      lessons: t.lessonsLearned
    }));

    const prompt = `
      You are an expert trading psychology coach and analyst.
      Analyze the following recent trading history (JSON format):
      ${JSON.stringify(recentTrades)}

      Your task:
      1. Calculate a "Trader Score" (0-100) based on consistency, risk management (implied by PnL distribution), and learning (mistakes vs lessons).
      2. Identify 3 key patterns:
         - One clear STRENGTH (what they do well).
         - One clear WEAKNESS (a leak to fix).
         - One FOCUS AREA (an actionable step for next week).
      
      Return ONLY valid JSON in this specific format:
      {
        "traderScore": 75,
        "scoreReasoning": "Brief explanation of the score...",
        "insights": [
          { "type": "STRENGTH", "title": "Great Win Rate on Gold", "description": "...", "actionableStep": "..." },
          { "type": "WEAKNESS", "title": "Overtrading on Mondays", "description": "...", "actionableStep": "..." },
          { "type": "FOCUS_AREA", "title": "Refine Stop Losses", "description": "...", "actionableStep": "..." }
        ]
      }
    `;

    try {
      const result = await this.geminiPro.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean potential markdown blocks
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);

    } catch (error) {
      this.logger.error(`Gemini analysis failed: ${error.message}`);
      return {
          traderScore: 0,
          scoreReasoning: "AI Analysis Failed",
          insights: []
      };
    }
  }
}
