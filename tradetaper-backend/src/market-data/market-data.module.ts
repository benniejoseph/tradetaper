// src/market-data/market-data.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config'; // To use ConfigService for API Key
import { MarketDataService } from './market-data.service';
import { MarketDataController } from './market-data.controller';

@Module({
  imports: [
    HttpModule, // For making HTTP requests
    ConfigModule, // To access .env variables
  ],
  providers: [MarketDataService],
  controllers: [MarketDataController],
})
export class MarketDataModule {}
