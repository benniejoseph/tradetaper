import { Repository } from 'typeorm';
import { Strategy } from './entities/strategy.entity';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { Trade } from '../trades/entities/trade.entity';
export declare class StrategiesService {
    private strategiesRepository;
    private tradesRepository;
    constructor(strategiesRepository: Repository<Strategy>, tradesRepository: Repository<Trade>);
    create(createStrategyDto: CreateStrategyDto, userId: string): Promise<Strategy>;
    findAll(userId: string): Promise<Strategy[]>;
    findOne(id: string, userId: string): Promise<Strategy>;
    update(id: string, updateStrategyDto: UpdateStrategyDto, userId: string): Promise<Strategy>;
    remove(id: string, userId: string): Promise<void>;
    toggleActive(id: string, userId: string): Promise<Strategy>;
    getStrategyStats(strategyId: string, userId: string): Promise<{
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
    getAllStrategiesWithStats(userId: string): Promise<{
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
}
