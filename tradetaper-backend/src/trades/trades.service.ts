/* eslint-disable @typescript-eslint/no-unused-vars */
// src/trades/trades.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import {
  Trade,
  TradeStatus,
  TradeDirection,
  AssetType,
} from './entities/trade.entity'; // Import AssetType if used
import { Tag } from '../tags/entities/tag.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  private calculateAndSetPnl(trade: Trade): void {
    if (
      trade.status === TradeStatus.CLOSED &&
      trade.entryPrice != null &&
      trade.exitPrice != null &&
      trade.quantity != null
    ) {
      let pnl = 0;
      if (trade.direction === TradeDirection.LONG) {
        // Compare with enum member
        pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
      } else if (trade.direction === TradeDirection.SHORT) {
        // Compare with enum member
        pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity;
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
      entryDate: new Date(createTradeDto.entryDate),
      exitDate: createTradeDto.exitDate
        ? new Date(createTradeDto.exitDate)
        : undefined,
      userId: userContext.id,
      tags: resolvedTags,
    });

    this.calculateAndSetPnl(trade);
    return this.tradesRepository.save(trade);
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
      whereClause.accountId = accountId;
    }
    return this.tradesRepository.find({
      where: whereClause,
      relations: ['tags'],
      order: { entryDate: 'DESC' },
      ...options,
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

    const { tagNames, entryDate, exitDate, ...otherDetailsToUpdate } =
      updateTradeDto;

    const partialUpdateData: Partial<Trade> = { ...otherDetailsToUpdate };

    if (entryDate !== undefined) {
      partialUpdateData.entryDate = new Date(entryDate);
    }
    if (exitDate !== undefined) {
      partialUpdateData.exitDate =
        exitDate === null ? undefined : new Date(exitDate);
    } else if (
      Object.prototype.hasOwnProperty.call(updateTradeDto, 'exitDate') &&
      exitDate === null
    ) {
      partialUpdateData.exitDate = undefined;
    }

    this.tradesRepository.merge(trade, partialUpdateData);

    if (tagNames !== undefined) {
      trade.tags = await this.findOrCreateTags(tagNames, userContext.id);
    }

    this.calculateAndSetPnl(trade);
    return this.tradesRepository.save(trade);
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
}
