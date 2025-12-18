"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
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
const psychological_insight_entity_1 = require("../notes/entities/psychological-insight.entity");
const cloud_sql_connector_1 = require("@google-cloud/cloud-sql-connector");
const isProduction = process.env.NODE_ENV === 'production';
console.log('🔧 Database configuration (data-source.ts):', {
    isProduction,
    nodeEnv: process.env.NODE_ENV,
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
    dbHost: process.env.DB_HOST,
});
async function createDataSource() {
    const configService = new config_1.ConfigService();
    if (isProduction) {
        if (!process.env.INSTANCE_CONNECTION_NAME) {
            throw new Error('INSTANCE_CONNECTION_NAME is not defined.');
        }
        if (!process.env.DB_USER) {
            throw new Error('DB_USER is not defined.');
        }
        if (!process.env.DB_PASSWORD) {
            throw new Error('DB_PASSWORD is not defined.');
        }
        const connector = new cloud_sql_connector_1.Connector();
        const clientOpts = await connector.getOptions({
            instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
        });
        return new typeorm_1.DataSource({
            ...clientOpts,
            type: 'postgres',
            database: process.env.DB_NAME || 'tradetaper',
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            entities: [
                user_entity_1.User,
                account_entity_1.Account,
                trade_entity_1.Trade,
                tag_entity_1.Tag,
                mt5_account_entity_1.MT5Account,
                subscription_entity_1.Subscription,
                usage_entity_1.Usage,
                strategy_entity_1.Strategy,
                note_entity_1.Note,
                note_block_entity_1.NoteBlock,
                note_media_entity_1.NoteMedia,
                psychological_insight_entity_1.PsychologicalInsight,
            ],
            migrations: ['dist/migrations/*{.ts,.js}'],
            synchronize: false,
            logging: false,
        });
    }
    else {
        return new typeorm_1.DataSource({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_DATABASE', 'tradetaper'),
            entities: [
                user_entity_1.User,
                account_entity_1.Account,
                trade_entity_1.Trade,
                tag_entity_1.Tag,
                mt5_account_entity_1.MT5Account,
                subscription_entity_1.Subscription,
                usage_entity_1.Usage,
                strategy_entity_1.Strategy,
                note_entity_1.Note,
                note_block_entity_1.NoteBlock,
                note_media_entity_1.NoteMedia,
                psychological_insight_entity_1.PsychologicalInsight,
            ],
            migrations: ['src/migrations/*{.ts,.js}'],
            synchronize: false,
            logging: true,
        });
    }
}
exports.AppDataSource = createDataSource();
//# sourceMappingURL=data-source.js.map