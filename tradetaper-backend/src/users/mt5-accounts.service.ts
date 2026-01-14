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
import { UserResponseDto } from './dto/user-response.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TradesService } from '../trades/trades.service';
import { TradeDirection, AssetType, TradeStatus } from '../types/enums';
import { User } from './entities/user.entity';
import { CreateTradeDto } from '../trades/dto/create-trade.dto';
import { MetaApiService } from '../integrations/metaapi/metaapi.service';
import { TradeMapperService } from '../integrations/metaapi/trade-mapper.service';
import { TradeJournalSyncService } from '../trades/services/trade-journal-sync.service';

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
    private readonly metaApiService: MetaApiService,
    private readonly tradeMapperService: TradeMapperService,
    private readonly tradeJournalSyncService: TradeJournalSyncService,
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
   * Check if MetaApi integration is available
   */
  isMetaApiAvailable(): boolean {
    return this.metaApiService.isAvailable();
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
      balance: createDto.initialBalance ?? 0, // Start with initial balance
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
   * Link an MT5 account via MetaApi (provision in cloud)
   */
  async linkAccount(
    id: string,
    credentials: { password: string },
  ): Promise<{ accountId: string; state: string }> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    if (!this.metaApiService.isAvailable()) {
      throw new UnprocessableEntityException('MetaApi integration not available');
    }

    this.logger.log(`Linking MT5 account ${id} to MetaApi`);

    let login: string;
    let server: string;
    
    // Robust check for manual account to avoid decryption errors
    const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';

    try {
      if (isManual) {
        login = account.login;
        server = account.server;
      } else {
        login = this.decrypt(account.login);
        server = this.decrypt(account.server);
      }
    } catch (error) {
       this.logger.error(`Decryption failed during link: ${error.message}`);
       throw new UnprocessableEntityException('Failed to decrypt account credentials. Please delete and limits-add this account.');
    }

    try {
      // Provision account in MetaApi
      const result = await this.metaApiService.provisionAccount({
        login,
        password: credentials.password,
        server,
        accountName: account.accountName,
        // provisioningProfileId: 'cloud-g2', // Removed: Causing 422 error (Profile not found)
      });

      // Update account with MetaApi ID
      await this.mt5AccountRepository.update(id, {
        metaApiAccountId: result.accountId,
        deploymentState: 'DEPLOYED',
        connectionState: 'CONNECTED',
        connectionStatus: 'connected',
        lastSyncError: null as any, // Clear previous errors (force null for DB)
      });

      this.logger.log(`MT5 account ${id} linked successfully with MetaApi ID: ${result.accountId}`);

      return result;
    } catch (error) {
      // Catch MetaApi/Provisioning errors and return readable bad request instead of 500
      this.logger.error(`Provisioning failed: ${error.message}`);
      
      // If error contains "broker not found" or "unauthorized", pass that info
      if (error.message.toLowerCase().includes('broker')) {
         throw new UnprocessableEntityException('Broker server not found. Check server name.');
      }
      if (error.message.toLowerCase().includes('auth') || error.message.toLowerCase().includes('password')) {
         throw new UnprocessableEntityException('Invalid credentials. Check login and password.');
      }

      throw new UnprocessableEntityException(`Link failed: ${error.message}`);
    }
  }

  /**
   * Unlink an MT5 account from MetaApi
   */
  async unlinkAccount(id: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    if (!account.metaApiAccountId) {
      throw new Error('Account is not linked to MetaApi');
    }

    await this.metaApiService.unlinkAccount(account.metaApiAccountId);

    // Update account status
    await this.mt5AccountRepository.update(id, {
      metaApiAccountId: undefined as any,
      deploymentState: 'UNDEPLOYED',
      connectionState: 'DISCONNECTED',
      connectionStatus: 'disconnected',
    });

    this.logger.log(`MT5 account ${id} unlinked from MetaApi`);
  }

  /**
   * Get connection status from MetaApi
   */
  async getConnectionStatus(id: string): Promise<{
    state: string;
    connectionStatus: string;
    deployed: boolean;
    metaApiAvailable: boolean;
  }> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    if (!account.metaApiAccountId) {
      return {
        state: account.deploymentState || 'UNDEPLOYED',
        connectionStatus: account.connectionStatus || 'disconnected',
        deployed: false,
        metaApiAvailable: this.metaApiService.isAvailable(),
      };
    }

    const status = await this.metaApiService.getConnectionStatus(account.metaApiAccountId);
    
    return {
      ...status,
      metaApiAvailable: true,
    };
  }

  /**
   * Sync account info (balance, equity, etc.) from MetaApi
   */
  async syncAccount(id: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    if (!account.metaApiAccountId) {
      this.logger.warn(`Account ${id} is not linked to MetaApi, skipping sync`);
      return;
    }

    this.logger.log(`Syncing account ${id} from MetaApi`);

    try {
      // Ensure account is deployed before syncing
      await this.ensureAccountDeployed(account.metaApiAccountId);

      const accountInfo = await this.metaApiService.getAccountInfo(account.metaApiAccountId);

      await this.mt5AccountRepository.update(id, {
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        marginFree: accountInfo.freeMargin,
        leverage: accountInfo.leverage,
        currency: accountInfo.currency,
        lastSyncAt: new Date(),
        connectionStatus: 'connected',
      });

      this.logger.log(`Account ${id} synced successfully`);
    } catch (error) {
      this.logger.error(`Failed to sync account ${id}: ${error.message}`);
      await this.mt5AccountRepository.update(id, {
        lastSyncError: error.message,
        lastSyncErrorAt: new Date(),
        syncAttempts: (account.syncAttempts || 0) + 1,
      });
      // Do not re-throw as 500. Log it and maybe throw a Bad Request if triggered manually
      // or just suppress it if it's a background sync. 
      // User says "got 500 code", implies manual trigger.
      // Throw 422 to indicate the sync failed (likely due to MetaApi issues) but the request was valid
      throw new UnprocessableEntityException(`Sync failed: ${error.message}`); 
    }
  }

  /**
   * Import trades from MT5 via MetaApi
   */
  async importTradesFromMT5(
    id: string,
    fromDate: string,
    toDate: string,
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    if (!account.metaApiAccountId) {
      throw new Error('Account is not linked to MetaApi. Please link the account first.');
    }

    this.logger.log(`Importing trades for account ${id} from ${fromDate} to ${toDate}`);

    // Ensure account is deployed before importing
    await this.ensureAccountDeployed(account.metaApiAccountId);

    // Fetch deals from MetaApi
    const deals = await this.metaApiService.getDealHistory(
      account.metaApiAccountId,
      new Date(fromDate),
      new Date(toDate),
    );

    // Map to trade format
    const mappedTrades = this.tradeMapperService.mapDealsToTrades(deals);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Import each trade
    for (const trade of mappedTrades) {
      try {
        // Check if trade already exists by looking for matching symbol + entry date
        // Check across ALL user accounts to prevent duplicates
      // Check for duplicates - now checking across ALL trades for this user
      const duplicate = await this.tradesService.findDuplicate(
        account.userId, 
        trade.symbol, 
        trade.entryDate,
        trade.externalId // Pass externalId for exact match if available
      );

      if (duplicate) {
        this.logger.debug(`Skipping duplicate trade: ${trade.symbol} at ${trade.entryDate}`);
        skipped++;
        continue;
      }

      const createTradeDto: any = {
        assetType: trade.assetType,
        symbol: trade.symbol,
        side: trade.direction, // Corrected from direction to side
        status: TradeStatus.CLOSED, // Imported trades are usually closed history
        openPrice: trade.entryPrice, // Corrected from entryPrice to openPrice
        closePrice: trade.exitPrice || undefined, // Corrected from exitPrice to closePrice
        openTime: trade.entryDate.toISOString(),
        closeTime: trade.exitDate?.toISOString(),
        quantity: trade.quantity,
        commission: trade.commission,
        marginUsed: trade.marginUsed, // Include marginUsed
        notes: `${trade.notes}\nSwap: ${trade.swap}`,
        accountId: id,
      };

      const createdTrade = await this.tradesService.create(createTradeDto, { id: account.userId } as any);
        
        // Auto-create journal entry for the trade
        try {
          await this.tradeJournalSyncService.createJournalForTrade(createdTrade);
          this.logger.log(`Auto-created journal for trade ${createdTrade.id}`);
        } catch (journalError) {
          this.logger.warn(`Failed to create journal for trade ${createdTrade.id}: ${journalError.message}`);
          // Don't fail the import if journal creation fails
        }
        
        imported++;
      } catch (error) {
        this.logger.error(`Failed to import trade ${trade.externalId}: ${error.message}`);
        errors++;
      }
    }

    // Calculate total P&L from imported trades
    const totalPnL = mappedTrades
      .filter(t => !t.externalId || imported > 0) // Only count imported trades
      .reduce((sum, t) => sum + (t.realizedPnL || 0), 0);

    // Update account stats and balance
    // Note: PostgreSQL decimal columns return as strings, must convert to numbers
    const initialBal = parseFloat(String(account.initialBalance)) || 0;
    const currentBal = parseFloat(String(account.balance)) || 0;
    const baseBalance = initialBal || currentBal;
    const newBalance = baseBalance + totalPnL;
    
    this.logger.log(`Balance calculation: base=${baseBalance}, pnl=${totalPnL}, new=${newBalance}`);
    
    await this.mt5AccountRepository.update(id, {
      totalTradesImported: (account.totalTradesImported || 0) + imported,
      lastSyncAt: new Date(),
      balance: newBalance,
      equity: newBalance,
      profit: totalPnL,
    });

    this.logger.log(`Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors, P&L: ${totalPnL}`);

    return { imported, skipped, errors };
  }

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
          metaApiAccountId: account.metaApiAccountId,
          connectionStatus: account.connectionStatus || 'disconnected',
          isRealAccount: account.isRealAccount,
        } as any);
      }
    }

    return validAccounts;
  }

  async findOne(id: string): Promise<MT5Account | null> {
    return this.mt5AccountRepository.findOne({ where: { id } });
  }

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

  async remove(id: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    // Unlink from MetaApi if connected
    if (account.metaApiAccountId) {
      try {
        await this.metaApiService.unlinkAccount(account.metaApiAccountId);
      } catch (error) {
        this.logger.warn(`Failed to unlink from MetaApi: ${error.message}`);
      }
    }

    // Orphan trades
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

  private mapToResponseDto(account: MT5Account): MT5AccountResponseDto {
    const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';
    const { password, login, server, ...rest } = account;

    return {
      ...rest,
      login: isManual ? login : this.decrypt(login),
      server: isManual ? server : this.decrypt(server),
    } as MT5AccountResponseDto;
  }

  private async cleanupCorruptedAccounts(accountIds: string[]): Promise<void> {
    try {
      this.logger.log(`Cleaning up ${accountIds.length} corrupted MT5 accounts`);
      await this.mt5AccountRepository.delete(accountIds);
    } catch (error) {
      this.logger.error(`Failed to cleanup corrupted accounts: ${error.message}`);
    }
  }
  private async ensureAccountDeployed(metaApiAccountId: string): Promise<void> {
    try {
      const status = await this.metaApiService.getConnectionStatus(metaApiAccountId);
      
      if (!status.deployed) {
        this.logger.log(`Account ${metaApiAccountId} is UNDEPLOYED. Auto-deploying for sync...`);
        // This will trigger a 6-hour billing session
        await this.metaApiService.deployAccount(metaApiAccountId);
        
        // Update local status
        await this.mt5AccountRepository.update(
          { metaApiAccountId },
          { 
            deploymentState: 'DEPLOYED',
            connectionState: 'CONNECTED' // Assume connected after deploy
          }
        );
      }
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes('not found')) {
         this.logger.warn(`MetaApi account not found (likely deleted remotely): ${error.message}`);
         throw new UnprocessableEntityException('MetaApi account not found. It may have been deleted remotely. Please unlink and re-link this account.');
      }
      this.logger.error(`Failed to ensure account deployment: ${error.message}`);
      throw error;
    }
  }
  async getCandles(
    accountId: string,
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    const account = await this.findOne(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    if (!account.login) {
      // Manual account - return empty or mock? 
      // For now, return empty array as manual accounts don't have metaapi connection
      return [];
    }
    
    // Delegate to MetaApiService
    return this.metaApiService.getCandles(account.id, symbol, timeframe, startTime, endTime);
  }
}
