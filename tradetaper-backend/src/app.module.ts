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
import { Subscription } from './subscriptions/entities/subscription.entity';
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
        // Check if DATABASE_URL is provided (common in deployment platforms)
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (databaseUrl) {
          // Parse DATABASE_URL for platforms like Railway, Render, Heroku
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize:
              configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true' ||
              configService.get<string>('NODE_ENV') !== 'production',
            ssl: configService.get<string>('NODE_ENV') === 'production' ? {
              rejectUnauthorized: false,
            } : false,
          };
        }
        
        // Fallback to individual database variables
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5435),
          username: configService.get<string>('DB_USERNAME', 'bennie'),
          password: configService.get<string>('DB_PASSWORD', 'tradetaperpass'),
          database: configService.get<string>('DB_DATABASE', 'tradetaper_dev'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize:
            configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true' ||
            configService.get<string>('NODE_ENV') !== 'production',
          ssl: configService.get<string>('NODE_ENV') === 'production' ? {
            rejectUnauthorized: false,
          } : false,
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
    TypeOrmModule.forFeature([Subscription]),
    // ... other modules will go here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
