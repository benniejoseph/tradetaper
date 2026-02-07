import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';
import { Strategy } from './entities/strategy.entity';
import { Trade } from '../trades/entities/trade.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Strategy, Trade]),
    SubscriptionsModule,
  ],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}

