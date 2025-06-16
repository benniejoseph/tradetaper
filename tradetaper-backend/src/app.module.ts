// tradetaper-backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TradesModule } from './trades/trades.module';
import { TagsModule } from './tags/tags.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { WebSocketGatewayModule } from './websocket/websocket.module';
import { StrategiesModule } from './strategies/strategies.module';
import { FilesModule } from './files/files.module';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { Usage } from './subscriptions/entities/usage.entity';
import { User } from './users/entities/user.entity';
import { Trade } from './trades/entities/trade.entity';
import { Tag } from './tags/entities/tag.entity';
import { MT5Account } from './users/entities/mt5-account.entity';
import { Strategy } from './strategies/entities/strategy.entity';

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
        
        console.log('🔧 Database configuration:', {
          isProduction,
          nodeEnv: process.env.NODE_ENV
        });

        // For production, use Cloud SQL with Unix socket
        if (isProduction) {
          console.log('Using Cloud SQL configuration for production');
          
          return {
            type: 'postgres' as const,
            host: '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
            username: 'tradetaper',
            password: 'TradeTaper2024',
            database: 'tradetaper',
            entities: [User, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
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

        // For development
        console.log('Using local database configuration for development');
        return {
          type: 'postgres' as const,
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'tradetaper',
          entities: [User, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
          synchronize: true,
          autoLoadEntities: true,
          logging: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    TradesModule,
    TagsModule,
    AdminModule,
    CommonModule,
    WebSocketGatewayModule,
    StrategiesModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
