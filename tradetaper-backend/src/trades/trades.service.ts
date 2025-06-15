/* eslint-disable @typescript-eslint/no-unused-vars */
// src/trades/trades.service.ts
import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { Trade } from './entities/trade.entity';
import {
  TradeStatus,
  TradeDirection,
  AssetType,
} from '../types/enums';
import { Tag } from '../tags/entities/tag.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
// import { TradesGateway } from '../websocket/trades.gateway';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    // @Inject(forwardRef(() => TradesGateway))
    // private readonly tradesGateway: TradesGateway,
  ) {}

  private calculateAndSetPnl(trade: Trade): void {
    if (
      trade.status === TradeStatus.CLOSED &&
      trade.openPrice != null &&
      trade.closePrice != null &&
      trade.quantity != null
    ) {
      let pnl = 0;
      if (trade.side === TradeDirection.LONG) {
        // Compare with enum member
        pnl = (trade.closePrice - trade.openPrice) * trade.quantity;
      } else if (trade.side === TradeDirection.SHORT) {
        // Compare with enum member
        pnl = (trade.openPrice - trade.closePrice) * trade.quantity;
      }
      trade.profitOrLoss = parseFloat(
        (pnl - (trade.commission || 0)).toFixed(4),
      );
    } else {
      trade.profitOrLoss = undefined;
    }
  }

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

    this.calculateAndSetPnl(trade);
    const savedTrade = await this.tradesRepository.save(trade);

    // Load the complete trade with relations for response
    const completeTradeData = await this.tradesRepository.findOne({
      where: { id: savedTrade.id },
      relations: ['tags'],
    });

    if (!completeTradeData) {
      throw new NotFoundException(`Trade with id ${savedTrade.id} not found after creation`);
    }

    this.logger.log(`Trade created successfully: ${savedTrade.id}`);

    // Emit WebSocket notification
    // this.tradesGateway.notifyTradeCreated(savedTrade);

    return completeTradeData;
  }

  async findAll(
    userContext: UserResponseDto,
    accountId?: string,
    options?: FindManyOptions<Trade>,
  ): Promise<Trade[]> {
    this.logger.log(
      `User ${userContext.id} fetching all their trades, account: ${accountId || 'all'}`,
    );
    const whereClause: FindManyOptions<Trade>['where'] = {
      userId: userContext.id,
    };

    if (accountId) {
      // Filter by specific account
      whereClause.accountId = accountId;
    }
    // If no accountId specified, return all trades (including those with null accountId)

    const trades = await this.tradesRepository.find({
      where: whereClause,
      relations: ['tags'],
      order: { openTime: 'DESC' },
      ...options,
    });

    this.logger.log(
      `Found ${trades.length} trades for user ${userContext.id}, account filter: ${accountId || 'all'}`,
    );

    return trades;
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
      return trade;
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

    this.calculateAndSetPnl(trade);
    const updatedTrade = await this.tradesRepository.save(trade);

    // Emit WebSocket notification
    // this.tradesGateway.notifyTradeUpdated(updatedTrade);

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

    // Emit WebSocket notification
    // this.tradesGateway.notifyTradeDeleted(id);
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

    // Emit WebSocket notification
    // this.tradesGateway.notifyBulkOperation('delete', deletedCount);

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
          trade.closeTime = closeTime === null ? undefined : new Date(closeTime);
        }

        if (tagNames !== undefined) {
          trade.tags = await this.findOrCreateTags(tagNames, userContext.id);
        }

        this.calculateAndSetPnl(trade);
        updatedTrades.push(trade);
      }
    }

    const savedTrades = await this.tradesRepository.save(updatedTrades);

    // Emit WebSocket notification
    // this.tradesGateway.notifyBulkOperation(
    //   'update',
    //   savedTrades.length,
    //   savedTrades,
    // );

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
        closeTime: tradeDto.closeTime ? new Date(tradeDto.closeTime) : undefined,
        userId: userContext.id,
        tags: resolvedTags,
      });

      this.calculateAndSetPnl(trade);
      createdTrades.push(trade);
    }

    const savedTrades = await this.tradesRepository.save(createdTrades);

    // Emit WebSocket notification
    // this.tradesGateway.notifyBulkOperation(
    //   'import',
    //   savedTrades.length,
    //   savedTrades,
    // );

    return { importedCount: savedTrades.length, trades: savedTrades };
  }
}
