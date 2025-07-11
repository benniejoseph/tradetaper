// src/predictive-trades/predictive-trades.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from '../trades/entities/trade.entity';
import { PredictiveTradesController } from './predictive-trades.controller';
import { PredictiveTradesService } from './predictive-trades.service';
import { GeminiPredictionService } from './gemini-prediction.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Trade]), ConfigModule],
  controllers: [PredictiveTradesController],
  providers: [PredictiveTradesService, GeminiPredictionService],
})
export class PredictiveTradesModule {} 