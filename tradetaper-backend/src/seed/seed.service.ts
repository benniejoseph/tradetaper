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
} from '../trades/entities/trade.entity';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { addDays, subDays, format } from 'date-fns';
import { UserResponseDto } from '../users/dto/user-response.dto'; // Import UserResponseDto

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Keep for findOneBy if needed, but user creation via service
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

    // Check if any user exists; if so, assume seeding might have run.
    // For more robust seeding, check for a specific seed marker or specific seed users.
    const userCount = await this.userRepository.count();
    if (userCount > 0) {
      // Check if specific seed users exist to be more precise
      const seedUser1Exists = await this.userRepository.findOneBy({
        email: 'user1@example.com',
      });
      const seedUser2Exists = await this.userRepository.findOneBy({
        email: 'user2@example.com',
      });
      if (seedUser1Exists || seedUser2Exists) {
        this.logger.log(
          'Seed users already exist or other users present. Checking trades for seed users.',
        );
        // Further check if trades for these users exist if needed
        // For now, if users exist, we might skip all seeding or just specific parts
        // This logic can be refined based on how often you want to re-seed parts
      } else {
        this.logger.log(
          'Other users exist, but seed users not found. Proceeding to create seed users.',
        );
      }
    }
    // A simpler check: if a specific trade from seed data exists, skip.
    // This requires knowing a unique characteristic of a seeded trade.
    // Or, if users exist AND trades exist, skip.
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
      // Type for users we are creating/fetching for seeding purposes
      let user1Data: UserResponseDto | Pick<User, 'id' | 'email'> | undefined;
      let user2Data: UserResponseDto | Pick<User, 'id' | 'email'> | undefined;

      // --- Create/Fetch User 1 ---
      const existingUser1 = await this.userRepository.findOneBy({
        email: 'user1@example.com',
      });
      if (existingUser1) {
        user1Data = { id: existingUser1.id, email: existingUser1.email }; // Just take what we need
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

      // --- Create/Fetch User 2 ---
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

      // --- Seed Trades for User 1 ---
      if (user1Data && user1Data.id) {
        // Check if user1 already has trades before seeding
        const user1TradeCount = await this.tradeRepository.count({
          where: { userId: user1Data.id },
        });
        if (user1TradeCount === 0) {
          const tradesForUser1: Partial<Trade>[] = [
            {
              userId: user1Data.id,
              assetType: AssetType.STOCK,
              symbol: 'AAPL',
              direction: TradeDirection.LONG,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 60),
              entryPrice: 150.0,
              quantity: 10,
              exitDate: subDays(new Date(), 50),
              exitPrice: 160.0,
              commission: 5.0,
              strategyTag: 'Swing, Value',
              setupDetails: 'Bought on dip, expecting earnings beat.',
              mistakesMade: 'Held too long after target.',
              lessonsLearned: 'Take profits at target.',
              imageUrl:
                'https://via.placeholder.com/300x200.png?text=AAPL+Chart1',
            },
            {
              userId: user1Data.id,
              assetType: AssetType.CRYPTO,
              symbol: 'BTCUSD',
              direction: TradeDirection.LONG,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 45),
              entryPrice: 30000.0,
              quantity: 0.1,
              exitDate: subDays(new Date(), 40),
              exitPrice: 28000.0,
              commission: 10.0,
              strategyTag: 'Scalp, Breakout',
              setupDetails: 'Breakout attempt failed.',
              mistakesMade: 'Chased price.',
              lessonsLearned: 'Wait for confirmation.',
            },
            {
              userId: user1Data.id,
              assetType: AssetType.FOREX,
              symbol: 'EURUSD',
              direction: TradeDirection.SHORT,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 35),
              entryPrice: 1.1,
              quantity: 10000,
              exitDate: subDays(new Date(), 33),
              exitPrice: 1.095,
              commission: 2.0,
              strategyTag: 'News Play',
            },
            {
              userId: user1Data.id,
              assetType: AssetType.STOCK,
              symbol: 'MSFT',
              direction: TradeDirection.LONG,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 25),
              entryPrice: 280.0,
              quantity: 5,
              exitDate: subDays(new Date(), 20),
              exitPrice: 295.0,
              commission: 5.0,
              strategyTag: 'Trend Following',
              imageUrl:
                'https://via.placeholder.com/300x200.png?text=MSFT+Chart',
            },
            {
              userId: user1Data.id,
              assetType: AssetType.CRYPTO,
              symbol: 'ETHUSD',
              direction: TradeDirection.LONG,
              status: TradeStatus.OPEN,
              entryDate: subDays(new Date(), 5),
              entryPrice: 1800.0,
              quantity: 0.5,
              commission: 7.0,
              strategyTag: 'Dip Buy',
              stopLoss: 1700,
              takeProfit: 2000,
            },
            {
              userId: user1Data.id,
              assetType: AssetType.STOCK,
              symbol: 'GOOGL',
              direction: TradeDirection.LONG,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 150),
              entryPrice: 100.0,
              quantity: 10,
              exitDate: subDays(new Date(), 3),
              exitPrice: 130.0,
              commission: 5,
              strategyTag: 'Long Term Hold',
            },
            {
              userId: user1Data.id,
              assetType: AssetType.FOREX,
              symbol: 'USDJPY',
              direction: TradeDirection.SHORT,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 8),
              entryPrice: 140.0,
              quantity: 5000,
              exitDate: subDays(new Date(), 7),
              exitPrice: 139.5,
              commission: 3,
              strategyTag: 'Short Term, Technicals',
            },
            {
              userId: user1Data.id,
              assetType: AssetType.STOCK,
              symbol: 'TSLA',
              direction: TradeDirection.LONG,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 22),
              entryPrice: 200.0,
              quantity: 10,
              exitDate: subDays(new Date(), 21),
              exitPrice: 210.0,
              commission: 5,
              strategyTag: 'Momentum, Intraday',
            },
            {
              userId: user1Data.id,
              assetType: AssetType.CRYPTO,
              symbol: 'ADAUSD',
              direction: TradeDirection.LONG,
              status: TradeStatus.CLOSED,
              entryDate: subDays(new Date(), 65),
              entryPrice: 0.3,
              quantity: 1000,
              exitDate: subDays(new Date(), 15),
              exitPrice: 0.35,
              commission: 10,
              strategyTag: 'Medium Term, HODL',
            },
          ];

          for (const tradeData of tradesForUser1) {
            const trade = this.tradeRepository.create(tradeData);
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
            }
            await this.tradeRepository.save(trade);
          }
          this.logger.log(
            `Seeded ${tradesForUser1.length} trades for ${user1Data.email}`,
          );
        } else {
          this.logger.log(
            `Trades for ${user1Data.email} already exist or user not found. Skipping trade seed for user1.`,
          );
        }
      }

      // --- Seed Trades for User 2 (Optional) ---
      if (user2Data && user2Data.id) {
        const user2TradeCount = await this.tradeRepository.count({
          where: { userId: user2Data.id },
        });
        if (user2TradeCount === 0) {
          const tradesForUser2: Partial<Trade>[] = [
            {
              userId: user2Data.id,
              assetType: AssetType.STOCK,
              symbol: 'NVDA',
              direction: TradeDirection.LONG,
              status: TradeStatus.OPEN,
              entryDate: subDays(new Date(), 2),
              entryPrice: 450.0,
              quantity: 5,
              commission: 3.0,
              strategyTag: 'Growth, AI Trend',
            },
          ];
          for (const tradeData of tradesForUser2) {
            await this.tradeRepository.save(
              this.tradeRepository.create(tradeData),
            );
          }
          this.logger.log(
            `Seeded ${tradesForUser2.length} trades for ${user2Data.email}`,
          );
        } else {
          this.logger.log(
            `Trades for ${user2Data.email} already exist or user not found. Skipping trade seed for user2.`,
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
}
