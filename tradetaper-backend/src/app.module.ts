// tradetaper-backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TradesModule } from './trades/trades.module';
import { TagsModule } from './tags/tags.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
// import { WebSocketGatewayModule } from './websocket/websocket.module';
import { StrategiesModule } from './strategies/strategies.module';
import { FilesModule } from './files/files.module';
import { MarketDataModule } from './market-data/market-data.module';
import { SimpleWebSocketModule } from './websocket/simple-websocket.module';
import { NotesModule } from './notes/notes.module';
import { DatabaseModule } from './database/database.module';
import { PredictiveTradesModule } from './predictive-trades/predictive-trades.module';
import { MarketIntelligenceModule } from './market-intelligence/market-intelligence.module';
import { AgentOrchestratorModule } from './agents/agent-orchestrator.module';
import { AgentsImplementationModule } from './agents/implementations/agents-implementation.module';
import { AgentsModule } from './agents/agents.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BacktestingModule } from './backtesting/backtesting.module';
import { StatementParserModule } from './statement-parser/statement-parser.module';
import { TerminalFarmModule } from './terminal-farm/terminal-farm.module';
import { DisciplineModule } from './discipline/discipline.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UploadModule } from './upload/upload.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        // If Redis URL is provided, use Redis; otherwise fall back to in-memory
        if (redisUrl) {
          const keyv = new Keyv({
            store: new KeyvRedis(redisUrl),
            namespace: 'tradetaper',
          });

          return {
            store: keyv as any,
            ttl: 600, // 10 minutes default TTL
          };
        }

        // Fallback to in-memory cache if Redis not configured
        return {
          ttl: 600,
        };
      },
    }),
    AgentOrchestratorModule, // Multi-agent coordination layer
    DatabaseModule,
    UsersModule,
    AuthModule,
    TradesModule,
    TagsModule,
    AdminModule,
    CommonModule,
    // WebSocketGatewayModule,
    StrategiesModule,
    FilesModule,
    MarketDataModule,
    SimpleWebSocketModule,
    NotesModule,
    PredictiveTradesModule,
    MarketIntelligenceModule,
    MarketIntelligenceModule,
    AgentsImplementationModule, // AI Agents (Psychology, Market Analyst, Risk Manager)
    AgentsModule,
    AnalyticsModule,
    NotificationsModule,
    BacktestingModule, // Strategy backtesting framework
    StatementParserModule, // MT4/MT5 statement file upload and parsing
    TerminalFarmModule, // MT5 terminal auto-sync infrastructure
    DisciplineModule, // Trade discipline, gamification, pre-trade approvals
    CommunityModule, // Public community + leaderboards
    SubscriptionsModule,
    UploadModule, // File upload (screenshots, documents)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
