import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface BitcoinMetrics {
  price: number;
  marketCap: number;
  totalBTC: number;
  hashRate: number;
  difficulty: number;
  blockTime: number; // Average time between blocks in minutes
  mempool: {
    size: number; // transactions
    bytes: number;
  };
  timestamp: Date;
}

export interface BitcoinTransaction {
  hash: string;
  size: number;
  fee: number;
  inputs: number;
  outputs: number;
  totalInput: number;
  totalOutput: number;
  timestamp: Date;
}

export interface BitcoinAddress {
  address: string;
  balance: number; // in BTC
  totalReceived: number;
  totalSent: number;
  transactionCount: number;
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly BASE_URL = 'https://blockchain.info';

  // Cache
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly httpService: HttpService) {
    this.logger.log('Blockchain.com Service initialized (FREE API)');
  }

  /**
   * Get Bitcoin price
   */
  async getBitcoinPrice(): Promise<number> {
    const cacheKey = 'btc_price';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/ticker`, {
          timeout: 10000,
        })
      );

      const price = response.data.USD.last;
      this.setCache(cacheKey, price);
      return price;
    } catch (error) {
      this.logger.error('Error fetching BTC price:', error.message);
      return 0;
    }
  }

  /**
   * Get comprehensive Bitcoin metrics
   */
  async getBitcoinMetrics(): Promise<BitcoinMetrics> {
    const cacheKey = 'btc_metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [price, stats] = await Promise.all([
        this.getBitcoinPrice(),
        this.getNetworkStats(),
      ]);

      const metrics: BitcoinMetrics = {
        price,
        marketCap: stats.market_price_usd * stats.totalbc,
        totalBTC: stats.totalbc / 100000000, // Convert from satoshis
        hashRate: stats.hash_rate,
        difficulty: stats.difficulty,
        blockTime: stats.minutes_between_blocks,
        mempool: {
          size: stats.n_tx_mempool || 0,
          bytes: stats.mempool_size || 0,
        },
        timestamp: new Date(),
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      this.logger.error('Error fetching Bitcoin metrics:', error.message);
      throw error;
    }
  }

  /**
   * Get network statistics
   */
  private async getNetworkStats(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/stats`, {
          timeout: 10000,
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error fetching network stats:', error.message);
      throw error;
    }
  }

  /**
   * Get address information
   */
  async getAddressInfo(address: string): Promise<BitcoinAddress> {
    const cacheKey = `address_${address}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/rawaddr/${address}`, {
          timeout: 10000,
        })
      );

      const data = response.data;
      const addressInfo: BitcoinAddress = {
        address,
        balance: data.final_balance / 100000000, // Convert from satoshis
        totalReceived: data.total_received / 100000000,
        totalSent: data.total_sent / 100000000,
        transactionCount: data.n_tx,
      };

      this.setCache(cacheKey, addressInfo);
      return addressInfo;
    } catch (error) {
      this.logger.error(`Error fetching address info for ${address}:`, error.message);
      throw error;
    }
  }

  /**
   * Get latest blocks
   */
  async getLatestBlocks(limit: number = 10): Promise<any[]> {
    const cacheKey = `latest_blocks_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/latestblock`, {
          timeout: 10000,
        })
      );

      const latestBlock = response.data;
      const blocks = [];

      // Get block details
      for (let i = 0; i < Math.min(limit, 5); i++) {
        try {
          const blockHeight = latestBlock.height - i;
          const blockData = await this.getBlockByHeight(blockHeight);
          blocks.push(blockData);
        } catch (err) {
          break;
        }
      }

      this.setCache(cacheKey, blocks);
      return blocks;
    } catch (error) {
      this.logger.error('Error fetching latest blocks:', error.message);
      return [];
    }
  }

  /**
   * Get block by height
   */
  private async getBlockByHeight(height: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/block-height/${height}?format=json`, {
          timeout: 10000,
        })
      );

      return response.data.blocks[0];
    } catch (error) {
      this.logger.error(`Error fetching block at height ${height}:`, error.message);
      throw error;
    }
  }

  /**
   * Get unconfirmed transactions
   */
  async getUnconfirmedTransactions(limit: number = 10): Promise<BitcoinTransaction[]> {
    const cacheKey = `unconfirmed_tx_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/unconfirmed-transactions?format=json`, {
          timeout: 10000,
        })
      );

      const transactions = response.data.txs.slice(0, limit).map((tx: any) => ({
        hash: tx.hash,
        size: tx.size,
        fee: tx.fee / 100000000, // Convert from satoshis
        inputs: tx.inputs.length,
        outputs: tx.out.length,
        totalInput: tx.inputs.reduce((sum: number, input: any) => 
          sum + (input.prev_out?.value || 0), 0) / 100000000,
        totalOutput: tx.out.reduce((sum: number, output: any) => 
          sum + output.value, 0) / 100000000,
        timestamp: new Date(tx.time * 1000),
      }));

      this.setCache(cacheKey, transactions);
      return transactions;
    } catch (error) {
      this.logger.error('Error fetching unconfirmed transactions:', error.message);
      return [];
    }
  }

  /**
   * Get Bitcoin whale addresses (known large holders)
   */
  async getWhaleActivity(): Promise<{
    address: string;
    label: string;
    balance: number;
  }[]> {
    // List of known whale addresses
    const whaleAddresses = [
      { address: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo', label: 'Binance Cold Wallet' },
      { address: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97', label: 'Binance Cold Wallet 2' },
      { address: '1LQoWist8KkaUXSPKZHNvEyfrEkPHzSsCd', label: 'Huobi Cold Wallet' },
    ];

    const whaleActivity = [];

    for (const whale of whaleAddresses) {
      try {
        const info = await this.getAddressInfo(whale.address);
        whaleActivity.push({
          address: whale.address,
          label: whale.label,
          balance: info.balance,
        });

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.warn(`Failed to fetch whale activity for ${whale.label}`);
      }
    }

    return whaleActivity;
  }

  /**
   * Analyze network health
   */
  async analyzeNetworkHealth(): Promise<{
    hashRate: number;
    difficulty: number;
    mempoolCongestion: 'low' | 'medium' | 'high';
    averageBlockTime: number;
    health: 'healthy' | 'congested' | 'warning';
  }> {
    const metrics = await this.getBitcoinMetrics();

    // Determine mempool congestion
    let mempoolCongestion: 'low' | 'medium' | 'high' = 'low';
    if (metrics.mempool.size > 50000) mempoolCongestion = 'high';
    else if (metrics.mempool.size > 20000) mempoolCongestion = 'medium';

    // Determine overall health
    let health: 'healthy' | 'congested' | 'warning' = 'healthy';
    if (mempoolCongestion === 'high' || metrics.blockTime > 15) {
      health = 'congested';
    } else if (mempoolCongestion === 'medium' || metrics.blockTime > 12) {
      health = 'warning';
    }

    return {
      hashRate: metrics.hashRate,
      difficulty: metrics.difficulty,
      mempoolCongestion,
      averageBlockTime: metrics.blockTime,
      health,
    };
  }

  /**
   * Get exchange flows (simplified)
   */
  async getExchangeFlows(): Promise<{
    netFlow: number; // Positive = inflow, Negative = outflow
    sentiment: 'accumulation' | 'distribution' | 'neutral';
  }> {
    // This is a simplified version
    // In production, you'd track specific exchange addresses
    const whaleActivity = await this.getWhaleActivity();

    // Simplified: if whale balances are increasing, it's accumulation
    const totalBalance = whaleActivity.reduce((sum, w) => sum + w.balance, 0);

    // This would need historical comparison in production
    const netFlow = Math.random() * 1000 - 500; // Placeholder

    let sentiment: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
    if (netFlow > 100) sentiment = 'accumulation';
    else if (netFlow < -100) sentiment = 'distribution';

    return {
      netFlow,
      sentiment,
    };
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

