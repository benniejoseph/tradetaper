import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Account } from '../users/entities/account.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Usage } from '../subscriptions/entities/usage.entity';
import { Strategy } from '../strategies/entities/strategy.entity';
import { Note } from '../notes/entities/note.entity';
import { NoteBlock } from '../notes/entities/note-block.entity';
import { NoteMedia } from '../notes/entities/note-media.entity';
import { PsychologicalInsight } from '../notes/entities/psychological-insight.entity';
import { KnowledgeDocument } from '../knowledge-base/entities/knowledge-document.entity';
import { VectorEmbedding } from '../knowledge-base/entities/vector-embedding.entity';
import { TradeCandle } from '../trades/entities/trade-candle.entity';
import { BacktestTrade } from '../backtesting/entities/backtest-trade.entity';
import { BacktestChartLayout } from '../backtesting/entities/backtest-chart-layout.entity';
import { MarketLog } from '../backtesting/entities/market-log.entity';
import { MarketCandle } from '../backtesting/entities/market-candle.entity';
import { ReplaySession } from '../backtesting/entities/replay-session.entity';
import { CommunitySettings } from '../community/entities/community-settings.entity';
import { CommunityPost } from '../community/entities/community-post.entity';
import { CommunityFollow } from '../community/entities/community-follow.entity';
import { CommunityPostReply } from '../community/entities/community-post-reply.entity';
import { EconomicEventAlert } from '../market-intelligence/entities/economic-event-alert.entity';
import { EconomicEventAnalysis } from '../market-intelligence/entities/economic-event-analysis.entity';
import { EconomicEventRelease } from '../market-intelligence/entities/economic-event-release.entity';
import { CotWeeklyReport } from '../market-intelligence/entities/cot-weekly-report.entity';
import { AuthSession } from '../auth/entities/auth-session.entity';
import { AdminMfaCredential } from '../admin/entities/admin-mfa-credential.entity';
import { AdminAuthAuditLog } from '../admin/entities/admin-auth-audit-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationPreference } from '../notifications/entities/notification-preference.entity';
import { Connector } from '@google-cloud/cloud-sql-connector';

import { Logger } from '@nestjs/common';

const dbLogger = new Logger('DatabaseDataSource');

const isProduction = process.env.NODE_ENV === 'production';
const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
const selectPoolerUser = (): string | undefined => {
  const candidates = splitCsv(process.env.DB_USER_CANDIDATES);
  return candidates.find((candidate) => candidate.includes('.')) || candidates[0];
};

dbLogger.log(
  `Database configuration: isProduction=${isProduction}, nodeEnv=${process.env.NODE_ENV}, dbHost=${process.env.DB_POOLER_HOST || process.env.DB_HOST}`,
);

async function createDataSource() {
  const configService = new ConfigService();

  if (isProduction) {
    // If INSTANCE_CONNECTION_NAME is present, use Cloud SQL Connector (GCP Native)
    if (process.env.INSTANCE_CONNECTION_NAME) {
      if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
        throw new Error('DB_USER/DB_PASSWORD not defined for Cloud SQL.');
      }
      const connector = new Connector();
      const clientOpts = await connector.getOptions({
        instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
      });
      return new DataSource({
        ...clientOpts,
        type: 'postgres',
        database: process.env.DB_NAME || 'tradetaper',
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        entities: [
          User,
          Account,
          Trade,
          Tag,
          MT5Account,
          Subscription,
          Usage,
          Strategy,
          Note,
          NoteBlock,
          NoteMedia,
          PsychologicalInsight,
          KnowledgeDocument,
          VectorEmbedding,
          TradeCandle,
          BacktestTrade,
          BacktestChartLayout,
          MarketLog,
          MarketCandle,
          ReplaySession,
          CommunitySettings,
          CommunityPost,
          CommunityFollow,
          CommunityPostReply,
          EconomicEventAlert,
          EconomicEventAnalysis,
          EconomicEventRelease,
          CotWeeklyReport,
          AuthSession,
          AdminMfaCredential,
          AdminAuthAuditLog,
          Notification,
          NotificationPreference,
        ],
        migrations: ['dist/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: false,
      });
    } else {
      // Use standard connection (e.g. Supabase / External Postgres)
      const usePooler = Boolean(process.env.DB_POOLER_HOST);
      const host = process.env.DB_POOLER_HOST || process.env.DB_HOST;
      const port = usePooler
        ? parsePositiveInt(process.env.DB_POOLER_PORT, 6543)
        : parsePositiveInt(process.env.DB_PORT, 5432);
      const username = usePooler
        ? selectPoolerUser() ||
          process.env.DB_USER ||
          process.env.DB_USERNAME ||
          process.env.DATABASE_USERNAME
        : process.env.DB_USER ||
          process.env.DB_USERNAME ||
          process.env.DATABASE_USERNAME ||
          selectPoolerUser();
      const timeoutMs = parsePositiveInt(process.env.DB_CONNECTION_TIMEOUT_MS, 15000);

      if (!host) {
        throw new Error(
          'Database host is not configured. Set DB_POOLER_HOST or DB_HOST.',
        );
      }

      return new DataSource({
        type: 'postgres',
        host,
        port,
        username,
        password: process.env.DB_PASSWORD,
        database:
          process.env.DB_DATABASE || process.env.DB_NAME || 'tradetaper',
        ssl: { rejectUnauthorized: false }, // Required for Supabase/Cloud
        extra: {
          connectionTimeoutMillis: timeoutMs,
          query_timeout: parsePositiveInt(process.env.DB_QUERY_TIMEOUT_MS, 60000),
          statement_timeout: parsePositiveInt(process.env.DB_QUERY_TIMEOUT_MS, 60000),
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
        },
        entities: [
          User,
          Account,
          Trade,
          Tag,
          MT5Account,
          Subscription,
          Usage,
          Strategy,
          Note,
          NoteBlock,
          NoteMedia,
          PsychologicalInsight,
          KnowledgeDocument,
          VectorEmbedding,
          TradeCandle,
          BacktestTrade,
          BacktestChartLayout,
          MarketLog,
          MarketCandle,
          ReplaySession,
          CommunitySettings,
          CommunityPost,
          CommunityFollow,
          CommunityPostReply,
          EconomicEventAlert,
          EconomicEventAnalysis,
          EconomicEventRelease,
          CotWeeklyReport,
          AuthSession,
          AdminMfaCredential,
          AdminAuthAuditLog,
          Notification,
          NotificationPreference,
        ],
        migrations: ['dist/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: false,
      });
    }
  } else {
    // Development configuration
    const isSSL = configService.get<string>('DB_SSL') === 'true';
    const devPoolerHost = configService.get<string>('DB_POOLER_HOST');
    const usePooler = Boolean(devPoolerHost);
    const host = usePooler
      ? devPoolerHost!
      : configService.get<string>('DB_HOST', 'localhost');
    const port = usePooler
      ? parsePositiveInt(configService.get<string>('DB_POOLER_PORT'), 6543)
      : parsePositiveInt(configService.get<string>('DB_PORT'), 5432);
    const username = usePooler
      ? selectPoolerUser() ||
        configService.get<string>('DB_USER') ||
        configService.get<string>('DB_USERNAME') ||
        configService.get<string>('DATABASE_USERNAME')
      : configService.get<string>('DB_USERNAME') ||
        configService.get<string>('DB_USER') ||
        'postgres';

    return new DataSource({
      type: 'postgres',
      host,
      port,
      username,
      password: configService.get<string>('DB_PASSWORD', 'postgres'),
      database: configService.get<string>('DB_DATABASE', 'tradetaper'),
      ssl: isSSL ? { rejectUnauthorized: false } : false,
      entities: [
        User,
        Account,
        Trade,
        Tag,
        MT5Account,
        Subscription,
        Usage,
        Strategy,
        Note,
        NoteBlock,
        NoteMedia,
        PsychologicalInsight,
        KnowledgeDocument,
        VectorEmbedding,
        TradeCandle,
        BacktestTrade,
        BacktestChartLayout,
        MarketLog,
        MarketCandle,
        ReplaySession,
        CommunitySettings,
        CommunityPost,
        CommunityFollow,
        CommunityPostReply,
        EconomicEventAlert,
        EconomicEventAnalysis,
        EconomicEventRelease,
        CotWeeklyReport,
        AuthSession,
        AdminMfaCredential,
        AdminAuthAuditLog,
        Notification,
        NotificationPreference,
      ],
      migrations: ['src/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: true,
    });
  }
}

export const AppDataSource = createDataSource();
