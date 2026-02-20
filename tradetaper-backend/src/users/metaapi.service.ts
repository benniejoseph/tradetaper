import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MetaApi, { StreamingMetaApiConnectionInstance } from 'metaapi.cloud-sdk';

export interface MT5AccountCredentials {
  accountName: string;
  server: string;
  login: string;
  password: string;
  isRealAccount: boolean;
}

export interface MetaApiProvisionResult {
  metaApiAccountId: string;
  provisioningProfileId: string;
  deploymentState: string;
  region: string;
}

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);
  private metaApi: MetaApi | null = null;
  private enabled = false;
  private metaApiToken: string | null = null;
  private metaApiDomain: string | null = null;
  private readonly connectionCache = new Map<
    string,
    StreamingMetaApiConnectionInstance
  >();

  constructor(private readonly configService: ConfigService) {
    this.initializeMetaApi();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private normalizeDomain(domain: string): string {
    const cleaned = domain.replace(/^https?:\/\//, '').trim();
    if (cleaned === 'agiliumtrade.ai') {
      return 'agiliumtrade.agiliumtrade.ai';
    }
    return cleaned;
  }

  private initializeMetaApi(): void {
    const apiToken =
      this.configService.get<string>('METAAPI_API_TOKEN') ||
      this.configService.get<string>('METAAPI_TOKEN');
    const rawDomain = this.configService.get<string>(
      'METAAPI_DOMAIN',
      'agiliumtrade.agiliumtrade.ai',
    );
    const domain = this.normalizeDomain(rawDomain);
    const requestTimeout = parseInt(
      this.configService.get<string>('METAAPI_REQUEST_TIMEOUT', '60000'),
      10,
    );

    if (!apiToken) {
      this.logger.warn(
        'METAAPI_API_TOKEN not configured. MetaApi integration is disabled.',
      );
      this.enabled = false;
      return;
    }

    this.metaApiToken = apiToken;
    this.metaApiDomain = domain;
    this.metaApi = new MetaApi(apiToken, {
      domain,
      requestTimeout,
      retryOpts: {
        retries: 3,
        minDelayInSeconds: 1,
        maxDelayInSeconds: 30,
      },
    });

    this.enabled = true;
    this.logger.log(`MetaApi initialized (domain=${domain})`);
  }

  async getKnownServers(
    query: string,
    version = 5,
  ): Promise<Array<{ name: string; broker?: string; type?: string }>> {
    if (!this.metaApiToken || !this.metaApiDomain || !this.enabled) {
      throw new BadRequestException('MetaApi integration is not configured');
    }

    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return [];
    }

    const baseDomain = this.metaApiDomain.replace(/^https?:\/\//, '');
    const url = `https://mt-provisioning-api-v1.${baseDomain}/known-mt-servers/${version}/search?query=${encodeURIComponent(
      trimmedQuery,
    )}`;

    try {
      const response = await fetch(url, {
        headers: {
          'auth-token': this.metaApiToken,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(
          `MetaApi server search failed (${response.status}): ${body}`,
        );
        throw new BadRequestException('Failed to fetch server list');
      }

      const data = (await response.json()) as Record<string, string[]>;
      const results: Array<{ name: string; broker?: string; type?: string }> =
        [];

      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([broker, servers]) => {
          if (!Array.isArray(servers)) return;
          servers.forEach((server) => {
            const serverName = String(server);
            const type = serverName.toLowerCase().includes('demo')
              ? 'demo'
              : 'real';
            results.push({ name: serverName, broker, type });
          });
        });
      }

      return results.slice(0, 50);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to fetch MetaApi servers', error);
      throw new InternalServerErrorException('Failed to fetch server list');
    }
  }

  private async getProvisioningProfile(server: string): Promise<any> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

    try {
      const profileList =
        await this.metaApi.provisioningProfileApi.getProvisioningProfilesWithClassicPagination(
          {
            limit: 50,
            status: 'active',
          },
        );
      const profiles = profileList.items || [];

      const profile = profiles.find((p) =>
        p.name.toLowerCase().includes(server.toLowerCase()),
      );

      return profile || null;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to get/create provisioning profile for ${server}`,
        error,
      );
      return null;
    }
  }

  async createAndDeployAccount(
    credentials: MT5AccountCredentials,
  ): Promise<MetaApiProvisionResult> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

    try {
      const profile = await this.getProvisioningProfile(credentials.server);

      const accountData: any = {
        login: credentials.login,
        password: credentials.password,
        name: credentials.accountName,
        server: credentials.server,
        application: 'TradeTaper',
        magic: 1000,
        reliability: 'regular' as const,
        tags: ['TradeTaper-User'],
        region: this.configService.get<string>('METAAPI_REGION', 'new-york'),
        baseCurrency: this.configService.get<string>(
          'METAAPI_BASE_CURRENCY',
          'USD',
        ),
      };

      if (profile) {
        accountData.provisioningProfileId = profile.id;
      }

      const metaApiAccount =
        await this.metaApi.metatraderAccountApi.createAccount(accountData);
      await metaApiAccount.deploy();

      const deploymentTimeout = 300000;
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

      return {
        metaApiAccountId: metaApiAccount.id,
        provisioningProfileId: profile.id,
        deploymentState: metaApiAccount.state,
        region: metaApiAccount.region || 'new-york',
      };
    } catch (error) {
      this.logger.error('Failed to create MetaApi account', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add MT5 account');
    }
  }

  async connectAndSync(
    metaApiAccountId: string,
  ): Promise<StreamingMetaApiConnectionInstance> {
    return this.getStreamingConnection(metaApiAccountId);
  }

  async getDealsByTimeRange(
    metaApiAccountId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    const connection = await this.connectAndSync(metaApiAccountId);
    return connection.historyStorage.getDealsByTimeRange(startTime, endTime);
  }

  async getAccountInfo(metaApiAccountId: string): Promise<any> {
    const connection = await this.connectAndSync(metaApiAccountId);
    return connection.terminalState.accountInformation;
  }

  async getStreamingConnection(
    metaApiAccountId: string,
  ): Promise<StreamingMetaApiConnectionInstance> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

    let connection = this.connectionCache.get(metaApiAccountId);

    if (connection) {
      try {
        await connection.connect();
      } catch (error) {
        this.logger.warn(
          `MetaApi connection reset for account ${metaApiAccountId}: ${error.message}`,
        );
        this.connectionCache.delete(metaApiAccountId);
        connection = undefined;
      }
    }

    if (!connection) {
      const metaApiAccount =
        await this.metaApi.metatraderAccountApi.getAccount(metaApiAccountId);

      if (!['DEPLOYED'].includes(metaApiAccount.state)) {
        await metaApiAccount.deploy();
        const deploymentTimeout = 300000;
        const startTime = Date.now();
        while (
          !['DEPLOYED'].includes(metaApiAccount.state) &&
          Date.now() - startTime < deploymentTimeout
        ) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          await metaApiAccount.reload();
        }
      }

      connection = await metaApiAccount.getStreamingConnection();
      this.connectionCache.set(metaApiAccountId, connection);
      await connection.connect();
    }

    if (!connection.synchronized) {
      await connection.waitSynchronized({
        applicationPattern: 'TradeTaper',
        timeoutInSeconds: 300,
      });
    }

    return connection;
  }

  async closeConnection(metaApiAccountId: string): Promise<void> {
    const connection = this.connectionCache.get(metaApiAccountId);
    if (!connection) return;

    try {
      await connection.close();
    } finally {
      this.connectionCache.delete(metaApiAccountId);
    }
  }

  async removeAccount(metaApiAccountId: string): Promise<void> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

    const metaApiAccount =
      await this.metaApi.metatraderAccountApi.getAccount(metaApiAccountId);
    await metaApiAccount.remove();
  }
}
