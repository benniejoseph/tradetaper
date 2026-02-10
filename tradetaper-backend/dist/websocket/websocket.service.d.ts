import { Server } from 'socket.io';
export declare class WebSocketService {
    private readonly logger;
    private server;
    private userSockets;
    setServer(server: Server): void;
    registerUserSocket(userId: string, socketId: string): void;
    unregisterSocket(socketId: string): void;
    sendToUser(userId: string, event: string, data: Record<string, unknown>): void;
    broadcast(event: string, data: Record<string, unknown>): void;
    notifyTradeCreated(trade: Record<string, unknown>): void;
    notifyTradeUpdated(trade: Record<string, unknown>): void;
    notifyTradeDeleted(tradeId: string): void;
    notifyBulkOperation(operation: string, count: number, trades?: Record<string, unknown>[]): void;
    getConnectedUsersCount(): number;
    isUserConnected(userId: string): boolean;
}
