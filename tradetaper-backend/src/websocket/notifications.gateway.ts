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
import { AuthenticatedSocket } from './types/authenticated-socket';

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
    // SECURITY: User is now authenticated via WsJwtAdapter
    const authClient = client as AuthenticatedSocket;
    if (authClient.user) {
      this.logger.log(`Client connected: ${client.id} (User: ${authClient.user.email})`);
      // Automatically register the authenticated user's socket
      this.webSocketService.registerUserSocket(authClient.user.id, client.id);
    } else {
      this.logger.warn(`Client connected without authentication: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const authClient = client as AuthenticatedSocket;
    this.webSocketService.unregisterSocket(client.id);
    if (authClient.user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${authClient.user.email})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * Handle user authentication status check
   * SECURITY: Authentication is now handled at connection time via WsJwtAdapter
   * This endpoint just returns the authenticated user's info
   */
  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId?: string; token?: string },
  ) {
    // SECURITY: User is already authenticated via JWT at connection time
    if (client.user) {
      client.emit('auth:success', {
        message: 'Authenticated successfully',
        user: {
          id: client.user.id,
          email: client.user.email,
          role: client.user.role,
        }
      });
      this.logger.log(`Auth status requested by user ${client.user.email} on socket ${client.id}`);
    } else {
      // This should never happen if WsJwtAdapter is working correctly
      client.emit('auth:error', { message: 'Not authenticated' });
      this.logger.warn(`Unauthenticated socket attempted auth: ${client.id}`);
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
