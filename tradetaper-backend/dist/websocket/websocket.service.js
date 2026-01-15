"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebSocketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const common_1 = require("@nestjs/common");
let WebSocketService = WebSocketService_1 = class WebSocketService {
    logger = new common_1.Logger(WebSocketService_1.name);
    server = null;
    userSockets = new Map();
    setServer(server) {
        this.server = server;
        this.logger.log('WebSocket server instance set');
    }
    registerUserSocket(userId, socketId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socketId);
        this.logger.debug(`Socket ${socketId} registered for user ${userId}`);
    }
    unregisterSocket(socketId) {
        for (const [userId, sockets] of this.userSockets.entries()) {
            if (sockets.has(socketId)) {
                sockets.delete(socketId);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                }
                this.logger.debug(`Socket ${socketId} unregistered from user ${userId}`);
                break;
            }
        }
    }
    sendToUser(userId, event, data) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return;
        }
        const sockets = this.userSockets.get(userId);
        if (sockets && sockets.size > 0) {
            for (const socketId of sockets) {
                this.server.to(socketId).emit(event, data);
            }
            this.logger.debug(`Sent ${event} to user ${userId} (${sockets.size} sockets)`);
        }
    }
    broadcast(event, data) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return;
        }
        this.server.emit(event, data);
        this.logger.debug(`Broadcast ${event} to all clients`);
    }
    notifyTradeCreated(trade) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized, skipping trade:created notification');
            return;
        }
        this.server.emit('trade:created', trade);
        this.logger.debug(`Trade created notification sent: ${trade.id}`);
    }
    notifyTradeUpdated(trade) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized, skipping trade:updated notification');
            return;
        }
        this.server.emit('trade:updated', trade);
        this.logger.debug(`Trade updated notification sent: ${trade.id}`);
    }
    notifyTradeDeleted(tradeId) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized, skipping trade:deleted notification');
            return;
        }
        this.server.emit('trade:deleted', { id: tradeId });
        this.logger.debug(`Trade deleted notification sent: ${tradeId}`);
    }
    notifyBulkOperation(operation, count, trades) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized, skipping trades:bulk notification');
            return;
        }
        this.server.emit('trades:bulk', { operation, count, trades });
        this.logger.debug(`Bulk operation notification sent: ${operation} (${count} trades)`);
    }
    getConnectedUsersCount() {
        return this.userSockets.size;
    }
    isUserConnected(userId) {
        const sockets = this.userSockets.get(userId);
        return sockets !== undefined && sockets.size > 0;
    }
};
exports.WebSocketService = WebSocketService;
exports.WebSocketService = WebSocketService = WebSocketService_1 = __decorate([
    (0, common_1.Injectable)()
], WebSocketService);
//# sourceMappingURL=websocket.service.js.map