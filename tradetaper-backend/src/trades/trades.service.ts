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
import { GroupTradesDto } from './dto/group-trades.dto';
import { CopyJournalDto } from './dto/copy-journal.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { v4 as uuidv4 } from 'uuid';
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
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { VoiceJournalResponseDto } from './dto/voice-journal.dto';
import { CandleManagementService } from '../backtesting/services/candle-management.service'; // [CANDLE STORE]

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
    private readonly orchestratorService: MultiModelOrchestratorService,
    @Inject(forwardRef(() => CandleManagementService))
    private readonly candleManagementService: CandleManagementService, // [CANDLE STORE]
  ) {}

  async parseVoiceJournal(
    audioBuffer: Buffer,
    mimeType: string,
    userContext: UserResponseDto,
  ): Promise<VoiceJournalResponseDto> {
    this.logger.debug(`Parsing voice journal for user ${userContext.id} [${mimeType}]`);

    const base64Audio = audioBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Audio}`;

    const prompt = `
You are an expert ICT (Inner Circle Trader) Assistant. The user has recorded an audio log for a specific trade they took. 
Listen to the audio and extract the relevant information to populate their Trade Journal.

Focus on these concepts if mentioned: Fair Value Gaps, Order Blocks, Liquidity Sweeps, Market Structure Shifts, Premium/Discount, OTE (Optimal Trade Entry), Judas Swing, Timeframes.
Also listen closely for their psychological state before, during, and after the trade.
Valid emotional states include: Calm, Confident, Anxious, Fearful, Greedy, Frustrated, Overconfident, Impatient, FOMO, Revenge_Trading, Bored, Excited, Apathetic, Hesitant, Optimistic, Pessimistic, Nervous, Relieved, Disappointed, Satisfied.
Listen for metrics like entry/exit, planned risk/reward, or whether they hesitated or broke rules.

Return a JSON object strictly matching this schema:
{
  "updates": {
    // any fields you can solidly extract from the audio. Valid keys: 
    // emotionBefore (string), emotionDuring (string), emotionAfter (string),
    // entryReason (string), 
    // marketCondition (string, MUST BE EXACTLY ONE OF: 'Trending Up', 'Trending Down', 'Ranging', 'Choppy', 'High Volatility', 'Low Volatility', 'News Driven', 'Pre-News'), 
    // timeframe (string, MUST BE EXACTLY ONE OF: '1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'), 
    // htfBias (string), newsImpact (string), 
    // confirmations (array of strings, e.g. ["RSI Divergence", "Order Block"]),
    // hesitated (boolean), followedPlan (boolean), ruleViolations (array of strings),
    // sleepQuality (number 1-5), energyLevel (number 1-5), distractionLevel (number 1-5),
    // tradingEnvironment (string), mistakesMade (string), lessonsLearned (string)
  },
  "missingPrompts": [
    // Array of string questions asking the user for critical info they missed (e.g. "What was your higher timeframe bias?")
  ],
  "transcriptSummary": "A very brief 1-2 sentence summary of what they said."
}
`;

    try {
      const response = await this.orchestratorService.complete({
        prompt: "Extract the trading journal data from the attached audio.",
        system: prompt,
        taskComplexity: 'complex',
        modelPreference: 'gemini-1.5-pro',
        optimizeFor: 'quality',
        requireJson: true,
        images: [dataUrl], // The orchestrator treats all InlineDataParts (audio/video/image) via the images array
        userId: userContext.id,
      });

      const parsedData: VoiceJournalResponseDto = JSON.parse(response.content);
      return parsedData;
    } catch (error) {
      this.logger.error(`Voice parsing failed: ${error.message}`);
      throw new BadRequestException('Failed to process audio recording');
    }
  }

  /**
   * Get 1-minute candles for a trade's time window.
   *
   * Data flow:
   *   1. Resolve the trade and its MT5 account
   *   2. Determine active sync mode (MetaAPI or Terminal EA)
   *   3. Delegate to CandleManagementService.getCandlesForTrade()
   *      → checks market_candles (global shared store) first
   *      → fetches missing gaps from MetaAPI or Terminal EA
   *   4. Return 1m candles — frontend aggregates to 5m/15m/1h/4h/D1
   */
  async getTradeCandles(
    tradeId: string,
    _timeframe: string,   // kept for controller compat — frontend always gets 1m
    userContext: UserResponseDto,
  ): Promise<any[]> {
    this.logger.debug(`[CandleStore] getTradeCandles for trade ${tradeId}`);

    try {
      // 1. Resolve trade
      const trade = await this.findOne(tradeId, userContext);

      // 2. Check if we have an MT5 account and what sync mode is active
      let metaApiSvc: any = null;
      let metaApiAccountId: string | null = null;
      let terminalFarmSvc: any = null;

      if (trade.accountId) {
        try {
          const account = await this.mt5AccountsService.findOne(
              trade.accountId,
            );

          if (account?.metaApiAccountId && this.mt5AccountsService.isMetaApiEnabled()) {
            // Use the MetaApiService directly (has getHistoricalCandles on account object)
            metaApiSvc = this.mt5AccountsService.getMetaApiService();
            metaApiAccountId = account.metaApiAccountId;
          }

          // If MetaAPI not available, try Terminal EA
          if (!metaApiSvc) {
            const terminal = await this.terminalFarmService.findTerminalForAccount(
              trade.accountId,
            );
            if (terminal?.status === 'RUNNING') {
              terminalFarmSvc = this.terminalFarmService;
            }
          }
        } catch {
          // Account resolution failed — still try to serve from cache
        }
      }

      // 3. Fetch via global candle store (gap detection + fetch only missing)
      const { candles, source, cached } =
        await this.candleManagementService.getCandlesForTrade(tradeId, trade, {
          bufferHours: 1,
          metaApiService: metaApiSvc,
          metaApiAccountId: metaApiAccountId ?? undefined,
          terminalFarmService: terminalFarmSvc,
          accountId: trade.accountId ?? undefined,
        });

      this.logger.log(
        `[CandleStore] ${candles.length} 1m candles for ` +
          `${trade.symbol} (source: ${source}, cached: ${cached})`,
      );

      if (candles.length > 0) {
        return candles;
      }

      // 4. No candles available at all — return status for the frontend
      if (!metaApiSvc && !terminalFarmSvc) {
        return [{ status: 'unavailable', message: 'No active sync method. Connect MetaAPI or Terminal EA.' }];
      }

      if (terminalFarmSvc) {
        return [{ status: 'queued', message: 'Candle request sent to MT5 Terminal EA. Refresh in 30s.' }];
      }

      return [{ status: 'unavailable', message: 'Candle data not available for this trade.' }];
    } catch (error) {
      this.logger.error(`[CandleStore] Error: ${error.message}`, error.stack);
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
        message: `New ${populatedTrade.side} trade on ${populatedTrade.symbol}${populatedTrade.profitOrLoss ? ` - P/L: ${populatedTrade.profitOrLoss > 0 ? '+' : ''}${populatedTrade.profitOrLoss.toFixed(2)}` : ''}`,
        data: {
          tradeId: populatedTrade.id,
          symbol: populatedTrade.symbol,
          side: populatedTrade.side,
          openPrice: populatedTrade.openPrice,
          status: populatedTrade.status,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send trade created notification: ${error.message}`,
      );
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
      relations: ['tags', 'strategy'],
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

  async findAllLite(
    userContext: UserResponseDto,
    accountId?: string,
    page = 1,
    limit = 50,
    includeTags = false,
    filters?: {
      status?: string;
      direction?: string;
      assetType?: string;
      symbol?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      isStarred?: boolean;
      minPnl?: number;
      maxPnl?: number;
      minDuration?: number;
      maxDuration?: number;
      sortBy?: string;
      sortDir?: string;
    },
  ): Promise<PaginatedResponseDto<Trade>> {
    this.logger.log(
      `User ${userContext.id} fetching trades (lite), account: ${accountId || 'all'}, page: ${page}, limit: ${limit}`,
    );

    const queryBuilder = this.tradesRepository
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId: userContext.id });

    if (accountId) {
      queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('trade.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.direction) {
      queryBuilder.andWhere('trade.side = :side', {
        side: filters.direction,
      });
    }

    if (filters?.assetType) {
      queryBuilder.andWhere('trade.assetType = :assetType', {
        assetType: filters.assetType,
      });
    }

    if (filters?.symbol) {
      queryBuilder.andWhere('trade.symbol ILIKE :symbol', {
        symbol: `%${filters.symbol}%`,
      });
    }

    if (filters?.isStarred) {
      queryBuilder.andWhere('trade.isStarred = :isStarred', {
        isStarred: true,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('trade.openTime >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('trade.openTime <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(trade.symbol ILIKE :search OR trade.notes ILIKE :search OR trade.setupDetails ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (Number.isFinite(filters?.minPnl)) {
      queryBuilder.andWhere('trade.profitOrLoss >= :minPnl', {
        minPnl: filters?.minPnl,
      });
    }
    if (Number.isFinite(filters?.maxPnl)) {
      queryBuilder.andWhere('trade.profitOrLoss <= :maxPnl', {
        maxPnl: filters?.maxPnl,
      });
    }

    if (Number.isFinite(filters?.minDuration)) {
      queryBuilder.andWhere(
        'trade.closeTime IS NOT NULL AND EXTRACT(EPOCH FROM (trade.closeTime - trade.openTime)) >= :minDuration',
        { minDuration: filters?.minDuration },
      );
    }
    if (Number.isFinite(filters?.maxDuration)) {
      queryBuilder.andWhere(
        'trade.closeTime IS NOT NULL AND EXTRACT(EPOCH FROM (trade.closeTime - trade.openTime)) <= :maxDuration',
        { maxDuration: filters?.maxDuration },
      );
    }

    if (includeTags) {
      queryBuilder.leftJoinAndSelect('trade.tags', 'tag');
    }

    // Always include Strategy for the UI
    queryBuilder.leftJoinAndSelect('trade.strategy', 'strategy');

    const sortBy = filters?.sortBy || 'openTime';
    const sortDir =
      String(filters?.sortDir || 'DESC').toUpperCase() === 'ASC'
        ? 'ASC'
        : 'DESC';

    if (sortBy === 'duration') {
      queryBuilder.addSelect(
        'EXTRACT(EPOCH FROM (trade.closeTime - trade.openTime))',
        'durationSeconds',
      );
      queryBuilder.orderBy('durationSeconds', sortDir);
    } else if (
      [
        'openTime',
        'closeTime',
        'profitOrLoss',
        'rMultiple',
        'quantity',
        'symbol',
        'status',
      ].includes(sortBy)
    ) {
      queryBuilder.orderBy(`trade.${sortBy}`, sortDir);
    } else {
      queryBuilder.orderBy('trade.openTime', 'DESC');
    }

    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .select([
        'trade.id',
        'trade.userId',
        'trade.assetType',
        'trade.symbol',
        'trade.side',
        'trade.status',
        'trade.openTime',
        'trade.openPrice',
        'trade.closeTime',
        'trade.closePrice',
        'trade.quantity',
        'trade.stopLoss',
        'trade.takeProfit',
        'trade.commission',
        'trade.profitOrLoss',
        'trade.rMultiple',
        'trade.session',
        'trade.notes',
        'trade.isStarred',
        'trade.accountId',
        'trade.createdAt',
        'trade.updatedAt',
        'trade.strategyId',
        'trade.groupId',
        'trade.isGroupLeader',
      ]);

    if (includeTags) {
      queryBuilder.addSelect(['tag.id', 'tag.name']);
    }

    queryBuilder.addSelect(['strategy.id', 'strategy.name']);

    const [trades, total] = await queryBuilder.getManyAndCount();

    const populatedTrades = await this._populateAccountDetails(
      trades,
      userContext.id,
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
    accountId?: string,
  ): Promise<Trade | null> {
    const where: Record<string, any> = { userId, externalId };
    if (accountId) {
      where.accountId = accountId;
    }
    return await this.tradesRepository.findOne({
      where,
    });
  }

  /**
   * Batch fetch trades by external IDs (for optimized sync)
   * Prevents N+1 query problem during trade sync
   */
  async findManyByExternalIds(
    userId: string,
    externalIds: string[],
    accountId?: string,
  ): Promise<Trade[]> {
    if (!externalIds || externalIds.length === 0) {
      return [];
    }

    const where: Record<string, any> = {
      userId,
      externalId: In(externalIds),
    };
    if (accountId) {
      where.accountId = accountId;
    }

    return await this.tradesRepository.find({ where });
  }

  /**
   * Fallback lookup: find an OPEN trade for a given symbol+account opened within
   * ±toleranceSec seconds of `openTime`. Used when positionId-based lookup fails
   * (e.g. for gold/commodities where DEAL_POSITION_ID ≠ position ticket).
   */
  async findOpenTradeBySymbolAndTime(
    userId: string,
    accountId: string,
    symbol: string,
    nearOpenTime: Date,
    toleranceSec = 120,
  ): Promise<Trade | null> {
    const from = new Date(nearOpenTime.getTime() - toleranceSec * 1000);
    const to   = new Date(nearOpenTime.getTime() + toleranceSec * 1000);

    const result = await this.tradesRepository
      .createQueryBuilder('t')
      .where('t.userId = :userId',     { userId })
      .andWhere('t.accountId = :accountId', { accountId })
      .andWhere('t.symbol   = :symbol',   { symbol })
      .andWhere("t.status   = 'OPEN'")
      .andWhere('t.openTime BETWEEN :from AND :to', { from, to })
      .orderBy('t.openTime', 'ASC')
      .getOne();

    return result ?? null;
  }


  /**
   * [FIX #10] Orphan all trades for an account using TypeORM (preserves entity hooks).
   * Called when an MT5 account is deleted.
   */
  async orphanTradesByAccount(accountId: string): Promise<void> {
    await this.tradesRepository.update(
      { accountId } as any,
      { accountId: null as any },
    );
  }

  async mergeDuplicateExternalTrades(

    userId: string,
    externalId: string,
    accountId?: string,
  ): Promise<Trade | null> {
    const where: Record<string, any> = { userId, externalId };
    if (accountId) {
      where.accountId = accountId;
    }

    const trades = await this.tradesRepository.find({
      where,
      order: { openTime: 'ASC', createdAt: 'ASC' },
    });

    if (trades.length <= 1) {
      return trades[0] || null;
    }

    const merged = this.mergeTradeRecords(trades);
    await this.tradesRepository.save(merged);

    const deleteIds = trades.filter((t) => t.id !== merged.id).map((t) => t.id);
    if (deleteIds.length > 0) {
      await this.tradesRepository.delete({ id: In(deleteIds), userId });
    }

    this.logger.log(
      `Merged ${trades.length} trades for externalId ${externalId} into ${merged.id}`,
    );

    return merged;
  }

  async mergeDuplicateExternalTradesForUser(
    userId: string,
    accountId?: string,
  ): Promise<{ merged: number; totalDuplicates: number }> {
    const queryBuilder = this.tradesRepository
      .createQueryBuilder('trade')
      .select('trade.externalId', 'externalId')
      .addSelect('COUNT(*)', 'count')
      .where('trade.userId = :userId', { userId })
      .andWhere('trade.externalId IS NOT NULL');

    if (accountId) {
      queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
    }

    const duplicates = await queryBuilder
      .groupBy('trade.externalId')
      .having('COUNT(*) > 1')
      .getRawMany<{ externalId: string; count: string }>();

    let merged = 0;

    for (const row of duplicates) {
      const externalId = row.externalId;
      const result = await this.mergeDuplicateExternalTrades(
        userId,
        externalId,
        accountId,
      );
      if (result) {
        merged += 1;
      }
    }

    return { merged, totalDuplicates: duplicates.length };
  }

  private mergeTradeRecords(trades: Trade[]): Trade {
    const sortedByOpen = [...trades].sort(
      (a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime(),
    );
    const sortedByClose = trades
      .filter((t) => t.closeTime)
      .sort(
        (a, b) =>
          new Date(a.closeTime as Date).getTime() -
          new Date(b.closeTime as Date).getTime(),
      );

    const hasClosed = trades.some(
      (t) => t.status === TradeStatus.CLOSED || t.closeTime || t.closePrice,
    );

    const primary =
      trades.find((t) => t.status === TradeStatus.CLOSED) || sortedByOpen[0];
    const entryCandidate = sortedByOpen[0];
    const closeCandidate =
      sortedByClose.length > 0 ? sortedByClose[sortedByClose.length - 1] : null;

    if (entryCandidate) {
      primary.openTime = entryCandidate.openTime || primary.openTime;
      if (!primary.openPrice && entryCandidate.openPrice) {
        primary.openPrice = entryCandidate.openPrice;
      }
      if (!primary.quantity && entryCandidate.quantity) {
        primary.quantity = entryCandidate.quantity;
      }
      primary.side = entryCandidate.side || primary.side;
      primary.stopLoss = entryCandidate.stopLoss ?? primary.stopLoss;
      primary.takeProfit = entryCandidate.takeProfit ?? primary.takeProfit;
      primary.externalDealId =
        entryCandidate.externalDealId || primary.externalDealId;
    }

    if (closeCandidate) {
      primary.closeTime = closeCandidate.closeTime || primary.closeTime;
      if (!primary.closePrice && closeCandidate.closePrice) {
        primary.closePrice = closeCandidate.closePrice;
      }
      primary.contractSize =
        primary.contractSize ?? closeCandidate.contractSize;
      primary.mt5Magic = primary.mt5Magic ?? closeCandidate.mt5Magic;
    }

    if (!primary.contractSize && entryCandidate?.contractSize) {
      primary.contractSize = entryCandidate.contractSize;
    }
    if (!primary.mt5Magic && entryCandidate?.mt5Magic) {
      primary.mt5Magic = entryCandidate.mt5Magic;
    }

    primary.status = hasClosed ? TradeStatus.CLOSED : primary.status;

    const hasCommission = trades.some(
      (t) => t.commission !== null && t.commission !== undefined,
    );
    const commissionSum = trades.reduce(
      (sum, t) => sum + (Number(t.commission) || 0),
      0,
    );
    if (hasCommission) {
      primary.commission = commissionSum;
    }

    const hasSwap = trades.some((t) => t.swap !== null && t.swap !== undefined);
    const swapSum = trades.reduce((sum, t) => sum + (Number(t.swap) || 0), 0);
    if (hasSwap) {
      primary.swap = swapSum;
    }

    if (hasClosed) {
      const pnlCandidate = [...trades]
        .filter((t) => t.profitOrLoss !== null && t.profitOrLoss !== undefined)
        .sort((a, b) => {
          const at = a.closeTime ? new Date(a.closeTime).getTime() : 0;
          const bt = b.closeTime ? new Date(b.closeTime).getTime() : 0;
          return bt - at;
        })[0];
      if (pnlCandidate?.profitOrLoss !== undefined) {
        primary.profitOrLoss = pnlCandidate.profitOrLoss;
      }
    }

    return primary;
  }

  async findOne(id: string, userContext: UserResponseDto): Promise<Trade> {
    this.logger.log(`User ${userContext.id} fetching trade with ID ${id}`);
    try {
      const trade = await this.tradesRepository
        .createQueryBuilder('trade')
        .leftJoinAndSelect('trade.tags', 'tag')
        .leftJoinAndSelect('trade.strategy', 'strategy')
        .where('trade.id = :id', { id })
        .andWhere('trade.userId = :userId', { userId: userContext.id })
        .getOneOrFail();

      const [populatedTrade] = await this._populateAccountDetails(
        [trade],
        userContext.id,
      );
      return populatedTrade;
    } catch (error) {
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

  private normalizeChangeValue(value: unknown): unknown {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value === undefined) return null;
    if (typeof value === 'number') return Number(value);
    return value;
  }

  private buildChangeLogEntry(
    trade: Trade,
    updateTradeDto: UpdateTradeDto,
    partialUpdateData: Partial<Trade>,
    source: 'user' | 'mt5' | 'system',
  ): {
    at: string;
    source: 'user' | 'mt5' | 'system';
    changes: Record<string, { from: unknown; to: unknown }>;
    note?: string;
  } | null {
    const fieldsToTrack = [
      'openTime',
      'closeTime',
      'openPrice',
      'closePrice',
      'quantity',
      'stopLoss',
      'takeProfit',
      'status',
      'notes',
      'commission',
      'swap',
      'profitOrLoss',
    ] as const;

    const changes: Record<string, { from: unknown; to: unknown }> = {};

    for (const field of fieldsToTrack) {
      if (!Object.prototype.hasOwnProperty.call(updateTradeDto, field)) {
        continue;
      }

      const updateValue = (updateTradeDto as any)[field];
      const nextValue = Object.prototype.hasOwnProperty.call(
        partialUpdateData,
        field,
      )
        ? (partialUpdateData as any)[field]
        : updateValue;

      const fromValue = this.normalizeChangeValue((trade as any)[field]);
      const toValue = this.normalizeChangeValue(
        updateValue === null && (field === 'closeTime' || field === 'openTime')
          ? null
          : nextValue,
      );

      if (JSON.stringify(fromValue) !== JSON.stringify(toValue)) {
        changes[field] = { from: fromValue, to: toValue };
      }
    }

    if (Object.keys(changes).length === 0) {
      return null;
    }

    return {
      at: new Date().toISOString(),
      source,
      changes,
    };
  }

  async update(
    id: string,
    updateTradeDto: UpdateTradeDto,
    userContext: UserResponseDto,
    options?: {
      logChanges?: boolean;
      changeSource?: 'user' | 'mt5' | 'system';
    },
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

    if (options?.logChanges !== false) {
      const changeEntry = this.buildChangeLogEntry(
        trade,
        updateTradeDto,
        partialUpdateData,
        options?.changeSource || 'user',
      );

      if (changeEntry) {
        trade.changeLog = [...(trade.changeLog || []), changeEntry];
      }
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
      if (
        updatedTrade.status === TradeStatus.CLOSED &&
        trade.status !== TradeStatus.CLOSED
      ) {
        await this.notificationsService.send({
          userId: userContext.id,
          type: NotificationType.TRADE_CLOSED,
          title: 'Trade Closed',
          message: `${updatedTrade.side} trade on ${updatedTrade.symbol} closed${updatedTrade.profitOrLoss ? ` - P/L: ${updatedTrade.profitOrLoss > 0 ? '+' : ''}${updatedTrade.profitOrLoss.toFixed(2)}` : ''}`,
          data: {
            tradeId: updatedTrade.id,
            symbol: updatedTrade.symbol,
            side: updatedTrade.side,
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
            side: updatedTrade.side,
            status: updatedTrade.status,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send trade update notification: ${error.message}`,
      );
    }

    return updatedTrade;
  }

  async updateFromSync(
    id: string,
    updateData: Partial<Trade>,
    changeLog?: {
      source: 'mt5' | 'system' | 'user';
      changes: Record<string, { from: unknown; to: unknown }>;
      note?: string;
    },
  ): Promise<Trade> {
    const trade = await this.tradesRepository.findOne({ where: { id } });
    if (!trade) {
      throw new NotFoundException(`Trade with ID "${id}" not found for sync.`);
    }

    const normalized: Partial<Trade> = { ...updateData };
    if (typeof (updateData as any).openTime === 'string') {
      normalized.openTime = new Date((updateData as any).openTime);
    }
    if (typeof (updateData as any).closeTime === 'string') {
      normalized.closeTime = new Date((updateData as any).closeTime);
    }

    if (changeLog && Object.keys(changeLog.changes || {}).length > 0) {
      trade.changeLog = [
        ...(trade.changeLog || []),
        {
          at: new Date().toISOString(),
          source: changeLog.source,
          changes: changeLog.changes,
          note: changeLog.note,
        },
      ];
    }

    this.tradesRepository.merge(trade, normalized);
    const saved = await this.tradesRepository.save(trade);
    return saved;
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

  async groupTrades(
    groupTradesDto: GroupTradesDto,
    userContext: UserResponseDto,
  ): Promise<{ groupId: string; updatedCount: number }> {
    const { tradeIds } = groupTradesDto;

    if (tradeIds.length < 2) {
      throw new BadRequestException('At least two trades are required to form a group');
    }

    const trades = await this.tradesRepository.find({
      where: { id: In(tradeIds), userId: userContext.id },
    });

    if (trades.length !== tradeIds.length) {
      throw new NotFoundException('Some trades not found or do not belong to user');
    }

    // Sort to predict leader by open time
    trades.sort((a, b) => a.openTime.getTime() - b.openTime.getTime());

    const groupId = uuidv4();

    trades.forEach((trade, index) => {
      trade.groupId = groupId;
      trade.isGroupLeader = index === 0;
    });

    const savedTrades = await this.tradesRepository.save(trades);
    this.logger.log(`User ${userContext.id} grouped ${savedTrades.length} trades into group ${groupId}`);

    return { groupId, updatedCount: savedTrades.length };
  }

  async copyJournalToGroup(
    id: string,
    copyJournalDto: CopyJournalDto,
    userContext: UserResponseDto,
  ): Promise<{ updatedCount: number }> {
    const sourceTrade = await this.tradesRepository.findOne({
      where: { id, userId: userContext.id },
      relations: ['tags'],
    });

    if (!sourceTrade) {
      throw new NotFoundException('Source trade not found');
    }

    if (!sourceTrade.groupId) {
      throw new BadRequestException('Trade does not belong to any group');
    }

    const groupTrades = await this.tradesRepository.find({
      where: { groupId: sourceTrade.groupId, userId: userContext.id },
      relations: ['tags'],
    });

    const targetTrades = groupTrades.filter((t) => t.id !== sourceTrade.id);

    if (targetTrades.length === 0) {
      throw new BadRequestException('No other trades found in this group');
    }

    const { mode } = copyJournalDto;

    const fieldsToCopy: (keyof Trade)[] = [
      'emotionBefore',
      'emotionDuring',
      'emotionAfter',
      'confidenceLevel',
      'followedPlan',
      'ruleViolations',
      'setupDetails',
      'mistakesMade',
      'lessonsLearned',
      'marketCondition',
      'timeframe',
      'htfBias',
      'newsImpact',
      'executionGrade',
      'notes',
    ];

    let updatedCount = 0;

    for (const targetTrade of targetTrades) {
      let isUpdated = false;

      for (const field of fieldsToCopy) {
        if (mode === 'OVERRIDE') {
          if (sourceTrade[field] !== undefined) {
            (targetTrade as any)[field] = sourceTrade[field];
            isUpdated = true;
          }
        } else if (mode === 'PARTIAL') {
          if ((targetTrade[field] === null || targetTrade[field] === undefined) && sourceTrade[field] !== undefined) {
            (targetTrade as any)[field] = sourceTrade[field];
            isUpdated = true;
          }
        }
      }

      // Copy tags logic
      if (sourceTrade.tags && sourceTrade.tags.length > 0) {
        if (mode === 'OVERRIDE') {
          targetTrade.tags = [...sourceTrade.tags];
          isUpdated = true;
        } else if (mode === 'PARTIAL') {
          const existingTagIds = new Set(targetTrade.tags?.map((t) => t.id) || []);
          const newTags = sourceTrade.tags.filter((t) => !existingTagIds.has(t.id));
          if (newTags.length > 0) {
            targetTrade.tags = [...(targetTrade.tags || []), ...newTags];
            isUpdated = true;
          }
        }
      } else if (mode === 'OVERRIDE' && (!sourceTrade.tags || sourceTrade.tags.length === 0)) {
        targetTrade.tags = [];
        isUpdated = true;
      }

      if (isUpdated) {
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await this.tradesRepository.save(targetTrades);
      this.logger.log(`User ${userContext.id} copied journal to ${updatedCount} trades in group ${sourceTrade.groupId}`);
    }

    return { updatedCount };
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
