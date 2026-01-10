import { Module, Global, forwardRef } from '@nestjs/common';
import { SimpleTradesGateway } from './simple-trades.gateway';
import { ICTGateway } from './ict.gateway';
import { MarketIntelligenceModule } from '../market-intelligence/market-intelligence.module';

@Global()
@Module({
  imports: [forwardRef(() => MarketIntelligenceModule)],
  providers: [SimpleTradesGateway, ICTGateway],
  exports: [SimpleTradesGateway, ICTGateway],
})
export class SimpleWebSocketModule {}
