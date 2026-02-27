"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const trade_entity_1 = require("./entities/trade.entity");
const trades_service_1 = require("./trades.service");
const gemini_vision_service_1 = require("../notes/gemini-vision.service");
const trades_controller_1 = require("./trades.controller");
const performance_service_1 = require("./performance.service");
const users_module_1 = require("../users/users.module");
const tags_module_1 = require("../tags/tags.module");
const trade_journal_sync_service_1 = require("./services/trade-journal-sync.service");
const note_entity_1 = require("../notes/entities/note.entity");
const trade_candle_entity_1 = require("./entities/trade-candle.entity");
const terminal_farm_module_1 = require("../terminal-farm/terminal-farm.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const notifications_module_1 = require("../notifications/notifications.module");
const backtesting_module_1 = require("../backtesting/backtesting.module");
let TradesModule = class TradesModule {
};
exports.TradesModule = TradesModule;
exports.TradesModule = TradesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([trade_entity_1.Trade, note_entity_1.Note, trade_candle_entity_1.TradeCandle]),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            (0, common_1.forwardRef)(() => terminal_farm_module_1.TerminalFarmModule),
            (0, common_1.forwardRef)(() => notifications_module_1.NotificationsModule),
            tags_module_1.TagsModule,
            subscriptions_module_1.SubscriptionsModule,
            (0, common_1.forwardRef)(() => backtesting_module_1.BacktestingModule),
        ],
        providers: [
            trades_service_1.TradesService,
            gemini_vision_service_1.GeminiVisionService,
            trade_journal_sync_service_1.TradeJournalSyncService,
            performance_service_1.PerformanceService,
        ],
        controllers: [trades_controller_1.TradesController],
        exports: [trades_service_1.TradesService, trade_journal_sync_service_1.TradeJournalSyncService],
    })
], TradesModule);
//# sourceMappingURL=trades.module.js.map