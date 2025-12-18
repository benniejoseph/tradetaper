import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MarketIntelligenceController } from './market-intelligence.controller';
import { MarketIntelligenceService } from './market-intelligence.service';
import { NewsAnalysisService } from './news-analysis.service';
import { ICTAnalysisService } from './ict-analysis.service';
import { EconomicCalendarService } from './economic-calendar.service';
import { AIMarketPredictionService } from './ai-market-prediction.service';
import { ForexFactoryService } from './forex-factory.service';
import { MarketDataAggregatorService } from './market-data-aggregator.service';
import { FreeDataSourcesModule } from './free-data-sources/free-data-sources.module';
import { ICTModule } from './ict/ict.module'; // NEW ICT MODULE
import { TradingViewAdvancedService } from './tradingview/tradingview-advanced.service';
import { TradingViewAdvancedController } from './tradingview/tradingview-advanced.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    CacheModule.register({
      ttl: 30000, // 30 seconds cache for real-time data
      max: 1000,
    }),
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
    AIMarketPredictionService,
    ForexFactoryService,
    MarketDataAggregatorService,
    TradingViewAdvancedService, // NEW: TradingView Advanced API Service
  ],
  exports: [
    MarketIntelligenceService,
    AIMarketPredictionService, // Export for agent usage
    FreeDataSourcesModule,
    ICTModule,
    TradingViewAdvancedService, // Export for use in other modules
  ],
})
export class MarketIntelligenceModule {}
