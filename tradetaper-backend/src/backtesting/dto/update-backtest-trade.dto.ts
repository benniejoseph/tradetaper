import { PartialType } from '@nestjs/mapped-types';
import { CreateBacktestTradeDto } from './create-backtest-trade.dto';

export class UpdateBacktestTradeDto extends PartialType(CreateBacktestTradeDto) {}
