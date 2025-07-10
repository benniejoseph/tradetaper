"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const account_entity_1 = require("../users/entities/account.entity");
const trade_entity_1 = require("../trades/entities/trade.entity");
const tag_entity_1 = require("../tags/entities/tag.entity");
const mt5_account_entity_1 = require("../users/entities/mt5-account.entity");
const subscription_entity_1 = require("../subscriptions/entities/subscription.entity");
const usage_entity_1 = require("../subscriptions/entities/usage.entity");
const strategy_entity_1 = require("../strategies/entities/strategy.entity");
const note_entity_1 = require("../notes/entities/note.entity");
const note_block_entity_1 = require("../notes/entities/note-block.entity");
const note_media_entity_1 = require("../notes/entities/note-media.entity");
const isProduction = process.env.NODE_ENV === 'production';
console.log('🔧 Database configuration (data-source.ts):', {
    isProduction,
    nodeEnv: process.env.NODE_ENV
});
let dbConfig = {};
if (isProduction) {
    console.log('Using Cloud SQL configuration for production');
    dbConfig = {
        type: 'postgres',
        host: '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
        username: 'tradetaper',
        password: 'TradeTaper2024',
        database: 'tradetaper',
        ssl: false,
        retryAttempts: 5,
        retryDelay: 3000,
        connectTimeoutMS: 60000,
        extra: {
            max: 10,
            connectionTimeoutMillis: 60000,
        }
    };
}
else {
    console.log('Using local database configuration for development');
    dbConfig = {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'tradetaper',
        ssl: false,
    };
}
console.log('FINAL DATABASE CONFIG (data-source.ts):', {
    isProduction,
    host: dbConfig.host,
    username: dbConfig.username,
    database: dbConfig.database,
    ssl: dbConfig.ssl,
    nodeEnv: process.env.NODE_ENV,
});
exports.AppDataSource = new typeorm_1.DataSource({
    ...dbConfig,
    entities: [user_entity_1.User, account_entity_1.Account, trade_entity_1.Trade, tag_entity_1.Tag, mt5_account_entity_1.MT5Account, subscription_entity_1.Subscription, usage_entity_1.Usage, strategy_entity_1.Strategy, note_entity_1.Note, note_block_entity_1.NoteBlock, note_media_entity_1.NoteMedia],
    migrations: [isProduction ? 'dist/migrations/*{.ts,.js}' : 'src/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
});
//# sourceMappingURL=data-source.js.map