import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface TradeData {
  id: string;
  [key: string]: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/trades',
})
export class TradesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('TradesGateway');
  private connectedClients = new Set<Socket>();

  handleConnection(client: Socket) {
    this.connectedClients.add(client);
    this.logger.log(
      `Client connected: ${client.id}. Total clients: ${this.connectedClients.size}`,
    );

    // Send connection confirmation
    client.emit('connection', { message: 'Connected to trades WebSocket' });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client);
    this.logger.log(
      `Client disconnected: ${client.id}. Total clients: ${this.connectedClients.size}`,
    );
  }

  // Emit trade creation event
  notifyTradeCreated(trade: TradeData) {
    this.server.emit('trade:created', trade);
    this.logger.debug(`Trade created notification sent: ${trade.id}`);
  }

  // Emit trade update event
  notifyTradeUpdated(trade: TradeData) {
    this.server.emit('trade:updated', trade);
    this.logger.debug(`Trade updated notification sent: ${trade.id}`);
  }

  // Emit trade deletion event
  notifyTradeDeleted(tradeId: string) {
    this.server.emit('trade:deleted', { id: tradeId });
    this.logger.debug(`Trade deleted notification sent: ${tradeId}`);
  }

  // Emit bulk operation event
  notifyBulkOperation(operation: string, count: number, trades?: TradeData[]) {
    this.server.emit('trades:bulk', { operation, count, trades });
    this.logger.debug(
      `Bulk operation notification sent: ${operation} (${count} trades)`,
    );
  }

  // Get current connection count
  getConnectionCount(): number {
    return this.connectedClients.size;
  }
}
