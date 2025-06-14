// tradetaper-backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TradesModule } from './trades/trades.module';
import { MarketDataModule } from './market-data/market-data.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { TagsModule } from './tags/tags.module';
import { WebSocketGatewayModule } from './websocket/websocket.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ContentModule } from './content/content.module';
import { AdminModule } from './admin/admin.module';
import { StrategiesModule } from './strategies/strategies.module';
import { CommonModule } from './common/common.module';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { Usage } from './subscriptions/entities/usage.entity';
import { User } from './users/entities/user.entity';
import { Trade } from './trades/entities/trade.entity';
import { Tag } from './tags/entities/tag.entity';
import { MT5Account } from './users/entities/mt5-account.entity';
import { Strategy } from './strategies/entities/strategy.entity';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');

        console.log('🔧 Database configuration:', {
          isProduction,
          hasDatabaseUrl: !!databaseUrl,
          nodeEnv: process.env.NODE_ENV
        });

        // Using DATABASE_URL for production (GCP Cloud SQL)
        if (isProduction && databaseUrl && databaseUrl.includes('postgresql://')) {
          console.log('Attempting production database connection with URL:', databaseUrl);
          console.log('FINAL DATABASE CONFIG (app.module.ts):', {
            isProduction,
            databaseUrl,
            ssl: false,
            nodeEnv: process.env.NODE_ENV,
          });
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
            synchronize: false, // Don't auto-sync in production
            ssl: false, // Disable SSL for Cloud SQL
            retryAttempts: 5, // Increase retry attempts
            retryDelay: 3000, // Increase retry delay
            autoLoadEntities: true,
            logging: false,
            maxQueryExecutionTime: 10000, // Increase timeout
            connectTimeoutMS: 20000, // Increase connect timeout
            acquireTimeoutMillis: 10000, // Increase acquire timeout
            timeout: 20000, // Increase overall timeout
          };
        }

        // Fallback: No database configuration
        console.log('⚠️ No database URL provided - running without database');
        return {
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'temp',
          password: 'temp',
          database: 'temp',
          entities: [],
          synchronize: false,
          autoLoadEntities: false,
          logging: false,
          retryAttempts: 0,
        };
      },
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    //   serveRoot: '/uploads',
    // }),
    UsersModule,
    AuthModule,
    TradesModule,
    TagsModule,
    AdminModule,
    CommonModule,
    // TEMPORARY: Disable modules requiring external services for initial admin deployment
    // MarketDataModule,
    // SeedModule,
    // FilesModule,
    // WebSocketGatewayModule,
    // SubscriptionsModule,
    // ContentModule,
    // StrategiesModule,
    // TypeOrmModule.forFeature([Subscription]),
    // ... other modules will go here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
