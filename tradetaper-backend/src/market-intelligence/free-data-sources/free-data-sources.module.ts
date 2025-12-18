import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// import { CoinGeckoService } from './coingecko.service'; // Disabled - missing dependencies
// import { RSSNewsService } from './rss-news.service'; // Disabled - missing dependencies
import { FredEconomicService } from './fred-economic.service';
// import { SocialOnChainModule } from './social-onchain/social-onchain.module'; // Disabled - missing dependencies

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    // CoinGeckoService, // Disabled
    // RSSNewsService, // Disabled
    FredEconomicService,
  ],
  exports: [
    // CoinGeckoService, // Disabled
    // RSSNewsService, // Disabled
    FredEconomicService,
    // SocialOnChainModule, // Disabled
  ],
})
export class FreeDataSourcesModule {}
