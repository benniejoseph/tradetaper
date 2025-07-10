import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class SimpleTradesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    private connectedClients;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    notifyTradeCreated(trade: any): void;
    notifyTradeUpdated(trade: any): void;
    notifyTradeDeleted(tradeId: string): void;
    notifyBulkOperation(operation: string, count: number, trades?: any[]): void;
    getConnectionCount(): number;
}
