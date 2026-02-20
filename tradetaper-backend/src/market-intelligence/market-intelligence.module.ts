import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MarketIntelligenceController } from './market-intelligence.controller';
import { MarketIntelligenceService } from './market-intelligence.service';
import { NewsAnalysisService } from './news-analysis.service';
import { ICTAnalysisService } from './ict-analysis.service';
import { EconomicCalendarService } from './economic-calendar.service';
import { EconomicAlertsService } from './economic-alerts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EconomicEventAlert } from './entities/economic-event-alert.entity';
import { EconomicEventAnalysis } from './entities/economic-event-analysis.entity';
import { AIMarketPredictionService } from './ai-market-prediction.service';
import { MarketSentimentService } from './market-sentiment.service'; // Added
import { ForexFactoryService } from './forex-factory.service';
import { MarketDataAggregatorService } from './market-data-aggregator.service';
import { FreeDataSourcesModule } from './free-data-sources/free-data-sources.module';
import { ICTModule } from './ict/ict.module'; // NEW ICT MODULE
import { TradingViewAdvancedService } from './tradingview/tradingview-advanced.service';
import { TradingViewAdvancedController } from './tradingview/tradingview-advanced.controller';
import { GeminiInsightsService } from './gemini-insights.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([EconomicEventAlert, EconomicEventAnalysis]),
    FreeDataSourcesModule, // FREE data sources (Yahoo Finance, Binance, CoinGecko, RSS, Reddit)
    ICTModule, // NEW ICT (Inner Circle Trader) strategies
  ],
  controllers: [
    MarketIntelligenceController,
    TradingViewAdvancedController, // NEW: TradingView Advanced API
  ],
  providers: [
    MarketIntelligenceService,
    NewsAnalysisService,
    ICTAnalysisService,
    EconomicCalendarService,
    EconomicAlertsService,
    AIMarketPredictionService,
    ForexFactoryService,
    MarketDataAggregatorService,
    TradingViewAdvancedService, // NEW: TradingView Advanced API Service
    GeminiInsightsService,
    MarketSentimentService, // Added
  ],
  exports: [
    MarketIntelligenceService,
    AIMarketPredictionService, // Export for agent usage
    EconomicCalendarService, // ADDDED: Required for NotificationsModule
    EconomicAlertsService,
    FreeDataSourcesModule,
    ICTModule,
    TradingViewAdvancedService, // Export for use in other modules
    GeminiInsightsService,
    MarketSentimentService, // Added
  ],
})
export class MarketIntelligenceModule {}
