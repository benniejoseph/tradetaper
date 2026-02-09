"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
const keyv_1 = __importDefault(require("keyv"));
const redis_1 = __importDefault(require("@keyv/redis"));
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const trades_module_1 = require("./trades/trades.module");
const tags_module_1 = require("./tags/tags.module");
const admin_module_1 = require("./admin/admin.module");
const common_module_1 = require("./common/common.module");
const strategies_module_1 = require("./strategies/strategies.module");
const files_module_1 = require("./files/files.module");
const market_data_module_1 = require("./market-data/market-data.module");
const simple_websocket_module_1 = require("./websocket/simple-websocket.module");
const notes_module_1 = require("./notes/notes.module");
const database_module_1 = require("./database/database.module");
const predictive_trades_module_1 = require("./predictive-trades/predictive-trades.module");
const market_intelligence_module_1 = require("./market-intelligence/market-intelligence.module");
const agent_orchestrator_module_1 = require("./agents/agent-orchestrator.module");
const agents_implementation_module_1 = require("./agents/implementations/agents-implementation.module");
const agents_module_1 = require("./agents/agents.module");
const analytics_module_1 = require("./analytics/analytics.module");
const notifications_module_1 = require("./notifications/notifications.module");
const backtesting_module_1 = require("./backtesting/backtesting.module");
const statement_parser_module_1 = require("./statement-parser/statement-parser.module");
const terminal_farm_module_1 = require("./terminal-farm/terminal-farm.module");
const discipline_module_1 = require("./discipline/discipline.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const redisUrl = configService.get('REDIS_URL');
                    if (redisUrl) {
                        const keyv = new keyv_1.default({
                            store: new redis_1.default(redisUrl),
                            namespace: 'tradetaper',
                        });
                        return {
                            store: keyv,
                            ttl: 600,
                        };
                    }
                    return {
                        ttl: 600,
                    };
                },
            }),
            agent_orchestrator_module_1.AgentOrchestratorModule,
            database_module_1.DatabaseModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            trades_module_1.TradesModule,
            tags_module_1.TagsModule,
            admin_module_1.AdminModule,
            common_module_1.CommonModule,
            strategies_module_1.StrategiesModule,
            files_module_1.FilesModule,
            market_data_module_1.MarketDataModule,
            simple_websocket_module_1.SimpleWebSocketModule,
            notes_module_1.NotesModule,
            predictive_trades_module_1.PredictiveTradesModule,
            market_intelligence_module_1.MarketIntelligenceModule,
            market_intelligence_module_1.MarketIntelligenceModule,
            agents_implementation_module_1.AgentsImplementationModule,
            agents_module_1.AgentsModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
            backtesting_module_1.BacktestingModule,
            statement_parser_module_1.StatementParserModule,
            terminal_farm_module_1.TerminalFarmModule,
            discipline_module_1.DisciplineModule,
            subscriptions_module_1.SubscriptionsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map