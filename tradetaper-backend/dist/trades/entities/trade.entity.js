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
exports.Trade = void 0;
const user_entity_1 = require("../../users/entities/user.entity");
const class_transformer_1 = require("class-transformer");
const tag_entity_1 = require("../../tags/entities/tag.entity");
const enums_1 = require("../../types/enums");
const typeorm_1 = require("typeorm");
let Trade = class Trade {
    id;
    user;
    userId;
    strategy;
    strategyId;
    accountId;
    isStarred;
    assetType;
    symbol;
    side;
    status;
    openTime;
    openPrice;
    closeTime;
    closePrice;
    quantity;
    commission;
    swap;
    marginUsed;
    notes;
    profitOrLoss;
    rMultiple;
    stopLoss;
    takeProfit;
    ictConcept;
    session;
    setupDetails;
    mistakesMade;
    lessonsLearned;
    imageUrl;
    tags;
    chartImageUrl;
    externalId;
    externalDealId;
    mt5Magic;
    contractSize;
    executionCandles;
    emotionBefore;
    emotionDuring;
    emotionAfter;
    confidenceLevel;
    followedPlan;
    ruleViolations;
    plannedRR;
    maePrice;
    mfePrice;
    maePips;
    mfePips;
    slippage;
    executionGrade;
    marketCondition;
    timeframe;
    htfBias;
    newsImpact;
    changeLog;
    entryReason;
    confirmations;
    hesitated;
    preparedToLose;
    sleepQuality;
    energyLevel;
    distractionLevel;
    tradingEnvironment;
    createdAt;
    updatedAt;
    getContractSize() {
        if (this.contractSize)
            return this.contractSize;
        if (!this.symbol)
            return 1;
        const s = this.symbol.toUpperCase();
        if (s.includes('XAU') || s.includes('GOLD'))
            return 100;
        if (s.includes('XAG') || s.includes('SILVER'))
            return 5000;
        if (this.assetType === enums_1.AssetType.FOREX)
            return 100000;
        if (this.assetType === enums_1.AssetType.INDICES)
            return 1;
        return 1;
    }
    calculatePnl() {
        if (this.status === enums_1.TradeStatus.CLOSED &&
            this.openPrice &&
            this.closePrice &&
            this.quantity) {
            const contractSize = this.getContractSize();
            let pnl = 0;
            const openPrice = Number(this.openPrice);
            const closePrice = Number(this.closePrice);
            const quantity = Number(this.quantity);
            const commission = Number(this.commission || 0);
            const swap = Number(this.swap || 0);
            if (!Number.isFinite(openPrice) ||
                !Number.isFinite(closePrice) ||
                !Number.isFinite(quantity)) {
                this.profitOrLoss = undefined;
                return;
            }
            if (this.side === enums_1.TradeDirection.LONG) {
                pnl = (closePrice - openPrice) * quantity * contractSize;
            }
            else if (this.side === enums_1.TradeDirection.SHORT) {
                pnl = (openPrice - closePrice) * quantity * contractSize;
            }
            const total = pnl + commission + swap;
            this.profitOrLoss = Number.isFinite(total)
                ? parseFloat(total.toFixed(4))
                : undefined;
        }
        else {
            this.profitOrLoss = undefined;
        }
    }
};
exports.Trade = Trade;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Trade.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.id, {
        eager: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Trade.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Trade.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Strategy', {
        eager: false,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'strategyId' }),
    __metadata("design:type", Object)
], Trade.prototype, "strategy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "strategyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true, default: false }),
    __metadata("design:type", Boolean)
], Trade.prototype, "isStarred", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.AssetType,
        default: enums_1.AssetType.STOCK,
    }),
    __metadata("design:type", String)
], Trade.prototype, "assetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Trade.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.TradeDirection,
    }),
    __metadata("design:type", String)
], Trade.prototype, "side", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.TradeStatus,
        default: enums_1.TradeStatus.OPEN,
    }),
    __metadata("design:type", String)
], Trade.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamptz'),
    __metadata("design:type", Date)
], Trade.prototype, "openTime", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8 }),
    __metadata("design:type", Number)
], Trade.prototype, "openPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamptz', { nullable: true }),
    __metadata("design:type", Date)
], Trade.prototype, "closeTime", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "closePrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8 }),
    __metadata("design:type", Number)
], Trade.prototype, "quantity", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "commission", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "swap", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "marginUsed", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "notes", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "profitOrLoss", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "rMultiple", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8, nullable: true }),
    __metadata("design:type", Object)
], Trade.prototype, "stopLoss", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8, nullable: true }),
    __metadata("design:type", Object)
], Trade.prototype, "takeProfit", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.ICTConcept,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "ictConcept", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.TradingSession,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "setupDetails", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "mistakesMade", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "lessonsLearned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 1024, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "imageUrl", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => tag_entity_1.Tag),
    (0, typeorm_1.ManyToMany)(() => tag_entity_1.Tag, (tag) => tag.trades, { cascade: ['insert'] }),
    (0, typeorm_1.JoinTable)({
        name: 'trade_tags',
        joinColumn: { name: 'tradeId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Trade.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 2048,
        nullable: true,
        name: 'chart_image_url',
    }),
    __metadata("design:type", String)
], Trade.prototype, "chartImageUrl", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "externalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "externalDealId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "mt5Magic", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "contractSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Trade.prototype, "executionCandles", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.EmotionalState,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "emotionBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.EmotionalState,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "emotionDuring", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.EmotionalState,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "emotionAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "confidenceLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Trade.prototype, "followedPlan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Trade.prototype, "ruleViolations", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "plannedRR", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "maePrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 19, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "mfePrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "maePips", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "mfePips", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "slippage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.ExecutionGrade,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "executionGrade", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.MarketCondition,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "marketCondition", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.Timeframe,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "timeframe", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.HTFBias,
        nullable: true,
    }),
    __metadata("design:type", String)
], Trade.prototype, "htfBias", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Trade.prototype, "newsImpact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], Trade.prototype, "changeLog", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "entryReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Trade.prototype, "confirmations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Trade.prototype, "hesitated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Trade.prototype, "preparedToLose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "sleepQuality", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "energyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Trade.prototype, "distractionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "tradingEnvironment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Trade.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Trade.prototype, "updatedAt", void 0);
exports.Trade = Trade = __decorate([
    (0, typeorm_1.Entity)('trades'),
    (0, typeorm_1.Index)(['user', 'openTime'])
], Trade);
//# sourceMappingURL=trade.entity.js.map