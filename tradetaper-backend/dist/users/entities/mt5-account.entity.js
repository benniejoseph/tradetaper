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
exports.MT5Account = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let MT5Account = class MT5Account {
    id;
    accountName;
    server;
    login;
    password;
    metaApiAccountId;
    provisioningProfileId;
    deploymentState;
    connectionState;
    isRealAccount;
    isActive;
    balance;
    equity;
    margin;
    marginFree;
    profit;
    leverage;
    accountType;
    currency;
    connectionStatus;
    lastSyncAt;
    syncAttempts;
    lastSyncErrorAt;
    lastSyncError;
    metadata;
    totalTradesImported;
    autoSyncEnabled;
    lastKnownIp;
    lastHeartbeatAt;
    isStreamingActive;
    accountInfo;
    region;
    user;
    userId;
    createdAt;
    updatedAt;
};
exports.MT5Account = MT5Account;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MT5Account.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], MT5Account.prototype, "accountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], MT5Account.prototype, "server", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], MT5Account.prototype, "login", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, select: false }),
    __metadata("design:type", String)
], MT5Account.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], MT5Account.prototype, "metaApiAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], MT5Account.prototype, "provisioningProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'UNDEPLOYED' }),
    __metadata("design:type", String)
], MT5Account.prototype, "deploymentState", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'DISCONNECTED' }),
    __metadata("design:type", String)
], MT5Account.prototype, "connectionState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MT5Account.prototype, "isRealAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], MT5Account.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 19, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 19, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "equity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 19, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "margin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 19, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "marginFree", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 19, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "profit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "leverage", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], MT5Account.prototype, "accountType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, nullable: true, default: 'USD' }),
    __metadata("design:type", String)
], MT5Account.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'DISCONNECTED' }),
    __metadata("design:type", String)
], MT5Account.prototype, "connectionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MT5Account.prototype, "lastSyncAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "syncAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MT5Account.prototype, "lastSyncErrorAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MT5Account.prototype, "lastSyncError", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, default: () => "'{}'" }),
    __metadata("design:type", Object)
], MT5Account.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MT5Account.prototype, "totalTradesImported", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], MT5Account.prototype, "autoSyncEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], MT5Account.prototype, "lastKnownIp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MT5Account.prototype, "lastHeartbeatAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MT5Account.prototype, "isStreamingActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, default: () => "'{}'" }),
    __metadata("design:type", Object)
], MT5Account.prototype, "accountInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], MT5Account.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.id, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], MT5Account.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MT5Account.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MT5Account.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MT5Account.prototype, "updatedAt", void 0);
exports.MT5Account = MT5Account = __decorate([
    (0, typeorm_1.Entity)('mt5_accounts')
], MT5Account);
//# sourceMappingURL=mt5-account.entity.js.map