/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/seed/seed.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  Trade,
  AssetType,
  TradeDirection,
  TradeStatus,
  ICTConcept,
  TradingSession,
} from '../trades/entities/trade.entity';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { addDays, subDays, format } from 'date-fns';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  // Trading account IDs that match the frontend
  private readonly TRADING_ACCOUNTS = [
    'acc_binance_main',
    'acc_kucoin_spot',
    'acc_bybit_futures',
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      this.logger.log('Skipping seed data in non-development environment.');
      return;
    }

    const userCount = await this.userRepository.count();
    const tradeCount = await this.tradeRepository.count();
    if (
      userCount > 0 &&
      tradeCount > 0 &&
      this.configService.get<string>('FORCE_SEED') !== 'true'
    ) {
      this.logger.log(
        'Database likely contains data. Skipping seed. Set FORCE_SEED=true in .env to override.',
      );
      return;
    }

    this.logger.log('Starting database seed process...');
    await this.seedUsersAndTrades();
    this.logger.log('Database seeding completed.');
  }

  private async seedUsersAndTrades() {
    try {
      let user1Data: UserResponseDto | Pick<User, 'id' | 'email'> | undefined;
      let user2Data: UserResponseDto | Pick<User, 'id' | 'email'> | undefined;

      // Create/Fetch User 1
      const existingUser1 = await this.userRepository.findOneBy({
        email: 'user1@example.com',
      });
      if (existingUser1) {
        user1Data = { id: existingUser1.id, email: existingUser1.email };
        this.logger.log(`Found existing user: ${user1Data.email}`);
      } else {
        user1Data = await this.usersService.create({
          email: 'user1@example.com',
          password: 'password123',
          firstName: 'Demo',
          lastName: 'UserOne',
        });
        this.logger.log(`Created user: ${user1Data.email}`);
      }

      // Create/Fetch User 2
      const existingUser2 = await this.userRepository.findOneBy({
        email: 'user2@example.com',
      });
      if (existingUser2) {
        user2Data = { id: existingUser2.id, email: existingUser2.email };
        this.logger.log(`Found existing user: ${user2Data.email}`);
      } else {
        user2Data = await this.usersService.create({
          email: 'user2@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'UserTwo',
        });
        this.logger.log(`Created user: ${user2Data.email}`);
      }

      // Seed Trades for User 1
      if (user1Data && user1Data.id) {
        const user1TradeCount = await this.tradeRepository.count({
          where: { userId: user1Data.id },
        });
        if (user1TradeCount === 0) {
          let totalTrades = 0;

          for (const accountId of this.TRADING_ACCOUNTS) {
            const accountTrades = this.generateTradesForAccount(
              user1Data.id,
              accountId,
              1,
            );

            for (const tradeData of accountTrades) {
              const trade = this.tradeRepository.create(tradeData);
              this.calculateTradeMetrics(trade);
              await this.tradeRepository.save(trade);
              totalTrades++;
            }
          }

          this.logger.log(
            `Seeded ${totalTrades} trades for ${user1Data.email} across ${this.TRADING_ACCOUNTS.length} accounts`,
          );
        } else {
          this.logger.log(
            `Trades for ${user1Data.email} already exist. Skipping trade seed for user1.`,
          );
        }
      }

      // Seed Trades for User 2
      if (user2Data && user2Data.id) {
        const user2TradeCount = await this.tradeRepository.count({
          where: { userId: user2Data.id },
        });
        if (user2TradeCount === 0) {
          let totalTrades = 0;

          for (const accountId of this.TRADING_ACCOUNTS) {
            const accountTrades = this.generateTradesForAccount(
              user2Data.id,
              accountId,
              2,
            );

            for (const tradeData of accountTrades) {
              const trade = this.tradeRepository.create(tradeData);
              this.calculateTradeMetrics(trade);
              await this.tradeRepository.save(trade);
              totalTrades++;
            }
          }

          this.logger.log(
            `Seeded ${totalTrades} trades for ${user2Data.email} across ${this.TRADING_ACCOUNTS.length} accounts`,
          );
        } else {
          this.logger.log(
            `Trades for ${user2Data.email} already exist. Skipping trade seed for user2.`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error during seeding process:', error);
      if (error.stack) {
        this.logger.error(error.stack);
      }
    }
  }

  private calculateTradeMetrics(trade: Trade) {
    if (
      trade.status === TradeStatus.CLOSED &&
      trade.entryPrice != null &&
      trade.exitPrice != null &&
      trade.quantity != null
    ) {
      let pnl = 0;
      if (trade.direction === TradeDirection.LONG) {
        pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
      } else if (trade.direction === TradeDirection.SHORT) {
        pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity;
      }
      trade.profitOrLoss = parseFloat(
        (pnl - (trade.commission || 0)).toFixed(4),
      );

      // Calculate R-Multiple for closed trades
      if (trade.stopLoss != null) {
        const riskAmount =
          Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity;
        if (riskAmount > 0) {
          trade.rMultiple = parseFloat(
            (trade.profitOrLoss / riskAmount).toFixed(2),
          );
        }
      }
    }
  }

  private generateTradesForAccount(
    userId: string,
    accountId: string,
    userNumber: 1 | 2,
  ): Partial<Trade>[] {
    const trades: Partial<Trade>[] = [];

    // Common symbols and their typical pricing
    const forexPairs = [
      { symbol: 'EURUSD', basePrice: 1.085, pipValue: 0.0001 },
      { symbol: 'GBPUSD', basePrice: 1.265, pipValue: 0.0001 },
      { symbol: 'USDJPY', basePrice: 151.5, pipValue: 0.01 },
      { symbol: 'AUDUSD', basePrice: 0.65, pipValue: 0.0001 },
      { symbol: 'USDCAD', basePrice: 1.36, pipValue: 0.0001 },
      { symbol: 'NZDUSD', basePrice: 0.595, pipValue: 0.0001 },
      { symbol: 'EURJPY', basePrice: 164.0, pipValue: 0.01 },
      { symbol: 'GBPJPY', basePrice: 192.0, pipValue: 0.01 },
      { symbol: 'CHFJPY', basePrice: 169.0, pipValue: 0.01 },
      { symbol: 'EURGBP', basePrice: 0.86, pipValue: 0.0001 },
    ];

    const concepts = Object.values(ICTConcept);
    const sessions = Object.values(TradingSession);
    const directions = Object.values(TradeDirection);
    const statuses = [
      TradeStatus.CLOSED,
      TradeStatus.CLOSED,
      TradeStatus.CLOSED,
      TradeStatus.OPEN,
    ]; // 75% closed, 25% open

    // Different trading styles for different accounts
    let baseQuantity = 100000; // Standard lot
    let baseDaysBack = 1;

    if (accountId === 'acc_binance_main') {
      baseQuantity = 100000; // Standard lot for main account
      baseDaysBack = 1;
    } else if (accountId === 'acc_kucoin_spot') {
      baseQuantity = 75000; // Slightly smaller positions
      baseDaysBack = 30;
    } else if (accountId === 'acc_bybit_futures') {
      baseQuantity = 150000; // Larger positions for futures
      baseDaysBack = 60;
    }

    // Generate 20 trades for this account
    for (let i = 0; i < 20; i++) {
      const pair = forexPairs[i % forexPairs.length];
      const concept = concepts[i % concepts.length];
      const session = sessions[i % sessions.length];
      const direction = directions[i % directions.length];
      const status = statuses[i % statuses.length];

      // Vary the entry dates (spread over different time periods)
      const daysBack =
        baseDaysBack + Math.floor(i * 2.5) + Math.floor(Math.random() * 5);
      const entryDate = subDays(new Date(), daysBack);

      // Calculate realistic prices with some variation
      const priceVariation = (Math.random() - 0.5) * 0.02; // ±2% variation
      const entryPrice = pair.basePrice * (1 + priceVariation);

      // Calculate exit price for closed trades (with realistic win/loss ratio)
      let exitPrice: number | undefined;
      let exitDate: Date | undefined;
      let profitFactor = 1;

      if (status === TradeStatus.CLOSED) {
        exitDate = addDays(entryDate, Math.floor(Math.random() * 5) + 1); // Hold for 1-5 days

        // Create realistic win/loss distribution (65% winners for user1, 58% for user2)
        const winRate = userNumber === 1 ? 0.65 : 0.58;
        const isWinningTrade = Math.random() < winRate;

        if (isWinningTrade) {
          // Winning trade: 20-80 pip moves
          const pipMove = (20 + Math.random() * 60) * pair.pipValue;
          profitFactor = direction === TradeDirection.LONG ? 1 : -1;
          exitPrice = entryPrice + pipMove * profitFactor;
        } else {
          // Losing trade: 10-40 pip moves against
          const pipMove = (10 + Math.random() * 30) * pair.pipValue;
          profitFactor = direction === TradeDirection.LONG ? -1 : 1;
          exitPrice = entryPrice + pipMove * profitFactor;
        }
      }

      // Calculate stop loss and take profit
      const stopLossPips = (15 + Math.random() * 25) * pair.pipValue; // 15-40 pips
      const takeProfitPips = (30 + Math.random() * 50) * pair.pipValue; // 30-80 pips

      const stopLoss =
        direction === TradeDirection.LONG
          ? entryPrice - stopLossPips
          : entryPrice + stopLossPips;

      const takeProfit =
        direction === TradeDirection.LONG
          ? entryPrice + takeProfitPips
          : entryPrice - takeProfitPips;

      // Vary position sizes
      const sizeVariation = 0.5 + Math.random(); // 0.5x to 1.5x base size
      const quantity = Math.floor(baseQuantity * sizeVariation);

      // Calculate commission (0.5-1.5 per 10k)
      const commission = (quantity / 10000) * (0.5 + Math.random());

      // Generate setup details based on concept and account
      const setupDetails = this.generateSetupDetails(
        concept,
        session,
        accountId,
        direction,
      );

      trades.push({
        userId,
        accountId,
        assetType: AssetType.FOREX,
        symbol: pair.symbol,
        direction,
        status,
        entryDate,
        entryPrice: parseFloat(
          entryPrice.toFixed(pair.symbol.includes('JPY') ? 3 : 5),
        ),
        exitDate,
        exitPrice: exitPrice
          ? parseFloat(exitPrice.toFixed(pair.symbol.includes('JPY') ? 3 : 5))
          : undefined,
        quantity,
        commission: parseFloat(commission.toFixed(2)),
        stopLoss: parseFloat(
          stopLoss.toFixed(pair.symbol.includes('JPY') ? 3 : 5),
        ),
        takeProfit: parseFloat(
          takeProfit.toFixed(pair.symbol.includes('JPY') ? 3 : 5),
        ),
        ictConcept: concept,
        session,
        setupDetails,
        notes: status === TradeStatus.OPEN ? 'Active position' : undefined,
        lessonsLearned:
          status === TradeStatus.CLOSED && Math.random() > 0.7
            ? this.generateLessons()
            : undefined,
        mistakesMade:
          status === TradeStatus.CLOSED && Math.random() > 0.8
            ? this.generateMistakes()
            : undefined,
      });
    }

    return trades;
  }

  private generateSetupDetails(
    concept: ICTConcept,
    session: TradingSession,
    accountId: string,
    direction: TradeDirection,
  ): string {
    const accountName = accountId.split('_')[1]; // binance, kucoin, bybit
    const directionText = direction.toLowerCase();

    const details = [
      `${session} session ${concept.toLowerCase()} setup for ${directionText} entry`,
      `${accountName} account: ${concept} identified during ${session} session`,
      `Clean ${concept.toLowerCase()} formation on ${session} timeframe, ${directionText} bias`,
      `${session} market structure showing ${concept.toLowerCase()}, taking ${directionText} position`,
      `Strong ${concept} pattern during ${session} session, executing ${directionText} trade`,
    ];

    return details[Math.floor(Math.random() * details.length)];
  }

  private generateLessons(): string {
    const lessons = [
      'Perfect execution on ICT model trade setup',
      'Market structure reading was accurate, good timing',
      'Patience paid off waiting for optimal entry point',
      'Risk management rules followed correctly',
      'Multi-timeframe analysis confirmed the bias',
      'Session timing was crucial for this setup',
      'Order flow reading skills improving',
      'Confluence factors all aligned perfectly',
    ];

    return lessons[Math.floor(Math.random() * lessons.length)];
  }

  private generateMistakes(): string {
    const mistakes = [
      'Entered too early without proper confirmation',
      'Ignored key resistance/support level above/below entry',
      'Failed to read market sentiment properly during news',
      'Position size was too large for account risk',
      'Exited position too early due to fear',
      'Did not wait for session-specific setup time',
      'Missed higher timeframe confluences',
      'Rushed entry without proper market structure shift',
    ];

    return mistakes[Math.floor(Math.random() * mistakes.length)];
  }
} 