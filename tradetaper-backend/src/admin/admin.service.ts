import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async getDashboardStats() {
    // Get real counts from database
    const totalUsers = await this.userRepository.count();
    const totalTrades = await this.tradeRepository.count();
    const totalSubscriptions = await this.subscriptionRepository.count();
    
    return {
      totalUsers,
      userGrowth: 0,
      activeUsers: 0,
      activeGrowth: 0,
      totalRevenue: 0,
      revenueGrowth: 0,
      totalTrades,
      tradeGrowth: 0
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC'
      }
    });
    
    return {
      data: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt,
        isActive: false,
        subscriptionStatus: 'free',
        lastLoginAt: user.lastLoginAt
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getTrades(page: number = 1, limit: number = 50) {
    const [trades, total] = await this.tradeRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC'
      },
      relations: ['user']
    });
    
    return {
      data: trades.map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        type: trade.side,
        quantity: trade.quantity,
        openPrice: trade.openPrice,
        closePrice: trade.closePrice,
        profit: trade.profitOrLoss || 0,
        status: trade.status,
        createdAt: trade.createdAt,
        user: {
          email: trade.user?.email || 'Unknown'
        }
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getDatabaseTables() {
    return [
      'users',
      'trades', 
      'subscriptions',
      'usage',
      'strategies',
      'mt5_accounts',
      'tags'
    ];
  }

  async getDatabaseTable(table: string) {
    let rowCount = 0;
    
    switch(table) {
      case 'users':
        rowCount = await this.userRepository.count();
        break;
      case 'trades':
        rowCount = await this.tradeRepository.count();
        break;
      case 'subscriptions':
        rowCount = await this.subscriptionRepository.count();
        break;
    }
    
    const tableInfo = {
      users: {
        name: 'users',
        rowCount,
        columns: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
        indexes: ['PRIMARY', 'email_unique'],
        size: '0 MB'
      },
      trades: {
        name: 'trades',
        rowCount,
        columns: ['id', 'userId', 'symbol', 'side', 'quantity', 'openPrice', 'closePrice', 'status', 'createdAt'],
        indexes: ['PRIMARY', 'userId_idx', 'symbol_idx'],
        size: '0 MB'
      },
      subscriptions: {
        name: 'subscriptions',
        rowCount,
        columns: ['id', 'userId', 'plan', 'status', 'createdAt', 'updatedAt'],
        indexes: ['PRIMARY', 'userId_idx'],
        size: '0 MB'
      }
    };
    
    return tableInfo[table] || { error: 'Table not found' };
  }
}
