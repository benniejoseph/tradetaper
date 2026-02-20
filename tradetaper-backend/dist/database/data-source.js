"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
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
const knowledge_document_entity_1 = require("../knowledge-base/entities/knowledge-document.entity");
const vector_embedding_entity_1 = require("../knowledge-base/entities/vector-embedding.entity");
const trade_candle_entity_1 = require("../trades/entities/trade-candle.entity");
const backtest_trade_entity_1 = require("../backtesting/entities/backtest-trade.entity");
const market_log_entity_1 = require("../backtesting/entities/market-log.entity");
const market_candle_entity_1 = require("../backtesting/entities/market-candle.entity");
const replay_session_entity_1 = require("../backtesting/entities/replay-session.entity");
const community_settings_entity_1 = require("../community/entities/community-settings.entity");
const community_post_entity_1 = require("../community/entities/community-post.entity");
const community_follow_entity_1 = require("../community/entities/community-follow.entity");
const community_post_reply_entity_1 = require("../community/entities/community-post-reply.entity");
const economic_event_alert_entity_1 = require("../market-intelligence/entities/economic-event-alert.entity");
const economic_event_analysis_entity_1 = require("../market-intelligence/entities/economic-event-analysis.entity");
const cloud_sql_connector_1 = require("@google-cloud/cloud-sql-connector");
const common_1 = require("@nestjs/common");
const dbLogger = new common_1.Logger('DatabaseDataSource');
const isProduction = process.env.NODE_ENV === 'production';
dbLogger.log(`Database configuration: isProduction=${isProduction}, nodeEnv=${process.env.NODE_ENV}, dbHost=${process.env.DB_HOST}`);
async function createDataSource() {
    const configService = new config_1.ConfigService();
    if (isProduction) {
        if (process.env.INSTANCE_CONNECTION_NAME) {
            if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
                throw new Error('DB_USER/DB_PASSWORD not defined for Cloud SQL.');
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
                    knowledge_document_entity_1.KnowledgeDocument,
                    vector_embedding_entity_1.VectorEmbedding,
                    trade_candle_entity_1.TradeCandle,
                    backtest_trade_entity_1.BacktestTrade,
                    market_log_entity_1.MarketLog,
                    market_candle_entity_1.MarketCandle,
                    replay_session_entity_1.ReplaySession,
                    community_settings_entity_1.CommunitySettings,
                    community_post_entity_1.CommunityPost,
                    community_follow_entity_1.CommunityFollow,
                    community_post_reply_entity_1.CommunityPostReply,
                    economic_event_alert_entity_1.EconomicEventAlert,
                    economic_event_analysis_entity_1.EconomicEventAnalysis,
                ],
                migrations: ['dist/migrations/*{.ts,.js}'],
                synchronize: false,
                logging: false,
            });
        }
        else {
            return new typeorm_1.DataSource({
                type: 'postgres',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432', 10),
                username: process.env.DB_USER || process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE || process.env.DB_NAME || 'tradetaper',
                ssl: { rejectUnauthorized: false },
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
                    knowledge_document_entity_1.KnowledgeDocument,
                    vector_embedding_entity_1.VectorEmbedding,
                    trade_candle_entity_1.TradeCandle,
                    backtest_trade_entity_1.BacktestTrade,
                    market_log_entity_1.MarketLog,
                    market_candle_entity_1.MarketCandle,
                    replay_session_entity_1.ReplaySession,
                    community_settings_entity_1.CommunitySettings,
                    community_post_entity_1.CommunityPost,
                    community_follow_entity_1.CommunityFollow,
                    community_post_reply_entity_1.CommunityPostReply,
                    economic_event_alert_entity_1.EconomicEventAlert,
                    economic_event_analysis_entity_1.EconomicEventAnalysis,
                ],
                migrations: ['dist/migrations/*{.ts,.js}'],
                synchronize: false,
                logging: false,
            });
        }
    }
    else {
        const isSSL = configService.get('DB_SSL') === 'true';
        return new typeorm_1.DataSource({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_DATABASE', 'tradetaper'),
            ssl: isSSL ? { rejectUnauthorized: false } : false,
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
                knowledge_document_entity_1.KnowledgeDocument,
                vector_embedding_entity_1.VectorEmbedding,
                trade_candle_entity_1.TradeCandle,
                backtest_trade_entity_1.BacktestTrade,
                market_log_entity_1.MarketLog,
                market_candle_entity_1.MarketCandle,
                replay_session_entity_1.ReplaySession,
                community_settings_entity_1.CommunitySettings,
                community_post_entity_1.CommunityPost,
                community_follow_entity_1.CommunityFollow,
                community_post_reply_entity_1.CommunityPostReply,
                economic_event_alert_entity_1.EconomicEventAlert,
                economic_event_analysis_entity_1.EconomicEventAnalysis,
            ],
            migrations: ['src/migrations/*{.ts,.js}'],
            synchronize: false,
            logging: true,
        });
    }
}
exports.AppDataSource = createDataSource();
//# sourceMappingURL=data-source.js.map