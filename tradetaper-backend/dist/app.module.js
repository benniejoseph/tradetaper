"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const trades_module_1 = require("./trades/trades.module");
const tags_module_1 = require("./tags/tags.module");
const admin_module_1 = require("./admin/admin.module");
const common_module_1 = require("./common/common.module");
const strategies_module_1 = require("./strategies/strategies.module");
const files_module_1 = require("./files/files.module");
const market_data_module_1 = require("./market-data/market-data.module");
const subscription_entity_1 = require("./subscriptions/entities/subscription.entity");
const usage_entity_1 = require("./subscriptions/entities/usage.entity");
const user_entity_1 = require("./users/entities/user.entity");
const account_entity_1 = require("./users/entities/account.entity");
const trade_entity_1 = require("./trades/entities/trade.entity");
const tag_entity_1 = require("./tags/entities/tag.entity");
const mt5_account_entity_1 = require("./users/entities/mt5-account.entity");
const strategy_entity_1 = require("./strategies/entities/strategy.entity");
const simple_websocket_module_1 = require("./websocket/simple-websocket.module");
const notes_module_1 = require("./notes/notes.module");
const note_entity_1 = require("./notes/entities/note.entity");
const note_block_entity_1 = require("./notes/entities/note-block.entity");
const note_media_entity_1 = require("./notes/entities/note-media.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const isProduction = configService.get('NODE_ENV') === 'production';
                    console.log('🔧 Database configuration:', {
                        isProduction,
                        nodeEnv: process.env.NODE_ENV
                    });
                    if (isProduction) {
                        console.log('Using Cloud SQL configuration for production');
                        return {
                            type: 'postgres',
                            host: '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
                            username: 'tradetaper',
                            password: 'TradeTaper2024',
                            database: 'tradetaper',
                            entities: [user_entity_1.User, account_entity_1.Account, trade_entity_1.Trade, tag_entity_1.Tag, mt5_account_entity_1.MT5Account, subscription_entity_1.Subscription, usage_entity_1.Usage, strategy_entity_1.Strategy, note_entity_1.Note, note_block_entity_1.NoteBlock, note_media_entity_1.NoteMedia],
                            synchronize: false,
                            ssl: false,
                            retryAttempts: 5,
                            retryDelay: 3000,
                            autoLoadEntities: true,
                            logging: ['error', 'warn'],
                            connectTimeoutMS: 60000,
                            extra: {
                                max: 10,
                                connectionTimeoutMillis: 60000,
                            }
                        };
                    }
                    console.log('Using local database configuration for development');
                    return {
                        type: 'postgres',
                        host: process.env.DB_HOST || 'localhost',
                        port: parseInt(process.env.DB_PORT || '5432', 10),
                        username: process.env.DB_USERNAME || 'postgres',
                        password: process.env.DB_PASSWORD || 'postgres',
                        database: process.env.DB_DATABASE || 'tradetaper',
                        entities: [user_entity_1.User, account_entity_1.Account, trade_entity_1.Trade, tag_entity_1.Tag, mt5_account_entity_1.MT5Account, subscription_entity_1.Subscription, usage_entity_1.Usage, strategy_entity_1.Strategy, note_entity_1.Note, note_block_entity_1.NoteBlock, note_media_entity_1.NoteMedia],
                        synchronize: true,
                        autoLoadEntities: true,
                        logging: true,
                    };
                },
            }),
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
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map