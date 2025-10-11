import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { CoinGeckoService } from './coingecko.service';
import { RSSNewsService } from './rss-news.service';
import { FredEconomicService } from './fred-economic.service';
import { SocialOnChainModule } from './social-onchain/social-onchain.module';

@Module({
  imports: [HttpModule, ConfigModule, SocialOnChainModule],
  providers: [
    CoinGeckoService,
    RSSNewsService,
    FredEconomicService,
  ],
  exports: [
    CoinGeckoService,
    RSSNewsService,
    FredEconomicService,
    SocialOnChainModule,
  ],
})
export class FreeDataSourcesModule {}
