import { Module, forwardRef } from '@nestjs/common';
import { TradesGateway } from './trades.gateway';
import { WebSocketService } from './websocket.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  providers: [WebSocketService, TradesGateway, NotificationsGateway],
  exports: [WebSocketService, TradesGateway, NotificationsGateway],
})
export class WebSocketModule {}

// Re-export for backwards compatibility
export { WebSocketModule as WebSocketGatewayModule };
