import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CotWeeklyReport, CotDataPoint } from './entities/cot-weekly-report.entity';
import { firstValueFrom } from 'rxjs';

/**
 * CFTC Socrata API integration for standard Commitment of Traders mapping.
 */
@Injectable()
export class CotDataService {
  private readonly logger = new Logger(CotDataService.name);

  // Financial Futures (Forex, Indices) -> Socrata endpoint
  private readonly TFF_ENDPOINT = 'https://publicreporting.cftc.gov/resource/gpe5-46if.json';
  
  // Disaggregated (Metals, Energy) -> Socrata endpoint
  private readonly DISAGG_ENDPOINT = 'https://publicreporting.cftc.gov/resource/6dca-zjaw.json';

  // Map our UI symbols to the ugly long CFTC contract names
  private readonly COT_SYMBOL_MAP: Record<string, { name: string; type: 'tff' | 'disagg' }> = {
    // Forex (TFF)
    'EURUSD': { name: 'EURO FX - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'GBPUSD': { name: 'BRITISH POUND - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'USDJPY': { name: 'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'AUDUSD': { name: 'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'USDCAD': { name: 'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'NZDUSD': { name: 'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'USDCHF': { name: 'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    
    // Indices (TFF)
    'SPX': { name: 'E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'NDX': { name: 'NASDAQ-100 MINI - CHICAGO MERCANTILE EXCHANGE', type: 'tff' },
    'DOW': { name: 'DJIA x $5 - CHICAGO BOARD OF TRADE', type: 'tff' },

    // Metals/Commodities (Disaggregated)
    'XAUUSD': { name: 'GOLD - COMMODITY EXCHANGE INC.', type: 'disagg' },
    'XAGUSD': { name: 'SILVER - COMMODITY EXCHANGE INC.', type: 'disagg' },
    'WTI': { name: 'CRUDE OIL, LIGHT SWEET - NEW YORK MERCANTILE EXCHANGE', type: 'disagg' },
    'NATGAS': { name: 'NATURAL GAS - NEW YORK MERCANTILE EXCHANGE', type: 'disagg' },
  };

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(CotWeeklyReport)
    private readonly cotRepository: Repository<CotWeeklyReport>,
  ) {}

  /**
   * Fetches historical COT data for a given symbol. Checks Cache first.
   * If cache is missing or stale over the weekend, fetches from CFTC.
   */
  async getCotHistory(symbol: string, limit = 52): Promise<CotDataPoint[]> {
    const config = this.COT_SYMBOL_MAP[symbol];
    if (!config) {
      this.logger.warn(`No COT mapping explicitly found for symbol: ${symbol}`);
      return [];
    }

    try {
      // 1. Fetch from Cache
      const cached = await this.cotRepository.find({
        where: { symbol },
        order: { reportDate: 'DESC' },
        take: limit,
      });

      // CFTC releases data on Friday containing Tuesday's snapshot.
      // If we have at least 10 weeks of data, and the most recent array item is within the last 10 days, rely on cache.
      const now = new Date();
      if (cached.length > 5 && cached[0] && (now.getTime() - cached[0].reportDate.getTime()) < 10 * 24 * 60 * 60 * 1000) {
          return cached.map(c => c.data);
      }

      // 2. Fetch from CFTC Socrata Open Data API if missing
      this.logger.log(`Fetching latest CFTC Socrata data for ${symbol}...`);
      const payload = await this.fetchFromSocrata(config.type, config.name, limit);
      
      // 3. Sync to Database
      if (payload.length > 0) {
        await this.syncToDatabase(symbol, config.name, payload);
      }

      return payload;
    } catch (err) {
      this.logger.error(`Failed to fetch COT data for ${symbol}: ${err.message}`);
      
      // Graceful fallback to whatever is in the cache on CFTC API failure
      const fallback = await this.cotRepository.find({
        where: { symbol },
        order: { reportDate: 'DESC' },
        take: limit,
      });
      return fallback.map(c => c.data);
    }
  }

  private async fetchFromSocrata(type: 'tff' | 'disagg', cftcName: string, limit: number): Promise<CotDataPoint[]> {
    const endpoint = type === 'tff' ? this.TFF_ENDPOINT : this.DISAGG_ENDPOINT;
    
    // We use Socrata's SoQL queries directly in the URL params
    const response = await firstValueFrom(
        this.httpService.get(endpoint, {
            params: {
                contract_market_name: cftcName,
                $limit: limit,
                $order: 'report_date_as_yyyy_mm_dd DESC',
            },
            timeout: 10000,
        })
    );

    const rows = response.data;
    if (!Array.isArray(rows)) return [];

    return rows.map((row: any) => {
        if (type === 'tff') {
            // Traders in Financial Futures mapping
            const longLev = parseFloat(row.lev_money_positions_long_all) || 0;
            const shortLev = parseFloat(row.lev_money_positions_short_all) || 0;
            const longRet = parseFloat(row.nonrept_positions_long_all) || 0;
            const shortRet = parseFloat(row.nonrept_positions_short_all) || 0;

            return {
                date: new Date(row.report_date_as_yyyy_mm_dd),
                netNonCommercial: longLev - shortLev, // Leveraged Funds = Smart Money in TFF
                netNonReportable: longRet - shortRet,
                openInterest: parseFloat(row.open_interest_all) || 0,
                longNonCommercial: longLev,
                shortNonCommercial: shortLev,
                longNonReportable: longRet,
                shortNonReportable: shortRet,
            };
        } else {
            // Disaggregated Futures mapping
            const longMM = parseFloat(row.m_money_positions_long_all) || 0;
            const shortMM = parseFloat(row.m_money_positions_short_all) || 0;
            const longRet = parseFloat(row.nonrept_positions_long_all) || 0;
            const shortRet = parseFloat(row.nonrept_positions_short_all) || 0;

            return {
                date: new Date(row.report_date_as_yyyy_mm_dd),
                netNonCommercial: longMM - shortMM, // Managed Money = Smart Money in Disagg
                netNonReportable: longRet - shortRet,
                openInterest: parseFloat(row.open_interest_all) || 0,
                longNonCommercial: longMM,
                shortNonCommercial: shortMM,
                longNonReportable: longRet,
                shortNonReportable: shortRet,
            };
        }
    });
  }

  private async syncToDatabase(symbol: string, cftcName: string, dataPoints: CotDataPoint[]) {
      const records = dataPoints.map(dp => {
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
