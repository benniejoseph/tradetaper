import { Module } from '@nestjs/common';
import { TradesGateway } from './trades.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  providers: [WebSocketService, TradesGateway],
  exports: [WebSocketService, TradesGateway],
})
export class WebSocketGatewayModule {}
