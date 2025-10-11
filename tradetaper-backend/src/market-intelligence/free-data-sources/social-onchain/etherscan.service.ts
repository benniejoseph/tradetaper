import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ethers } from 'ethers';

export interface EthTransaction {
  hash: string;
  from: string;
  to: string;
  value: string; // in ETH
  valueUSD: number;
  timestamp: Date;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  token: string;
  tokenName: string;
  tokenSymbol: string;
  value: string;
  valueUSD?: number;
  timestamp: Date;
}

export interface WhaleActivity {
  address: string;
  label?: string; // e.g., "Binance", "Whale"
  transactions: number;
  totalValueUSD: number;
  recentTransactions: EthTransaction[];
  sentiment: 'buying' | 'selling' | 'neutral';
}

export interface GasTracker {
  fast: number; // Gwei
  standard: number;
  slow: number;
  baseFee: number;
  timestamp: Date;
}

@Injectable()
export class EtherscanService {
  private readonly logger = new Logger(EtherscanService.name);
  private readonly BASE_URL = 'https://api.etherscan.io/api';
  private readonly apiKey: string;

  // Cache
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Whale addresses (known exchanges and large holders)
  private readonly WHALE_ADDRESSES = [
    { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance 14' },
    { address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', label: 'Binance 15' },
    { address: '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', label: 'Binance 16' },
    { address: '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', label: 'Binance 17' },
    { address: '0x9696f59e4d72e237be84ffd425dcad154bf96976', label: 'Binance 18' },
    { address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', label: 'Binance' },
    { address: '0x564286362092d8e7936f0549571a803b203aaced', label: 'Finance 2' },
    { address: '0x0681d8db095565fe8a346fa0277bffde9c0edbbf', label: 'Binance 3' },
    { address: '0xfe9e8709d3215310075d67e3ed32a380ccf451c8', label: 'Binance 4' },
    { address: '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67', label: 'Binance 5' },
  ];

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService
  ) {
    // Etherscan API key is FREE (5 req/sec limit)
    this.apiKey = this.configService.get<string>('ETHERSCAN_API_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.warn('ETHERSCAN_API_KEY not set. Some features may be limited.');
    }

    this.logger.log('Etherscan Service initialized (FREE API)');
  }

  /**
   * Get current ETH price
   */
  async getEthPrice(): Promise<number> {
    const cacheKey = 'eth_price';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.BASE_URL, {
          params: {
            module: 'stats',
            action: 'ethprice',
            apikey: this.apiKey,
          },
          timeout: 10000,
        })
      );

      const price = parseFloat(response.data.result.ethusd);
      this.setCache(cacheKey, price);
      return price;
    } catch (error) {
      this.logger.error('Error fetching ETH price:', error.message);
      return 0;
    }
  }

  /**
   * Get gas tracker
   */
  async getGasTracker(): Promise<GasTracker> {
    const cacheKey = 'gas_tracker';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.BASE_URL, {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: this.apiKey,
          },
          timeout: 10000,
        })
      );

      const result = response.data.result;
      const gasTracker: GasTracker = {
        fast: parseFloat(result.FastGasPrice),
        standard: parseFloat(result.ProposeGasPrice),
        slow: parseFloat(result.SafeGasPrice),
        baseFee: parseFloat(result.suggestBaseFee),
        timestamp: new Date(),
      };

      this.setCache(cacheKey, gasTracker);
      return gasTracker;
    } catch (error) {
      this.logger.error('Error fetching gas tracker:', error.message);
      throw error;
    }
  }

  /**
   * Get whale activity
   */
  async getWhaleActivity(): Promise<WhaleActivity[]> {
    const cacheKey = 'whale_activity';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.logger.log('Analyzing whale activity...');

    const whaleActivities: WhaleActivity[] = [];
    const ethPrice = await this.getEthPrice();

    // Check recent transactions for each whale address
    for (const whale of this.WHALE_ADDRESSES.slice(0, 5)) {
      // Limit to first 5 to respect rate limits
      try {
        const transactions = await this.getAddressTransactions(whale.address, 10);

        // Calculate metrics
        const totalValueUSD = transactions.reduce((sum, tx) => sum + tx.valueUSD, 0);
        
        // Determine sentiment (buying vs selling)
        const incomingValue = transactions
          .filter((tx) => tx.to.toLowerCase() === whale.address.toLowerCase())
          .reduce((sum, tx) => sum + tx.valueUSD, 0);

        const outgoingValue = transactions
          .filter((tx) => tx.from.toLowerCase() === whale.address.toLowerCase())
          .reduce((sum, tx) => sum + tx.valueUSD, 0);

        let sentiment: 'buying' | 'selling' | 'neutral' = 'neutral';
        if (incomingValue > outgoingValue * 1.5) sentiment = 'buying';
        else if (outgoingValue > incomingValue * 1.5) sentiment = 'selling';

        whaleActivities.push({
          address: whale.address,
          label: whale.label,
          transactions: transactions.length,
          totalValueUSD,
          recentTransactions: transactions.slice(0, 5),
          sentiment,
        });

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        this.logger.warn(`Failed to get activity for ${whale.label}`);
      }
    }

    this.setCache(cacheKey, whaleActivities);
    return whaleActivities;
  }

  /**
   * Get transactions for an address
   */
  private async getAddressTransactions(
    address: string,
    limit: number = 10
  ): Promise<EthTransaction[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.BASE_URL, {
          params: {
            module: 'account',
            action: 'txlist',
            address,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: limit,
            sort: 'desc',
            apikey: this.apiKey,
          },
          timeout: 10000,
        })
      );

      const ethPrice = await this.getEthPrice();

      return response.data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        valueUSD: parseFloat(ethers.formatEther(tx.value)) * ethPrice,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: parseInt(tx.blockNumber),
      }));
    } catch (error) {
      this.logger.error(`Error fetching transactions for ${address}:`, error.message);
      return [];
    }
  }

  /**
   * Get ERC-20 token transfers for an address
   */
  async getTokenTransfers(
    address: string,
    limit: number = 10
  ): Promise<TokenTransfer[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.BASE_URL, {
          params: {
            module: 'account',
            action: 'tokentx',
            address,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: limit,
            sort: 'desc',
            apikey: this.apiKey,
          },
          timeout: 10000,
        })
      );

      return response.data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        token: tx.contractAddress,
        tokenName: tx.tokenName,
        tokenSymbol: tx.tokenSymbol,
        value: ethers.formatUnits(tx.value, parseInt(tx.tokenDecimal)),
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
      }));
    } catch (error) {
      this.logger.error('Error fetching token transfers:', error.message);
      return [];
    }
  }

  /**
   * Get address balance
   */
  async getAddressBalance(address: string): Promise<{
    eth: string;
    usd: number;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.BASE_URL, {
          params: {
            module: 'account',
            action: 'balance',
            address,
            tag: 'latest',
            apikey: this.apiKey,
          },
          timeout: 10000,
        })
      );

      const ethBalance = ethers.formatEther(response.data.result);
      const ethPrice = await this.getEthPrice();

      return {
        eth: ethBalance,
        usd: parseFloat(ethBalance) * ethPrice,
      };
    } catch (error) {
      this.logger.error('Error fetching address balance:', error.message);
      return { eth: '0', usd: 0 };
    }
  }

  /**
   * Analyze overall network activity
   */
  async analyzeNetworkActivity(): Promise<{
    gasPrice: GasTracker;
    whaleActivity: WhaleActivity[];
    networkSentiment: 'bullish' | 'bearish' | 'neutral';
    congestion: 'low' | 'medium' | 'high';
  }> {
    const gasPrice = await this.getGasTracker();
    const whaleActivity = await this.getWhaleActivity();

    // Determine network congestion based on gas prices
    let congestion: 'low' | 'medium' | 'high' = 'low';
    if (gasPrice.fast > 100) congestion = 'high';
    else if (gasPrice.fast > 50) congestion = 'medium';

    // Determine network sentiment based on whale activity
    const buyingWhales = whaleActivity.filter((w) => w.sentiment === 'buying').length;
    const sellingWhales = whaleActivity.filter((w) => w.sentiment === 'selling').length;

    let networkSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (buyingWhales > sellingWhales * 1.5) networkSentiment = 'bullish';
    else if (sellingWhales > buyingWhales * 1.5) networkSentiment = 'bearish';

    return {
      gasPrice,
      whaleActivity,
      networkSentiment,
      congestion,
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

