import { Injectable, NotFoundException } from '@nestjs/common';
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

  getStrategyStats() {
    // For now, return default stats since we don't have the relationship set up
    // TODO: Implement proper trade querying when relationships are working
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

  async getAllStrategiesWithStats(userId: string) {
    const strategies = await this.findAll(userId);

    const strategiesWithStats = await Promise.all(
      strategies.map((strategy) => {
        const stats = this.getStrategyStats();
        return {
          ...strategy,
          stats,
        };
      }),
    );

    return strategiesWithStats;
  }
}
