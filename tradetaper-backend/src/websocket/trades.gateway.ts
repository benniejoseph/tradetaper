import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { WebSocketService } from './websocket.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
      'https://tradetaper-admin.vercel.app',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/trades',
})
export class TradesGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('TradesGateway');
  private connectedClients = new Set<Socket>();

  constructor(
    @Inject(WebSocketService)
    private readonly webSocketService: WebSocketService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.webSocketService.setServer(server);
  }

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

  // Get current connection count
  getConnectionCount(): number {
    return this.connectedClients.size;
  }
}
