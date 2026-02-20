import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
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
      'http://localhost:3002',
      'https://tradetaper.com',
      'https://www.tradetaper.com',
      /^https:\/\/tradetaper-frontend.*\.vercel\.app$/,
    ],
    credentials: true,
  },
  namespace: '/mt5',
})
export class MT5PositionsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('MT5PositionsGateway');

  afterInit() {
    this.logger.log('📈 MT5 Positions WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const user = (client as any).user;
    if (!user?.id) {
      this.logger.warn(`MT5 socket rejected: no user on ${client.id}`);
      client.disconnect();
      return;
    }

    client.join(`user:${user.id}`);
    client.emit('mt5:connected', {
      message: 'Connected to MT5 live positions stream',
      userId: user.id,
    });
    this.logger.log(`✅ MT5 socket connected: ${client.id} (user ${user.id})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 MT5 socket disconnected: ${client.id}`);
  }

  emitPositionsUpdate(userId: string, payload: Record<string, unknown>) {
    if (!this.server) {
      this.logger.warn('MT5 WebSocket server not initialized');
      return;
    }
    this.server.to(`user:${userId}`).emit('mt5:positions', payload);
  }
}
