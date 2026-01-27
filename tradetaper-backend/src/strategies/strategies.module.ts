import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';
import { Strategy } from './entities/strategy.entity';
import { Trade } from '../trades/entities/trade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Strategy, Trade])],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}

