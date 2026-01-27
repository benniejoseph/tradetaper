import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
import { BacktestTrade } from './entities/backtest-trade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BacktestTrade])],
  controllers: [BacktestingController],
  providers: [BacktestingService],
  exports: [BacktestingService],
})
export class BacktestingModule {}
