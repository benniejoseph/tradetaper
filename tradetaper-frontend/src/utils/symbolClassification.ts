// Symbol classification utility to determine correct asset type and API endpoint

export type AssetTypeEndpoint = 'forex' | 'commodities' | 'stocks' | 'crypto';

interface SymbolClassification {
  assetType: AssetTypeEndpoint;
  description: string;
}

// Comprehensive symbol mapping
const SYMBOL_MAPPINGS: Record<string, SymbolClassification> = {
  // Precious Metals (Commodities)
  'XAUUSD': { assetType: 'commodities', description: 'Gold vs US Dollar' },
  'XAGUSD': { assetType: 'commodities', description: 'Silver vs US Dollar' },
  'XPTUSD': { assetType: 'commodities', description: 'Platinum vs US Dollar' },
  'XPDUSD': { assetType: 'commodities', description: 'Palladium vs US Dollar' },
  
  // Energy Commodities
  'USOIL': { assetType: 'commodities', description: 'US Crude Oil' },
  'UKOIL': { assetType: 'commodities', description: 'UK Brent Oil' },
  'NATGAS': { assetType: 'commodities', description: 'Natural Gas' },
  
  // Agricultural Commodities
  'WHEAT': { assetType: 'commodities', description: 'Wheat' },
  'CORN': { assetType: 'commodities', description: 'Corn' },
  'SOYBEAN': { assetType: 'commodities', description: 'Soybean' },
  
  // Major Forex Pairs
  'EURUSD': { assetType: 'forex', description: 'Euro vs US Dollar' },
  'GBPUSD': { assetType: 'forex', description: 'British Pound vs US Dollar' },
  'USDJPY': { assetType: 'forex', description: 'US Dollar vs Japanese Yen' },
  'USDCHF': { assetType: 'forex', description: 'US Dollar vs Swiss Franc' },
  'AUDUSD': { assetType: 'forex', description: 'Australian Dollar vs US Dollar' },
  'USDCAD': { assetType: 'forex', description: 'US Dollar vs Canadian Dollar' },
  'NZDUSD': { assetType: 'forex', description: 'New Zealand Dollar vs US Dollar' },
  
  // Minor Forex Pairs
  'EURGBP': { assetType: 'forex', description: 'Euro vs British Pound' },
  'EURJPY': { assetType: 'forex', description: 'Euro vs Japanese Yen' },
  'GBPJPY': { assetType: 'forex', description: 'British Pound vs Japanese Yen' },
  'CHFJPY': { assetType: 'forex', description: 'Swiss Franc vs Japanese Yen' },
  'AUDCAD': { assetType: 'forex', description: 'Australian Dollar vs Canadian Dollar' },
  'AUDCHF': { assetType: 'forex', description: 'Australian Dollar vs Swiss Franc' },
  'AUDJPY': { assetType: 'forex', description: 'Australian Dollar vs Japanese Yen' },
  'CADCHF': { assetType: 'forex', description: 'Canadian Dollar vs Swiss Franc' },
  'CADJPY': { assetType: 'forex', description: 'Canadian Dollar vs Japanese Yen' },
  'CHFCAD': { assetType: 'forex', description: 'Swiss Franc vs Canadian Dollar' },
  'EURAUD': { assetType: 'forex', description: 'Euro vs Australian Dollar' },
  'EURCAD': { assetType: 'forex', description: 'Euro vs Canadian Dollar' },
  'EURCHF': { assetType: 'forex', description: 'Euro vs Swiss Franc' },
  'EURNZD': { assetType: 'forex', description: 'Euro vs New Zealand Dollar' },
  'GBPAUD': { assetType: 'forex', description: 'British Pound vs Australian Dollar' },
  'GBPCAD': { assetType: 'forex', description: 'British Pound vs Canadian Dollar' },
  'GBPCHF': { assetType: 'forex', description: 'British Pound vs Swiss Franc' },
  'GBPNZD': { assetType: 'forex', description: 'British Pound vs New Zealand Dollar' },
  'NZDCAD': { assetType: 'forex', description: 'New Zealand Dollar vs Canadian Dollar' },
  'NZDCHF': { assetType: 'forex', description: 'New Zealand Dollar vs Swiss Franc' },
  'NZDJPY': { assetType: 'forex', description: 'New Zealand Dollar vs Japanese Yen' },
  
  // Exotic Forex Pairs
  'USDZAR': { assetType: 'forex', description: 'US Dollar vs South African Rand' },
  'USDMXN': { assetType: 'forex', description: 'US Dollar vs Mexican Peso' },
  'USDTRY': { assetType: 'forex', description: 'US Dollar vs Turkish Lira' },
  'USDSEK': { assetType: 'forex', description: 'US Dollar vs Swedish Krona' },
  'USDNOK': { assetType: 'forex', description: 'US Dollar vs Norwegian Krone' },
  'USDDKK': { assetType: 'forex', description: 'US Dollar vs Danish Krone' },
  'USDPLN': { assetType: 'forex', description: 'US Dollar vs Polish Zloty' },
  'USDCZK': { assetType: 'forex', description: 'US Dollar vs Czech Koruna' },
  'USDHUF': { assetType: 'forex', description: 'US Dollar vs Hungarian Forint' },
  
  // Cryptocurrencies (common symbols)
  'BTCUSD': { assetType: 'crypto', description: 'Bitcoin vs US Dollar' },
  'ETHUSD': { assetType: 'crypto', description: 'Ethereum vs US Dollar' },
  'LTCUSD': { assetType: 'crypto', description: 'Litecoin vs US Dollar' },
  'XRPUSD': { assetType: 'crypto', description: 'Ripple vs US Dollar' },
  'BCHUSD': { assetType: 'crypto', description: 'Bitcoin Cash vs US Dollar' },
  'ADAUSD': { assetType: 'crypto', description: 'Cardano vs US Dollar' },
  'DOTUSD': { assetType: 'crypto', description: 'Polkadot vs US Dollar' },
  'LINKUSD': { assetType: 'crypto', description: 'Chainlink vs US Dollar' },
  
  // Major Stocks (examples)
  'AAPL': { assetType: 'stocks', description: 'Apple Inc.' },
  'GOOGL': { assetType: 'stocks', description: 'Alphabet Inc.' },
  'MSFT': { assetType: 'stocks', description: 'Microsoft Corporation' },
  'AMZN': { assetType: 'stocks', description: 'Amazon.com Inc.' },
  'TSLA': { assetType: 'stocks', description: 'Tesla Inc.' },
  'META': { assetType: 'stocks', description: 'Meta Platforms Inc.' },
  'NFLX': { assetType: 'stocks', description: 'Netflix Inc.' },
  'NVDA': { assetType: 'stocks', description: 'NVIDIA Corporation' },
  'JPM': { assetType: 'stocks', description: 'JPMorgan Chase & Co.' },
  'V': { assetType: 'stocks', description: 'Visa Inc.' },
};

// Currency codes for pattern matching
const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'LTC', 'XRP', 'BCH', 'ADA', 'DOT', 'LINK'];
const PRECIOUS_METALS = ['XAU', 'XAG', 'XPT', 'XPD']; // Gold, Silver, Platinum, Palladium

/**
 * Classifies a trading symbol into the correct asset type for API routing
 */
export function classifySymbol(symbol: string): SymbolClassification {
  const upperSymbol = symbol.toUpperCase().trim();
  
  // Direct mapping lookup first (most accurate)
  if (SYMBOL_MAPPINGS[upperSymbol]) {
    return SYMBOL_MAPPINGS[upperSymbol];
  }
  
  // Pattern-based classification for unmapped symbols
  
  // Check for precious metals (XAU, XAG, etc.)
  if (PRECIOUS_METALS.some(metal => upperSymbol.startsWith(metal))) {
    return { 
      assetType: 'commodities', 
      description: `${upperSymbol} Commodity` 
    };
  }
  
  // Check for crypto patterns (ends with USD and starts with known crypto)
  if (upperSymbol.endsWith('USD') && upperSymbol.length >= 6) {
    const baseCurrency = upperSymbol.slice(0, -3);
    if (CRYPTO_SYMBOLS.includes(baseCurrency)) {
      return { 
        assetType: 'crypto', 
        description: `${baseCurrency} vs US Dollar` 
      };
    }
  }
  
  // Check for forex patterns (6 characters, major currencies)
  if (upperSymbol.length === 6) {
    const baseCurrency = upperSymbol.slice(0, 3);
    const quoteCurrency = upperSymbol.slice(3, 6);
    
    if (MAJOR_CURRENCIES.includes(baseCurrency) && MAJOR_CURRENCIES.includes(quoteCurrency)) {
      return { 
        assetType: 'forex', 
        description: `${baseCurrency} vs ${quoteCurrency}` 
      };
    }
  }
  
  // Check for slashed forex format (EUR/USD)
  if (upperSymbol.includes('/')) {
    const [baseCurrency, quoteCurrency] = upperSymbol.split('/');
    if (baseCurrency && quoteCurrency && 
        MAJOR_CURRENCIES.includes(baseCurrency) && 
        MAJOR_CURRENCIES.includes(quoteCurrency)) {
      return { 
        assetType: 'forex', 
        description: `${baseCurrency} vs ${quoteCurrency}` 
      };
    }
  }
  
  // Default to stocks for other patterns (typically 1-5 character symbols)
  if (upperSymbol.length <= 5 && upperSymbol.match(/^[A-Z]+$/)) {
    return { 
      assetType: 'stocks', 
      description: `${upperSymbol} Stock` 
    };
  }
  
  // Fallback - default to forex if uncertain
  console.warn(`Unable to classify symbol: ${symbol}. Defaulting to forex.`);
  return { 
    assetType: 'forex', 
    description: `${upperSymbol} (unclassified, defaulting to forex)` 
  };
}

/**
 * Gets the API endpoint path for a symbol based on its classification
 */
export function getApiEndpointForSymbol(symbol: string): string {
  const classification = classifySymbol(symbol);
  const upperSymbol = symbol.toUpperCase().trim();
  
  switch (classification.assetType) {
    case 'forex':
      // Handle both slashed and non-slashed forex formats
      if (upperSymbol.includes('/')) {
        const [base, quote] = upperSymbol.split('/');
        return `/market-data/historical/forex/${base}/${quote}`;
      } else if (upperSymbol.length === 6) {
        const base = upperSymbol.slice(0, 3);
        const quote = upperSymbol.slice(3, 6);
        return `/market-data/historical/forex/${base}/${quote}`;
      } else {
        throw new Error(`Invalid forex symbol format: ${symbol}`);
      }
      
    case 'commodities':
      return `/market-data/historical/commodities/${upperSymbol}`;
      
    case 'stocks':
      return `/market-data/historical/stocks/${upperSymbol}`;
      
    case 'crypto':
      return `/market-data/historical/crypto/${upperSymbol}`;
      
    default:
      throw new Error(`Unknown asset type: ${classification.assetType}`);
  }
}

/**
 * Checks if a symbol is supported by the classification system
 */
export function isSymbolSupported(symbol: string): boolean {
  try {
    const classification = classifySymbol(symbol);
    return classification.assetType !== 'forex' || !classification.description.includes('unclassified');
  } catch (error) {
    return false;
  }
}

/**
 * Gets all supported symbols by asset type
 */
export function getSupportedSymbolsByAssetType(): Record<AssetTypeEndpoint, string[]> {
  const result: Record<AssetTypeEndpoint, string[]> = {
    forex: [],
    commodities: [],
    stocks: [],
    crypto: []
  };
  
  Object.entries(SYMBOL_MAPPINGS).forEach(([symbol, classification]) => {
    result[classification.assetType].push(symbol);
  });
  
  return result;
}