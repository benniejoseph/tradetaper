import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreatePredictionDto } from '../predictive-trades/dto/create-prediction.dto';
import { PredictionResponse } from '../predictive-trades/predictive-trades.service';
import * as crypto from 'crypto';

export interface BatchPredictionResult {
  symbol: string;
  prediction: PredictionResponse | null;
  error?: string;
  fromCache: boolean;
}

@Injectable()
export class GeminiPredictionService {
  private readonly logger = new Logger(GeminiPredictionService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private cacheHits = 0;
  private cacheMisses = 0;
  private batchCalls = 0;
  private singleCalls = 0;

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generatePrediction(
    tradeSetup: CreatePredictionDto,
  ): Promise<PredictionResponse> {
    const prompt = this.createPrompt(tradeSetup);
    const cacheKey = this.generateCacheKey(tradeSetup);

    // Check cache first
    if (this.cacheManager) {
      const cached = await this.cacheManager.get<PredictionResponse>(cacheKey);
      if (cached) {
        this.cacheHits++;
        this.logger.debug(`Cache HIT for ${tradeSetup.instrument} (${this.getCacheStats()})`);
        return cached;
      }
    }
    this.cacheMisses++;
    this.singleCalls++;

    this.logger.log(`Generating prediction for: ${tradeSetup.instrument}`);

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      if (text === null) {
        throw new Error('Gemini API returned null text');
      }

      const match = text.match(/\{[\s\S]*\}/);
      if (!match?.[0]) {
        throw new Error('Could not find valid JSON in response');
      }

      const parsed = JSON.parse(match[0]) as PredictionResponse;

      // Cache the result (15 min TTL for predictions)
      if (this.cacheManager) {
        await this.cacheManager.set(cacheKey, parsed, 900000);
        this.logger.debug(`Cached prediction for ${tradeSetup.instrument}`);
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Prediction failed: ${error.message}`, error.stack);
      throw new Error(`Failed to generate prediction: ${error.message}`);
    }
  }

  /**
   * Generate predictions for multiple symbols in a single API call.
   * 30-50% cheaper than calling individually.
   */
  async generateBatchPrediction(
    setups: CreatePredictionDto[],
  ): Promise<BatchPredictionResult[]> {
    if (setups.length === 0) return [];
    if (setups.length === 1) {
      const pred = await this.generatePrediction(setups[0]);
      return [{ symbol: setups[0].instrument, prediction: pred, fromCache: false }];
    }

    this.batchCalls++;
    this.logger.log(`Batch prediction for ${setups.length} symbols`);

    // Check cache for each setup
    const results: BatchPredictionResult[] = [];
    const uncached: { setup: CreatePredictionDto; index: number }[] = [];

    for (let i = 0; i < setups.length; i++) {
      const setup = setups[i];
      const cacheKey = this.generateCacheKey(setup);

      if (this.cacheManager) {
        const cached = await this.cacheManager.get<PredictionResponse>(cacheKey);
        if (cached) {
          this.cacheHits++;
          results[i] = { symbol: setup.instrument, prediction: cached, fromCache: true };
          continue;
        }
      }
      this.cacheMisses++;
      uncached.push({ setup, index: i });
    }

    // If all cached, return early
    if (uncached.length === 0) {
      this.logger.debug(`All ${setups.length} symbols served from cache`);
      return results;
    }

    // Generate batch prompt for uncached items
    const batchPrompt = this.createBatchPrompt(uncached.map(u => u.setup));

    try {
      const result = await this.model.generateContent(batchPrompt);
      const text = result.response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      // Parse JSON array from response
      const match = text.match(/\[[\s\S]*\]/);
      if (!match?.[0]) {
        // Fallback: try single object
        const singleMatch = text.match(/\{[\s\S]*\}/);
        if (singleMatch && uncached.length === 1) {
          const parsed = JSON.parse(singleMatch[0]) as PredictionResponse;
          results[uncached[0].index] = {
            symbol: uncached[0].setup.instrument,
            prediction: parsed,
            fromCache: false,
          };
          if (this.cacheManager) {
            await this.cacheManager.set(this.generateCacheKey(uncached[0].setup), parsed, 900000);
          }
          return results;
        }
        throw new Error('Could not parse batch response');
      }

      const parsed = JSON.parse(match[0]) as Array<PredictionResponse & { symbol?: string }>;

      // Map predictions back to results
      for (let i = 0; i < uncached.length; i++) {
        const { setup, index } = uncached[i];
        const pred = parsed[i] || parsed.find(p => 
          p.symbol?.toLowerCase() === setup.instrument.toLowerCase()
        );

        if (pred) {
          results[index] = {
            symbol: setup.instrument,
            prediction: {
              probabilityOfProfit: pred.probabilityOfProfit,
              expectedPnL: pred.expectedPnL,
              predictedOutcome: pred.predictedOutcome,
              confidence: pred.confidence,
            },
            fromCache: false,
          };

          // Cache individual results
          if (this.cacheManager) {
            await this.cacheManager.set(this.generateCacheKey(setup), results[index].prediction, 900000);
          }
        } else {
          results[index] = {
            symbol: setup.instrument,
            prediction: null,
            error: 'Prediction not found in batch response',
            fromCache: false,
          };
        }
      }

      this.logger.log(`Batch complete: ${uncached.length} API calls saved`);
      return results;
    } catch (error) {
      this.logger.error(`Batch prediction failed: ${error.message}`);
      
      // Fill remaining with errors
      for (const { setup, index } of uncached) {
        if (!results[index]) {
          results[index] = {
            symbol: setup.instrument,
            prediction: null,
            error: error.message,
            fromCache: false,
          };
        }
      }
      return results;
    }
  }

  private generateCacheKey(setup: CreatePredictionDto): string {
    const normalized = `${setup.instrument}:${setup.direction}:${setup.entryPrice}:${setup.stopLoss}:${setup.takeProfit}`;
    const hash = crypto.createHash('md5').update(normalized).digest('hex');
    return `gemini-pred:${hash}`;
  }

  private getCacheStats(): string {
    const total = this.cacheHits + this.cacheMisses;
    const rate = total > 0 ? ((this.cacheHits / total) * 100).toFixed(0) : 0;
    return `hits=${this.cacheHits}, misses=${this.cacheMisses}, rate=${rate}%`;
  }

  getCacheMetrics(): { hits: number; misses: number; rate: number; batchCalls: number; singleCalls: number } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      rate: total > 0 ? (this.cacheHits / total) * 100 : 0,
      batchCalls: this.batchCalls,
      singleCalls: this.singleCalls,
    };
  }

  private createPrompt(tradeSetup: CreatePredictionDto): string {
    return `Predict trade outcome:
Instrument: ${tradeSetup.instrument}
Direction: ${tradeSetup.direction}
Entry: ${tradeSetup.entryPrice}, SL: ${tradeSetup.stopLoss}, TP: ${tradeSetup.takeProfit}
Duration: ${tradeSetup.expectedDurationHours || 'N/A'}h

JSON only: {"probabilityOfProfit": 0-1, "expectedPnL": {"min": N, "max": N}, "predictedOutcome": "win|loss|neutral", "confidence": 0-1}`;
  }

  private createBatchPrompt(setups: CreatePredictionDto[]): string {
    const setupsText = setups.map((s, i) => 
      `${i + 1}. ${s.instrument} ${s.direction} Entry:${s.entryPrice} SL:${s.stopLoss} TP:${s.takeProfit}`
    ).join('\n');

    return `Predict outcomes for these ${setups.length} trades:
${setupsText}

Return JSON array with one object per trade:
[{"symbol":"X","probabilityOfProfit":0-1,"expectedPnL":{"min":N,"max":N},"predictedOutcome":"win|loss|neutral","confidence":0-1}]`;
  }
}

 