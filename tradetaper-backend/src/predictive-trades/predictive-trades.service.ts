// src/predictive-trades/predictive-trades.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from '../trades/entities/trade.entity';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { GeminiPredictionService } from './gemini-prediction.service';

export interface PredictionResponse {
  probabilityOfProfit: number;
  expectedPnL: { min: number; max: number };
  predictedOutcome: 'win' | 'loss' | 'neutral';
  confidence: number;
}

@Injectable()
export class PredictiveTradesService {
  private readonly logger = new Logger(PredictiveTradesService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
    private readonly geminiPredictionService: GeminiPredictionService,
  ) {}

  async predict(
    userId: string,
    createPredictionDto: CreatePredictionDto,
  ): Promise<PredictionResponse> {
    this.logger.log(
      `Generating prediction for user ${userId} with setup: ${JSON.stringify(
        createPredictionDto,
      )}`,
    );

    return this.geminiPredictionService.generatePrediction(createPredictionDto);
  }
} 