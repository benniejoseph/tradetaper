// src/seed/test-user-seed.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Strategy } from '../strategies/entities/strategy.entity';
import {
  AssetType,
  TradeDirection,
  TradeStatus,
  ICTConcept,
  TradingSession,
} from '../types/enums';

@Injectable()
export class TestUserSeedService {
  private readonly logger = new Logger(TestUserSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepository: Repository<MT5Account>,
    @InjectRepository(Strategy)
    private readonly strategyRepository: Repository<Strategy>,
  ) {}

  async createTestUser(): Promise<{
    user: User;
    stats: {
      trades: number;
      accounts: number;
      strategies: number;
      tags: number;
    };
  }> {
    this.logger.log('Creating comprehensive test user with trading data...');

    // Create test user
    const testUser = this.userRepository.create({
      email: 'trader@tradetaper.com',
      password: 'TradeTest123!', // Will be hashed by @BeforeInsert
      firstName: 'Alex',
      lastName: 'Trader',
    });

    const savedUser = await this.userRepository.save(testUser);
    this.logger.log(`Created test user: ${savedUser.email} (${savedUser.id})`);

    // Create MT5 accounts
    const accounts = await this.createMT5Accounts(savedUser.id);
    
    // Create trading strategies
    const strategies = await this.createStrategies(savedUser.id);
    
    // Create tags
    const tags = await this.createTags(savedUser.id);
    
    // Create comprehensive trades
    const trades = await this.createTrades(savedUser.id, accounts, strategies, tags);

    const stats = {
      trades: trades.length,
      accounts: accounts.length,
      strategies: strategies.length,
      tags: tags.length,
    };

    this.logger.log(`Test user created successfully with ${JSON.stringify(stats)}`);

    return { user: savedUser, stats };
  }

  private async createMT5Accounts(userId: string): Promise<MT5Account[]> {
    const accountsData = [
      {
        userId,
        accountName: 'FTMO Challenge - 100K',
        server: 'FTMO-Server',
        login: '5012345',
        password: 'demo-password',
        isActive: true,
        balance: 100000,
        accountType: 'demo',
        currency: 'USD',
      },
      {
        userId,
        accountName: 'Live Account - ICMarkets',
        server: 'ICMarkets-Live',
        login: '8012345',
        password: 'live-password',
        isActive: true,
        balance: 15000,
        accountType: 'live',
        currency: 'USD',
      },
    ];

    const accounts: MT5Account[] = [];
    for (const accountData of accountsData) {
      const account = this.mt5AccountRepository.create(accountData);
      accounts.push(await this.mt5AccountRepository.save(account));
    }

    this.logger.log(`Created ${accounts.length} MT5 accounts`);
    return accounts;
  }

  private async createStrategies(userId: string): Promise<Strategy[]> {
    const strategiesData = [
      {
        name: 'ICT London Open',
        description: 'Trade London session using ICT concepts.',
        tradingSession: TradingSession.LONDON,
        color: '#3B82F6',
        tags: 'ICT, London, MSS, OTE',
        checklist: [
          { id: '1', text: 'Check DXY bias', completed: false, order: 1 },
          { id: '2', text: 'Identify previous day high/low', completed: false, order: 2 },
        ],
      },
    ];

    const strategies: Strategy[] = [];
    for (const strategyData of strategiesData) {
      const strategy = this.strategyRepository.create({
        ...strategyData,
        userId,
      });
      strategies.push(await this.strategyRepository.save(strategy));
    }

    this.logger.log(`Created ${strategies.length} trading strategies`);
    return strategies;
  }

  private async createTags(userId: string): Promise<Tag[]> {
    const tagsData = [
      { name: 'High Probability', color: '#10B981' },
      { name: 'London Open', color: '#3B82F6' },
      { name: 'ICT Setup', color: '#8B5CF6' },
    ];

    const tags: Tag[] = [];
    for (const tagData of tagsData) {
      const tag = this.tagRepository.create({
        ...tagData,
        userId,
      });
      tags.push(await this.tagRepository.save(tag));
    }

    this.logger.log(`Created ${tags.length} tags`);
    return tags;
  }

  private async createTrades(
    userId: string,
    accounts: MT5Account[],
    strategies: Strategy[],
    tags: Tag[],
  ): Promise<Trade[]> {
    const trades: Trade[] = [];
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY'];

    // Generate 50 trades
    for (let i = 0; i < 50; i++) {
      const account = accounts[0];
      const strategy = strategies[0];
      const symbol = forexPairs[i % forexPairs.length];
      
      const openTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const direction = Math.random() > 0.5 ? TradeDirection.LONG : TradeDirection.SHORT;
      const status = TradeStatus.CLOSED;
      
      const basePrice = 1.0850;
      const openPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const closePrice = openPrice + (Math.random() - 0.5) * basePrice * 0.005;
      const closeTime = new Date(openTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);

      const quantity = 1.0;
      const commission = 5.0;
      const profitOrLoss = Math.random() > 0.6 ? Math.random() * 100 : -Math.random() * 50;

      const trade = this.tradeRepository.create({
        userId,
        accountId: account.id,
        strategyId: strategy.id,
        assetType: AssetType.FOREX,
        symbol,
        side: direction,
        status,
        openTime,
        openPrice: parseFloat(openPrice.toFixed(5)),
        closeTime,
        closePrice: parseFloat(closePrice.toFixed(5)),
        quantity,
        commission,
        profitOrLoss: parseFloat(profitOrLoss.toFixed(2)),
        ictConcept: ICTConcept.FVG,
        session: TradingSession.LONDON,
        setupDetails: 'Good setup with confirmation',
        notes: 'Trade executed well',
        tags: [tags[0]],
      });

      trades.push(trade);
    }

    const savedTrades = await this.tradeRepository.save(trades);
    this.logger.log(`Created ${savedTrades.length} trades`);
    return savedTrades;
  }

  async deleteTestUser(): Promise<void> {
    const testUser = await this.userRepository.findOne({
      where: { email: 'trader@tradetaper.com' }
    });

    if (testUser) {
      await this.userRepository.remove(testUser);
      this.logger.log('Test user and all related data deleted');
    }
  }
} 