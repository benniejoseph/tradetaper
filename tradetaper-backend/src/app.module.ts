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
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');

        console.log('🔧 Database configuration:', {
          isProduction,
          hasDatabaseUrl: !!databaseUrl,
          nodeEnv: process.env.NODE_ENV
        });

        // Using DATABASE_URL for production (Railway, Heroku, etc)
        if (isProduction && databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
            synchronize: true, // TEMPORARY: Force schema sync
            ssl: {
              rejectUnauthorized: false, // Required for Railway and some other providers
            },
            retryAttempts: 3,
            retryDelay: 3000,
            autoLoadEntities: true,
            logging: false, // Disable query logging in production
            maxQueryExecutionTime: 30000, // 30 seconds timeout
            connectTimeoutMS: 30000,
            acquireTimeoutMillis: 30000,
            timeout: 30000,
          };
        }

        // Using DATABASE_URL for development if provided
        if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            retryAttempts: 3,
            retryDelay: 3000,
            autoLoadEntities: true,
            logging: false,
          };
        }

        // Using individual DB config params for development
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'tradetaper_dev'),
          entities: [User, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          retryAttempts: 3,
          retryDelay: 3000,
          autoLoadEntities: true,
          logging: false,
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
    MarketDataModule,
    TagsModule,
    SeedModule,
    FilesModule,
    WebSocketGatewayModule,
    SubscriptionsModule,
    ContentModule,
    AdminModule,
    StrategiesModule,
    CommonModule,
    TypeOrmModule.forFeature([Subscription]),
    // ... other modules will go here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
