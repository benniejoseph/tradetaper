import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly webSocketService: WebSocketService) {}

  afterInit(server: Server) {
    this.webSocketService.setServer(server);
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.webSocketService.unregisterSocket(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle user authentication and register socket
   */
  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; token?: string },
  ) {
    // TODO: Validate JWT token for security
    // For now, just register the socket with the userId
    if (data.userId) {
      this.webSocketService.registerUserSocket(data.userId, client.id);
      client.emit('auth:success', { message: 'Authenticated successfully' });
      this.logger.log(`User ${data.userId} authenticated on socket ${client.id}`);
    } else {
      client.emit('auth:error', { message: 'userId is required' });
    }
  }

  /**
   * Handle notification acknowledgment (mark as read)
   */
  @SubscribeMessage('notification:ack')
  handleNotificationAck(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    // This will be handled by the NotificationsService
    // For now, just acknowledge receipt
    this.logger.debug(`Notification ${data.notificationId} acknowledged`);
    client.emit('notification:ack:success', { id: data.notificationId });
  }

  /**
   * Handle subscribe to economic events
   */
  @SubscribeMessage('economic:subscribe')
  handleEconomicSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { currencies?: string[]; importance?: string[] },
  ) {
    // Join rooms for specific currencies or importance levels
    if (data.currencies) {
      data.currencies.forEach((currency) => {
        client.join(`economic:${currency}`);
      });
    }
    if (data.importance) {
      data.importance.forEach((level) => {
        client.join(`economic:importance:${level}`);
      });
    }

    client.emit('economic:subscribed', data);
    this.logger.debug(`Client ${client.id} subscribed to economic events`, data);
  }

  /**
   * Handle unsubscribe from economic events
   */
  @SubscribeMessage('economic:unsubscribe')
  handleEconomicUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { currencies?: string[]; importance?: string[] },
  ) {
    if (data.currencies) {
      data.currencies.forEach((currency) => {
        client.leave(`economic:${currency}`);
      });
    }
    if (data.importance) {
      data.importance.forEach((level) => {
        client.leave(`economic:importance:${level}`);
      });
    }

    client.emit('economic:unsubscribed', data);
    this.logger.debug(`Client ${client.id} unsubscribed from economic events`, data);
  }

  /**
   * Ping/pong for keepalive
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}
