// src/integrations/metaapi/metaapi.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MetaApi from 'metaapi.cloud-sdk';

export interface MT5ConnectionConfig {
  login: string;
  password: string;
  server: string;
  accountName: string;
  provisioningProfileId?: string; // e.g., 'cloud-g2'
}

export interface MT5Deal {
  id: string;
  type: string; // DEAL_TYPE_BUY, DEAL_TYPE_SELL
  entryType: string; // DEAL_ENTRY_IN, DEAL_ENTRY_OUT
  symbol: string;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: Date;
  positionId: string;
  orderId: string;
  comment?: string;
  magic?: number;
}

export interface MT5AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  server: string;
  platform: string;
  broker: string;
}

@Injectable()
export class MetaApiService implements OnModuleInit {
  private readonly logger = new Logger(MetaApiService.name);
  private metaApi: MetaApi | null = null;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const token = this.configService.get<string>('METAAPI_TOKEN');
    
    if (!token) {
      this.logger.warn('METAAPI_TOKEN not configured - MT5 integration disabled');
      return;
    }

    try {
      this.metaApi = new MetaApi(token);
      this.isInitialized = true;
      this.logger.log('MetaApi SDK initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize MetaApi: ${error.message}`);
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && this.metaApi !== null;
  }

  /**
   * Provision (create) a new MT5 account in MetaApi cloud
   */
  async provisionAccount(config: MT5ConnectionConfig): Promise<{ accountId: string; state: string }> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    this.logger.log(`Provisioning MT5 account for ${config.accountName} with profile ${config.provisioningProfileId || 'default'}`);

    try {
      const accountData: any = {
        name: config.accountName,
        login: config.login,
        password: config.password,
        server: config.server,
        platform: 'mt5',
        magic: 0,
        application: 'MetaApi',
      };

      if (config.provisioningProfileId) {
        accountData.provisioningProfileId = config.provisioningProfileId;
      }

      const account = await this.metaApi.metatraderAccountApi.createAccount(accountData);

      this.logger.log(`Account provisioned with ID: ${account.id}`);

      // Deploy the account
      await account.deploy();
      this.logger.log(`Account deployment initiated...`);

      // Wait for account to be deployed
      await account.waitDeployed();
      this.logger.log(`Account ${account.id} is deployed`);

      return {
        accountId: account.id,
        state: account.state,
      };
    } catch (error) {
      this.logger.error(`Failed to provision account: ${error.message}`);
      throw new Error(`Failed to provision MT5 account: ${error.message}`);
    }
  }

  /**
   * Deploy an existing account (start the server)
   */
  async deployAccount(accountId: string): Promise<void> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    try {
      const account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      if (account.state === 'DEPLOYED') {
        this.logger.log(`Account ${accountId} is already deployed`);
        return;
      }

      this.logger.log(`Deploying account ${accountId}...`);
      await account.deploy();
      await account.waitDeployed();
      this.logger.log(`Account ${accountId} deployed successfully`);
    } catch (error) {
      this.logger.error(`Failed to deploy account ${accountId}: ${error.message}`);
      throw new Error(`Failed to deploy account: ${error.message}`);
    }
  }

  /**
   * Undeploy an existing account (stop the server to save costs)
   */
  async undeployAccount(accountId: string): Promise<void> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    try {
      const account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      if (account.state === 'UNDEPLOYED') {
        return;
      }

      this.logger.log(`Undeploying account ${accountId}...`);
      await account.undeploy();
      await account.waitUndeployed();
      this.logger.log(`Account ${accountId} undeployed successfully`);
    } catch (error) {
      this.logger.error(`Failed to undeploy account ${accountId}: ${error.message}`);
      // Don't throw here, just log, as this is usually a cleanup action
    }
  }

  /**
   * Get account information (balance, equity, etc.)
   */
  async getAccountInfo(accountId: string): Promise<MT5AccountInfo> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    try {
      const account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      
      // Ensure account is deployed before connecting
      if (account.state !== 'DEPLOYED') {
        this.logger.log(`Account ${accountId} is ${account.state}, deploying for info fetch...`);
        await account.deploy();
        await account.waitDeployed();
      }

      const connection = account.getStreamingConnection();
      
      await connection.connect();
      await connection.waitSynchronized();

      const accountInfo = connection.terminalState.accountInformation;
      
      await connection.close();

      return {
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        freeMargin: accountInfo.freeMargin,
        leverage: accountInfo.leverage,
        currency: accountInfo.currency,
        server: accountInfo.server,
        platform: accountInfo.platform,
        broker: accountInfo.broker,
      };
    } catch (error) {
      this.logger.error(`Failed to get account info: ${error.message}`);
      throw new Error(`Failed to get account info: ${error.message}`);
    }
  }

  /**
   * Fetch deal history (closed trades) for a date range
   */
  async getDealHistory(
    accountId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<MT5Deal[]> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    this.logger.log(`Fetching deal history for ${accountId} from ${startTime} to ${endTime}`);

    try {
      const account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      
      // Ensure account is deployed
      if (account.state !== 'DEPLOYED') {
        this.logger.log(`Account ${accountId} is ${account.state}, deploying for history fetch...`);
        await account.deploy();
        await account.waitDeployed();
      }

      const connection = account.getRPCConnection();
      
      await connection.connect();
      await connection.waitSynchronized();

      const deals = await connection.getDealsByTimeRange(startTime, endTime);
      
      await connection.close();

      // Convert deals to array if needed
      const dealsArray = Array.isArray(deals) ? deals : (deals as any).deals || [];
      
      this.logger.log(`Fetched ${dealsArray.length} deals`);

      return dealsArray.map((deal: any) => ({
        id: deal.id,
        type: deal.type,
        entryType: deal.entryType,
        symbol: deal.symbol,
        volume: deal.volume,
        price: deal.price,
        profit: deal.profit,
        commission: deal.commission,
        swap: deal.swap,
        time: new Date(deal.time),
        positionId: deal.positionId,
        orderId: deal.orderId,
        comment: deal.comment,
        magic: deal.magic,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch deal history: ${error.message}`);
      throw new Error(`Failed to fetch deal history: ${error.message}`);
    }
  }

  /**
   * Fetch historical candles
   */
  async getCandles(
    accountId: string,
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    this.logger.log(`Fetching candles for ${accountId} - ${symbol} ${timeframe} from ${startTime} to ${endTime}`);

    try {
      const account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      
      if (account.state !== 'DEPLOYED') {
         await account.deploy();
         await account.waitDeployed();
      }

      const connection = account.getRPCConnection();
      await connection.connect();
      // MetaApi getHistoricalCandles: Try Forward (startTime) then Backward (endTime)
      console.log(`[MetaApi] Fetching candles for ${symbol} ${timeframe}. Start: ${startTime}, End: ${endTime}`);
      
      let candles = [];
      try {
        // Try Standard Forward Fetch
        candles = await (connection as any).getHistoricalCandles(symbol, timeframe, startTime, 3000);
        console.log(`[MetaApi] Strategy 1 (Forward from ${startTime}): Got ${candles?.length || 0} candles`);
      } catch (e) {
        console.warn(`[MetaApi] Strategy 1 failed: ${e.message}`);
      }

      if (!candles || candles.length === 0) {
        // Fallback: Backward Fetch from EndTime
        try {
            console.log(`[MetaApi] Strategy 2 (Backward from ${endTime}): Attempting fallback...`);
            candles = await (connection as any).getHistoricalCandles(symbol, timeframe, endTime, 3000);
            console.log(`[MetaApi] Strategy 2 Result: Got ${candles?.length || 0} candles`);
        } catch (e) {
            console.error(`[MetaApi] Strategy 2 failed: ${e.message}`);
        }
      }
      
      await connection.close();
      
      return candles;
    } catch (error) {
      this.logger.error(`Failed to fetch candles: ${error.message}`);
      throw new Error(`Failed to fetch candles: ${error.message}`);
    }
  }

  /**
   * Get account connection status
   */
  async getConnectionStatus(accountId: string): Promise<{
    state: string;
    connectionStatus: string;
    deployed: boolean;
  }> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    try {
      const account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      
      return {
        state: account.state,
        connectionStatus: account.connectionStatus,
        deployed: account.state === 'DEPLOYED',
      };
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes('not found')) {
        this.logger.warn(`Account not found in MetaApi: ${error.message}`);
      } else {
        this.logger.error(`Failed to get connection status: ${error.message}`);
      }
      throw new Error(`Failed to get connection status: ${error.message}`);
    }
  }

  /**
   * Undeploy and remove account from MetaApi
   */
  async unlinkAccount(accountId: string): Promise<void> {
    if (!this.metaApi) {
      throw new Error('MetaApi not initialized');
    }

    try {
      const account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      
      // Undeploy first
      await account.undeploy();
      await account.waitUndeployed();
      
      // Then remove
      await account.remove();
      
      this.logger.log(`Account ${accountId} unlinked and removed`);
    } catch (error) {
      this.logger.error(`Failed to unlink account: ${error.message}`);
      throw new Error(`Failed to unlink account: ${error.message}`);
    }
  }
}
