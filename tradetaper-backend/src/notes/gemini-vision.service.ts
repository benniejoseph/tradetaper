// src/notes/gemini-vision.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { extname } from 'path';
// import { get_encoding } from 'tiktoken';

@Injectable()
export class GeminiVisionService {
  private readonly logger = new Logger(GeminiVisionService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any; // GenerativeModel type

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    this.logger.log('Analyzing image with Gemini Pro Vision...');

    const base64Image = imageBuffer.toString('base64');

    const parts = [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
    ];

    try {
      const result = await this.model.generateContent({
        contents: [{ parts }],
      });
      const response = result.response;
      const text = response.text();
      this.logger.log(`Gemini Vision Raw Response: ${text}`);

      // Attempt to parse JSON, handle cases where AI might not return perfect JSON
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (jsonError) {
        this.logger.error(
          `Failed to parse Gemini Vision response as JSON: ${jsonError.message}. Raw text: ${text}`,
        );
        // Fallback: try to extract key-value pairs if not perfect JSON
        const extractedData: any = {};
        const regex =
          /"(symbol|direction|entryPrice|exitPrice|stopLoss|takeProfit)":\s*"?([^",]+)"?/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          extractedData[match[1]] = match[2];
        }
        return extractedData;
      }
    } catch (error) {
      this.logger.error(
        `Error calling Gemini Vision API: ${error.message}`,
        error.stack,
      );
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
