import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class SimpleTradesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    private connectedClients;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    notifyTradeCreated(trade: Record<string, unknown>): void;
    notifyTradeUpdated(trade: Record<string, unknown>): void;
    notifyTradeDeleted(tradeId: string): void;
    notifyBulkOperation(operation: string, count: number, trades?: Record<string, unknown>[]): void;
    getConnectionCount(): number;
}
