import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
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

    const account = this.accountRepository.create({
      ...createAccountDto,
      userId: user.id,
      currency: createAccountDto.currency || 'USD',
      isActive: createAccountDto.isActive ?? true,
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

    // Update the account
    await this.accountRepository.update(id, updateAccountDto);

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
      userId: account.userId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
