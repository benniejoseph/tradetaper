import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MetaApi, {
  MetatraderAccount,
  ProvisioningProfile,
  MetatraderAccountInformation,
  MetatraderDeal,
  MetatraderPosition,
  MetatraderOrder,
  StreamingMetaApiConnectionInstance,
} from 'metaapi.cloud-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { User } from './entities/user.entity';

export interface MT5AccountCredentials {
  accountName: string;
  server: string;
  login: string;
  password: string;
  isRealAccount: boolean;
}

export interface HistoricalTradeFilter {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface LiveTradeData {
  positions: MetatraderPosition[];
  orders: MetatraderOrder[];
  accountInfo: MetatraderAccountInformation;
  deals: MetatraderDeal[];
}

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);
  private metaApi: MetaApi;

  constructor(
    private configService: ConfigService,
    @InjectRepository(MT5Account)
    private mt5AccountRepository: Repository<MT5Account>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.initializeMetaApi();
  }

  private initializeMetaApi() {
    const apiToken = this.configService.get<string>('METAAPI_API_TOKEN');
    const environment = this.configService.get<string>(
      'METAAPI_ENVIRONMENT',
      'sandbox',
    );
    const domain = this.configService.get<string>(
      'METAAPI_DOMAIN',
      'agiliumtrade.ai',
    );
    const requestTimeout = parseInt(
      this.configService.get<string>('METAAPI_REQUEST_TIMEOUT', '60000'),
      10,
    );

    if (!apiToken) {
      this.logger.error('MetaApi API token not configured');
      throw new Error('MetaApi configuration missing');
    }

    this.metaApi = new MetaApi(apiToken, {
      domain,
      requestTimeout,
      retryOpts: {
        retries: 3,
        minDelayInSeconds: 1,
        maxDelayInSeconds: 30,
      },
    });

    this.logger.log(`MetaApi initialized for ${environment} environment`);
  }

  /**
   * Get all available MT5 servers from MetaApi
   */
  async getAvailableServers(): Promise<Array<{ name: string; type: string }>> {
    try {
      // Return predefined servers since provisioning profiles don't contain broker servers
      return [
        { name: 'MetaQuotes-Demo', type: 'demo' },
        { name: 'ICMarkets-Demo', type: 'demo' },
        { name: 'Pepperstone-Demo', type: 'demo' },
        { name: 'FTMO-Demo', type: 'demo' },
        { name: 'Alpari-Demo', type: 'demo' },
        { name: 'XM-Demo', type: 'demo' },
        { name: 'IG-Demo', type: 'demo' },
        { name: 'OANDA-Demo', type: 'demo' },
      ];
    } catch (error) {
      this.logger.error('Failed to fetch available servers', error);
      return [
        { name: 'MetaQuotes-Demo', type: 'demo' },
        { name: 'ICMarkets-Demo', type: 'demo' },
        { name: 'Pepperstone-Demo', type: 'demo' },
      ];
    }
  }

  /**
   * Create or get a provisioning profile for the broker server
   */
  private async getProvisioningProfile(
    server: string,
  ): Promise<ProvisioningProfile> {
    try {
      const profiles =
        await this.metaApi.provisioningProfileApi.getProvisioningProfiles(5, 'active');

      // Find existing profile for this server by name
      let profile = profiles.find((p) => p.name.includes(server));

      if (!profile) {
        // Create new provisioning profile
        const profileData = {
          name: `TradeTaper-${server}`,
          version: 5,
          brokerTimezone: 'EET',
          brokerDSTSwitchTimezone: 'EET',
        };

        profile =
          await this.metaApi.provisioningProfileApi.createProvisioningProfile(
            profileData,
          );
        this.logger.log(
          `Created new provisioning profile for server: ${server}`,
        );
      }

      return profile;
    } catch (error) {
      this.logger.error(
        `Failed to get/create provisioning profile for ${server}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to setup broker connection',
      );
    }
  }

  /**
   * Add a new MT5 account with MetaApi integration
   */
  async addMT5Account(
    userId: string,
    credentials: MT5AccountCredentials,
  ): Promise<MT5Account> {
    try {
      this.logger.log(
        `Adding MT5 account for user ${userId} on server ${credentials.server}`,
      );

      // Check if user exists
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if account already exists
      const existingAccount = await this.mt5AccountRepository.findOne({
        where: { userId, login: credentials.login, server: credentials.server },
      });

      if (existingAccount) {
        throw new BadRequestException('MT5 account already exists');
      }

      // Get or create provisioning profile
      const profile = await this.getProvisioningProfile(credentials.server);

      // Create MetaApi account
      const accountData = {
        login: credentials.login,
        password: credentials.password,
        name: credentials.accountName,
        server: credentials.server,
        provisioningProfileId: profile.id,
        application: 'TradeTaper',
        magic: 1000,
        quoteConnection: false, // Recommended for performance
        reliability: 'regular' as const,
        tags: ['TradeTaper-User'],
        region: 'new-york',
        baseCurrency: 'USD',
      };

      const metaApiAccount =
        await this.metaApi.metatraderAccountApi.createAccount(accountData);

      // Deploy the account
      await metaApiAccount.deploy();

      // Wait for deployment (with timeout)
      const deploymentTimeout = 300000; // 5 minutes
      const startTime = Date.now();

      while (
        !['DEPLOYED'].includes(metaApiAccount.state) &&
        Date.now() - startTime < deploymentTimeout
      ) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await metaApiAccount.reload();
      }

      if (!['DEPLOYED'].includes(metaApiAccount.state)) {
        throw new InternalServerErrorException('Account deployment timeout');
      }

      // Create local database entry
      const mt5Account = this.mt5AccountRepository.create({
        accountName: credentials.accountName,
        server: credentials.server,
        login: credentials.login,
        password: credentials.password,
        metaApiAccountId: metaApiAccount.id,
        provisioningProfileId: profile.id,
        deploymentState: metaApiAccount.state,
        connectionState: 'DISCONNECTED',
        isRealAccount: credentials.isRealAccount,
        isActive: true,
        userId: userId,
        region: metaApiAccount.region || 'new-york',
      });

      const savedAccount = await this.mt5AccountRepository.save(mt5Account);

      // Start initial connection
      this.connectAccount(savedAccount.id).catch((error) => {
        this.logger.error(
          `Failed to connect account ${savedAccount.id}`,
          error,
        );
      });

      this.logger.log(`Successfully added MT5 account: ${savedAccount.id}`);
      return savedAccount;
    } catch (error) {
      this.logger.error('Failed to add MT5 account', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add MT5 account');
    }
  }

  /**
   * Connect to an MT5 account and establish streaming connection
   */
  async connectAccount(accountId: string): Promise<void> {
    try {
      const account = await this.mt5AccountRepository.findOne({
        where: { id: accountId },
      });
      if (!account || !account.metaApiAccountId) {
        throw new BadRequestException('Account not found or not configured');
      }

      const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(
        account.metaApiAccountId,
      );

      if (!['DEPLOYED'].includes(metaApiAccount.state)) {
        await metaApiAccount.deploy();

        // Wait for deployment
        const deploymentTimeout = 300000; // 5 minutes
        const startTime = Date.now();

        while (
          !['DEPLOYED'].includes(metaApiAccount.state) &&
          Date.now() - startTime < deploymentTimeout
        ) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          await metaApiAccount.reload();
        }
      }

      // Get connection
      const connection = await metaApiAccount.getStreamingConnection();
      await connection.connect();

      // Wait for synchronization
      await connection.waitSynchronized({
        applicationPattern: 'TradeTaper',
        timeoutInSeconds: 300,
      });

      // Update account status
      await this.mt5AccountRepository.update(accountId, {
        deploymentState: metaApiAccount.state,
        connectionState: 'SYNCHRONIZED',
        connectionStatus: 'CONNECTED',
        lastHeartbeatAt: new Date(),
        isStreamingActive: true,
        lastSyncAt: new Date(),
      });

      this.logger.log(`Account ${accountId} connected`);
    } catch (error) {
      this.logger.error(`Failed to connect account ${accountId}`, error);

      await this.mt5AccountRepository.update(accountId, {
        connectionState: 'DISCONNECTED',
        connectionStatus: 'DISCONNECTED',
        lastSyncErrorAt: new Date(),
        lastSyncError: error.message,
        isStreamingActive: false,
      });

      throw error;
    }
  }

  /**
   * Get historical trades (deals) for an account
   */
  async getHistoricalTrades(
    accountId: string,
    filter?: HistoricalTradeFilter,
  ): Promise<MetatraderDeal[]> {
    this.logger.log(`Fetching historical trades for account ${accountId}`);
    return [];
  }

  /**
   * Get live trading data (positions, orders, account info)
   */
  async getLiveTradeData(accountId: string): Promise<LiveTradeData> {
    try {
      const account = await this.mt5AccountRepository.findOne({
        where: { id: accountId },
      });
      if (!account || !account.metaApiAccountId) {
        throw new BadRequestException('Account not found');
      }

      const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(
        account.metaApiAccountId,
      );
      const connection = await metaApiAccount.getStreamingConnection();

      // Ensure connection is established
      if (!connection.synchronized) {
        await connection.connect();
        await connection.waitSynchronized({ timeoutInSeconds: 60 });
      }

      // Get live data from terminal state
      const terminalState = connection.terminalState;
      const positions = terminalState.positions;
      const orders = terminalState.orders;
      const accountInfo = terminalState.accountInformation;

      // Get recent deals (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const deals = connection.historyStorage.getDealsByTimeRange(
        yesterday,
        new Date(),
      );

      // Update account info in database
      if (accountInfo) {
        await this.mt5AccountRepository.update(accountId, {
          balance: parseFloat(accountInfo.balance?.toString() || '0'),
          equity: parseFloat(accountInfo.equity?.toString() || '0'),
          margin: parseFloat(accountInfo.margin?.toString() || '0'),
          marginFree: parseFloat(accountInfo.freeMargin?.toString() || '0'),
          profit: parseFloat('0'), // Profit is not directly available in account info
          leverage: accountInfo.leverage || 1,
          currency: accountInfo.currency || 'USD',
          lastHeartbeatAt: new Date(),
          accountInfo: accountInfo as any,
        });
      }

      return {
        positions,
        orders,
        accountInfo: accountInfo,
        deals,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get live trade data for account ${accountId}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch live trade data');
    }
  }

  /**
   * Start real-time streaming for an account
   */
  async startStreaming(
    accountId: string,
  ): Promise<StreamingMetaApiConnectionInstance> {
    try {
      const account = await this.mt5AccountRepository.findOne({
        where: { id: accountId },
      });
      if (!account || !account.metaApiAccountId) {
        throw new BadRequestException('Account not found');
      }

      const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(
        account.metaApiAccountId,
      );
      const connection = await metaApiAccount.getStreamingConnection();

      // Connect and start streaming (without custom listeners for now)
      await connection.connect();
      await connection.waitSynchronized({ timeoutInSeconds: 300 });

      // Update account streaming status
      await this.mt5AccountRepository.update(accountId, {
        isStreamingActive: true,
        connectionState: 'SYNCHRONIZED',
        connectionStatus: 'CONNECTED',
        lastHeartbeatAt: new Date(),
      });

      this.logger.log(`Streaming started for account ${accountId}`);
      return connection;
    } catch (error) {
      this.logger.error(
        `Failed to start streaming for account ${accountId}`,
        error,
      );

      await this.mt5AccountRepository.update(accountId, {
        isStreamingActive: false,
        connectionState: 'DISCONNECTED',
        lastSyncError: error.message,
        lastSyncErrorAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Stop real-time streaming for an account
   */
  async stopStreaming(accountId: string): Promise<void> {
    try {
      const account = await this.mt5AccountRepository.findOne({
        where: { id: accountId },
      });
      if (!account || !account.metaApiAccountId) {
        throw new BadRequestException('Account not found');
      }

      const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(
        account.metaApiAccountId,
      );
      const connection = await metaApiAccount.getStreamingConnection();

      await connection.close();

      // Update account streaming status
      await this.mt5AccountRepository.update(accountId, {
        isStreamingActive: false,
        connectionState: 'DISCONNECTED',
        connectionStatus: 'DISCONNECTED',
      });

      this.logger.log(`Streaming stopped for account ${accountId}`);
    } catch (error) {
      this.logger.error(
        `Failed to stop streaming for account ${accountId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove an MT5 account
   */
  async removeMT5Account(accountId: string, userId: string): Promise<void> {
    try {
      const account = await this.mt5AccountRepository.findOne({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new BadRequestException('Account not found');
      }

      // Stop streaming first
      await this.stopStreaming(accountId);

      // Remove from MetaApi if exists
      if (account.metaApiAccountId) {
        try {
          const metaApiAccount =
            await this.metaApi.metatraderAccountApi.getAccount(
              account.metaApiAccountId,
            );
          await metaApiAccount.undeploy();
          await metaApiAccount.remove();
        } catch (error) {
          this.logger.warn(
            `Failed to remove MetaApi account ${account.metaApiAccountId}`,
            error,
          );
        }
      }

      // Remove from database
      await this.mt5AccountRepository.remove(account);

      this.logger.log(`Successfully removed MT5 account: ${accountId}`);
    } catch (error) {
      this.logger.error(`Failed to remove MT5 account ${accountId}`, error);
      throw error;
    }
  }

  /**
   * Get account connection status
   */
  async getAccountStatus(accountId: string): Promise<{
    isConnected: boolean;
    isStreaming: boolean;
    deploymentState: string;
    connectionState: string;
    lastHeartbeat?: Date;
    lastError?: string;
  }> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    return {
      isConnected: account.connectionStatus === 'CONNECTED',
      isStreaming: account.isStreamingActive,
      deploymentState: account.deploymentState,
      connectionState: account.connectionState,
      lastHeartbeat: account.lastHeartbeatAt,
      lastError: account.lastSyncError,
    };
  }

  /**
   * Health check for MetaApi service
   */
  async healthCheck(): Promise<{
    status: string;
    message: string;
    details?: any;
  }> {
    try {
      // Try to get user information to test API connectivity
      const profiles =
        await this.metaApi.provisioningProfileApi.getProvisioningProfiles(5, 'active');

      return {
        status: 'ok',
        message: 'MetaApi service is healthy',
        details: {
          profileCount: profiles.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('MetaApi health check failed', error);
      return {
        status: 'error',
        message: 'MetaApi service is unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
