import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TradesService } from './trades.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/trades',
})
export class TradesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('TradesGateway');

  constructor(private readonly tradesService: TradesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { accountId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `account_${data.accountId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    client.emit('joinedRoom', { room });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { accountId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `account_${data.accountId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  // Emit trade created event
  emitTradeCreated(trade: any, accountId: string) {
    const room = `account_${accountId}`;
    this.server.to(room).emit('tradeCreated', trade);
    this.logger.log(`Emitted tradeCreated to room: ${room}`);
  }

  // Emit trade updated event
  emitTradeUpdated(trade: any, accountId: string) {
    const room = `account_${accountId}`;
    this.server.to(room).emit('tradeUpdated', trade);
    this.logger.log(`Emitted tradeUpdated to room: ${room}`);
  }

  // Emit trade deleted event
  emitTradeDeleted(tradeId: string, accountId: string) {
    const room = `account_${accountId}`;
    this.server.to(room).emit('tradeDeleted', { id: tradeId });
    this.logger.log(`Emitted tradeDeleted to room: ${room}`);
  }

  // Emit bulk trades updated event
  emitBulkTradesUpdated(tradeIds: string[], accountId: string) {
    const room = `account_${accountId}`;
    this.server.to(room).emit('bulkTradesUpdated', { tradeIds });
    this.logger.log(`Emitted bulkTradesUpdated to room: ${room}`);
  }

  // Emit performance stats updated event
  emitPerformanceStatsUpdated(stats: any, accountId: string) {
    const room = `account_${accountId}`;
    this.server.to(room).emit('performanceStatsUpdated', stats);
    this.logger.log(`Emitted performanceStatsUpdated to room: ${room}`);
  }
} 