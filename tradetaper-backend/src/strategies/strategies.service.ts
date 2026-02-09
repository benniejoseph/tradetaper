import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strategy } from './entities/strategy.entity';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { Trade } from '../trades/entities/trade.entity';
import { TradeStatus } from '../types/enums';

@Injectable()
export class StrategiesService {
  constructor(
    @InjectRepository(Strategy)
    private strategiesRepository: Repository<Strategy>,
    @InjectRepository(Trade)
    private tradesRepository: Repository<Trade>,
  ) {}

  async create(
    createStrategyDto: CreateStrategyDto,
    userId: string,
  ): Promise<Strategy> {
    const strategy = this.strategiesRepository.create({
      ...createStrategyDto,
      userId,
    });
    return await this.strategiesRepository.save(strategy);
  }

  async findAll(userId: string): Promise<Strategy[]> {
    return await this.strategiesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Strategy> {
    const strategy = await this.strategiesRepository.findOne({
      where: { id, userId },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    return strategy;
  }

  async update(
    id: string,
    updateStrategyDto: UpdateStrategyDto,
    userId: string,
  ): Promise<Strategy> {
    const strategy = await this.findOne(id, userId);

    Object.assign(strategy, updateStrategyDto);
    return await this.strategiesRepository.save(strategy);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.strategiesRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
  }

  async toggleActive(id: string, userId: string): Promise<Strategy> {
    const strategy = await this.findOne(id, userId);
    strategy.isActive = !strategy.isActive;
    return await this.strategiesRepository.save(strategy);
  }

  async getStrategyStats(strategyId: string, userId: string) {
    // Get all closed trades for this strategy
    const trades = await this.tradesRepository.find({
      where: {
        strategyId,
        userId,
        status: TradeStatus.CLOSED,
      },
    });

    const closedTrades = trades.length;

    if (closedTrades === 0) {
      return {
        totalTrades: 0,
        closedTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnl: 0,
        averagePnl: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
      };
    }

    // Calculate stats from trades
    const winningTrades = trades.filter((t) => (t.profitOrLoss || 0) > 0);
    const losingTrades = trades.filter((t) => (t.profitOrLoss || 0) < 0);

    const totalPnl = trades.reduce(
      (sum, t) => sum + (Number(t.profitOrLoss) || 0),
      0,
    );
    const totalWins = winningTrades.reduce(
      (sum, t) => sum + (Number(t.profitOrLoss) || 0),
      0,
    );
    const totalLosses = Math.abs(
      losingTrades.reduce((sum, t) => sum + (Number(t.profitOrLoss) || 0), 0),
    );

    const winRate = (winningTrades.length / closedTrades) * 100;
    const averagePnl = totalPnl / closedTrades;
    const averageWin =
      winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss =
      losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const profitFactor =
      totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    return {
      totalTrades: closedTrades,
      closedTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: parseFloat(winRate.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      averagePnl: parseFloat(averagePnl.toFixed(2)),
      averageWin: parseFloat(averageWin.toFixed(2)),
      averageLoss: parseFloat(averageLoss.toFixed(2)),
      profitFactor:
        profitFactor === Infinity
          ? 999.99
          : parseFloat(profitFactor.toFixed(2)),
    };
  }

  async getAllStrategiesWithStats(userId: string) {
    const strategies = await this.findAll(userId);

    const strategiesWithStats = await Promise.all(
      strategies.map(async (strategy) => {
        const stats = await this.getStrategyStats(strategy.id, userId);
        return {
          ...strategy,
          stats,
        };
      }),
    );

    return strategiesWithStats;
  }
}
