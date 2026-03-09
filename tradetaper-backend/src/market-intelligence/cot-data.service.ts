import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CotWeeklyReport,
  CotDataPoint,
} from './entities/cot-weekly-report.entity';
import { firstValueFrom } from 'rxjs';

/**
 * CFTC Socrata API integration for standard Commitment of Traders mapping.
 */
export type CotDatasetType = 'tff' | 'disagg';

export interface CotSymbolConfig {
  symbol: string;
  label: string;
  category: 'Forex' | 'Indices' | 'Commodities';
  type: CotDatasetType;
  aliases: string[];
  marketNames: string[];
  description: string;
}

const COT_SYMBOLS: CotSymbolConfig[] = [
  // Forex (Traders in Financial Futures)
  {
    symbol: 'EURUSD',
    label: 'Euro / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['EURUSD', 'EURUSD.FX', 'EURUSDSPOT'],
    marketNames: ['EURO FX'],
    description: 'CFTC leveraged funds positioning in Euro FX futures.',
  },
  {
    symbol: 'GBPUSD',
    label: 'British Pound / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['GBPUSD', 'GBPUSD.FX'],
    marketNames: ['BRITISH POUND'],
    description: 'CFTC leveraged funds positioning in British Pound futures.',
  },
  {
    symbol: 'USDJPY',
    label: 'US Dollar / Japanese Yen',
    category: 'Forex',
    type: 'tff',
    aliases: ['USDJPY', 'JPYUSD', 'USDJPY.FX'],
    marketNames: ['JAPANESE YEN'],
    description: 'CFTC leveraged funds positioning in JPY futures.',
  },
  {
    symbol: 'AUDUSD',
    label: 'Australian Dollar / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['AUDUSD', 'AUDUSD.FX'],
    marketNames: ['AUSTRALIAN DOLLAR'],
    description: 'CFTC leveraged funds positioning in AUD futures.',
  },
  {
    symbol: 'USDCAD',
    label: 'US Dollar / Canadian Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['USDCAD', 'CADUSD', 'USDCAD.FX'],
    marketNames: ['CANADIAN DOLLAR'],
    description: 'CFTC leveraged funds positioning in CAD futures.',
  },
  {
    symbol: 'USDCHF',
    label: 'US Dollar / Swiss Franc',
    category: 'Forex',
    type: 'tff',
    aliases: ['USDCHF', 'CHFUSD', 'USDCHF.FX'],
    marketNames: ['SWISS FRANC'],
    description: 'CFTC leveraged funds positioning in CHF futures.',
  },
  {
    symbol: 'NZDUSD',
    label: 'New Zealand Dollar / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['NZDUSD', 'NZDUSD.FX'],
    marketNames: ['NZ DOLLAR'],
    description: 'CFTC leveraged funds positioning in NZD futures.',
  },

  // Indices (Traders in Financial Futures)
  {
    symbol: 'ES',
    label: 'E-mini S&P 500',
    category: 'Indices',
    type: 'tff',
    aliases: ['ES', 'SPX', 'SP500', 'US500'],
    marketNames: ['E-MINI S&P 500'],
    description: 'Institutional positioning in E-mini S&P 500 futures.',
  },
  {
    symbol: 'NQ',
    label: 'E-mini NASDAQ-100',
    category: 'Indices',
    type: 'tff',
    aliases: ['NQ', 'NDX', 'NAS100', 'US100'],
    marketNames: ['NASDAQ MINI', 'NASDAQ-100 STOCK INDEX'],
    description: 'Institutional positioning in NASDAQ-100 futures.',
  },
  {
    symbol: 'DOW',
    label: 'Dow Jones',
    category: 'Indices',
    type: 'tff',
    aliases: ['DOW', 'DJI', 'DJIA', 'US30'],
    marketNames: ['DJIA x $5', 'DOW JONES INDUSTRIAL AVERAGE'],
    description: 'Institutional positioning in DJIA futures.',
  },

  // Commodities (Disaggregated)
  {
    symbol: 'XAUUSD',
    label: 'Gold',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['XAUUSD', 'XAU', 'GOLD'],
    marketNames: ['GOLD'],
    description: 'Managed money positioning in COMEX Gold futures.',
  },
  {
    symbol: 'XAGUSD',
    label: 'Silver',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['XAGUSD', 'XAG', 'SILVER'],
    marketNames: ['SILVER'],
    description: 'Managed money positioning in COMEX Silver futures.',
  },
  {
    symbol: 'WTI',
    label: 'WTI Crude Oil',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['WTI', 'USOIL', 'CL', 'CRUDE'],
    marketNames: ['CRUDE OIL, LIGHT SWEET-WTI', 'WTI CRUDE OIL 1ST LINE'],
    description: 'Managed money positioning in NYMEX WTI futures.',
  },
  {
    symbol: 'NATGAS',
    label: 'Henry Hub Natural Gas',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['NATGAS', 'NG', 'NATURALGAS'],
    marketNames: ['HENRY HUB'],
    description: 'Managed money positioning in Henry Hub natural gas futures.',
  },
];

@Injectable()
export class CotDataService {
  private readonly logger = new Logger(CotDataService.name);

  // Financial Futures (forex + indices), futures first then combined fallback.
  private readonly TFF_ENDPOINTS = [
    'https://publicreporting.cftc.gov/resource/gpe5-46if.json',
    'https://publicreporting.cftc.gov/resource/yw9f-hn96.json',
  ];

  // Disaggregated (metals + energy), futures first then combined fallback.
  private readonly DISAGG_ENDPOINTS = [
    'https://publicreporting.cftc.gov/resource/72hh-3qpy.json',
    'https://publicreporting.cftc.gov/resource/kh3c-gbw2.json',
    'https://publicreporting.cftc.gov/resource/6dca-aqww.json',
  ];

  private readonly symbolMap = new Map<string, CotSymbolConfig>();

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(CotWeeklyReport)
    private readonly cotRepository: Repository<CotWeeklyReport>,
  ) {
    for (const config of COT_SYMBOLS) {
      this.symbolMap.set(this.normalizeSymbol(config.symbol), config);
      for (const alias of config.aliases) {
        this.symbolMap.set(this.normalizeSymbol(alias), config);
      }
    }
  }

  getSupportedSymbols(): Array<Omit<CotSymbolConfig, 'marketNames'>> {
    return COT_SYMBOLS.map(({ marketNames, ...rest }) => rest);
  }

  /**
   * Fetches historical COT data for a given symbol. Checks Cache first.
   * If cache is missing or stale over the weekend, fetches from CFTC.
   */
  async getCotHistory(
    requestedSymbol: string,
    limit = 52,
  ): Promise<CotDataPoint[]> {
    const normalizedLimit = Number.isFinite(limit)
      ? Math.min(Math.max(limit, 4), 520)
      : 52;
    const config = this.resolveSymbol(requestedSymbol);

    if (!config) {
      this.logger.warn(
        `No COT mapping explicitly found for symbol: ${requestedSymbol}`,
      );
      return [];
    }

    const symbol = config.symbol;

    try {
      // 1. Fetch from Cache
      const cached = await this.cotRepository.find({
        where: { symbol },
        order: { reportDate: 'DESC' },
        take: normalizedLimit,
      });

      // CFTC releases data on Friday containing Tuesday's snapshot.
      // If we have at least 10 weeks of data, and the most recent array item is within the last 10 days, rely on cache.
      const now = new Date();
      if (
        cached.length > 5 &&
        cached[0] &&
        now.getTime() - cached[0].reportDate.getTime() <
          10 * 24 * 60 * 60 * 1000
      ) {
        return cached.map((c) => c.data);
      }

      // 2. Fetch from CFTC Socrata Open Data API if missing
      this.logger.log(`Fetching latest CFTC Socrata data for ${symbol}...`);
      const payload = await this.fetchFromSocrata(config, normalizedLimit);

      // 3. Sync to Database
      if (payload.data.length > 0) {
        await this.syncToDatabase(
          symbol,
          payload.contractMarketName || config.marketNames[0],
          payload.data,
        );
      }

      return payload.data;
    } catch (err) {
      this.logger.error(
        `Failed to fetch COT data for ${symbol}: ${err.message}`,
      );

      // Graceful fallback to whatever is in the cache on CFTC API failure
      const fallback = await this.cotRepository.find({
        where: { symbol },
        order: { reportDate: 'DESC' },
        take: normalizedLimit,
      });
      return fallback.map((c) => c.data);
    }
  }

  private resolveSymbol(symbol: string): CotSymbolConfig | null {
    const normalized = this.normalizeSymbol(symbol);
    return this.symbolMap.get(normalized) || null;
  }

  private normalizeSymbol(symbol: string): string {
    return String(symbol || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  private async fetchFromSocrata(
    config: CotSymbolConfig,
    limit: number,
  ): Promise<{ data: CotDataPoint[]; contractMarketName: string | null }> {
    const endpoints =
      config.type === 'tff' ? this.TFF_ENDPOINTS : this.DISAGG_ENDPOINTS;

    let lastError: Error | null = null;
    for (const cftcName of config.marketNames) {
      for (const endpoint of endpoints) {
        try {
          const response = await firstValueFrom(
            this.httpService.get(endpoint, {
              params: {
                $where: `contract_market_name='${this.escapeSoqlLiteral(cftcName)}'`,
                $limit: limit,
                $order: 'report_date_as_yyyy_mm_dd DESC',
              },
              timeout: 15000,
            }),
          );

          const rows = response.data;
          if (!Array.isArray(rows) || rows.length === 0) {
            continue;
          }

          const parsed = this.parseRows(config.type, rows);
          if (parsed.length > 0) {
            this.logger.log(
              `Resolved ${config.symbol} to CFTC contract "${cftcName}" (${endpoint}) with ${parsed.length} rows`,
            );
            return {
              data: parsed,
              contractMarketName: cftcName,
            };
          }
        } catch (error: any) {
          const status = error?.response?.status;
          const message = error?.message || 'Unknown error';
          this.logger.warn(
            `COT endpoint failed (${endpoint}) for ${cftcName}: ${status || 'n/a'} ${message}`,
          );
          lastError = error;
        }
      }
    }

    if (!lastError) {
      this.logger.warn(
        `No COT rows returned for ${config.symbol}. Tried contracts: ${config.marketNames.join(', ')}`,
      );
    }

    if (lastError) {
      throw lastError;
    }

    return {
      data: [],
      contractMarketName: null,
    };
  }

  private parseRows(type: CotDatasetType, rows: any[]): CotDataPoint[] {
    return rows
      .map((row) => {
        const dateRaw = row.report_date_as_yyyy_mm_dd;
        const date = new Date(dateRaw);
        if (Number.isNaN(date.getTime())) {
          return null;
        }

        const longSmart =
          type === 'tff'
            ? this.num(
                row.lev_money_positions_long_all,
                row.lev_money_positions_long,
                row.noncomm_positions_long_all,
                row.noncomm_positions_long,
              )
            : this.num(
                row.m_money_positions_long_all,
                row.m_money_positions_long,
                row.noncomm_positions_long_all,
                row.noncomm_positions_long,
              );
        const shortSmart =
          type === 'tff'
            ? this.num(
                row.lev_money_positions_short_all,
                row.lev_money_positions_short,
                row.noncomm_positions_short_all,
                row.noncomm_positions_short,
              )
            : this.num(
                row.m_money_positions_short_all,
                row.m_money_positions_short,
                row.noncomm_positions_short_all,
                row.noncomm_positions_short,
              );

        const longRetail = this.num(row.nonrept_positions_long_all);
        const shortRetail = this.num(row.nonrept_positions_short_all);

        return {
          date,
          netNonCommercial: longSmart - shortSmart,
          netNonReportable: longRetail - shortRetail,
          openInterest: this.num(row.open_interest_all, row.open_interest_old),
          longNonCommercial: longSmart,
          shortNonCommercial: shortSmart,
          longNonReportable: longRetail,
          shortNonReportable: shortRetail,
        } as CotDataPoint;
      })
      .filter((item): item is CotDataPoint => item !== null);
  }

  private num(...values: Array<number | string | undefined | null>): number {
    for (const value of values) {
      if (value === undefined || value === null || value === '') continue;
      const parsed = parseFloat(String(value));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return 0;
  }

  private escapeSoqlLiteral(value: string): string {
    return value.replace(/'/g, "''");
  }

  private async syncToDatabase(
    symbol: string,
    cftcName: string,
    dataPoints: CotDataPoint[],
  ) {
    const records = dataPoints.map((dp) => {
      const report = new CotWeeklyReport();
      report.symbol = symbol;
      report.cftcContractName = cftcName;
      report.reportDate = dp.date;
      report.data = dp;
      return report;
    });

    // Upsert to handle unique ['symbol', 'reportDate'] constraints
    await this.cotRepository.upsert(records, ['symbol', 'reportDate']);
  }
}
