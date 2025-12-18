import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { StockTwitsService } from './stocktwits.service';
import { EtherscanService } from './etherscan.service';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    StockTwitsService,
    EtherscanService,
    BlockchainService,
  ],
  exports: [
    StockTwitsService,
    EtherscanService,
    BlockchainService,
  ],
})
export class SocialOnChainModule {}

