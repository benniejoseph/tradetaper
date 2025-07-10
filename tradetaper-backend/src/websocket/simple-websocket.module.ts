import { Module, Global } from '@nestjs/common';
import { SimpleTradesGateway } from './simple-trades.gateway';

@Global()
@Module({
  providers: [SimpleTradesGateway],
  exports: [SimpleTradesGateway],
})
export class SimpleWebSocketModule {}
