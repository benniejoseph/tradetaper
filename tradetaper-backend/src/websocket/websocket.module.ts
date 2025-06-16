import { Module } from '@nestjs/common';
import { TradesGateway } from './trades.gateway';

@Module({
  providers: [TradesGateway],
  exports: [TradesGateway],
})
export class WebSocketGatewayModule {}
