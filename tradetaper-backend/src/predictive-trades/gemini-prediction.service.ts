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
      const response = result.response;
      const text = response.text();
      this.logger.log(`Gemini Raw Prediction Response: ${text}`);
      return this.parsePredictionResponse(text);
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

  private parsePredictionResponse(text: string): PredictionResponse {
    try {
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      // Basic validation
      if (
        typeof parsed.probabilityOfProfit === 'number' &&
        typeof parsed.confidence === 'number' &&
        ['win', 'loss', 'neutral'].includes(parsed.predictedOutcome)
      ) {
        return parsed;
      }
      throw new Error('Parsed JSON does not match expected format.');
    } catch (error) {
      this.logger.error(`Failed to parse prediction response: ${error.message}. Raw text: ${text}`);
      // Return a neutral/error response
      return {
        probabilityOfProfit: 0.5,
        expectedPnL: { min: 0, max: 0 },
        predictedOutcome: 'neutral',
        confidence: 0,
      };
    }
  }
} 