import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface EconomicIndicator {
  name: string;
  value: number;
  date: Date;
  change: number; // % change from previous period
  interpretation: 'positive' | 'negative' | 'neutral';
}

export interface EconomicOverview {
  gdp: EconomicIndicator;
  unemployment: EconomicIndicator;
  inflation: EconomicIndicator;
  interestRate: EconomicIndicator;
  consumerConfidence?: EconomicIndicator;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  marketImpact: string[];
  timestamp: Date;
}

@Injectable()
export class FredEconomicService {
  private readonly logger = new Logger(FredEconomicService.name);
  private readonly fredApiKey: string;
  private readonly baseUrl = 'https://api.stlouisfed.org/fred';
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private readonly CACHE_DURATION = 3600000; // 1 hour

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    // FRED API key is FREE - get it at https://fred.stlouisfed.org/docs/api/api_key.html
    this.fredApiKey = this.configService.get<string>('FRED_API_KEY') || '';
  }

  /**
   * Get comprehensive economic overview
   */
  async getEconomicOverview(): Promise<EconomicOverview> {
    this.logger.log('Fetching economic overview from FRED');

    try {
      // Fetch all indicators in parallel
      const [gdp, unemployment, inflation, interestRate, consumerConfidence] =
        await Promise.all([
          this.getGDP(),
          this.getUnemploymentRate(),
          this.getInflationRate(),
          this.getInterestRate(),
          this.getConsumerConfidence().catch(() => null),
        ]);

      // Analyze overall economic sentiment
      const { sentiment, impact } = this.analyzeEconomicSentiment(
        gdp,
        unemployment,
        inflation,
        interestRate
      );

      return {
        gdp,
        unemployment,
        inflation,
        interestRate,
        consumerConfidence: consumerConfidence || undefined,
        overallSentiment: sentiment,
        marketImpact: impact,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get economic overview:', error);
      throw error;
    }
  }

  /**
   * Get GDP data (Real Gross Domestic Product)
   */
  async getGDP(): Promise<EconomicIndicator> {
    const seriesId = 'GDPC1'; // Real GDP
    const data = await this.fetchSeries(seriesId, 2);

    if (data.length < 2) {
      throw new Error('Insufficient GDP data');
    }

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = ((latest.value - previous.value) / previous.value) * 100;

    return {
      name: 'GDP Growth',
      value: latest.value,
      date: new Date(latest.date),
      change,
      interpretation: change > 2 ? 'positive' : change < 0 ? 'negative' : 'neutral',
    };
  }

  /**
   * Get Unemployment Rate
   */
  async getUnemploymentRate(): Promise<EconomicIndicator> {
    const seriesId = 'UNRATE'; // Unemployment Rate
    const data = await this.fetchSeries(seriesId, 2);

    if (data.length < 2) {
      throw new Error('Insufficient unemployment data');
    }

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = latest.value - previous.value;

    return {
      name: 'Unemployment Rate',
      value: latest.value,
      date: new Date(latest.date),
      change,
      interpretation:
        change < -0.2 ? 'positive' : change > 0.2 ? 'negative' : 'neutral',
    };
  }

  /**
   * Get Inflation Rate (CPI)
   */
  async getInflationRate(): Promise<EconomicIndicator> {
    const seriesId = 'CPIAUCSL'; // Consumer Price Index
    const data = await this.fetchSeries(seriesId, 13); // 13 months for YoY

    if (data.length < 13) {
      throw new Error('Insufficient CPI data');
    }

    const latest = data[data.length - 1];
    const yearAgo = data[data.length - 13];
    const yoyChange = ((latest.value - yearAgo.value) / yearAgo.value) * 100;

    return {
      name: 'Inflation (CPI YoY)',
      value: yoyChange,
      date: new Date(latest.date),
      change: yoyChange,
      interpretation:
        yoyChange > 3 ? 'negative' : yoyChange < 2 ? 'positive' : 'neutral',
    };
  }

  /**
   * Get Federal Funds Rate
   */
  async getInterestRate(): Promise<EconomicIndicator> {
    const seriesId = 'FEDFUNDS'; // Federal Funds Rate
    const data = await this.fetchSeries(seriesId, 2);

    if (data.length < 2) {
      throw new Error('Insufficient interest rate data');
    }

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = latest.value - previous.value;

    return {
      name: 'Federal Funds Rate',
      value: latest.value,
      date: new Date(latest.date),
      change,
      interpretation:
        change < -0.25 ? 'positive' : change > 0.25 ? 'negative' : 'neutral',
    };
  }

  /**
   * Get Consumer Confidence Index
   */
  async getConsumerConfidence(): Promise<EconomicIndicator> {
    const seriesId = 'UMCSENT'; // University of Michigan Consumer Sentiment
    const data = await this.fetchSeries(seriesId, 2);

    if (data.length < 2) {
      throw new Error('Insufficient consumer confidence data');
    }

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = ((latest.value - previous.value) / previous.value) * 100;

    return {
      name: 'Consumer Confidence',
      value: latest.value,
      date: new Date(latest.date),
      change,
      interpretation: change > 2 ? 'positive' : change < -2 ? 'negative' : 'neutral',
    };
  }

  /**
   * Fetch series data from FRED API
   */
  private async fetchSeries(
    seriesId: string,
    observations: number = 1
  ): Promise<{ date: string; value: number }[]> {
    // Check cache
    const cacheKey = `${seriesId}_${observations}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION) {
      return cached.data;
    }

    if (!this.fredApiKey) {
      this.logger.warn('FRED API key not configured - using mock data');
      return this.getMockData(seriesId, observations);
    }

    try {
      const url = `${this.baseUrl}/series/observations`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            series_id: seriesId,
            api_key: this.fredApiKey,
            file_type: 'json',
            sort_order: 'desc',
            limit: observations,
          },
          timeout: 10000,
        })
      );

      const data = response.data.observations
        .map((obs: any) => ({
          date: obs.date,
          value: parseFloat(obs.value),
        }))
        .filter((d: any) => !isNaN(d.value))
        .reverse();

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: new Date() });

      return data;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch FRED series ${seriesId}, using mock data:`,
        error.message
      );
      return this.getMockData(seriesId, observations);
    }
  }

  /**
   * Get mock data (fallback when API is unavailable)
   */
  private getMockData(
    seriesId: string,
    observations: number
  ): { date: string; value: number }[] {
    const mockData: { [key: string]: number[] } = {
      GDPC1: [22000, 22500], // GDP in billions
      UNRATE: [3.8, 3.7], // Unemployment %
      CPIAUCSL: Array(13)
        .fill(0)
        .map((_, i) => 300 + i * 2), // CPI
      FEDFUNDS: [5.25, 5.25], // Federal Funds Rate %
      UMCSENT: [68, 70], // Consumer Sentiment
    };

    const values = mockData[seriesId] || [100, 101];
    const result: { date: string; value: number }[] = [];

    for (let i = 0; i < Math.min(observations, values.length); i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (observations - i - 1));
      result.push({
        date: date.toISOString().split('T')[0],
        value: values[i] || values[0],
      });
    }

    return result;
  }

  /**
   * Analyze overall economic sentiment
   */
  private analyzeEconomicSentiment(
    gdp: EconomicIndicator,
    unemployment: EconomicIndicator,
    inflation: EconomicIndicator,
    interestRate: EconomicIndicator
  ): {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impact: string[];
  } {
    const impact: string[] = [];
    let positiveCount = 0;
    let negativeCount = 0;

    // GDP analysis
    if (gdp.interpretation === 'positive') {
      positiveCount++;
      impact.push(`✅ Strong GDP growth (+${gdp.change.toFixed(2)}%) - bullish for markets`);
    } else if (gdp.interpretation === 'negative') {
      negativeCount++;
      impact.push(`❌ GDP contraction (${gdp.change.toFixed(2)}%) - bearish signal`);
    } else {
      impact.push(`➖ GDP growth moderate (${gdp.change.toFixed(2)}%)`);
    }

    // Unemployment analysis
    if (unemployment.interpretation === 'positive') {
      positiveCount++;
      impact.push(
        `✅ Unemployment decreasing (${unemployment.change > 0 ? '+' : ''}${unemployment.change.toFixed(2)}%) - positive`
      );
    } else if (unemployment.interpretation === 'negative') {
      negativeCount++;
      impact.push(
        `❌ Unemployment rising (${unemployment.change > 0 ? '+' : ''}${unemployment.change.toFixed(2)}%) - negative`
      );
    } else {
      impact.push(`➖ Unemployment stable at ${unemployment.value.toFixed(1)}%`);
    }

    // Inflation analysis
    if (inflation.interpretation === 'positive') {
      positiveCount++;
      impact.push(`✅ Inflation moderate (${inflation.value.toFixed(2)}%) - favorable`);
    } else if (inflation.interpretation === 'negative') {
      negativeCount++;
      impact.push(`❌ High inflation (${inflation.value.toFixed(2)}%) - concerning`);
    } else {
      impact.push(`➖ Inflation at ${inflation.value.toFixed(2)}%`);
    }

    // Interest rate analysis
    if (interestRate.interpretation === 'positive') {
      positiveCount++;
      impact.push(
        `✅ Interest rates declining - supports growth`
      );
    } else if (interestRate.interpretation === 'negative') {
      negativeCount++;
      impact.push(
        `❌ Interest rates rising - tightening conditions`
      );
    } else {
      impact.push(`➖ Interest rates stable at ${interestRate.value.toFixed(2)}%`);
    }

    // Determine overall sentiment
    let sentiment: 'bullish' | 'bearish' | 'neutral';
    if (positiveCount > negativeCount + 1) {
      sentiment = 'bullish';
      impact.push('\n📈 Overall: Favorable economic conditions for risk assets');
    } else if (negativeCount > positiveCount + 1) {
      sentiment = 'bearish';
      impact.push('\n📉 Overall: Economic headwinds present');
    } else {
      sentiment = 'neutral';
      impact.push('\n➖ Overall: Mixed economic signals');
    }

    return { sentiment, impact };
  }
}

