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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleTradesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let SimpleTradesGateway = class SimpleTradesGateway {
    server;
    logger = new common_1.Logger('SimpleTradesGateway');
    connectedClients = new Set();
    handleConnection(client) {
        this.connectedClients.add(client);
        this.logger.log(`Client connected: ${client.id}. Total clients: ${this.connectedClients.size}`);
        client.emit('connection', { message: 'Connected to trades WebSocket' });
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client);
        this.logger.log(`Client disconnected: ${client.id}. Total clients: ${this.connectedClients.size}`);
    }
    notifyTradeCreated(trade) {
        if (this.server) {
            this.server.emit('trade:created', trade);
            this.logger.debug(`Trade created notification sent: ${trade.id}`);
        }
    }
    notifyTradeUpdated(trade) {
        if (this.server) {
            this.server.emit('trade:updated', trade);
            this.logger.debug(`Trade updated notification sent: ${trade.id}`);
        }
    }
    notifyTradeDeleted(tradeId) {
        if (this.server) {
            this.server.emit('trade:deleted', { id: tradeId });
            this.logger.debug(`Trade deleted notification sent: ${tradeId}`);
        }
    }
    notifyBulkOperation(operation, count, trades) {
        if (this.server) {
            this.server.emit('trades:bulk', { operation, count, trades });
            this.logger.debug(`Bulk operation notification sent: ${operation} (${count} trades)`);
        }
    }
    getConnectionCount() {
        return this.connectedClients.size;
    }
};
exports.SimpleTradesGateway = SimpleTradesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SimpleTradesGateway.prototype, "server", void 0);
exports.SimpleTradesGateway = SimpleTradesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
                'https://tradetaper-admin.vercel.app',
                'https://api.tradetaper.com',
                process.env.FRONTEND_URL || 'http://localhost:3000',
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
        namespace: '/trades',
    })
], SimpleTradesGateway);
//# sourceMappingURL=simple-trades.gateway.js.map