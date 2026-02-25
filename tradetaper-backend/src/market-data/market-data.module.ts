// src/market-data/market-data.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MarketDataService } from './market-data.service';
import { MarketDataController } from './market-data.controller';
import { MarketDataPublicController } from './market-data-public.controller';
import { MultiProviderMarketDataService } from './multi-provider.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MarketDataService, MultiProviderMarketDataService],
  controllers: [MarketDataController, MarketDataPublicController],
  exports: [MarketDataService, MultiProviderMarketDataService],
})
export class MarketDataModule {}
