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

interface CachedConnection {
  connection: StreamingMetaApiConnectionInstance;
  lastUsed: number;
}

/** [FIX #3] TTL-evicting connection cache */
const IDLE_TTL_MS = 10 * 60 * 1000; // 10-minute idle eviction

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);
  private metaApi: MetaApi | null = null;
  private enabled = false;
  private metaApiToken: string | null = null;
  private metaApiDomain: string | null = null;

  /** [FIX #3] Cache now stores {connection, lastUsed} and is periodically evicted */
  private readonly connectionCache = new Map<string, CachedConnection>();
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeMetaApi();
    // [FIX #3] Start idle connection eviction timer
    this.evictionTimer = setInterval(
      () => this.evictStaleConnections(),
      5 * 60 * 1000, // check every 5 minutes
    );
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

  /** [FIX #3] Evict idle connections to prevent memory leak */
  private async evictStaleConnections(): Promise<void> {
    const now = Date.now();
    for (const [id, cached] of this.connectionCache.entries()) {
      if (now - cached.lastUsed > IDLE_TTL_MS) {
        this.logger.log(`Evicting idle MetaApi connection for account ${id}`);
        try {
          await cached.connection.close();
        } catch (err) {
          this.logger.warn(`Error closing stale connection ${id}: ${err.message}`);
        }
        this.connectionCache.delete(id);
      }
    }
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

  /**
   * [FIX #6] Find provisioning profile with exact server name match first,
   * then fall back to prefix match, then substring.
   */
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
      const serverLower = server.toLowerCase();

      // Priority 1: exact match (case-insensitive)
      let profile = profiles.find(
        (p) => p.name.toLowerCase() === serverLower,
      );

      // Priority 2: starts-with match (e.g. profile "ICMarkets" matches server "ICMarkets-Live03")
      if (!profile) {
        profile = profiles.find((p) =>
          serverLower.startsWith(p.name.toLowerCase()),
        );
      }

      // Priority 3: legacy fuzzy includes (last resort)
      if (!profile) {
        profile = profiles.find((p) =>
          p.name.toLowerCase().includes(serverLower),
        );
      }

      if (profile) {
        this.logger.log(
          `Provisioning profile matched: "${profile.name}" for server "${server}"`,
        );
      } else {
        this.logger.warn(
          `No provisioning profile found for server "${server}". Will use auto-detection.`,
        );
      }

      return profile || null;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to get provisioning profile for ${server}`,
        error,
      );
      return null;
    }
  }

  /**
   * [FIX #2] Provision account — deploy is now fire-and-forget.
   * The caller receives the metaApiAccountId immediately; a background job
   * waits for deployment and initiates sync.
   */
  async provisionAccount(
    credentials: MT5AccountCredentials,
  ): Promise<{ metaApiAccountId: string; provisioningProfileId?: string; region: string }> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

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
      keywords: [credentials.server.split('-')[0]],
      platform: 'mt5',
      type: 'cloud-g2',
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

    // [FIX #2] Start deploy but do NOT await — return immediately
    metaApiAccount.deploy().catch((err) => {
      this.logger.warn(
        `Background deploy for ${metaApiAccount.id} failed: ${err.message}`,
      );
    });

    return {
      metaApiAccountId: metaApiAccount.id,
      provisioningProfileId: profile?.id,
      region: metaApiAccount.region || 'new-york',
    };
  }

  /**
   * [FIX #2] Wait for deployment: called from a background job, not from the HTTP handler.
   * Returns a partial MetaApiProvisionResult.
   */
  async waitForDeployment(
    metaApiAccountId: string,
    timeoutMs = 300_000,
  ): Promise<MetaApiProvisionResult> {
    if (!this.metaApi) throw new Error('MetaApi is not configured');

    const metaApiAccount =
      await this.metaApi.metatraderAccountApi.getAccount(metaApiAccountId);

    if (!['DEPLOYED'].includes(metaApiAccount.state)) {
      const start = Date.now();
      while (
        !['DEPLOYED'].includes(metaApiAccount.state) &&
        Date.now() - start < timeoutMs
      ) {
        await new Promise((r) => setTimeout(r, 5000));
        await metaApiAccount.reload();
      }
    }

    if (!['DEPLOYED'].includes(metaApiAccount.state)) {
      throw new Error(
        `Account ${metaApiAccountId} did not deploy within ${timeoutMs / 1000}s (state=${metaApiAccount.state})`,
      );
    }

    return {
      metaApiAccountId: metaApiAccount.id,
      provisioningProfileId: '', // filled by caller from DB
      deploymentState: metaApiAccount.state,
      region: metaApiAccount.region || 'new-york',
    };
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

  /** [FIX #3 + #8] Streaming connection with TTL cache and 30s sync timeout */
  async getStreamingConnection(
    metaApiAccountId: string,
  ): Promise<StreamingMetaApiConnectionInstance> {
    if (!this.metaApi) {
      throw new Error('MetaApi is not configured');
    }

    const cached = this.connectionCache.get(metaApiAccountId);

    if (cached) {
      try {
        await cached.connection.connect();
        cached.lastUsed = Date.now(); // [FIX #3] Refresh TTL on use
        return cached.connection;
      } catch (error) {
        this.logger.warn(
          `MetaApi connection reset for account ${metaApiAccountId}: ${error.message}`,
        );
        this.connectionCache.delete(metaApiAccountId);
      }
    }

    const metaApiAccount =
      await this.metaApi.metatraderAccountApi.getAccount(metaApiAccountId);

    if (!['DEPLOYED'].includes(metaApiAccount.state)) {
      // [FIX #8] Don't block here — just deploy and wait up to 30s
      await metaApiAccount.deploy();
      const deployStart = Date.now();
      while (
        !['DEPLOYED'].includes(metaApiAccount.state) &&
        Date.now() - deployStart < 30_000
      ) {
        await new Promise((r) => setTimeout(r, 3000));
        await metaApiAccount.reload();
      }
      if (!['DEPLOYED'].includes(metaApiAccount.state)) {
        throw new Error(
          `Account ${metaApiAccountId} not deployed (state=${metaApiAccount.state}). Try again shortly.`,
        );
      }
    }

    const connection = await metaApiAccount.getStreamingConnection();
    this.connectionCache.set(metaApiAccountId, {
      connection,
      lastUsed: Date.now(),
    });
    await connection.connect();

    if (!connection.synchronized) {
      // [FIX #8] 30s timeout instead of 300s
      await connection.waitSynchronized({
        applicationPattern: 'TradeTaper',
        timeoutInSeconds: 30,
      });
    }

    return connection;
  }

  async closeConnection(metaApiAccountId: string): Promise<void> {
    const cached = this.connectionCache.get(metaApiAccountId);
    if (!cached) return;

    try {
      await cached.connection.close();
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

  /**
   * Check if a MetaAPI account already exists for a given login+server combination.
   * Returns the existing metaApiAccountId if found, or null. [FIX #16 helper]
   */
  async findExistingAccount(
    login: string,
    server: string,
  ): Promise<string | null> {
    if (!this.metaApi) return null;
    try {
      const accounts =
        await this.metaApi.metatraderAccountApi.getAccountsWithClassicPagination({
          limit: 100,
        });
      const existing = (accounts.items || []).find(
        (a) =>
          a.login === login &&
          a.server?.toLowerCase() === server.toLowerCase(),
      );
      return existing?.id ?? null;
    } catch {
      return null;
    }
  }
}
