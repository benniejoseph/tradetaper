// src/notes/gemini-vision.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';

@Injectable()
export class GeminiVisionService {
  private readonly logger = new Logger(GeminiVisionService.name);

  constructor(private readonly orchestrator: MultiModelOrchestratorService) {}

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<any> {
    this.logger.log('Analyzing image with MultiModel Orchestrator (Vision)...');

    const base64Image = imageBuffer.toString('base64');
    // Orchestrator expects base64 string or data URI
    const imageInput = `data:image/jpeg;base64,${base64Image}`;

    try {
      const response = await this.orchestrator.complete({
        prompt,
        images: [imageInput],
        modelPreference: 'gemini-1.5-flash', // Vision capable
        taskComplexity: 'complex',
        requireJson: true,
      });

      const text = response.content;
      this.logger.log(`Vision Raw Response: ${text}`);

      try {
        // Clean markdown
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (jsonError) {
        this.logger.error(`Failed to parse Vision JSON: ${jsonError.message}`);
        // Fallback extraction
        const extractedData: any = {};
        const regex = /"(symbol|direction|entryPrice|exitPrice|stopLoss|takeProfit)":\s*"?([^",]+)"?/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          extractedData[match[1]] = match[2];
        }
        return extractedData;
      }
    } catch (error) {
      this.logger.error(`Error in Vision Analysis: ${error.message}`);
      throw new Error(`Failed to analyze chart: ${error.message}`);
    }
  }

  async analyzeChartImage(imageBuffer: Buffer): Promise<any> {
    const prompt = `
    Analyze this trading chart image. Identify the following:
    - Trading Instrument (e.g., EUR/USD, BTC/USD, Apple Stock)
    - Timeframe (e.g., 1-hour, Daily, 5-minute)
    - Entry Price (if visible)
    - Exit Price (if visible)
    - Stop Loss (if visible)
    - Take Profit (if visible)
    - Date and Time of the trade (if visible)
    - Key chart patterns (e.g., Head and Shoulders, Double Top/Bottom, Trendlines)
    - Relevant indicators and their values (e.g., RSI, MACD, Moving Averages)
    - Overall market sentiment (bullish, bearish, neutral)
    - Any other significant observations.

    Format the output as a JSON object with clear keys for each piece of information. If a piece of information is not visible or applicable, use 'N/A'.
    Example:
    {
      "instrument": "EUR/USD",
      "timeframe": "1-hour",
      "entryPrice": "1.0850",
      "exitPrice": "1.0920",
      "stopLoss": "1.0820",
      "takeProfit": "1.0950",
      "tradeDate": "2023-10-26",
      "tradeTime": "14:30 UTC",
      "chartPatterns": ["Ascending Triangle"],
      "indicators": [{"name": "RSI", "value": "70"}],
      "sentiment": "Bullish",
      "observations": "Price broke above resistance after a period of consolidation."
    }
    `;
    return this.analyzeImage(imageBuffer, prompt);
  }
}
