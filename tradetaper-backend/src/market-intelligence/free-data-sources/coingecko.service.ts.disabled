import { Injectable, Logger } from '@nestjs/common';
import CoinGecko from 'coingecko-api';

export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  totalSupply: number;
  ath: number;
  athDate: Date;
  timestamp: Date;
}

@Injectable()
export class CoinGeckoService {
  private readonly logger = new Logger(CoinGeckoService.name);
  private client = new CoinGecko();

  /**
   * Get current price for a single coin
   */
  async getCoinPrice(coinId: string): Promise<CoinGeckoPrice | null> {
    try {
      this.logger.log(`Fetching CoinGecko price for ${coinId}`);

      const response = await this.client.coins.fetch(coinId, {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
      });

      if (!response.success || !response.data) {
        return null;
      }

      const data = response.data;
      const marketData = data.market_data;

      return {
        id: data.id,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        price: marketData.current_price?.usd || 0,
        priceChange24h: marketData.price_change_24h || 0,
        priceChangePercent24h: marketData.price_change_percentage_24h || 0,
        marketCap: marketData.market_cap?.usd || 0,
        volume24h: marketData.total_volume?.usd || 0,
        high24h: marketData.high_24h?.usd || 0,
        low24h: marketData.low_24h?.usd || 0,
        circulatingSupply: marketData.circulating_supply || 0,
        totalSupply: marketData.total_supply || 0,
        ath: marketData.ath?.usd || 0,
        athDate: marketData.ath_date?.usd
          ? new Date(marketData.ath_date.usd)
          : new Date(),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error fetching CoinGecko price for ${coinId}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get simple price for multiple coins
   */
  async getSimplePrices(coinIds: string[]): Promise<Map<string, number>> {
    try {
      this.logger.log(
        `Fetching CoinGecko simple prices for ${coinIds.length} coins`
      );

      const response = await this.client.simple.price({
        ids: coinIds,
        vs_currencies: ['usd'],
        include_24hr_change: true,
      });

      if (!response.success || !response.data) {
        return new Map();
      }

      const prices = new Map<string, number>();
      Object.entries(response.data).forEach(([coinId, data]: [string, any]) => {
        if (data.usd) {
          prices.set(coinId, data.usd);
        }
      });

      return prices;
    } catch (error) {
      this.logger.error('Error fetching CoinGecko simple prices:', error.message);
      return new Map();
    }
  }

  /**
   * Get top coins by market cap
   */
  async getTopCoins(limit: number = 100): Promise<CoinGeckoPrice[]> {
    try {
      this.logger.log(`Fetching top ${limit} coins from CoinGecko`);

      const response = await this.client.coins.markets({
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
      });

      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        circulatingSupply: coin.circulating_supply || 0,
        totalSupply: coin.total_supply || 0,
        ath: coin.ath || 0,
        athDate: coin.ath_date ? new Date(coin.ath_date) : new Date(),
        timestamp: new Date(),
      }));
    } catch (error) {
      this.logger.error('Error fetching CoinGecko top coins:', error.message);
      return [];
    }
  }

  /**
   * Search for coins
   */
  async searchCoins(query: string): Promise<any[]> {
    try {
      this.logger.log(`Searching CoinGecko for: ${query}`);

      const response = await this.client.search(query);

      if (!response.success || !response.data) {
        return [];
      }

      return response.data.coins.slice(0, 10).map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        marketCapRank: coin.market_cap_rank,
        thumb: coin.thumb,
      }));
    } catch (error) {
      this.logger.error('Error searching CoinGecko:', error.message);
      return [];
    }
  }

  /**
   * Get historical market data
   */
  async getMarketChart(
    coinId: string,
    days: number = 30
  ): Promise<{ prices: number[][]; marketCaps: number[][]; volumes: number[][] }> {
    try {
      this.logger.log(
        `Fetching CoinGecko market chart for ${coinId} (${days} days)`
      );

      const response = await this.client.coins.fetchMarketChart(coinId, {
        vs_currency: 'usd',
        days,
      });

      if (!response.success || !response.data) {
        return { prices: [], marketCaps: [], volumes: [] };
      }

      return {
        prices: response.data.prices,
        marketCaps: response.data.market_caps,
        volumes: response.data.total_volumes,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching CoinGecko market chart for ${coinId}:`,
        error.message
      );
      return { prices: [], marketCaps: [], volumes: [] };
    }
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins(): Promise<any[]> {
    try {
      this.logger.log('Fetching CoinGecko trending coins');

      const response = await this.client.trending();

      if (!response.success || !response.data) {
        return [];
      }

      return response.data.coins.map((item: any) => ({
        id: item.item.id,
        symbol: item.item.symbol.toUpperCase(),
        name: item.item.name,
        marketCapRank: item.item.market_cap_rank,
        thumb: item.item.thumb,
        score: item.item.score,
      }));
    } catch (error) {
      this.logger.error('Error fetching CoinGecko trending coins:', error.message);
      return [];
    }
  }

  /**
   * Get global crypto market data
   */
  async getGlobalData(): Promise<any> {
    try {
      this.logger.log('Fetching CoinGecko global market data');

      const response = await this.client.global();

      if (!response.success || !response.data) {
        return null;
      }

      const data = response.data.data;

      return {
        totalMarketCap: data.total_market_cap?.usd || 0,
        total24hVolume: data.total_volume?.usd || 0,
        marketCapPercentage: data.market_cap_percentage,
        marketCapChangePercentage24h: data.market_cap_change_percentage_24h_usd || 0,
        activeCryptocurrencies: data.active_cryptocurrencies || 0,
        upcomingIcos: data.upcoming_icos || 0,
        ongoingIcos: data.ongoing_icos || 0,
        endedIcos: data.ended_icos || 0,
        markets: data.markets || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error fetching CoinGecko global data:', error.message);
      return null;
    }
  }
}

