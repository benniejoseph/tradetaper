import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MetaApi from 'metaapi.cloud-sdk';

interface MetaApiAccountConfig {
  id: string;
  token: string;
  maxUsers: number;
  currentUsers: number;
  environment: string;
  isActive: boolean;
}

@Injectable()
export class MetaApiManagerService {
  private readonly logger = new Logger(MetaApiManagerService.name);
  private metaApiAccounts: MetaApiAccountConfig[] = [];
  private apiInstances: Map<string, MetaApi> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeMetaApiAccounts();
  }

  private initializeMetaApiAccounts() {
    // Load MetaApi accounts from environment or database
    const primaryToken = this.configService.get<string>('METAAPI_API_TOKEN');
    const environment = this.configService.get<string>(
      'METAAPI_ENVIRONMENT',
      'sandbox',
    );

    if (primaryToken) {
      this.metaApiAccounts.push({
        id: 'primary',
        token: primaryToken,
        maxUsers: 500,
        currentUsers: 0,
        environment,
        isActive: true,
      });

      this.apiInstances.set('primary', new MetaApi(primaryToken));
    }

    // Add more accounts from configuration
    this.loadAdditionalAccounts();
  }

  private loadAdditionalAccounts() {
    // Load additional MetaApi accounts from database or config
    // This allows you to add more accounts as you scale
    const additionalTokens = this.configService.get<string>(
      'METAAPI_ADDITIONAL_TOKENS',
    );

    if (additionalTokens) {
      const tokens = additionalTokens.split(',');
      tokens.forEach((token, index) => {
        const accountId = `account_${index + 1}`;
        this.metaApiAccounts.push({
          id: accountId,
          token: token.trim(),
          maxUsers: 500,
          currentUsers: 0,
          environment: this.configService.get<string>(
            'METAAPI_ENVIRONMENT',
            'sandbox',
          ),
          isActive: true,
        });

        this.apiInstances.set(accountId, new MetaApi(token.trim()));
      });
    }
  }

  /**
   * Assign a MetaApi account to a user
   */
  assignMetaApiAccount(userId: string): { accountId: string; api: MetaApi } {
    // Find account with available capacity
    const availableAccount = this.metaApiAccounts.find(
      (account) => account.isActive && account.currentUsers < account.maxUsers,
    );

    if (!availableAccount) {
      throw new Error(
        'No available MetaApi account capacity. Please contact support.',
      );
    }

    availableAccount.currentUsers++;
    const api = this.apiInstances.get(availableAccount.id);

    if (!api) {
      throw new Error(
        `MetaApi instance not found for account ${availableAccount.id}`,
      );
    }

    this.logger.log(
      `Assigned MetaApi account ${availableAccount.id} to user ${userId}`,
    );

    return {
      accountId: availableAccount.id,
      api,
    };
  }

  /**
   * Release a MetaApi account slot when user removes their MT5 account
   */
  releaseMetaApiAccount(accountId: string, userId: string) {
    const account = this.metaApiAccounts.find((acc) => acc.id === accountId);
    if (account && account.currentUsers > 0) {
      account.currentUsers--;
      this.logger.log(
        `Released MetaApi account ${accountId} for user ${userId}`,
      );
    }
  }

  /**
   * Get MetaApi instance for a specific account
   */
  getMetaApiInstance(accountId: string): MetaApi {
    const api = this.apiInstances.get(accountId);
    if (!api) {
      throw new Error(`MetaApi account ${accountId} not found`);
    }
    return api;
  }

  /**
   * Get account usage statistics
   */
  getAccountStats() {
    return this.metaApiAccounts.map((account) => ({
      id: account.id,
      currentUsers: account.currentUsers,
      maxUsers: account.maxUsers,
      utilizationPercent: (account.currentUsers / account.maxUsers) * 100,
      isActive: account.isActive,
    }));
  }

  /**
   * Add new MetaApi account for scaling
   */
  async addMetaApiAccount(
    token: string,
    maxUsers: number = 500,
  ): Promise<string> {
    try {
      // Test the token
      const testApi = new MetaApi(token);
      await testApi.provisioningProfileApi.getProvisioningProfilesWithInfiniteScrollPagination();

      const accountId = `account_${Date.now()}`;
      this.metaApiAccounts.push({
        id: accountId,
        token,
        maxUsers,
        currentUsers: 0,
        environment: this.configService.get<string>(
          'METAAPI_ENVIRONMENT',
          'sandbox',
        ),
        isActive: true,
      });

      this.apiInstances.set(accountId, testApi);

      this.logger.log(`Added new MetaApi account: ${accountId}`);
      return accountId;
    } catch (error) {
      throw new Error(`Invalid MetaApi token: ${error.message}`);
    }
  }

  /**
   * Health check for all MetaApi accounts
   */
  async healthCheck(): Promise<any[]> {
    const healthChecks = await Promise.allSettled(
      this.metaApiAccounts.map(async (account) => {
        try {
          const api = this.apiInstances.get(account.id);
          if (!api) {
            throw new Error(
              `MetaApi instance not found for account ${account.id}`,
            );
          }
          await api.provisioningProfileApi.getProvisioningProfilesWithInfiniteScrollPagination();
          return {
            accountId: account.id,
            status: 'healthy',
            currentUsers: account.currentUsers,
            maxUsers: account.maxUsers,
          };
        } catch (error) {
          return {
            accountId: account.id,
            status: 'unhealthy',
            error: error.message,
            currentUsers: account.currentUsers,
            maxUsers: account.maxUsers,
          };
        }
      }),
    );

    return healthChecks.map((result) =>
      result.status === 'fulfilled' ? result.value : result.reason,
    );
  }
}
