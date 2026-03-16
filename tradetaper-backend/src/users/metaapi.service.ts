import {
  Injectable,
  Logger,
  BadRequestException,
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

interface KnownServerResult {
  name: string;
  broker?: string;
  type?: string;
}

/** [FIX #3] TTL-evicting connection cache */
const IDLE_TTL_MS = 10 * 60 * 1000; // 10-minute idle eviction
const SERVER_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);
  private metaApi: MetaApi | null = null;
  private enabled = false;
  private metaApiToken: string | null = null;
  private metaApiDomain: string | null = null;

  /** [FIX #3] Cache now stores {connection, lastUsed} and is periodically evicted */
  private readonly connectionCache = new Map<string, CachedConnection>();
  private readonly knownServersCache = new Map<
    string,
    { expiresAt: number; data: KnownServerResult[] }
  >();
  private lastSuccessfulKnownServers: KnownServerResult[] = [];
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

  /** Returns the underlying MetaApi SDK instance. Returns null if not enabled. */
  getMetaApiInstance(): MetaApi | null {
    return this.metaApi;
  }

  /**
   * Return the cached StreamingMetaApiConnectionInstance for a given MetaAPI account ID.
   * Used by TradesService to fetch 1m candle history for the chart.
   * Returns null if not cached (not yet connected via syncMetaApiAccount).
   */
  getCachedConnection(
    metaApiAccountId: string,
  ): StreamingMetaApiConnectionInstance | null {
    const cached = this.connectionCache.get(metaApiAccountId);
    if (!cached) return null;
    cached.lastUsed = Date.now();
    return cached.connection;
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

  private getFallbackServers(): KnownServerResult[] {
    return [
      { name: 'ICMarketsSC-Demo', broker: 'IC Markets', type: 'demo' },
      { name: 'ICMarketsSC-Live', broker: 'IC Markets', type: 'real' },
      { name: 'Exness-MT5Real', broker: 'Exness', type: 'real' },
      { name: 'Exness-MT5Trial', broker: 'Exness', type: 'demo' },
      { name: 'FTMO-Server', broker: 'FTMO', type: 'real' },
      { name: 'MetaQuotes-Demo', broker: 'MetaQuotes', type: 'demo' },
      { name: 'Pepperstone-Edge', broker: 'Pepperstone', type: 'real' },
    ];
  }

  private filterServerResults(
    list: KnownServerResult[],
    query: string,
  ): KnownServerResult[] {
    const q = query.toLowerCase();
    return list
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.broker?.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getKnownServers(query: string, version = 5): Promise<KnownServerResult[]> {
    if (!this.metaApiToken || !this.metaApiDomain || !this.enabled) {
      throw new BadRequestException('MetaApi integration is not configured');
    }

    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return [];
    }

    const cacheKey = `${version}:${trimmedQuery.toLowerCase()}`;
    const now = Date.now();
    const cached = this.knownServersCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const baseDomain = this.metaApiDomain.replace(/^https?:\/\//, '');
    const url = `https://mt-provisioning-api-v1.${baseDomain}/known-mt-servers/${version}/search?query=${encodeURIComponent(
      trimmedQuery,
    )}`;

    const allowInsecureTls =
      this.configService.get<string>('ALLOW_INSECURE_METAAPI_TLS') === 'true';
    const timeoutMs = parseInt(
      this.configService.get<string>('METAAPI_SERVER_SEARCH_TIMEOUT_MS', '20000'),
      10,
    );
    const maxRetries = parseInt(
      this.configService.get<string>('METAAPI_SERVER_SEARCH_RETRIES', '2'),
      10,
    );

    const requestConfig: Record<string, unknown> = {
      headers: {
        'auth-token': this.metaApiToken,
        Accept: 'application/json',
      },
      timeout: timeoutMs,
    };

    if (allowInsecureTls) {
      const httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: false,
      });
      requestConfig.httpsAgent = httpsAgent;
      this.logger.warn(
        'ALLOW_INSECURE_METAAPI_TLS=true enables insecure TLS validation for MetaApi server search',
      );
    }

    const axios = require('axios');
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, requestConfig);
        const data = response.data as Record<string, string[]>;
        const results: KnownServerResult[] = [];

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

        const trimmedResults = results.slice(0, 50);
        this.knownServersCache.set(cacheKey, {
          expiresAt: Date.now() + SERVER_SEARCH_CACHE_TTL_MS,
          data: trimmedResults,
        });
        if (trimmedResults.length > 0) {
          this.lastSuccessfulKnownServers = trimmedResults;
        }
        return trimmedResults;
      } catch (error) {
        lastError = error;
        const err = error as { code?: string; response?: { status?: number } };
        const status = err?.response?.status;
        const retryable =
          err?.code === 'ECONNABORTED' ||
          err?.code === 'ETIMEDOUT' ||
          err?.code === 'ECONNRESET' ||
          status === 429 ||
          (typeof status === 'number' && status >= 500);

        if (!retryable || attempt === maxRetries) {
          break;
        }

        const backoffMs = Math.min(1000 * (attempt + 1), 3000);
        this.logger.warn(
          `MetaApi server search retry ${attempt + 1}/${maxRetries} for query "${trimmedQuery}" after ${backoffMs}ms`,
        );
        await this.delay(backoffMs);
      }
    }

    const fromLastSuccess = this.filterServerResults(
      this.lastSuccessfulKnownServers,
      trimmedQuery,
    );
    if (fromLastSuccess.length > 0) {
      this.logger.warn(
        `MetaApi server search failed for "${trimmedQuery}". Returning cached fallback results`,
      );
      return fromLastSuccess;
    }

    const fromStaticFallback = this.filterServerResults(
      this.getFallbackServers(),
      trimmedQuery,
    );
    this.logger.error('Failed to fetch MetaApi servers', lastError as Error);
    return fromStaticFallback;
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
   * Fetch historical 1m candles from MetaAPI using the account history API.
   * NOTE: getHistoricalCandles() belongs on the MetatraderAccount object,
   * NOT on the StreamingMetaApiConnectionInstance.
   *
   * MetaAPI returns candles in reverse-chronological order (newest first),
   * and accepts a `startTime` (latest time) + count limit (max 1000).
   * We therefore page backwards from `to` until we reach `from`.
   */
  async getHistoricalCandles(
    metaApiAccountId: string,
    symbol: string,
    timeframe: string,
    from: Date,
    to: Date,
  ): Promise<any[]> {
    if (!this.metaApi) throw new Error('MetaApi is not configured');

    const account = await this.metaApi.metatraderAccountApi.getAccount(metaApiAccountId);

    const allCandles: any[] = [];
    let startTime: Date = new Date(to);
    const MAX_PER_PAGE = 1000;

    // Page backwards until we reach the `from` boundary (up to 10 pages)
    for (let page = 0; page < 10; page++) {
      let raw: any[] = [];
      try {
        raw = await account.getHistoricalCandles(symbol, timeframe, startTime, MAX_PER_PAGE);
      } catch (err) {
        this.logger.warn(
          `[MetaApiService] getHistoricalCandles page ${page} failed for ${symbol}: ${err.message}`,
        );
        break;
      }

      if (!Array.isArray(raw) || raw.length === 0) break;

      for (const c of raw) {
        const ts = c.time instanceof Date ? c.time : new Date(c.time);
        if (ts < from) break; // Passed our start boundary — stop
        allCandles.push(c);
      }

      // Check if the last candle is before `from` — done
      const last = raw[raw.length - 1];
      const lastTs = last?.time instanceof Date ? last.time : new Date(last?.time);
      if (!last || lastTs <= from) break;

      // Advance startTime to just before the oldest candle we received
      startTime = new Date(lastTs.getTime() - 60_000); // step back 1 minute
    }

    return allCandles;
  }
}
