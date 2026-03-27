import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
  AccountCategory,
} from './dto/account.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(
    createAccountDto: CreateAccountDto,
    user: UserResponseDto,
  ): Promise<AccountResponseDto> {
    this.logger.log(`Creating account for user ${user.id}`);

    const accountCategory =
      createAccountDto.accountCategory === AccountCategory.PROP_FIRM
        ? AccountCategory.PROP_FIRM
        : AccountCategory.PERSONAL;

    const account = this.accountRepository.create({
      ...createAccountDto,
      userId: user.id,
      currency: createAccountDto.currency || 'USD',
      isActive: createAccountDto.isActive ?? true,
      accountCategory,
      propFirmPhase:
        accountCategory === AccountCategory.PROP_FIRM
          ? createAccountDto.propFirmPhase ?? null
          : null,
      propMaxLoss:
        accountCategory === AccountCategory.PROP_FIRM
          ? createAccountDto.propMaxLoss ?? null
          : null,
      propDailyMaxLoss:
        accountCategory === AccountCategory.PROP_FIRM
          ? createAccountDto.propDailyMaxLoss ?? null
          : null,
    });

    const savedAccount = await this.accountRepository.save(account);
    return this.mapToResponseDto(savedAccount);
  }

  async findAllByUser(userId: string): Promise<AccountResponseDto[]> {
    const accounts = await this.accountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return accounts.map((account) => this.mapToResponseDto(account));
  }

  async findOne(id: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    const nextCategory =
      updateAccountDto.accountCategory ??
      (account.accountCategory === AccountCategory.PROP_FIRM
        ? AccountCategory.PROP_FIRM
        : AccountCategory.PERSONAL);

    const updatePayload: Record<string, any> = {
      ...updateAccountDto,
      accountCategory: nextCategory,
    };

    if (nextCategory !== AccountCategory.PROP_FIRM) {
      updatePayload.propFirmPhase = null;
      updatePayload.propMaxLoss = null;
      updatePayload.propDailyMaxLoss = null;
    } else {
      if (updateAccountDto.propFirmPhase !== undefined) {
        updatePayload.propFirmPhase = updateAccountDto.propFirmPhase || null;
      }
      if (updateAccountDto.propMaxLoss !== undefined) {
        updatePayload.propMaxLoss = updateAccountDto.propMaxLoss;
      }
      if (updateAccountDto.propDailyMaxLoss !== undefined) {
        updatePayload.propDailyMaxLoss = updateAccountDto.propDailyMaxLoss;
      }
    }

    // Update the account
    await this.accountRepository.update(id, updatePayload);

    // Fetch the updated account
    const updatedAccount = await this.accountRepository.findOne({
      where: { id },
    });

    if (!updatedAccount) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    return this.mapToResponseDto(updatedAccount);
  }

  async remove(id: string): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    await this.accountRepository.remove(account);
    this.logger.log(`Successfully deleted account ${id}`);
  }

  mapToResponseDto(account: Account): AccountResponseDto {
    return {
      id: account.id,
      name: account.name,
      balance: Number(account.balance),
      currency: account.currency,
      description: account.description,
      isActive: account.isActive,
      target: Number(account.target),
      accountCategory:
        account.accountCategory === AccountCategory.PROP_FIRM
          ? AccountCategory.PROP_FIRM
          : AccountCategory.PERSONAL,
      propFirmPhase: account.propFirmPhase ?? null,
      propMaxLoss:
        account.propMaxLoss !== null && account.propMaxLoss !== undefined
          ? Number(account.propMaxLoss)
          : null,
      propDailyMaxLoss:
        account.propDailyMaxLoss !== null &&
        account.propDailyMaxLoss !== undefined
          ? Number(account.propDailyMaxLoss)
          : null,
      userId: account.userId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
