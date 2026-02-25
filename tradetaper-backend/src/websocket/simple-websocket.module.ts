import { Module, Global, forwardRef } from '@nestjs/common';
import { SimpleTradesGateway } from './simple-trades.gateway';
import { ICTGateway } from './ict.gateway';
import { NotificationsGateway } from './notifications.gateway';
import { MT5PositionsGateway } from './mt5-positions.gateway';
import { WebSocketService } from './websocket.service';
import { MarketIntelligenceModule } from '../market-intelligence/market-intelligence.module';

@Global()
@Module({
  imports: [forwardRef(() => MarketIntelligenceModule)],
  providers: [
    SimpleTradesGateway,
    ICTGateway,
    NotificationsGateway, // ✅ ADD NotificationsGateway
    MT5PositionsGateway,
    WebSocketService, // ✅ ADD WebSocketService (required by NotificationsGateway)
  ],
  exports: [
    SimpleTradesGateway,
    ICTGateway,
    NotificationsGateway, // ✅ EXPORT NotificationsGateway
    MT5PositionsGateway,
    WebSocketService, // ✅ EXPORT WebSocketService
  ],
})
export class SimpleWebSocketModule {}
