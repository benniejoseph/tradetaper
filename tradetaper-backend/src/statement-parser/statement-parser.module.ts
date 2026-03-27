// src/statement-parser/statement-parser.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementUpload } from './entities/statement-upload.entity';
import { StatementParserService } from './statement-parser.service';
import { StatementParserController } from './statement-parser.controller';
import { MT4HtmlParser } from './parsers/mt4-html.parser';
import { MT5CsvParser } from './parsers/mt5-csv.parser';
import { TradesModule } from '../trades/trades.module';
import { Account } from '../users/entities/account.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StatementUpload, Account, MT5Account]),
    forwardRef(() => TradesModule),
  ],
  controllers: [StatementParserController],
  providers: [StatementParserService, MT4HtmlParser, MT5CsvParser],
  exports: [StatementParserService],
})
export class StatementParserModule {}
