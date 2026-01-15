import { Server } from 'socket.io';
export declare class WebSocketService {
    private readonly logger;
    private server;
    private userSockets;
    setServer(server: Server): void;
    registerUserSocket(userId: string, socketId: string): void;
    unregisterSocket(socketId: string): void;
    sendToUser(userId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    notifyTradeCreated(trade: any): void;
    notifyTradeUpdated(trade: any): void;
    notifyTradeDeleted(tradeId: string): void;
    notifyBulkOperation(operation: string, count: number, trades?: any[]): void;
    getConnectedUsersCount(): number;
    isUserConnected(userId: string): boolean;
}
