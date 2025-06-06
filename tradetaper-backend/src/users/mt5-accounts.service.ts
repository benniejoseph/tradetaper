// src/users/mt5-accounts.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { CreateMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ConfigService } from '@nestjs/config';
import { MetaApiService } from './metaapi.service';
import * as crypto from 'crypto';

@Injectable()
export class MT5AccountsService {
  private readonly logger = new Logger(MT5AccountsService.name);
  private readonly encryptionKey: Buffer;
  private readonly encryptionIV: Buffer;

  constructor(
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepository: Repository<MT5Account>,
    private readonly configService: ConfigService,
    private readonly metaApiService: MetaApiService,
  ) {
    // Get encryption keys from environment variables or generate them
    const encryptionKeyString = this.configService.get<string>('MT5_ENCRYPTION_KEY') || 
      crypto.randomBytes(32).toString('hex');
    const encryptionIVString = this.configService.get<string>('MT5_ENCRYPTION_IV') || 
      crypto.randomBytes(16).toString('hex');
    
    // Convert strings to buffers for crypto operations
    this.encryptionKey = Buffer.from(encryptionKeyString, 'hex');
    this.encryptionIV = Buffer.from(encryptionIVString, 'hex');
    
    // Log if using generated keys (only in development)
    if (!this.configService.get<string>('MT5_ENCRYPTION_KEY') && 
        this.configService.get<string>('NODE_ENV') !== 'production') {
      this.logger.warn(
        'Using generated encryption keys. Set MT5_ENCRYPTION_KEY and MT5_ENCRYPTION_IV ' +
        'environment variables for production use.'
      );
    }
  }

  // Encrypt sensitive data
  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      this.encryptionKey, 
      this.encryptionIV
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt sensitive data
  private decrypt(encryptedText: string): string {
    try {
      // Handle null/undefined values
      if (!encryptedText || typeof encryptedText !== 'string') {
        throw new Error('Invalid encrypted data: data is null, undefined, or not a string');
      }
      
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc', 
        this.encryptionKey, 
        this.encryptionIV
      );
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error(`Failed to decrypt data: ${error.message}`);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  async create(
    createMT5AccountDto: CreateMT5AccountDto,
    user: UserResponseDto,
  ): Promise<MT5AccountResponseDto> {
    this.logger.log(`Creating MT5 account for user ${user.id}`);

    // Encrypt sensitive data
    const encryptedPassword = this.encrypt(createMT5AccountDto.password);
    const encryptedLogin = this.encrypt(createMT5AccountDto.login);
    const encryptedServer = this.encrypt(createMT5AccountDto.server);

    const mt5Account = this.mt5AccountRepository.create({
      ...createMT5AccountDto,
      password: encryptedPassword,
      login: encryptedLogin,
      server: encryptedServer,
      userId: user.id,
      isActive: createMT5AccountDto.isActive ?? true,
    });

    const savedAccount = await this.mt5AccountRepository.save(mt5Account);
    return this.mapToResponseDto(savedAccount);
  }

  async createManual(manualAccountData: any): Promise<any> {
    this.logger.log(`Creating manual MT5 account for user ${manualAccountData.userId}`);

    // For manual accounts, we don't encrypt credentials since they're not used for real connections
    const mt5Account = this.mt5AccountRepository.create({
      accountName: manualAccountData.accountName,
      server: manualAccountData.server,
      login: manualAccountData.login.toString(),
      password: 'manual-account', // Dummy password for manual accounts
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
      metadata: { isManual: true }
    });

    const savedAccount = await this.mt5AccountRepository.save(mt5Account);
    
    // Return simplified response for manual accounts
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
      userId: savedAccount.userId
    };
  }

  async findAllByUser(userId: string): Promise<MT5AccountResponseDto[]> {
    const accounts = await this.mt5AccountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const validAccounts: MT5AccountResponseDto[] = [];
    const corruptedAccountIds: string[] = [];

    for (const account of accounts) {
      try {
        const responseDto = this.mapToResponseDto(account);
        validAccounts.push(responseDto);
      } catch (error) {
        this.logger.warn(`Account ${account.id} has corrupted encryption data, marking for cleanup: ${error.message}`);
        corruptedAccountIds.push(account.id);
      }
    }

    // Clean up corrupted accounts asynchronously
    if (corruptedAccountIds.length > 0) {
      this.cleanupCorruptedAccounts(corruptedAccountIds);
    }

    return validAccounts;
  }

  async findOne(id: string): Promise<MT5Account | null> {
    return this.mt5AccountRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    updateMT5AccountDto: UpdateMT5AccountDto,
  ): Promise<MT5AccountResponseDto> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id },
    });
    
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    // Create updated data object
    const updatedData: Partial<MT5Account> = {};
    
    // Process fields that need encryption
    if (updateMT5AccountDto.password) {
      updatedData.password = this.encrypt(updateMT5AccountDto.password);
    }
    
    if (updateMT5AccountDto.login) {
      updatedData.login = this.encrypt(updateMT5AccountDto.login);
    }
    
    if (updateMT5AccountDto.server) {
      updatedData.server = this.encrypt(updateMT5AccountDto.server);
    }
    
    // Add non-sensitive fields
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

    // Update the account
    await this.mt5AccountRepository.update(id, updatedData);
    
    // Fetch the updated account
    const updatedAccount = await this.mt5AccountRepository.findOne({
      where: { id },
    });
    
    if (!updatedAccount) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }
    
    return this.mapToResponseDto(updatedAccount);
  }

  async remove(id: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id },
    });
    
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }
    
    // First, orphan any trades associated with this account by setting accountId to null
    // This preserves the trades while removing the MT5 account reference
    try {
      await this.mt5AccountRepository.manager.query(
        'UPDATE trades SET "accountId" = NULL WHERE "accountId" = $1',
        [id]
      );
      this.logger.log(`Orphaned trades associated with MT5 account ${id}`);
    } catch (error) {
      this.logger.warn(`Failed to orphan trades for account ${id}: ${error.message}`);
      // Continue with deletion even if orphaning fails
    }
    
    await this.mt5AccountRepository.delete(id);
    this.logger.log(`Successfully deleted MT5 account ${id}`);
  }

  async syncAccount(id: string): Promise<MT5AccountResponseDto> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id },
    });
    
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }
    
    try {
      // For now, just update the sync timestamp
      // Later this can be connected to MetaApi for real sync
      account.lastSyncAt = new Date();
      account.connectionStatus = 'CONNECTED';
      
      const updatedAccount = await this.mt5AccountRepository.save(account);
      
      this.logger.log(`Successfully synced MT5 account ${account.accountName} (ID: ${account.id})`);
      
      return this.mapToResponseDto(updatedAccount);
    } catch (error) {
      this.logger.error(`Failed to sync MT5 account ${account.id}: ${error.message}`);
      throw new Error(`Failed to sync MT5 account: ${error.message}`);
    }
  }

  async validateMT5Connection(
    login: string,
    password: string,
    server: string,
  ): Promise<boolean> {
    try {
      // For now, return true for demo purposes
      // Later this can be connected to MetaApi for real validation
      this.logger.log(`Validating MT5 connection for ${login}@${server}`);
      return true;
    } catch (error) {
      this.logger.error(`MT5 connection validation failed: ${error.message}`);
      return false;
    }
  }

  async importTradesFromMT5(
    accountId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<any[]> {
    try {
      const account = await this.mt5AccountRepository.findOne({
        where: { id: accountId },
      });
      
      if (!account) {
        throw new NotFoundException(`MT5 account with id ${accountId} not found`);
      }

      // For now, return empty array
      // Later this can be connected to MetaApi for real trade import
      this.logger.log(`Importing trades from MT5 account ${accountId} (${fromDate.toISOString()} to ${toDate.toISOString()})`);
      
      return [];
    } catch (error) {
      this.logger.error(`Failed to import trades from MT5 account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  // Helper method to map entity to response DTO (omitting sensitive fields)
  private mapToResponseDto(account: MT5Account): MT5AccountResponseDto {
    // Check if this is a manual account (stored in metadata or by connection status)
    const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';
    
    const { password, login, server, ...rest } = account;
    
    return {
      ...rest,
      login: isManual ? login : this.decrypt(login),
      server: isManual ? server : this.decrypt(server),
    } as MT5AccountResponseDto;
  }

  // Clean up accounts with corrupted encryption data
  private async cleanupCorruptedAccounts(accountIds: string[]): Promise<void> {
    try {
      this.logger.log(`Cleaning up ${accountIds.length} corrupted MT5 accounts: ${accountIds.join(', ')}`);
      await this.mt5AccountRepository.delete(accountIds);
      this.logger.log(`Successfully cleaned up corrupted MT5 accounts`);
    } catch (error) {
      this.logger.error(`Failed to cleanup corrupted accounts: ${error.message}`);
    }
  }
}