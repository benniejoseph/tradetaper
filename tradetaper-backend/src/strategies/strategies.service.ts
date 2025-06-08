import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strategy } from './entities/strategy.entity';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Injectable()
export class StrategiesService {
  constructor(
    @InjectRepository(Strategy)
    private strategiesRepository: Repository<Strategy>,
  ) {}

  async create(createStrategyDto: CreateStrategyDto, userId: string): Promise<Strategy> {
    const strategy = this.strategiesRepository.create({
      ...createStrategyDto,
      userId,
    });
    return await this.strategiesRepository.save(strategy);
  }

  async findAll(userId: string): Promise<Strategy[]> {
    return await this.strategiesRepository.find({
      where: { userId },
      relations: ['trades'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Strategy> {
    const strategy = await this.strategiesRepository.findOne({
      where: { id, userId },
      relations: ['trades'],
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    return strategy;
  }

  async update(id: string, updateStrategyDto: UpdateStrategyDto, userId: string): Promise<Strategy> {
    const strategy = await this.findOne(id, userId);
    
    Object.assign(strategy, updateStrategyDto);
    return await this.strategiesRepository.save(strategy);
  }

  async remove(id: string, userId: string): Promise<void> {
    const strategy = await this.findOne(id, userId);
    await this.strategiesRepository.remove(strategy);
  }

  async toggleActive(id: string, userId: string): Promise<Strategy> {
    const strategy = await this.findOne(id, userId);
    strategy.isActive = !strategy.isActive;
    return await this.strategiesRepository.save(strategy);
  }

  async getStrategyStats(id: string, userId: string) {
    const strategy = await this.strategiesRepository
      .createQueryBuilder('strategy')
      .leftJoinAndSelect('strategy.trades', 'trade')
      .where('strategy.id = :id', { id })
      .andWhere('strategy.userId = :userId', { userId })
      .getOne();

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    const trades = strategy.trades || [];
    const closedTrades = trades.filter(trade => trade.status === 'Closed');
    
    const totalTrades = trades.length;
    const winningTrades = closedTrades.filter(trade => (trade.profitOrLoss || 0) > 0).length;
    const losingTrades = closedTrades.filter(trade => (trade.profitOrLoss || 0) < 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
    
    const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0);
    const averagePnl = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;
    
    const profitTrades = closedTrades.filter(trade => (trade.profitOrLoss || 0) > 0);
    const lossTrades = closedTrades.filter(trade => (trade.profitOrLoss || 0) < 0);
    
    const averageWin = profitTrades.length > 0 ? 
      profitTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0) / profitTrades.length : 0;
    const averageLoss = lossTrades.length > 0 ?
      Math.abs(lossTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0) / lossTrades.length) : 0;
    
    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

    return {
      totalTrades,
      closedTrades: closedTrades.length,
      winningTrades,
      losingTrades,
      winRate: Math.round(winRate * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      averagePnl: Math.round(averagePnl * 100) / 100,
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
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
      })
    );

    return strategiesWithStats;
  }
}