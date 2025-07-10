"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const websocket_service_1 = require("./websocket.service");
let TradesGateway = class TradesGateway {
    webSocketService;
    server;
    logger = new common_1.Logger('TradesGateway');
    connectedClients = new Set();
    constructor(webSocketService) {
        this.webSocketService = webSocketService;
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
        this.webSocketService.setServer(server);
    }
    handleConnection(client) {
        this.connectedClients.add(client);
        this.logger.log(`Client connected: ${client.id}. Total clients: ${this.connectedClients.size}`);
        client.emit('connection', { message: 'Connected to trades WebSocket' });
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client);
        this.logger.log(`Client disconnected: ${client.id}. Total clients: ${this.connectedClients.size}`);
    }
    getConnectionCount() {
        return this.connectedClients.size;
    }
};
exports.TradesGateway = TradesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TradesGateway.prototype, "server", void 0);
exports.TradesGateway = TradesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
                'https://tradetaper-admin.vercel.app',
                process.env.FRONTEND_URL || 'http://localhost:3000'
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
        namespace: '/trades',
    }),
    __param(0, (0, common_1.Inject)(websocket_service_1.WebSocketService)),
    __metadata("design:paramtypes", [websocket_service_1.WebSocketService])
], TradesGateway);
//# sourceMappingURL=trades.gateway.js.map