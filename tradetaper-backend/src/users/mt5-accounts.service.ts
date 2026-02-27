// src/users/mt5-accounts.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { MetaApiService } from './metaapi.service';
import { MT5PositionsGateway } from '../websocket/mt5-positions.gateway'; // [FIX #15]

import {
  SynchronizationListener,
  MetatraderDeal,
  MetatraderPosition,
  MetatraderAccountInformation,
  StreamingMetaApiConnectionInstance,
} from 'metaapi.cloud-sdk';
import { AssetType, TradeDirection, TradeStatus } from '../types/enums';

@Injectable()
export class MT5AccountsService {
  private readonly logger = new Logger(MT5AccountsService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepository: Repository<MT5Account>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly tradesService: TradesService,
    private readonly metaApiService: MetaApiService,
    private readonly mt5PositionsGateway: MT5PositionsGateway, // [FIX #15]
    private readonly dataSource: DataSource,
  ) {
    const encryptionKeyString =
      this.configService.get<string>('MT5_ENCRYPTION_KEY') ||
      crypto.randomBytes(32).toString('hex');

    this.encryptionKey = Buffer.from(encryptionKeyString, 'hex');

    if (
      !this.configService.get<string>('MT5_ENCRYPTION_KEY') &&
      this.configService.get<string>('NODE_ENV') !== 'production'
    ) {
      this.logger.warn(
        'Using generated encryption key. Set MT5_ENCRYPTION_KEY for production.',
      );
    }
  }

  /**
   * Completely disconnects and removes a MetaAPI account
   * Stops streaming, undeploys from MetaAPI, and clears DB state
   */
  async disconnectMetaApiAccount(accountId: string, userId: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (!account.metaApiAccountId) {
      throw new BadRequestException('Account is not connected to MetaApi');
    }

    const metaApiAccountId = account.metaApiAccountId;
    this.logger.log(`Disconnecting MetaAPI account ${metaApiAccountId} for user ${userId}`);

    try {
      // 1. Stop streaming if active
      if (account.isStreamingActive) {
        await this.metaApiService.closeConnection(metaApiAccountId);
        const listener = this.metaApiListeners.get(metaApiAccountId);
        if (listener) {
          try {
            const connection = await this.metaApiService.getStreamingConnection(metaApiAccountId);
            if (connection) {
              connection.removeSynchronizationListener(listener);
            }
          } catch (e) {
            this.logger.warn(`Could not remove MetaAPI listener during disconnect: ${e.message}`);
          }
          this.metaApiListeners.delete(metaApiAccountId);
        }
      }

      // 2. Undeploy and Delete from MetaAPI cloud
      try {
        await this.metaApiService.removeAccount(metaApiAccountId);
        this.logger.log(`Deleted MetaAPI account ${metaApiAccountId} from cloud`);
      } catch (e) {
        this.logger.warn(`Failed to delete MetaAPI account ${metaApiAccountId} from cloud: ${e.message}. It might already be deleted.`);
      }

      // 3. Clear MetaAPI specific fields from local DB, but keep the account record
      await this.mt5AccountRepository.update(accountId, {
        metaApiAccountId: null,
        provisioningProfileId: null,
        connectionStatus: 'disconnected',
        connectionState: 'DISCONNECTED',
        deploymentState: 'UNDEPLOYED',
        isStreamingActive: false,
        syncAttempts: 0,
        lastHeartbeatAt: null,
        lastSyncAt: null,
        lastSyncError: null,
      });

      this.logger.log(`Successfully disconnected MetaAPI for account ${accountId}`);
    } catch (error) {
      this.logger.error(`Error disconnecting MetaAPI account ${accountId}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to disconnect MetaAPI: ${error.message}`);
    }
  }

  private readonly metaApiListeners = new Map<
    string,
    SynchronizationListener
  >();

  /** Expose MetaAPI enabled state — avoids injecting MetaApiService into sibling services */
  isMetaApiEnabled(): boolean {
    return this.metaApiService.isEnabled();
  }

  /** Expose MetaApiService instance — for direct historical candle fetching in TradesService */
  getMetaApiService(): MetaApiService {
    return this.metaApiService;
  }

  /** Return cached connection for a MetaAPI account — null if not yet connected */
  getCachedConnection(metaApiAccountId: string) {
    return this.metaApiService.getCachedConnection(metaApiAccountId);
  }


  // [FIX #1] Per-call random IV — ciphertext is no longer deterministic
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    // Store as iv:ciphertext so decrypt can recover the IV
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  // [FIX #1] Decrypt supports both legacy (single-field) and new (iv:ciphertext) format
  private decrypt(raw: string): string {
    try {
      if (!raw || typeof raw !== 'string') {
        throw new Error('Invalid encrypted data');
      }
      if (raw.includes(':')) {
        // New format: iv:ciphertext
        const colonIdx = raw.indexOf(':');
        const iv = Buffer.from(raw.substring(0, colonIdx), 'hex');
        const enc = Buffer.from(raw.substring(colonIdx + 1), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
        return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
      }
      // Legacy format (static IV from env — for accounts encrypted before this fix)
      const legacyIvString = this.configService.get<string>('MT5_ENCRYPTION_IV') || '';
      if (!legacyIvString) throw new Error('No legacy IV configured for old-format decryption');
      const iv = Buffer.from(legacyIvString, 'hex').slice(0, 16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(raw, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error(`Failed to decrypt data: ${error.message}`);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /** [FIX #16] Plaintext SHA-256 fingerprint for dedup without storing credentials in plaintext */
  private accountFingerprint(login: string, server: string): string {
    return crypto
      .createHash('sha256')
      .update(`${login.toLowerCase()}:${server.toLowerCase()}`)
      .digest('hex');
  }

  /**
   * Create a new MT5 account
   */
  async create(
    createDto: CreateMT5AccountDto,
    userId: string,
  ): Promise<MT5AccountResponseDto> {
    this.logger.log(`Creating MetaApi MT5 account for user ${userId}`);

    if (!this.metaApiService.isEnabled()) {
      throw new BadRequestException(
        'MetaApi integration is not configured. Please contact support.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!createDto.password) {
      throw new BadRequestException('Password is required to connect MT5');
    }

    // [FIX #16] SHA-256 fingerprint dedup — immune to IV changes
    const fingerprint = this.accountFingerprint(
      createDto.login.toString(),
      createDto.server,
    );
    const existingByFingerprint = await this.mt5AccountRepository.findOne({
      where: { userId, loginServerFingerprint: fingerprint } as any,
    });
    if (existingByFingerprint) {
      throw new BadRequestException('MT5 account already linked. This login and server combination already exists.');
    }

    // [FIX #2] provisionAccount() returns immediately after submitting deploy
    const provision = await this.metaApiService.provisionAccount({
      accountName: createDto.accountName,
      server: createDto.server,
      login: createDto.login,
      password: createDto.password,
      isRealAccount: createDto.isRealAccount ?? false,
    });

    const mt5Account = this.mt5AccountRepository.create({
      accountName: createDto.accountName,
      server: this.encrypt(createDto.server),
      login: this.encrypt(createDto.login.toString()),
      password: this.encrypt(createDto.password),
      userId: userId,
      accountType:
        createDto.accountType || (createDto.isRealAccount ? 'real' : 'demo'),
      currency: createDto.currency || 'USD',
      isActive: createDto.isActive ?? true,
      isRealAccount: createDto.isRealAccount ?? false,
      connectionStatus: 'CONNECTING',
      deploymentState: 'DEPLOYING',  // [FIX #2] starts as DEPLOYING, not yet DEPLOYED
      connectionState: 'CONNECTING',
      initialBalance: createDto.initialBalance ?? 0,
      balance: createDto.initialBalance ?? 0,
      equity: createDto.initialBalance ?? 0,
      leverage: createDto.leverage ?? 100,
      target: createDto.target ?? 0,
      autoSyncEnabled: true,
      metaApiAccountId: provision.metaApiAccountId,
      provisioningProfileId: provision.provisioningProfileId,
      region: provision.region,
      metadata: {
        provider: 'metaapi',
        loginServerFingerprint: fingerprint, // [FIX #16] store fingerprint in metadata
      },
    });

    const savedAccount = await this.mt5AccountRepository.save(mt5Account);
    this.logger.log(
      `MT5 MetaApi account ${savedAccount.id} created successfully (deploying in background).`,
    );

    // [FIX #2] Background: wait for deploy, then sync
    void this.metaApiService
      .waitForDeployment(provision.metaApiAccountId)
      .then(async (deployResult) => {
        await this.mt5AccountRepository.update(savedAccount.id, {
          deploymentState: deployResult.deploymentState,
          connectionStatus: 'CONNECTED',
        });
        return this.syncMetaApiAccount(savedAccount.id, {
          fullHistory: true,
          startStreaming: true,
        });
      })
      .catch((error) => {
        this.logger.error(
          `MetaApi background deploy/sync failed for account ${savedAccount.id}: ${error.message}`,
        );
        void this.mt5AccountRepository.update(savedAccount.id, {
          deploymentState: 'ERROR',
          connectionStatus: 'DISCONNECTED',
          lastSyncError: error.message,
        });
      });

    return this.mapToResponseDto(savedAccount);
  }

  /**
   * Create a manual MT5 account (for file upload workflow)
   */
  async createManual(
    manualAccountData: Record<string, any>,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Creating manual MT5 account for user ${manualAccountData.userId}`,
    );

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
        this.logger.warn(
          `Account ${account.id} has encryption issue, returning with masked data: ${error.message}`,
        );
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

  async getMetaApiServers(
    query: string,
  ): Promise<Array<{ name: string; broker?: string; type?: string }>> {
    if (!this.metaApiService.isEnabled()) {
      return [];
    }
    return this.metaApiService.getKnownServers(query);
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

    await this.mt5AccountRepository.update(id, updatedData as any);

    const updatedAccount = await this.mt5AccountRepository.findOne({
      where: { id },
    });
    if (!updatedAccount) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    return this.mapToResponseDto(updatedAccount);
  }

  async syncMetaApiAccount(
    accountId: string,
    options: { fullHistory?: boolean; startStreaming?: boolean } = {},
  ): Promise<{ imported: number; skipped: number; failed: number }> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id: accountId },
    });

    if (!account || !account.metaApiAccountId) {
      throw new BadRequestException('MetaApi account not configured');
    }

    if (!this.metaApiService.isEnabled()) {
      throw new BadRequestException('MetaApi integration is not configured');
    }

    try {
      const connection = await this.metaApiService.getStreamingConnection(
        account.metaApiAccountId,
      );

      const accountInfo = connection.terminalState.accountInformation;
      if (accountInfo) {
        await this.updateAccountInfo(account.id, accountInfo);
      }

      await this.syncOpenPositionsFromMetaApi(account, connection);

      const endTime = new Date();
      const metadata = account.metadata || {};
      const storedTime = metadata.metaApiLastHistoryTime
        ? new Date(metadata.metaApiLastHistoryTime)
        : null;
      const safeStoredTime =
        storedTime && !Number.isNaN(storedTime.getTime()) ? storedTime : null;
      const startTime = options.fullHistory
        ? new Date(0)
        : safeStoredTime || account.lastSyncAt || new Date(0);

      let imported = 0;
      let skipped = 0;
      let failed = 0;

      const deals = connection.historyStorage.getDealsByTimeRange(
        startTime,
        endTime,
      );
      if (deals && deals.length > 0) {
        const result = await this.processMetaApiDealsBatch(
          account,
          deals,
          connection,
        );
        imported += result.imported;
        skipped += result.skipped;
        failed += result.failed;
      }

      await this.mt5AccountRepository.update(accountId, {
        connectionState: 'SYNCHRONIZED',
        connectionStatus: 'CONNECTED',
        lastSyncAt: new Date(),
        lastHeartbeatAt: new Date(),
        lastSyncError: null,
        lastSyncErrorAt: null,
        isStreamingActive: options.startStreaming ?? true,
        metadata: {
          ...metadata,
          metaApiLastHistoryTime: endTime.toISOString(),
        } as Record<string, any>,
      });

      if (options.startStreaming ?? true) {
        await this.ensureMetaApiListener(account, connection);
      }

      return { imported, skipped, failed };
    } catch (error) {
      this.logger.error(
        `MetaApi sync failed for account ${accountId}: ${error.message}`,
      );
      await this.mt5AccountRepository.update(accountId, {
        connectionState: 'DISCONNECTED',
        connectionStatus: 'DISCONNECTED',
        lastSyncError: error.message,
        lastSyncErrorAt: new Date(),
        isStreamingActive: false,
      });
      throw new InternalServerErrorException('Failed to sync MetaApi account');
    }
  }

  /**
   * Remove an MT5 account
   */
  async remove(id: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    if (account.metaApiAccountId) {
      try {
        await this.metaApiService.closeConnection(account.metaApiAccountId);
        if (this.metaApiService.isEnabled()) {
          await this.metaApiService.removeAccount(account.metaApiAccountId);
        }
        this.metaApiListeners.delete(account.metaApiAccountId);
      } catch (error) {
        this.logger.warn(
          `Failed to remove MetaApi account ${account.metaApiAccountId}: ${error.message}`,
        );
      }
    }

    // [FIX #10] Use TypeORM repository instead of raw SQL — preserves ORM lifecycle hooks
    try {
      await this.tradesService.orphanTradesByAccount(id);
    } catch (error) {
      this.logger.warn(`Failed to orphan trades for account ${id}: ${error.message}`);
    }

    await this.mt5AccountRepository.delete(id);
    this.logger.log(`Successfully deleted MT5 account ${id}`);
  }

  private async updateAccountInfo(
    accountId: string,
    accountInfo: MetatraderAccountInformation,
  ): Promise<void> {
    await this.mt5AccountRepository.update(accountId, {
      balance: parseFloat(accountInfo.balance?.toString() || '0'),
      equity: parseFloat(accountInfo.equity?.toString() || '0'),
      margin: parseFloat(accountInfo.margin?.toString() || '0'),
      marginFree: parseFloat(accountInfo.freeMargin?.toString() || '0'),
      leverage: accountInfo.leverage || 1,
      currency: accountInfo.currency || 'USD',
      lastHeartbeatAt: new Date(),
      accountInfo: accountInfo as any,
    });
  }

  /** [FIX #7] Per-position debounce timers to avoid N+1 DB queries on rapid tick events */
  private readonly positionUpdateDebounce = new Map<string, ReturnType<typeof setTimeout>>();

  private async ensureMetaApiListener(
    account: MT5Account,
    connection: StreamingMetaApiConnectionInstance,
  ): Promise<void> {
    if (!account.metaApiAccountId) return;
    if (this.metaApiListeners.has(account.metaApiAccountId)) return;

    const listener = new MetaApiSyncListener(
      {
        onConnected: async () => {
          await this.mt5AccountRepository.update(account.id, {
            connectionStatus: 'CONNECTED',
            connectionState: 'SYNCHRONIZED',
            isStreamingActive: true,
            lastHeartbeatAt: new Date(),
          });
        },
        onDisconnected: async () => {
          await this.mt5AccountRepository.update(account.id, {
            connectionStatus: 'DISCONNECTED',
            connectionState: 'DISCONNECTED',
            isStreamingActive: false,
          });
          // [FIX #12] Auto-reconnect watchdog with exponential backoff
          void this.reconnectWithBackoff(account);
        },
        onAccountInformationUpdated: async (info) => {
          await this.updateAccountInfo(account.id, info);
        },
        onPositionsReplaced: async (positions) => {
          await this.syncOpenPositionsFromMetaApi(
            account,
            connection,
            positions,
          );
        },
        onPositionUpdated: async (position) => {
          // [FIX #7] Debounce rapid updates for same position — 500ms window
          const key = `${account.id}:${position.id}`;
          const existing = this.positionUpdateDebounce.get(key);
          if (existing) clearTimeout(existing);
          const timer = setTimeout(() => {
            this.positionUpdateDebounce.delete(key);
            void this.syncMetaApiPosition(account, position, connection);
          }, 500);
          this.positionUpdateDebounce.set(key, timer);
        },
        onDealAdded: async (deal) => {
          await this.processMetaApiDeal(account, deal, connection);
        },
      },
      this.logger,
    );

    connection.addSynchronizationListener(listener);
    this.metaApiListeners.set(account.metaApiAccountId, listener);
  }

  /** [FIX #12] Auto-reconnect with exponential backoff (max 5 attempts) */
  private async reconnectWithBackoff(account: MT5Account): Promise<void> {
    let delay = 5_000;
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise((r) => setTimeout(r, delay));
      try {
        this.logger.log(
          `Reconnect attempt ${attempt} for MetaApi account ${account.id}`,
        );
        await this.syncMetaApiAccount(account.id, { startStreaming: true });
        this.logger.log(`Reconnect successful for ${account.id}`);
        return;
      } catch (err) {
        this.logger.warn(
          `Reconnect attempt ${attempt} failed for ${account.id}: ${err.message}`,
        );
        delay = Math.min(delay * 2, 60_000);
      }
    }
    this.logger.error(
      `All reconnect attempts exhausted for MetaApi account ${account.id}`,
    );
  }

  private async syncOpenPositionsFromMetaApi(
    account: MT5Account,
    connection: StreamingMetaApiConnectionInstance,
    overridePositions?: MetatraderPosition[],
  ): Promise<void> {
    const positions = overridePositions || connection.terminalState.positions;
    if (!positions || positions.length === 0) return;

    const positionIds = positions.map((p) => p.id.toString());
    const existingTrades = await this.tradesService.findManyByExternalIds(
      account.userId,
      positionIds,
      account.id,
    );

    const groupedByExternalId = new Map<string, any[]>();
    existingTrades.forEach((trade) => {
      if (!trade.externalId) return;
      const list = groupedByExternalId.get(trade.externalId) || [];
      list.push(trade);
      groupedByExternalId.set(trade.externalId, list);
    });

    const tradeMap = new Map<string, any>();
    for (const [externalId, trades] of groupedByExternalId.entries()) {
      if (trades.length > 1) {
        const merged = await this.tradesService.mergeDuplicateExternalTrades(
          account.userId,
          externalId,
          account.id,
        );
        if (merged) {
          tradeMap.set(externalId, merged);
        }
      } else {
        tradeMap.set(externalId, trades[0]);
      }
    }

    for (const position of positions) {
      await this.syncMetaApiPosition(account, position, connection, tradeMap);
    }
  }

  private async syncMetaApiPosition(
    account: MT5Account,
    position: MetatraderPosition,
    connection: StreamingMetaApiConnectionInstance,
    tradeMap?: Map<string, any>,
  ): Promise<void> {
    const externalId = position.id.toString();
    const existingTrade =
      tradeMap?.get(externalId) ||
      (await this.tradesService.findOneByExternalId(
        account.userId,
        externalId,
        account.id,
      ));

    const side =
      position.type === 'POSITION_TYPE_BUY'
        ? TradeDirection.LONG
        : TradeDirection.SHORT;
    const contractSize = this.getContractSize(connection, position.symbol);
    const openTime = position.time
      ? position.time.toISOString()
      : new Date().toISOString();

    if (existingTrade) {
      const updates: Record<string, any> = {};
      if (!existingTrade.openTime && openTime) updates.openTime = openTime;
      if (!existingTrade.openPrice && position.openPrice)
        updates.openPrice = position.openPrice;
      if (!existingTrade.quantity && position.volume)
        updates.quantity = position.volume;
      if (!existingTrade.side) updates.side = side;
      if (position.stopLoss !== undefined) updates.stopLoss = position.stopLoss;
      if (position.takeProfit !== undefined) updates.takeProfit = position.takeProfit;
      if (contractSize && !existingTrade.contractSize)
        updates.contractSize = contractSize;

      if (Object.keys(updates).length > 0) {
        await this.tradesService.updateFromSync(existingTrade.id, updates, {
          source: 'mt5',
          changes: {},
          note: 'MetaApi position update',
        });
      }

      // [FIX #15] Push updated position to WebSocket for real-time P/L streaming
      this.mt5PositionsGateway.emitPositionsUpdate(account.userId, {
        enabled: true,
        accountId: account.id,
        terminalId: account.metaApiAccountId,
        positions: [
          {
            ticket: position.id,
            symbol: position.symbol,
            type: position.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL',
            volume: position.volume,
            openPrice: position.openPrice,
            currentPrice: position.currentPrice,
            profit: position.profit,
            stopLoss: position.stopLoss,
            takeProfit: position.takeProfit,
            openTime: openTime,
            swap: position.swap,
            comment: (position as any).comment,
          },
        ],
        source: 'metaapi',
      });
      return;
    }

    await this.tradesService.create(
      {
        symbol: position.symbol,
        assetType: this.detectAssetType(position.symbol),
        side,
        status: TradeStatus.OPEN,
        openTime,
        openPrice: position.openPrice || 0,
        quantity: position.volume || 0,
        commission: 0,
        swap: position.swap || 0,
        notes: (position as any).comment
          ? `MetaApi Position ID: ${position.id} | ${(position as any).comment}`
          : `Auto-synced via MetaApi Position ID: ${position.id}`,
        accountId: account.id,
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        externalId,
        mt5Magic: position.magic,
        contractSize,
      },
      { id: account.userId } as any,
    );
  }

  /**
   * [FIX #5] Process deals in parallel batches of 50 using Promise.allSettled.
   * Reduces blocking time for large accounts from O(n*5ms) to O(n/50*5ms).
   */
  private async processMetaApiDealsBatch(
    account: MT5Account,
    deals: MetatraderDeal[],
    connection: StreamingMetaApiConnectionInstance,
  ): Promise<{ imported: number; skipped: number; failed: number }> {
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    const filteredDeals = deals.filter(
      (deal) => this.isSupportedDealType(deal) && !!deal.symbol,
    );

    const positionIds = filteredDeals
      .map((deal) => deal.positionId)
      .filter(Boolean)
      .map((id) => id!.toString());

    const existingTrades = await this.tradesService.findManyByExternalIds(
      account.userId,
      positionIds,
      account.id,
    );

    const groupedByExternalId = new Map<string, any[]>();
    existingTrades.forEach((trade) => {
      if (!trade.externalId) return;
      const list = groupedByExternalId.get(trade.externalId) || [];
      list.push(trade);
      groupedByExternalId.set(trade.externalId, list);
    });

    const existingTradesMap = new Map<string, any>();
    for (const [externalId, trades] of groupedByExternalId.entries()) {
      if (trades.length > 1) {
        const merged = await this.tradesService.mergeDuplicateExternalTrades(
          account.userId,
          externalId,
          account.id,
        );
        if (merged) existingTradesMap.set(externalId, merged);
      } else {
        existingTradesMap.set(externalId, trades[0]);
      }
    }

    const orderedDeals = [...filteredDeals].sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );

    // [FIX #5] Process in parallel batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < orderedDeals.length; i += BATCH_SIZE) {
      const batch = orderedDeals.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (deal) => {
          const externalId = deal.positionId
            ? deal.positionId.toString()
            : `deal_${deal.id}`;
          const existingTrade = deal.positionId
            ? existingTradesMap.get(externalId)
            : await this.tradesService.findOneByExternalId(
                account.userId,
                externalId,
                account.id,
              );

          const result = await this.processMetaApiDeal(
            account,
            deal,
            connection,
            existingTrade,
            externalId,
          );
          return { result, deal, externalId };
        }),
      );

      for (const settled of results) {
        if (settled.status === 'fulfilled') {
          const { result, deal, externalId } = settled.value;
          if (result.status === 'imported') {
            imported++;
            if (deal.positionId && result.trade) {
              existingTradesMap.set(externalId, result.trade);
            }
          } else if (result.status === 'skipped') {
            skipped++;
          } else {
            failed++;
          }
        } else {
          failed++;
          this.logger.error(
            `MetaApi batch deal failed: ${settled.reason?.message}`,
          );
        }
      }
    }

    return { imported, skipped, failed };
  }

  /**
   * [FIX #4] INOUT partial close: closes existing, creates new open for remaining volume.
   * [FIX #13] Persists deal.comment to notes.
   * [FIX #14] Maps deal.reason to closeReason.
   */
  private async processMetaApiDeal(
    account: MT5Account,
    deal: MetatraderDeal,
    connection: StreamingMetaApiConnectionInstance,
    existingTrade?: any,
    externalIdOverride?: string,
  ): Promise<{ status: 'imported' | 'skipped' | 'failed'; trade?: any }> {
    const externalId = externalIdOverride || deal.positionId?.toString();
    if (!externalId) return { status: 'skipped' };

    const side = this.mapDealSide(deal);
    if (!side) return { status: 'skipped' };
    if (!deal.symbol) return { status: 'skipped' };

    const tradeRecord =
      existingTrade ||
      (await this.tradesService.findOneByExternalId(
        account.userId,
        externalId,
        account.id,
      ));

    const entryType = (deal.entryType || '').toUpperCase();
    const isEntry = entryType === 'DEAL_ENTRY_IN';
    const isExit =
      entryType === 'DEAL_ENTRY_OUT' || entryType === 'DEAL_ENTRY_OUT_BY';
    const isInOut = entryType === 'DEAL_ENTRY_INOUT';

    const shouldTreatAsEntry = isEntry || (isInOut && !tradeRecord);
    const shouldTreatAsExit  = isExit  || (isInOut && !!tradeRecord);

    const openTime = deal.time
      ? deal.time.toISOString()
      : new Date().toISOString();
    const price = deal.price || 0;
    const contractSize = this.getContractSize(connection, deal.symbol);

    // [FIX #13] Compose notes from EA comment
    const dealNotes = deal.comment
      ? `MetaApi Position ID: ${externalId} | ${deal.comment}`
      : `Auto-synced via MetaApi Position ID: ${externalId}`;

    // [FIX #14] Map deal.reason to a human-readable close reason
    const closeReason = this.mapDealReason((deal as any).reason);

    if (shouldTreatAsEntry) {
      if (tradeRecord) {
        const updates: Record<string, any> = {};
        if (!tradeRecord.openTime && openTime) updates.openTime = openTime;
        if (!tradeRecord.openPrice && price) updates.openPrice = price;
        if (!tradeRecord.quantity && deal.volume) updates.quantity = deal.volume;
        if (!tradeRecord.side) updates.side = side;
        if (contractSize && !tradeRecord.contractSize) updates.contractSize = contractSize;
        if (!tradeRecord.externalDealId) updates.externalDealId = deal.id;
        if (!tradeRecord.mt5Magic && deal.magic) updates.mt5Magic = deal.magic;
        // [FIELD FIX] Apply SL/TP from deal if we have a value and the trade doesn't yet
        if (deal.stopLoss !== undefined && deal.stopLoss !== null && deal.stopLoss !== 0)
          updates.stopLoss = deal.stopLoss;
        if (deal.takeProfit !== undefined && deal.takeProfit !== null && deal.takeProfit !== 0)
          updates.takeProfit = deal.takeProfit;
        // [FIX #13]
        if (!tradeRecord.notes && deal.comment) updates.notes = dealNotes;

        if (Object.keys(updates).length > 0) {
          const updatedTrade = await this.tradesService.updateFromSync(
            tradeRecord.id,
            updates,
            { source: 'mt5', changes: {}, note: 'MetaApi entry update' },
          );
          return { status: 'imported', trade: updatedTrade };
        }
        return { status: 'skipped' };
      }

      const createdTrade = await this.tradesService.create(
        {
          symbol: deal.symbol,
          assetType: this.detectAssetType(deal.symbol),
          side,
          status: TradeStatus.OPEN,
          openTime,
          openPrice: price,
          quantity: deal.volume || 0,
          commission: deal.commission || 0,
          swap: deal.swap || 0,
          notes: dealNotes, // [FIX #13]
          accountId: account.id,
          externalId,
          externalDealId: deal.id,
          mt5Magic: deal.magic,
          contractSize,
          syncSource: 'metaapi',
          // [FIELD FIX] Map SL/TP from the entry deal (present on MT5 opening deals per MetaAPI docs)
          stopLoss: (deal.stopLoss && deal.stopLoss !== 0) ? deal.stopLoss : undefined,
          takeProfit: (deal.takeProfit && deal.takeProfit !== 0) ? deal.takeProfit : undefined,
        },
        { id: account.userId } as any,
      );
      return { status: 'imported', trade: createdTrade };
    }

    if (shouldTreatAsExit) {
      if (tradeRecord) {
        // [FIELD FIX] Exit deal carries last-known position SL/TP — enrich if open trade lacked them
        const enrichedSl =
          !tradeRecord.stopLoss && deal.stopLoss && deal.stopLoss !== 0
            ? deal.stopLoss
            : undefined;
        const enrichedTp =
          !tradeRecord.takeProfit && deal.takeProfit && deal.takeProfit !== 0
            ? deal.takeProfit
            : undefined;

        const updatedTrade = await this.tradesService.update(
          tradeRecord.id,
          {
            status: TradeStatus.CLOSED,
            closeTime: openTime,
            closePrice: price,
            profitOrLoss: deal.profit,
            commission:
              parseFloat(String(tradeRecord.commission || 0)) +
              (deal.commission || 0),
            swap: parseFloat(String(tradeRecord.swap || 0)) + (deal.swap || 0),
            contractSize: contractSize || tradeRecord.contractSize,
            closeReason, // [FIX #14]
            ...(enrichedSl !== undefined ? { stopLoss: enrichedSl } : {}),
            ...(enrichedTp !== undefined ? { takeProfit: enrichedTp } : {}),
          } as any,
          { id: account.userId } as any,
          { changeSource: 'mt5' },
        );

        // [FIX #4] INOUT partial close — create remaining open position
        if (isInOut) {
          const closedVolume = deal.volume || 0;
          const originalVolume = tradeRecord.quantity
            ? parseFloat(String(tradeRecord.quantity))
            : 0;
          const remainingVolume =
            Math.round((originalVolume - closedVolume) * 100000) / 100000;

          if (remainingVolume > 0.001) {
            this.logger.log(
              `INOUT partial close: ${closedVolume} lots closed, opening new ${remainingVolume} lot position for ${deal.symbol}`,
            );
            await this.tradesService.create(
              {
                symbol: deal.symbol,
                assetType: this.detectAssetType(deal.symbol),
                side: tradeRecord.side,
                status: TradeStatus.OPEN,
                openTime: tradeRecord.openTime || openTime,
                openPrice: tradeRecord.openPrice || price,
                quantity: remainingVolume,
                stopLoss: tradeRecord.stopLoss ?? undefined,
                takeProfit: tradeRecord.takeProfit ?? undefined,
                notes: `Partial close remainder. Original position ID: ${externalId}. Closed ${closedVolume} lots.`,
                accountId: account.id,
                externalId: `${externalId}_partial_${Date.now()}`,
                mt5Magic: deal.magic,
                contractSize,
                syncSource: 'metaapi',
              },
              { id: account.userId } as any,
            );
          }
        }

        return { status: 'imported', trade: updatedTrade };
      }

      // Orphan exit: entry was missed
      const inferredSide =
        side === TradeDirection.LONG
          ? TradeDirection.SHORT
          : TradeDirection.LONG;
      const createdTrade = await this.tradesService.create(
        {
          symbol: deal.symbol,
          assetType: this.detectAssetType(deal.symbol),
          side: inferredSide,
          status: TradeStatus.CLOSED,
          openTime,
          closeTime: openTime,
          openPrice: 0,
          closePrice: price,
          quantity: deal.volume || 0,
          profitOrLoss: deal.profit,
          commission: deal.commission || 0,
          swap: deal.swap || 0,
          notes: `Orphan Exit Synced (Entry missing). Position ID: ${externalId}${deal.comment ? ' | ' + deal.comment : ''}`, // [FIX #13]
          accountId: account.id,
          externalId,
          externalDealId: deal.id,
          mt5Magic: deal.magic,
          contractSize,
          syncSource: 'metaapi',
          closeReason, // [FIX #14]
        } as any,
        { id: account.userId } as any,
      );
      return { status: 'imported', trade: createdTrade };
    }

    return { status: 'skipped' };
  }

  /** [FIX #14] Map MetaAPI deal reason to human-readable string */
  private mapDealReason(reason?: string): string | undefined {
    if (!reason) return undefined;
    const reasonMap: Record<string, string> = {
      DEAL_REASON_CLIENT: 'Manual (Desktop)',
      DEAL_REASON_MOBILE: 'Manual (Mobile)',
      DEAL_REASON_WEB: 'Manual (Web)',
      DEAL_REASON_EXPERT: 'Expert Advisor',
      DEAL_REASON_SL: 'Stop Loss',
      DEAL_REASON_TP: 'Take Profit',
      DEAL_REASON_SO: 'Stop Out',
      DEAL_REASON_ROLLOVER: 'Rollover',
      DEAL_REASON_VMARGIN: 'Variation Margin',
      DEAL_REASON_SPLIT: 'Stock Split',
    };
    return reasonMap[reason.toUpperCase()] || reason;
  }

  private isSupportedDealType(deal: MetatraderDeal): boolean {
    const type = (deal.type || '').toUpperCase();
    return type === 'DEAL_TYPE_BUY' || type === 'DEAL_TYPE_SELL';
  }

  private mapDealSide(deal: MetatraderDeal): TradeDirection | null {
    const type = (deal.type || '').toUpperCase();
    if (type === 'DEAL_TYPE_BUY') return TradeDirection.LONG;
    if (type === 'DEAL_TYPE_SELL') return TradeDirection.SHORT;
    return null;
  }

  private getContractSize(
    connection: StreamingMetaApiConnectionInstance,
    symbol: string,
  ): number | undefined {
    try {
      const specification = connection.terminalState.specification(symbol);
      return specification?.contractSize;
    } catch {
      return undefined;
    }
  }

  private detectAssetType(symbol: string): AssetType {
    const upper = symbol.toUpperCase();
    const forexPairs = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    const forexMatch = forexPairs.filter((c) => upper.includes(c)).length >= 2;

    if (forexMatch && upper.length <= 7) return AssetType.FOREX;
    if (upper.includes('BTC') || upper.includes('ETH')) return AssetType.CRYPTO;
    if (upper.includes('XAU') || upper.includes('GOLD'))
      return AssetType.COMMODITIES;

    const indices = [
      'US30',
      'DJ30',
      'NAS100',
      'NDX',
      'SPX',
      'SP500',
      'GER30',
      'DE30',
      'UK100',
      'JP225',
    ];
    if (indices.some((i) => upper.includes(i))) return AssetType.INDICES;

    return AssetType.FOREX;
  }

  /**
   * [FIX #9] Map entity for list calls — skips credential decryption for performance.
   * Full credentials are only decrypted when explicitly needed (e.g. settings page).
   */
  private mapToListDto(account: MT5Account): MT5AccountResponseDto {
    const isManual =
      account.metadata?.isManual || account.connectionStatus === 'manual';
    const { password, login, server, ...rest } = account;
    return {
      ...rest,
      login: isManual ? login : '[Protected]',
      server: isManual ? server : '[Protected]',
    } as MT5AccountResponseDto;
  }

  /**
   * Map entity to response DTO (handles decryption) — for detail views only
   */
  private mapToResponseDto(account: MT5Account): MT5AccountResponseDto {
    const isManual =
      account.metadata?.isManual || account.connectionStatus === 'manual';
    const { password, login, server, ...rest } = account;

    return {
      ...rest,
      login: isManual ? login : this.decrypt(login),
      server: isManual ? server : this.decrypt(server),
    } as MT5AccountResponseDto;
  }

  /**
   * Get connection status - simplified for non-MetaAPI mode
   */
  async getConnectionStatus(id: string): Promise<{
    state: string;
    connectionStatus: string;
    deployed: boolean;
    autoSyncEnabled: boolean;
    isStreamingActive: boolean;
    lastSyncAt?: Date;
    lastSyncError?: string;
  }> {
    const account = await this.mt5AccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found`);
    }

    return {
      state: account.deploymentState || 'MANUAL',
      connectionStatus: account.connectionStatus || 'disconnected',
      deployed: account.deploymentState === 'DEPLOYED',
      autoSyncEnabled: !!account.autoSyncEnabled,
      isStreamingActive: !!account.isStreamingActive,
      lastSyncAt: account.lastSyncAt ?? undefined,
      lastSyncError: account.lastSyncError ?? undefined,
    };
  }

  /**
   * Set a specific MT5 account as the default for a user
   */
  async setDefaultAccount(id: string, userId: string): Promise<MT5AccountResponseDto> {
    const account = await this.mt5AccountRepository.findOne({ where: { id, userId } });
    if (!account) {
      throw new NotFoundException(`MT5 account with id ${id} not found or doesn't belong to the user`);
    }

    // Using a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Unset any existing default account for this user
      await queryRunner.manager.update(
        MT5Account,
        { userId, isDefault: true },
        { isDefault: false }
      );

      // 2. Set this account as the default
      await queryRunner.manager.update(
        MT5Account,
        { id },
        { isDefault: true }
      );

      await queryRunner.commitTransaction();

      // Return the updated account
      const updatedAccount = await this.mt5AccountRepository.findOne({ where: { id } });
      return this.mapToResponseDto(updatedAccount!);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to set default account: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to set default account');
    } finally {
      await queryRunner.release();
    }
  }
}

type MetaApiSyncHandlers = {
  onConnected?: () => Promise<void>;
  onDisconnected?: () => Promise<void>;
  onAccountInformationUpdated?: (
    info: MetatraderAccountInformation,
  ) => Promise<void>;
  onPositionsReplaced?: (positions: MetatraderPosition[]) => Promise<void>;
  onPositionUpdated?: (position: MetatraderPosition) => Promise<void>;
  onDealAdded?: (deal: MetatraderDeal) => Promise<void>;
};

class MetaApiSyncListener extends SynchronizationListener {
  constructor(
    private readonly handlers: MetaApiSyncHandlers,
    private readonly logger: Logger,
  ) {
    super();
  }

  async onConnected(instanceIndex: string, replicas: number): Promise<void> {
    try {
      await this.handlers.onConnected?.();
    } catch (error) {
      this.logger.warn(`MetaApi onConnected handler failed: ${error.message}`);
    }
  }

  async onDisconnected(instanceIndex: string): Promise<void> {
    try {
      await this.handlers.onDisconnected?.();
    } catch (error) {
      this.logger.warn(
        `MetaApi onDisconnected handler failed: ${error.message}`,
      );
    }
  }

  async onAccountInformationUpdated(
    instanceIndex: string,
    accountInformation: MetatraderAccountInformation,
  ): Promise<void> {
    try {
      await this.handlers.onAccountInformationUpdated?.(accountInformation);
    } catch (error) {
      this.logger.warn(`MetaApi account info handler failed: ${error.message}`);
    }
  }

  async onPositionsReplaced(
    instanceIndex: string,
    positions: MetatraderPosition[],
  ): Promise<void> {
    try {
      await this.handlers.onPositionsReplaced?.(positions);
    } catch (error) {
      this.logger.warn(
        `MetaApi positions replace handler failed: ${error.message}`,
      );
    }
  }

  async onPositionUpdated(
    instanceIndex: string,
    position: MetatraderPosition,
  ): Promise<void> {
    try {
      await this.handlers.onPositionUpdated?.(position);
    } catch (error) {
      this.logger.warn(
        `MetaApi position update handler failed: ${error.message}`,
      );
    }
  }

  async onDealAdded(
    instanceIndex: string,
    deal: MetatraderDeal,
  ): Promise<void> {
    try {
      await this.handlers.onDealAdded?.(deal);
    } catch (error) {
      this.logger.warn(`MetaApi deal handler failed: ${error.message}`);
    }
  }
}
