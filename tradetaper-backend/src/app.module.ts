// tradetaper-backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { AppDataSource } from './data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        try {
          console.log('🔧 Initializing TypeORM module...');
          const dataSource = await AppDataSource;
          console.log('✅ TypeORM module received data source.');
          return dataSource.options;
        } catch (error) {
          console.error(
            '❌ FATAL: Failed to initialize TypeORM module:',
            error,
          );
          process.exit(1);
        }
      },
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
