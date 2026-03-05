import { Controller, Get, UseGuards, Req, Logger, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TradesService } from '../trades/trades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import {
  FeatureAccessGuard,
  RequireFeature,
} from '../subscriptions/guards/feature-access.guard';

import { GeminiInsightsService } from '../market-intelligence/gemini-insights.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly tradesService: TradesService,
    private readonly geminiInsightsService: GeminiInsightsService,
  ) {}

  @Get('insights')
  @RequireFeature('aiAnalysis')
  async getAIInsights(
    @Req() req: AuthenticatedRequest,
    @Query('accountId') accountId?: string,
  ) {
    const userId = req.user.id;
    const trades = await this.tradesService.findClosedTradesForAnalytics(
      userId,
      accountId,
    );
    return this.geminiInsightsService.analyzeTradePatterns(trades);
  }

  @Get('advanced')
  @RequireFeature('advancedAnalytics')
  async getAdvancedAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('accountId') accountId?: string,
  ) {
    const userId = req.user.id;
    const trades = await this.tradesService.findClosedTradesForAnalytics(
      userId,
      accountId,
    );
    return this.analyticsService.calculateAdvancedMetrics(trades);
  }
}
