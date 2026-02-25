import { Controller, Get, UseGuards, Req, Logger, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TradesService } from '../trades/trades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

import { GeminiInsightsService } from '../market-intelligence/gemini-insights.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly tradesService: TradesService,
    private readonly geminiInsightsService: GeminiInsightsService,
  ) {}

  @Get('insights')
  async getAIInsights(
    @Req() req: AuthenticatedRequest,
    @Query('accountId') accountId?: string,
  ) {
    const userId = req.user.id;
    const trades = await this.tradesService.findAllByUser(userId);
    const filteredTrades = accountId
      ? trades.filter(
          (t) =>
            t.accountId === accountId || (t as any).mt5AccountId === accountId,
        )
      : trades;

    return this.geminiInsightsService.analyzeTradePatterns(filteredTrades);
  }

  @Get('advanced')
  async getAdvancedAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('accountId') accountId?: string,
  ) {
    const userId = req.user.id;
    // Fetch all closed trades for this user (and account)
    // We might need to ensure TradesService has a method to get ALL trades for analytics (no pagination)

    // For now, assuming findByUserId returns all or sufficient amount.
    // Ideally we want ALL closed trades for accurate analytics.
    const trades = await this.tradesService.findAllByUser(userId);

    // Filter by account if provided
    const filteredTrades = accountId
      ? trades.filter(
          (t) =>
            t.accountId === accountId || (t as any).mt5AccountId === accountId,
        )
      : trades;

    return this.analyticsService.calculateAdvancedMetrics(filteredTrades);
  }
}
