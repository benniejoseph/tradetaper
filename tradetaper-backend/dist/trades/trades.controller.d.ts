import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { Trade } from './entities/trade.entity';
export declare class TradesController {
    private readonly tradesService;
    constructor(tradesService: TradesService);
    create(createTradeDto: CreateTradeDto, req: any): Promise<Trade>;
    findAll(req: any, accountId?: string): Promise<Trade[]>;
    findOne(id: string, req: any): Promise<Trade>;
    update(id: string, updateTradeDto: UpdateTradeDto, req: any): Promise<Trade>;
    remove(id: string, req: any): Promise<void>;
    bulkDelete(body: {
        tradeIds: string[];
    }, req: any): Promise<{
        deletedCount: number;
    }>;
    bulkUpdate(body: {
        updates: {
            id: string;
            data: Partial<UpdateTradeDto>;
        }[];
    }, req: any): Promise<{
        updatedCount: number;
        trades: Trade[];
    }>;
    bulkImport(body: {
        trades: CreateTradeDto[];
    }, req: any): Promise<{
        importedCount: number;
        trades: Trade[];
    }>;
}
