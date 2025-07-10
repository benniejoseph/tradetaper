import { Server } from 'socket.io';
export declare class WebSocketService {
    private readonly logger;
    private server;
    setServer(server: Server): void;
    notifyTradeCreated(trade: any): void;
    notifyTradeUpdated(trade: any): void;
    notifyTradeDeleted(tradeId: string): void;
    notifyBulkOperation(operation: string, count: number, trades?: any[]): void;
}
