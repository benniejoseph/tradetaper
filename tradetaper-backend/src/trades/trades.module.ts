// src/trades/trades.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { UsersModule } from '../users/users.module';
import { TagsModule } from '../tags/tags.module';
import { CacheModule } from '@nestjs/cache-manager';
// import { WebSocketGatewayModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade]),
    forwardRef(() => UsersModule),
    TagsModule,
    // forwardRef(() => WebSocketGatewayModule),
    CacheModule.register({
      ttl: 60 * 60 * 1000, // 1 hour
      max: 100, // maximum number of items in cache
    }),
  ],
  providers: [TradesService],
  controllers: [TradesController],
  exports: [TradesService],
})
export class TradesModule {}
