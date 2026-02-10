import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
      'https://tradetaper-admin.vercel.app',
      'https://api.tradetaper.com',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/trades',
})
export class SimpleTradesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SimpleTradesGateway');
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

  // Simple notification methods (can be called from anywhere)
  notifyTradeCreated(trade: Record<string, unknown>) {
    if (this.server) {
      this.server.emit('trade:created', trade);
      this.logger.debug(`Trade created notification sent: ${trade.id}`);
    }
  }

  notifyTradeUpdated(trade: Record<string, unknown>) {
    if (this.server) {
      this.server.emit('trade:updated', trade);
      this.logger.debug(`Trade updated notification sent: ${trade.id}`);
    }
  }

  notifyTradeDeleted(tradeId: string) {
    if (this.server) {
      this.server.emit('trade:deleted', { id: tradeId });
      this.logger.debug(`Trade deleted notification sent: ${tradeId}`);
    }
  }

  notifyBulkOperation(operation: string, count: number, trades?: Record<string, unknown>[]) {
    if (this.server) {
      this.server.emit('trades:bulk', { operation, count, trades });
      this.logger.debug(
        `Bulk operation notification sent: ${operation} (${count} trades)`,
      );
    }
  }

  getConnectionCount(): number {
    return this.connectedClients.size;
  }
}
