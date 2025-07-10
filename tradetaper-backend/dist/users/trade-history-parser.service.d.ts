import { ParsedTradeData } from './dto/mt5-account.dto';
export declare class TradeHistoryParserService {
    private readonly logger;
    parseTradeHistory(buffer: Buffer, fileType: 'html' | 'xlsx', fileName: string): Promise<{
        trades: ParsedTradeData[];
        accountBalance?: number;
        accountCurrency?: string;
        totalNetProfit?: number;
        equity?: number;
    }>;
    private parseHTMLTradeHistory;
    private parseExcelTradeHistory;
    private parseDateTime;
    private parseExcelDateTime;
}
