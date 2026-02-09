import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MetaApi from 'metaapi.cloud-sdk';

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

  constructor(private readonly configService: ConfigService) {
    this.initializeMetaApi();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private initializeMetaApi(): void {
    const apiToken =
      this.configService.get<string>('METAAPI_API_TOKEN') ||
      this.configService.get<string>('METAAPI_TOKEN');
    const domain = this.configService.get<string>(
      'METAAPI_DOMAIN',
      'agiliumtrade.ai',
    );
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

      let profile = profiles.find((p) => p.name.includes(server));

      if (!profile) {
        const profileData = {
          name: `TradeTaper-${server}`,
          version: 5,
          brokerTimezone:
            this.configService.get<string>('METAAPI_BROKER_TIMEZONE', 'EET'),
          brokerDSTSwitchTimezone: this.configService.get<string>(
            'METAAPI_BROKER_DST_TIMEZONE',
            'EET',
          ),
        };

        profile =
          await this.metaApi.provisioningProfileApi.createProvisioningProfile(
            profileData,
          );
        this.logger.log(
          `Created MetaApi provisioning profile for server: ${server}`,
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

  async createAndDeployAccount(
    credentials: MT5AccountCredentials,
  ): Promise<MetaApiProvisionResult> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

    try {
      const profile = await this.getProvisioningProfile(credentials.server);

      const accountData = {
        login: credentials.login,
        password: credentials.password,
        name: credentials.accountName,
        server: credentials.server,
        provisioningProfileId: profile.id,
        application: 'TradeTaper',
        magic: 1000,
        quoteConnection: false,
        reliability: 'regular' as const,
        tags: ['TradeTaper-User'],
        region: this.configService.get<string>('METAAPI_REGION', 'new-york'),
        baseCurrency: this.configService.get<string>(
          'METAAPI_BASE_CURRENCY',
          'USD',
        ),
      };

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

  async connectAndSync(metaApiAccountId: string): Promise<any> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

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

    const connection = await metaApiAccount.getStreamingConnection();
    await connection.connect();
    await connection.waitSynchronized({
      applicationPattern: 'TradeTaper',
      timeoutInSeconds: 300,
    });

    return connection;
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
}
