import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server | null = null;
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server instance set');
  }

  /**
   * Register a socket connection for a user
   */
  registerUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.logger.debug(`Socket ${socketId} registered for user ${userId}`);
  }

  /**
   * Unregister a socket connection
   */
  unregisterSocket(socketId: string) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        this.logger.debug(`Socket ${socketId} unregistered from user ${userId}`);
        break;
      }
    }
  }

  /**
   * Send a notification to a specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.size > 0) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
      this.logger.debug(`Sent ${event} to user ${userId} (${sockets.size} sockets)`);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }
    this.server.emit(event, data);
    this.logger.debug(`Broadcast ${event} to all clients`);
  }

  // Trade notification methods

  notifyTradeCreated(trade: any) {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized, skipping trade:created notification',
      );
      return;
    }
    this.server.emit('trade:created', trade);
    this.logger.debug(`Trade created notification sent: ${trade.id}`);
  }

  notifyTradeUpdated(trade: any) {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized, skipping trade:updated notification',
      );
      return;
    }
    this.server.emit('trade:updated', trade);
    this.logger.debug(`Trade updated notification sent: ${trade.id}`);
  }

  notifyTradeDeleted(tradeId: string) {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized, skipping trade:deleted notification',
      );
      return;
    }
    this.server.emit('trade:deleted', { id: tradeId });
    this.logger.debug(`Trade deleted notification sent: ${tradeId}`);
  }

  notifyBulkOperation(operation: string, count: number, trades?: any[]) {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized, skipping trades:bulk notification',
      );
      return;
    }
    this.server.emit('trades:bulk', { operation, count, trades });
    this.logger.debug(
      `Bulk operation notification sent: ${operation} (${count} trades)`,
    );
  }

  /**
   * Get the number of connected users
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }
}
