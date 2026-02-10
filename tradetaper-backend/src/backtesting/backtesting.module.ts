import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
import { TagService } from './services/tag.service';
import { BacktestInsightsService } from './services/backtest-insights.service';
import { CandleManagementService } from './services/candle-management.service';
import { ReplaySessionService } from './services/replay-session.service';
import { BacktestTrade } from './entities/backtest-trade.entity';
import { MarketLog } from './entities/market-log.entity';
import { MarketCandle } from './entities/market-candle.entity';
import { ReplaySession } from './entities/replay-session.entity';
import { YahooFinanceService } from '../integrations/yahoo-finance/yahoo-finance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BacktestTrade,
      MarketLog,
      MarketCandle,
      ReplaySession,
    ]),
  ],
  controllers: [BacktestingController],
  providers: [
    BacktestingService,
    TagService,
    BacktestInsightsService,
    CandleManagementService,
    ReplaySessionService,
    YahooFinanceService,
  ],
  exports: [
    BacktestingService,
    TagService,
    CandleManagementService,
    ReplaySessionService,
  ],
})
export class BacktestingModule {}
