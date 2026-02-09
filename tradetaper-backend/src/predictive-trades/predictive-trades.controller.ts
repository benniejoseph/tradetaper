// src/predictive-trades/predictive-trades.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PredictiveTradesService } from './predictive-trades.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';

@Controller('predictive-trades')
@UseGuards(JwtAuthGuard)
export class PredictiveTradesController {
  constructor(
    private readonly predictiveTradesService: PredictiveTradesService,
  ) {}

  @Post('predict')
  async predict(@Req() req, @Body() createPredictionDto: CreatePredictionDto) {
    return this.predictiveTradesService.predict(
      req.user.id,
      createPredictionDto,
    );
  }
}
