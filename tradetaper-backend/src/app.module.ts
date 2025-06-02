// tradetaper-backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TradesModule } from './trades/trades.module';
import { MarketDataModule } from './market-data/market-data.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { TagsModule } from './tags/tags.module';
import { WebSocketGatewayModule } from './websocket/websocket.module';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5435'),
      username: process.env.DB_USERNAME || 'bennie',
      password: process.env.DB_PASSWORD || 'tradetaperpass',
      database: process.env.DB_DATABASE || 'tradetaper_dev',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
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
    // ... other modules will go here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
