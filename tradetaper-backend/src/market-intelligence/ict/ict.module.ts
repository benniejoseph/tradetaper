import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LiquidityAnalysisService } from './liquidity-analysis.service';
import { MarketStructureService } from './market-structure.service';
import { FairValueGapService } from './fair-value-gap.service';
import { OrderBlockService } from './order-block.service';
import { KillZoneService } from './kill-zone.service';
import { ICTMasterService } from './ict-master.service';
import { PremiumDiscountService } from './premium-discount.service';
import { PowerOfThreeService } from './power-of-three.service';
import { ChartImageAnalysisService } from './chart-image-analysis.service';
import { ICTAIAgentService } from './ict-ai-agent.service';
import { ICTController } from './ict.controller';
import { MarketDataProviderService } from './market-data-provider.service';
import { TradingViewRealtimeService } from './tradingview-realtime.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [ICTController],
  providers: [
    // Real-time Market Data
    TradingViewRealtimeService,
    // Market Data Provider
    MarketDataProviderService,
    // Core ICT Services
    LiquidityAnalysisService,
    MarketStructureService,
    FairValueGapService,
    OrderBlockService,
    KillZoneService,
    // Advanced ICT Services
    PremiumDiscountService,
    PowerOfThreeService,
    ChartImageAnalysisService,
    ICTAIAgentService,
    // Master Orchestrator
    ICTMasterService,
  ],
  exports: [
    TradingViewRealtimeService,
    MarketDataProviderService,
    LiquidityAnalysisService,
    MarketStructureService,
    FairValueGapService,
    OrderBlockService,
    KillZoneService,
    PremiumDiscountService,
    PowerOfThreeService,
    ChartImageAnalysisService,
    ICTAIAgentService,
    ICTMasterService,
  ],
})
export class ICTModule {}

