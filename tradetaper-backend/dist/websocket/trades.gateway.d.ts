import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
export declare class TradesGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly webSocketService;
    server: Server;
    private logger;
    private connectedClients;
    constructor(webSocketService: WebSocketService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    getConnectionCount(): number;
}
