import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        return callback(null, true);
      }

      const allowedPatterns = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://api.tradetaper.com',
        /^https:\/\/tradetaper-frontend.*\.vercel\.app$/,
        /^https:\/\/tradetaper-admin.*\.vercel\.app$/,
      ];

      const isAllowed = allowedPatterns.some((pattern) => {
        if (typeof pattern === 'string') return pattern === origin;
        if (pattern instanceof RegExp) return pattern.test(origin);
        return false;
      });

      callback(null, isAllowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
})
export class MainGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('MainGateway');
  private connectedClients = new Map<string, Socket>();

  afterInit(server: Server) {
    this.logger.log('🚀 Main WebSocket Gateway initialized');
    this.logger.log('📡 Socket.IO server ready for connections');
  }

  async handleConnection(client: Socket) {
    try {
      this.connectedClients.set(client.id, client);
      this.logger.log(
        `✅ Client connected to main gateway: ${client.id} (Total: ${this.connectedClients.size})`,
      );

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to TradeTaper WebSocket',
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(
      `🔌 Client disconnected from main gateway: ${client.id} (Remaining: ${this.connectedClients.size})`,
    );
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.logger.log(`📝 Ping received from ${client.id}: ${data}`);
    client.emit('pong', data);
    return { event: 'pong', data: data };
  }

  @SubscribeMessage('test-message')
  handleTestMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.log(
      `📨 Test message from ${client.id}: ${JSON.stringify(data)}`,
    );
    client.emit('test-response', {
      message: 'Test message received',
      originalData: data,
      timestamp: new Date().toISOString(),
    });
  }

  // Admin methods
  getConnectionCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
