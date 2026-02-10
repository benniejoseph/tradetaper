/* eslint-disable @typescript-eslint/no-unused-vars */
// src/trades/trades.service.ts
import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { Trade } from './entities/trade.entity';
import { TradeStatus, TradeDirection, AssetType } from '../types/enums';
import { Tag } from '../tags/entities/tag.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { SimpleTradesGateway } from '../websocket/simple-trades.gateway';
import { GeminiVisionService } from '../notes/gemini-vision.service';
import { Express } from 'express';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { AccountsService } from '../users/accounts.service';
import { MT5AccountsService } from '../users/mt5-accounts.service';

import { TradeCandle } from './entities/trade-candle.entity';

import { TerminalFarmService } from '../terminal-farm/terminal-farm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
    @InjectRepository(TradeCandle)
    private readonly tradeCandleRepository: Repository<TradeCandle>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @Inject(SimpleTradesGateway)
    private readonly tradesGateway: SimpleTradesGateway,
    @Inject(GeminiVisionService)
    private readonly geminiVisionService: GeminiVisionService,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => MT5AccountsService))
    private readonly mt5AccountsService: MT5AccountsService,
    @Inject(forwardRef(() => TerminalFarmService))
    private readonly terminalFarmService: TerminalFarmService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async getTradeCandles(
    tradeId: string,
    timeframe: string,
    userContext: UserResponseDto,
  ): Promise<any[]> {
    this.logger.debug(
      `Fetching candles for trade ${tradeId}, timeframe ${timeframe}`,
    );

    try {
      // 1. Check TradeCandle cache first
      const cached = await this.tradeCandleRepository.findOne({
        where: { tradeId, timeframe },
      });
      if (cached) {
        this.logger.debug(`Cache HIT for trade ${tradeId}`);
        return cached.data;
      }
      this.logger.debug(`Cache MISS for trade ${tradeId}`);

      // 2. Get Trade details and check executionCandles
      const trade = await this.findOne(tradeId, userContext);

      // 3. Return execution candles if available (auto-fetched from MT5)
      if (trade.executionCandles && trade.executionCandles.length > 0) {
        this.logger.debug(
          `Returning ${trade.executionCandles.length} execution candles from DB`,
        );

        // Cache for future requests if trade is CLOSED
        if (trade.status === TradeStatus.CLOSED) {
          try {
            await this.tradeCandleRepository.save({
              tradeId: trade.id,
              symbol: trade.symbol,
              timeframe,
              data: trade.executionCandles,
            });
          } catch (cacheError) {
            this.logger.error(`Failed to cache candles: ${cacheError.message}`);
          }
        }

        return trade.executionCandles;
      }

      // 4. Candles not yet available - return pending status
      // (Candles are auto-fetched when trade closes via processTrades)
      if (trade.status === TradeStatus.OPEN) {
        return [
          {
            status: 'pending',
            message: 'Candles will be fetched when trade closes',
          },
        ];
      }

      // 5. Trade is closed but no candles - may need manual trigger or re-sync
      if (trade.externalId && trade.accountId) {
        const terminal = await this.terminalFarmService.findTerminalForAccount(
          trade.accountId,
        );
        if (terminal && terminal.status === 'RUNNING') {
          // Calculate time range
          const entryTime = new Date(trade.openTime).getTime();
          const exitTime = trade.closeTime
            ? new Date(trade.closeTime).getTime()
            : Date.now();
          const bufferMs = 2 * 60 * 60 * 1000; // 2 hours

          const startTime = new Date(entryTime - bufferMs);
          const endTime = new Date(exitTime + bufferMs);

          const startStr = startTime
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);
          const endStr = endTime
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);
          const payload = `${trade.symbol},1m,${startStr},${endStr},${trade.id}`;

          this.terminalFarmService.queueCommand(
            terminal.id,
            'FETCH_CANDLES',
            payload,
          );

          return [
            {
              status: 'queued',
              message: 'Request sent to MT5 Terminal. Refresh in 30s.',
            },
          ];
        }
      }

      // No terminal or not an MT5 trade
      return [
        {
          status: 'unavailable',
          message: 'Candle data not available for this trade',
        },
      ];
    } catch (error) {
      this.logger.error(
        `Error in getTradeCandles: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async saveExecutionCandles(tradeId: string, candles: any[]): Promise<void> {
    const trade = await this.tradesRepository.findOne({
      where: { id: tradeId },
    });
    if (trade) {
      trade.executionCandles = candles;
      await this.tradesRepository.save(trade);
      this.logger.log(
        `Saved ${candles.length} execution candles for trade ${tradeId}`,
      );
    }
  }

  private async _populateAccountDetails(
    trades: Trade[],
    userId: string,
  ): Promise<Trade[]> {
    if (!trades.length) return trades;

    const accountIds = [
      ...new Set(trades.map((t) => t.accountId).filter((id) => id)),
    ];
    if (accountIds.length === 0) return trades;

    // Fetch from both services
    // Note: This is not efficient for large datasets but works for now given the split architecture
    // Ideally we'd have a unified cache or table

    // We can't easily query by IDs blindly because we don't know which ID belongs to which service
    // But we can try to fetch all user accounts and map them

    // Better approach: Fetch all user accounts once (cached) and map
    const [manualAccounts, mt5Accounts] = await Promise.all([
      this.accountsService.findAllByUser(userId),
      this.mt5AccountsService.findAllByUser(userId),
    ]);

    const accountMap = new Map<string, any>();
    manualAccounts.forEach((a) =>
      accountMap.set(a.id, { id: a.id, name: a.name, type: 'manual' }),
    );
    mt5Accounts.forEach((a) =>
      accountMap.set(a.id, { id: a.id, name: a.accountName, type: 'mt5' }),
    );

    return trades.map((trade) => {
      if (trade.accountId) {
        const account = accountMap.get(trade.accountId);
        if (account) {
          (trade as any).account = account;
        }
      }
      return trade;
    });
  }

  /* Removed calculateAndSetPnl as it is now handled by the Trade entity */

  private async findOrCreateTags(
    tagNames: string[],
    userId: string,
  ): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) {
      return [];
    }

    const lowerCaseTagNames = tagNames
      .map((name) => name.toLowerCase().trim())
      .filter((name) => name.length > 0);
    if (lowerCaseTagNames.length === 0) return [];

    const foundTags: Tag[] = await this.tagRepository.find({
      where: {
        name: In(lowerCaseTagNames),
        userId: userId,
      },
    });

    const foundTagNamesSet = new Set(
      foundTags.map((t) => t.name.toLowerCase()),
    );
    const newTagObjectsToCreate: Partial<Tag>[] = [];

    lowerCaseTagNames.forEach((name) => {
      if (!foundTagNamesSet.has(name)) {
        newTagObjectsToCreate.push({ name, userId });
      }
    });

    let createdTags: Tag[] = [];
    if (newTagObjectsToCreate.length > 0) {
      // Ensure unique names are being created in this batch
      const uniqueNewTagObjects = newTagObjectsToCreate.filter(
        (tagObj, index, self) =>
          index === self.findIndex((t) => t.name === tagObj.name),
      );
      const newTagEntities = this.tagRepository.create(uniqueNewTagObjects);
      createdTags = await this.tagRepository.save(newTagEntities);
      createdTags.forEach((tag) =>
        this.logger.log(`Created new tag: "${tag.name}" for user ${userId}`),
      );
    }

    return [...foundTags, ...createdTags];
  }

  async create(
    createTradeDto: CreateTradeDto,
    userContext: UserResponseDto,
  ): Promise<Trade> {
    this.logger.log(
      `User ${userContext.id} creating trade for symbol ${createTradeDto.symbol}, account ${createTradeDto.accountId || 'default'}`,
    );

    const { tagNames, ...tradeDetails } = createTradeDto;
    const resolvedTags = await this.findOrCreateTags(
      tagNames || [],
      userContext.id,
    );

    const trade = this.tradesRepository.create({
      ...tradeDetails,
      openTime: new Date(createTradeDto.openTime),
      closeTime: createTradeDto.closeTime
        ? new Date(createTradeDto.closeTime)
        : undefined,
      userId: userContext.id,
      tags: resolvedTags,
    });

    if (createTradeDto.profitOrLoss === undefined) {
      trade.calculatePnl();
    }
    const savedTrade = await this.tradesRepository.save(trade);

    // Load the complete trade with relations for response
    const completeTradeData = await this.tradesRepository.findOne({
      where: { id: savedTrade.id },
      relations: ['tags'],
    });

    if (!completeTradeData) {
      throw new NotFoundException(
        `Trade with id ${savedTrade.id} not found after creation`,
      );
    }

    const [populatedTrade] = await this._populateAccountDetails(
      [completeTradeData],
      userContext.id,
    );

    // Send notification
    try {
      await this.notificationsService.send({
        userId: userContext.id,
        type: NotificationType.TRADE_CREATED,
        title: 'Trade Created',
        message: `New ${populatedTrade.direction} trade on ${populatedTrade.symbol}${populatedTrade.profitOrLoss ? ` - P/L: ${populatedTrade.profitOrLoss > 0 ? '+' : ''}${populatedTrade.profitOrLoss.toFixed(2)}` : ''}`,
        data: {
          tradeId: populatedTrade.id,
          symbol: populatedTrade.symbol,
          direction: populatedTrade.direction,
          entryPrice: populatedTrade.entryPrice,
          status: populatedTrade.status,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send trade created notification: ${error.message}`);
    }

    this.logger.log(`Trade created successfully: ${savedTrade.id}`);

    return populatedTrade;
  }

  async findAllByUser(userId: string): Promise<Trade[]> {
    this.logger.debug(`Fetching ALL trades for user ${userId} for analytics`);
    const trades = await this.tradesRepository.find({
      where: { userId },
      relations: ['tags'],
      order: { openTime: 'DESC' },
    });
    return this._populateAccountDetails(trades, userId);
  }

  async findAll(
    userContext: UserResponseDto,
    accountId?: string,
    options?: FindManyOptions<Trade>,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDto<Trade>> {
    this.logger.log(
      `User ${userContext.id} fetching trades, account: ${accountId || 'all'}, page: ${page}, limit: ${limit}`,
    );
    const whereClause: FindManyOptions<Trade>['where'] = {
      userId: userContext.id,
    };

    if (accountId) {
      whereClause.accountId = accountId;
    }

    const [trades, total] = await this.tradesRepository.findAndCount({
      where: whereClause,
      relations: ['tags'],
      order: { openTime: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      ...options,
    });

    const populatedTrades = await this._populateAccountDetails(
      trades,
      userContext.id,
    );

    this.logger.log(
      `Found ${trades.length} of ${total} trades for user ${userContext.id}, account filter: ${accountId || 'all'}`,
    );

    return {
      data: populatedTrades,
      total,
      page,
      limit,
    };
  }

  async findDuplicate(
    userId: string,
    symbol: string,
    entryDate: Date,
    externalId?: string,
  ): Promise<Trade | null> {
    const queryBuilder = this.tradesRepository
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId })
      .andWhere('trade.accountId IS NOT NULL'); // Ignore orphaned trades

    if (externalId) {
      // If external ID is provided (e.g. from MT5), use it for exact match
      queryBuilder.andWhere('trade.externalId = :externalId', { externalId });
    } else {
      // Otherwise fallback to symbol and fuzzy time match (within 60s)
      queryBuilder
        .andWhere('trade.symbol = :symbol', { symbol })
        .andWhere('trade.openTime BETWEEN :start AND :end', {
          start: new Date(entryDate.getTime() - 60000),
          end: new Date(entryDate.getTime() + 60000),
        });
    }

    return await queryBuilder.getOne();
  }

  async findOneByExternalId(
    userId: string,
    externalId: string,
  ): Promise<Trade | null> {
    return await this.tradesRepository.findOne({
      where: { userId, externalId },
    });
  }

  /**
   * Batch fetch trades by external IDs (for optimized sync)
   * Prevents N+1 query problem during trade sync
   */
  async findManyByExternalIds(
    userId: string,
    externalIds: string[],
  ): Promise<Trade[]> {
    if (!externalIds || externalIds.length === 0) {
      return [];
    }

    return await this.tradesRepository.find({
      where: {
        userId,
        externalId: In(externalIds),
      },
    });
  }

  async findOne(id: string, userContext: UserResponseDto): Promise<Trade> {
    this.logger.log(`User ${userContext.id} fetching trade with ID ${id}`);
    try {
      const trade = await this.tradesRepository
        .createQueryBuilder('trade')
        .leftJoinAndSelect('trade.tags', 'tag')
        .where('trade.id = :id', { id })
        .andWhere('trade.userId = :userId', { userId: userContext.id })
        .getOneOrFail();

      const [populatedTrade] = await this._populateAccountDetails(
        [trade],
        userContext.id,
      );
      return populatedTrade;
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      this.logger.error(
        `Error fetching trade with ID ${id} for user ${userContext.id}: ${errorMessage}`,
      );
      throw new NotFoundException(
        `Trade with ID "${id}" not found or does not belong to user.`,
      );
    }
  }

  async update(
    id: string,
    updateTradeDto: UpdateTradeDto,
    userContext: UserResponseDto,
  ): Promise<Trade> {
    this.logger.log(`User ${userContext.id} updating trade with ID ${id}`);
    const trade = await this.tradesRepository.findOne({
      where: { id, userId: userContext.id },
      relations: ['tags'],
    });
    if (!trade) {
      throw new NotFoundException(
        `Trade with ID "${id}" not found for update.`,
      );
    }

    const { tagNames, openTime, closeTime, ...otherDetailsToUpdate } =
      updateTradeDto;

    const partialUpdateData: Partial<Trade> = { ...otherDetailsToUpdate };

    if (openTime !== undefined) {
      partialUpdateData.openTime = new Date(openTime);
    }
    if (closeTime !== undefined) {
      partialUpdateData.closeTime =
        closeTime === null ? undefined : new Date(closeTime);
    } else if (
      Object.prototype.hasOwnProperty.call(updateTradeDto, 'closeTime') &&
      closeTime === null
    ) {
      partialUpdateData.closeTime = undefined;
    }

    this.tradesRepository.merge(trade, partialUpdateData);

    if (tagNames !== undefined) {
      trade.tags = await this.findOrCreateTags(tagNames, userContext.id);
    }

    if (updateTradeDto.profitOrLoss === undefined) {
      trade.calculatePnl();
    }
    const updatedTrade = await this.tradesRepository.save(trade);

    // Send notification for closed trades
    try {
      if (updatedTrade.status === TradeStatus.CLOSED && trade.status !== TradeStatus.CLOSED) {
        await this.notificationsService.send({
          userId: userContext.id,
          type: NotificationType.TRADE_CLOSED,
          title: 'Trade Closed',
          message: `${updatedTrade.direction} trade on ${updatedTrade.symbol} closed${updatedTrade.profitOrLoss ? ` - P/L: ${updatedTrade.profitOrLoss > 0 ? '+' : ''}${updatedTrade.profitOrLoss.toFixed(2)}` : ''}`,
          data: {
            tradeId: updatedTrade.id,
            symbol: updatedTrade.symbol,
            direction: updatedTrade.direction,
            profitOrLoss: updatedTrade.profitOrLoss,
            status: updatedTrade.status,
          },
        });
      } else {
        // Regular update notification
        await this.notificationsService.send({
          userId: userContext.id,
          type: NotificationType.TRADE_UPDATED,
          title: 'Trade Updated',
          message: `Trade on ${updatedTrade.symbol} has been updated`,
          data: {
            tradeId: updatedTrade.id,
            symbol: updatedTrade.symbol,
            direction: updatedTrade.direction,
            status: updatedTrade.status,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send trade update notification: ${error.message}`);
    }

    return updatedTrade;
  }

  async remove(id: string, userContext: UserResponseDto): Promise<void> {
    const trade = await this.findOne(id, userContext);
    const result = await this.tradesRepository.delete(trade.id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Trade with ID "${id}" could not be deleted.`,
      );
    }
    this.logger.log(`User ${userContext.id} removed trade with ID ${id}`);
  }

  // Bulk operations
  async bulkDelete(
    tradeIds: string[],
    userContext: UserResponseDto,
  ): Promise<{ deletedCount: number }> {
    this.logger.log(
      `User ${userContext.id} bulk deleting ${tradeIds.length} trades`,
    );

    // Verify all trades belong to the user
    const trades = await this.tradesRepository.find({
      where: { id: In(tradeIds), userId: userContext.id },
    });

    if (trades.length !== tradeIds.length) {
      throw new NotFoundException(
        'Some trades not found or do not belong to user',
      );
    }

    const result = await this.tradesRepository.delete({
      id: In(tradeIds),
      userId: userContext.id,
    });

    const deletedCount = result.affected || 0;
    this.logger.log(
      `User ${userContext.id} bulk deleted ${deletedCount} trades`,
    );

    return { deletedCount };
  }

  async bulkUpdate(
    updates: { id: string; data: Partial<UpdateTradeDto> }[],
    userContext: UserResponseDto,
  ): Promise<{ updatedCount: number; trades: Trade[] }> {
    this.logger.log(
      `User ${userContext.id} bulk updating ${updates.length} trades`,
    );

    const tradeIds = updates.map((u) => u.id);
    const trades = await this.tradesRepository.find({
      where: { id: In(tradeIds), userId: userContext.id },
      relations: ['tags'],
    });

    if (trades.length !== updates.length) {
      throw new NotFoundException(
        'Some trades not found or do not belong to user',
      );
    }

    const updatedTrades: Trade[] = [];

    for (const update of updates) {
      const trade = trades.find((t) => t.id === update.id);
      if (trade) {
        const { tagNames, openTime, closeTime, ...otherData } = update.data;

        // Apply updates
        Object.assign(trade, otherData);

        if (openTime !== undefined) {
          trade.openTime = new Date(openTime);
        }
        if (closeTime !== undefined) {
          trade.closeTime =
            closeTime === null ? undefined : new Date(closeTime);
        }

        if (tagNames !== undefined) {
          trade.tags = await this.findOrCreateTags(tagNames, userContext.id);
        }

        if (update.data.profitOrLoss === undefined) {
          trade.calculatePnl();
        }
        updatedTrades.push(trade);
      }
    }

    const savedTrades = await this.tradesRepository.save(updatedTrades);

    return { updatedCount: savedTrades.length, trades: savedTrades };
  }

  async bulkImport(
    trades: CreateTradeDto[],
    userContext: UserResponseDto,
  ): Promise<{ importedCount: number; trades: Trade[] }> {
    this.logger.log(
      `User ${userContext.id} bulk importing ${trades.length} trades`,
    );

    const createdTrades: Trade[] = [];

    for (const tradeDto of trades) {
      const { tagNames, ...tradeDetails } = tradeDto;
      const resolvedTags = await this.findOrCreateTags(
        tagNames || [],
        userContext.id,
      );

      const trade = this.tradesRepository.create({
        ...tradeDetails,
        openTime: new Date(tradeDto.openTime),
        closeTime: tradeDto.closeTime
          ? new Date(tradeDto.closeTime)
          : undefined,
        userId: userContext.id,
        tags: resolvedTags,
      });

      if (tradeDto.profitOrLoss === undefined) {
        trade.calculatePnl();
      }
      createdTrades.push(trade);
    }

    const savedTrades = await this.tradesRepository.save(createdTrades);

    return { importedCount: savedTrades.length, trades: savedTrades };
  }

  // This method is no longer used directly for chart analysis, as it's handled by ChartAnalysisService
  // Keeping it here for now, but it can be removed if no other parts of the application use it.
  // async analyzeChart(file: Express.Multer.File): Promise<any> {
  //   this.logger.log(`Analyzing chart image: ${file.originalname}`);
  //   try {
  //     const analysisResult = await this.geminiVisionService.analyzeImage(
  //       file.buffer,
  //       `Analyze this trading chart image. Identify the following:
  //       - Trading Instrument (e.g., EUR/USD, BTC/USD, Apple Stock)
  //       - Timeframe (e.g., 1-hour, Daily, 5-minute)
  //       - Entry Price (if visible)
  //       - Exit Price (if visible)
  //       - Stop Loss (if visible)
  //       - Take Profit (if visible)
  //       - Date and Time of the trade (if visible)
  //       - Key chart patterns (e.g., Head and Shoulders, Double Top/Bottom, Trendlines)
  //       - Relevant indicators and their values (e.g., RSI, MACD, Moving Averages)
  //       - Overall market sentiment (bullish, bearish, neutral)

  //       Format the output as a JSON object with clear keys for each piece of information. If a piece of information is not visible or applicable, use 'N/A'.
  //       Example:
  //       {
  //         "instrument": "EUR/USD",
  //         "timeframe": "1-hour",
  //         "entryPrice": "1.0850",
  //         "exitPrice": "1.0920",
  //         "stopLoss": "1.0820",
  //         "takeProfit": "1.0950",
  //         "tradeDate": "2023-10-26",
  //         "tradeTime": "14:30 UTC",
  //         "chartPatterns": ["Ascending Triangle"],
  //         "indicators": [{"name": "RSI", "value": "70"}],
  //         "sentiment": "Bullish",
  //         "observations": "Price broke above resistance after a period of consolidation."
  //       }
  //       `,
  //     );
  //     this.logger.log(
  //       `Chart analysis result: ${JSON.stringify(analysisResult)}`,
  //     );
  //     return analysisResult;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to analyze chart image: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException(
  //       `Failed to analyze chart image: ${error.message}`,
  //     );
  //   }
  // }
}
