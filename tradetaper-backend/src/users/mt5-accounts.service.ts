// src/users/mt5-accounts.service.ts
import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import {
  CreateMT5AccountDto,
  UpdateMT5AccountDto,
  MT5AccountResponseDto,
} from './dto/mt5-account.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TradesService } from '../trades/trades.service';
import { User } from './entities/user.entity';

@Injectable()
export class MT5AccountsService {
  private readonly logger = new Logger(MT5AccountsService.name);
  private readonly encryptionKey: Buffer;
  private readonly encryptionIV: Buffer;

  constructor(
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepository: Repository<MT5Account>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly tradesService: TradesService,
  ) {
    // Get encryption keys from environment variables or generate them
    const encryptionKeyString =
      this.configService.get<string>('MT5_ENCRYPTION_KEY') ||
      crypto.randomBytes(32).toString('hex');
    const encryptionIVString =
      this.configService.get<string>('MT5_ENCRYPTION_IV') ||
      crypto.randomBytes(16).toString('hex');

    // Convert strings to buffers for crypto operations
    this.encryptionKey = Buffer.from(encryptionKeyString, 'hex');
    this.encryptionIV = Buffer.from(encryptionIVString, 'hex');

    // Log if using generated keys (only in development)
    if (
      !this.configService.get<string>('MT5_ENCRYPTION_KEY') &&
      this.configService.get<string>('NODE_ENV') !== 'production'
    ) {
      this.logger.warn(
        'Using generated encryption keys. Set MT5_ENCRYPTION_KEY and MT5_ENCRYPTION_IV ' +
          'environment variables for production use.',
      );
    }
  }

  // Encrypt sensitive data
  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      this.encryptionKey,
      this.encryptionIV,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt sensitive data
  private decrypt(encryptedText: string): string {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') {
        throw new Error('Invalid encrypted data');
      }
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        this.encryptionKey,
        this.encryptionIV,
      );
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error(`Failed to decrypt data: ${error.message}`);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Create a new MT5 account
   */
  async create(
    createDto: CreateMT5AccountDto,
    userId: string,
  ): Promise<MT5AccountResponseDto> {
    this.logger.log(`Creating MT5 account for user ${userId}`);

    const mt5Account = this.mt5AccountRepository.create({
      accountName: createDto.accountName,
      server: this.encrypt(createDto.server),
      login: this.encrypt(createDto.login.toString()),
      password: createDto.password ? this.encrypt(createDto.password) : 'encrypted-placeholder',
      userId: userId,
      accountType: createDto.isRealAccount ? 'real' : 'demo',
      currency: createDto.currency || 'USD',
      isActive: createDto.isActive ?? true,
      isRealAccount: createDto.isRealAccount ?? false,
      connectionStatus: 'disconnected',
      deploymentState: 'UNDEPLOYED',
      connectionState: 'DISCONNECTED',
      initialBalance: createDto.initialBalance ?? 0,
      balance: createDto.initialBalance ?? 0,
      equity: createDto.initialBalance ?? 0,
      leverage: createDto.leverage ?? 100,
      autoSyncEnabled: false,
      metadata: {},
    });

    const savedAccount = await this.mt5AccountRepository.save(mt5Account);
    this.logger.log(`MT5 account ${savedAccount.id} created successfully`);
    
    return this.mapToResponseDto(savedAccount);
  }

  /**
   * Create a manual MT5 account (for file upload workflow)
   */
  async createManual(manualAccountData: any): Promise<any> {
    this.logger.log(`Creating manual MT5 account for user ${manualAccountData.userId}`);

    const mt5Account = this.mt5AccountRepository.create({
      accountName: manualAccountData.accountName,
      server: manualAccountData.server,
      login: manualAccountData.login.toString(),
      password: 'manual-account',
      userId: manualAccountData.userId,
      accountType: 'demo',
      currency: manualAccountData.currency || 'USD',
      isActive: true,
      isRealAccount: manualAccountData.isRealAccount || false,
      connectionStatus: 'manual',
      deploymentState: 'MANUAL',
      connectionState: 'MANUAL',
      balance: 0,
      equity: 0,
      leverage: 1,
      autoSyncEnabled: false,
      metadata: { isManual: true },
    });

    const savedAccount = await this.mt5AccountRepository.save(mt5Account);

    return {
      id: savedAccount.id,
      accountName: savedAccount.accountName,
      server: savedAccount.server,
      login: savedAccount.login,
      accountType: savedAccount.accountType,
      currency: savedAccount.currency,
      isActive: savedAccount.isActive,
      isRealAccount: savedAccount.isRealAccount,
      connectionStatus: 'manual',
      isManual: true,
      balance: savedAccount.balance,
      equity: savedAccount.equity,
      leverage: savedAccount.leverage,
      createdAt: savedAccount.createdAt,
      updatedAt: savedAccount.updatedAt,
      userId: savedAccount.userId,
    };
  }

  /**
   * Find all MT5 accounts for a user
   */
  async findAllByUser(userId: string): Promise<MT5AccountResponseDto[]> {
    const accounts = await this.mt5AccountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const validAccounts: MT5AccountResponseDto[] = [];

    for (const account of accounts) {
      try {
        const responseDto = this.mapToResponseDto(account);
        validAccounts.push(responseDto);
      } catch (error) {
        this.logger.warn(`Account ${account.id} has encryption issue, returning with masked data: ${error.message}`);
        // Instead of deleting, return with placeholder data
        validAccounts.push({
          id: account.id,
          accountName: account.accountName || 'Unknown Account',
          server: '[Encrypted]',
          login: '[Encrypted]',
          isActive: account.isActive,
          balance: parseFloat(String(account.balance)) || 0,
          initialBalance: parseFloat(String(account.initialBalance)) || 0,
          accountType: account.accountType,
          currency: account.currency,
          lastSyncAt: account.lastSyncAt,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          connectionStatus: account.connectionStatus || 'disconnected',
          isRealAccount: account.isRealAccount,
        } as any);
      }
    }

    return validAccounts;
  }

  /**
   * Find a single MT5 account by ID
   */
  async findOne(id: string): Promise<MT5Account | null> {
    return this.mt5AccountRepository.findOne({ where: { id } });
  }

  /**
   * Update an MT5 account
   */
  async update(
    id: string,
    updateMT5AccountDto: UpdateMT5AccountDto,
  ): Promise<MT5AccountResponseDto> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    const updatedData: Partial<MT5Account> = {};

    if (updateMT5AccountDto.password) {
      updatedData.password = this.encrypt(updateMT5AccountDto.password);
    }
    if (updateMT5AccountDto.login) {
      updatedData.login = this.encrypt(updateMT5AccountDto.login);
    }
    if (updateMT5AccountDto.server) {
      updatedData.server = this.encrypt(updateMT5AccountDto.server);
    }
    if (updateMT5AccountDto.accountName) {
      updatedData.accountName = updateMT5AccountDto.accountName;
    }
    if (updateMT5AccountDto.accountType !== undefined) {
      updatedData.accountType = updateMT5AccountDto.accountType;
    }
    if (updateMT5AccountDto.currency !== undefined) {
      updatedData.currency = updateMT5AccountDto.currency;
    }
    if (updateMT5AccountDto.isActive !== undefined) {
      updatedData.isActive = updateMT5AccountDto.isActive;
    }
    if (updateMT5AccountDto.target !== undefined) {
      updatedData.target = updateMT5AccountDto.target;
    }

    await this.mt5AccountRepository.update(id, updatedData);

    const updatedAccount = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!updatedAccount) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    return this.mapToResponseDto(updatedAccount);
  }

  /**
   * Remove an MT5 account
   */
  async remove(id: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    // Orphan trades (set accountId to NULL)
    try {
      await this.mt5AccountRepository.manager.query(
        'UPDATE trades SET "accountId" = NULL WHERE "accountId" = $1',
        [id],
      );
    } catch (error) {
      this.logger.warn(`Failed to orphan trades: ${error.message}`);
    }

    await this.mt5AccountRepository.delete(id);
    this.logger.log(`Successfully deleted MT5 account ${id}`);
  }

  /**
   * Map entity to response DTO (handles decryption)
   */
  private mapToResponseDto(account: MT5Account): MT5AccountResponseDto {
    const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';
    const { password, login, server, ...rest } = account;

    return {
      ...rest,
      login: isManual ? login : this.decrypt(login),
      server: isManual ? server : this.decrypt(server),
    } as MT5AccountResponseDto;
  }

  /**
   * Get decrypted credentials (INTERNAL USE ONLY - Orchestrator)
   */
  async getDecryptedCredentials(id: string): Promise<MT5AccountResponseDto & { password?: string }> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';
    const { password, login, server, ...rest } = account;

    return {
      ...rest,
      login: isManual ? login : this.decrypt(login),
      server: isManual ? server : this.decrypt(server),
      password: isManual ? password : this.decrypt(password),
    };
  }

  /**
   * Sync account - placeholder for FTP-based sync (to be implemented)
   */
  async syncAccount(id: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    // TODO: Implement FTP-based sync
    this.logger.log(`Sync requested for account ${id} - FTP sync not yet implemented`);
    throw new UnprocessableEntityException(
      'Auto-sync via FTP is coming soon. Please use manual file upload for now.',
    );
  }

  /**
   * Get connection status - simplified for non-MetaAPI mode
   */
  async getConnectionStatus(id: string): Promise<{
    state: string;
    connectionStatus: string;
    deployed: boolean;
    ftpConfigured: boolean;
  }> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    // Check if FTP credentials exist for this account (to be implemented)
    const ftpConfigured = false; // TODO: Check ftp_credentials table

    return {
      state: account.deploymentState || 'MANUAL',
      connectionStatus: account.connectionStatus || 'disconnected',
      deployed: false, // No cloud deployment without MetaAPI
      ftpConfigured,
    };
  }
}
