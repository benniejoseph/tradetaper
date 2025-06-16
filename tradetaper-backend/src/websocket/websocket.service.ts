import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server instance set');
  }

  // Emit trade creation event
  notifyTradeCreated(trade: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping trade:created notification');
      return;
    }
    this.server.emit('trade:created', trade);
    this.logger.debug(`Trade created notification sent: ${trade.id}`);
  }

  // Emit trade update event
  notifyTradeUpdated(trade: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping trade:updated notification');
      return;
    }
    this.server.emit('trade:updated', trade);
    this.logger.debug(`Trade updated notification sent: ${trade.id}`);
  }

  // Emit trade deletion event
  notifyTradeDeleted(tradeId: string) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping trade:deleted notification');
      return;
    }
    this.server.emit('trade:deleted', { id: tradeId });
    this.logger.debug(`Trade deleted notification sent: ${tradeId}`);
  }

  // Emit bulk operation event
  notifyBulkOperation(operation: string, count: number, trades?: any[]) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping trades:bulk notification');
      return;
    }
    this.server.emit('trades:bulk', { operation, count, trades });
    this.logger.debug(
      `Bulk operation notification sent: ${operation} (${count} trades)`,
    );
  }
} 