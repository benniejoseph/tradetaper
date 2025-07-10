import { Trade } from './entities/trade.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
export interface ExportOptions {
    format: 'csv' | 'json' | 'xlsx';
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
}
export declare class ExportService {
    private readonly logger;
    exportTrades(trades: Trade[], options: ExportOptions, userContext: UserResponseDto): Promise<{
        data: string | Buffer;
        filename: string;
        mimeType: string;
    }>;
    private generateCSV;
    private generateJSON;
    private generateXLSX;
}
