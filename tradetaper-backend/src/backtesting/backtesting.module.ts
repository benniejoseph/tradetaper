import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
import { BacktestTrade } from './entities/backtest-trade.entity';
import { MarketLog } from './entities/market-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BacktestTrade, MarketLog])],
  controllers: [BacktestingController],
  providers: [BacktestingService],
  exports: [BacktestingService],
})
export class BacktestingModule {}

