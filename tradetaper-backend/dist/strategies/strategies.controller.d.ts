import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
export declare class StrategiesController {
    private readonly strategiesService;
    constructor(strategiesService: StrategiesService);
    create(createStrategyDto: CreateStrategyDto, req: any): Promise<import("./entities/strategy.entity").Strategy>;
    findAll(req: any): Promise<import("./entities/strategy.entity").Strategy[]>;
    getAllWithStats(req: any): Promise<{
        stats: {
            totalTrades: number;
            closedTrades: number;
            winningTrades: number;
            losingTrades: number;
            winRate: number;
            totalPnl: number;
            averagePnl: number;
            averageWin: number;
            averageLoss: number;
            profitFactor: number;
        };
        id: string;
        name: string;
        description: string;
        checklist: import("./entities/strategy.entity").ChecklistItem[];
        tradingSession: import("../types/enums").TradingSession;
        isActive: boolean;
        maxRiskPercent: number;
        color: string;
        tags: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }[]>;
    findOne(id: string, req: any): Promise<import("./entities/strategy.entity").Strategy>;
    getStats(id: string, req: any): Promise<{
        totalTrades: number;
        closedTrades: number;
        winningTrades: number;
        losingTrades: number;
        winRate: number;
        totalPnl: number;
        averagePnl: number;
        averageWin: number;
        averageLoss: number;
        profitFactor: number;
    }>;
    update(id: string, updateStrategyDto: UpdateStrategyDto, req: any): Promise<import("./entities/strategy.entity").Strategy>;
    toggleActive(id: string, req: any): Promise<import("./entities/strategy.entity").Strategy>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
