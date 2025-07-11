import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CreatePredictionDto } from '../predictive-trades/dto/create-prediction.dto';
import { PredictionResponse } from '../predictive-trades/predictive-trades.service';

@Injectable()
export class GeminiPredictionService {
  private readonly logger = new Logger(GeminiPredictionService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generatePrediction(
    tradeSetup: CreatePredictionDto,
  ): Promise<PredictionResponse> {
    this.logger.log(`Generating prediction with Gemini for: ${JSON.stringify(tradeSetup)}`);

    const prompt = this.createPrompt(tradeSetup);

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      this.logger.debug(`Raw response from Gemini: ${text}`);

      if (text === null) {
        this.logger.error('Gemini API returned null text');
        throw new Error('Gemini API returned null text');
      }

      try {
        // First, find the match
        const match = text.match(/\{[\s\S]*\}/);

        // Check if a match was found
        if (match && match[0]) {
          const parsed = JSON.parse(match[0]);
          this.logger.log(`Parsed prediction: ${JSON.stringify(parsed)}`);
          return parsed;
        } else {
          this.logger.error('Could not find a valid JSON object in the response.');
          this.logger.error(`Response text: ${text}`);
          throw new Error('Could not find a valid JSON object in the response.');
        }
      } catch (error) {
        this.logger.error(`Error parsing JSON: ${error.message}`, error.stack);
        throw new Error(`Failed to parse JSON: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Error calling Gemini API for prediction: ${error.message}`, error.stack);
      throw new Error(`Failed to generate prediction: ${error.message}`);
    }
  }

  private createPrompt(tradeSetup: CreatePredictionDto): string {
    return `
      You are a sophisticated trading analysis AI.
      Based on the following trade setup, provide a prediction about its potential outcome.

      Trade Setup:
      - Instrument: ${tradeSetup.instrument}
      - Direction: ${tradeSetup.direction}
      - Entry Price: ${tradeSetup.entryPrice}
      - Stop Loss: ${tradeSetup.stopLoss}
      - Take Profit: ${tradeSetup.takeProfit}
      - Expected Duration (hours): ${tradeSetup.expectedDurationHours || 'Not specified'}

      Analyze the risk/reward ratio, the context of the instrument, and general market principles.

      Return your prediction ONLY in the following JSON format. Do not include any other text, just the raw JSON:
      {
        "probabilityOfProfit": <a number between 0 and 1>,
        "expectedPnL": { "min": <number>, "max": <number> },
        "predictedOutcome": <"win", "loss", or "neutral">,
        "confidence": <a number between 0 and 1 representing your confidence in the prediction>
      }
    `;
  }
} 