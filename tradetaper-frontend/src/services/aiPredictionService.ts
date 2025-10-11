// services/aiPredictionService.ts
import { MarketQuote, NewsItem, TechnicalIndicator } from './marketDataService';
import { ICTAnalysisResult } from './ictAnalysisService';

export interface AIMarketPrediction {
  symbol: string;
  prediction: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  timeframe: string;
  targetPrice: number;
  probability: number;
  reasoning: string[];
  fundamentalFactors: string[];
  technicalFactors: string[];
  riskFactors: string[];
  catalysts: string[];
  sentiment: {
    score: number;
    label: 'Extremely Bearish' | 'Bearish' | 'Neutral' | 'Bullish' | 'Extremely Bullish';
  };
  scenarios: {
    bullish: { probability: number; target: number; catalyst: string };
    bearish: { probability: number; target: number; catalyst: string };
    neutral: { probability: number; range: { high: number; low: number } };
  };
}

export interface AITradingSignal {
  symbol: string;
  signal: 'Buy' | 'Sell' | 'Hold';
  strength: number;
  entry: {
    price: number;
    timing: string;
    method: string;
  };
  targets: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
  stopLoss: number;
  riskReward: number;
  holding_period: string;
  reasoning: string;
  ictAlignment: boolean;
  newsImpact: number;
}

export interface AIMarketSummary {
  timestamp: string;
  overallSentiment: 'Risk On' | 'Risk Off' | 'Mixed';
  marketRegime: 'Trending' | 'Ranging' | 'Volatile' | 'Calm';
  dominantTheme: string;
  keyDrivers: string[];
  sectorsToWatch: string[];
  currencyOutlook: { currency: string; bias: string; reasoning: string }[];
  commodityOutlook: { commodity: string; bias: string; reasoning: string }[];
  warnings: string[];
  opportunities: string[];
}

class AIPredictionService {
  private readonly OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  private readonly API_BASE = 'https://api.openai.com/v1/chat/completions';
  
  private predictionCache = new Map<string, { data: any; timestamp: number }>();

  // Main prediction function using OpenAI GPT
  async generateMarketPrediction(
    symbol: string,
    marketData: MarketQuote,
    newsData: NewsItem[],
    technicalData?: TechnicalIndicator,
    ictAnalysis?: ICTAnalysisResult
  ): Promise<AIMarketPrediction> {
    const cacheKey = `prediction_${symbol}`;
    const cached = this.predictionCache.get(cacheKey);
    
    // Cache for 30 minutes
    if (cached && Date.now() - cached.timestamp < 1800000) {
      return cached.data;
    }

    try {
      let prediction: AIMarketPrediction;
      
      if (this.OPENAI_API_KEY && this.OPENAI_API_KEY !== 'demo') {
        prediction = await this.generateAIPrediction(symbol, marketData, newsData, technicalData, ictAnalysis);
      } else {
        prediction = this.generateMockPrediction(symbol, marketData, newsData);
      }
      
      this.predictionCache.set(cacheKey, { data: prediction, timestamp: Date.now() });
      return prediction;
    } catch (error) {
      console.error(`Failed to generate prediction for ${symbol}:`, error);
      return this.generateMockPrediction(symbol, marketData, newsData);
    }
  }

  private async generateAIPrediction(
    symbol: string,
    marketData: MarketQuote,
    newsData: NewsItem[],
    technicalData?: TechnicalIndicator,
    ictAnalysis?: ICTAnalysisResult
  ): Promise<AIMarketPrediction> {
    const prompt = this.buildPredictionPrompt(symbol, marketData, newsData, technicalData, ictAnalysis);
    
    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert financial analyst and trader with deep knowledge of:
            - Technical analysis and chart patterns
            - Fundamental analysis and economic indicators  
            - ICT (Inner Circle Trader) methodology by Michael Huddleston
            - Market microstructure and institutional trading
            - Risk management and position sizing
            - Global macroeconomic trends
            
            Provide detailed, actionable market analysis in JSON format. Be specific about price targets, timeframes, and risk factors.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return this.generateMockPrediction(symbol, marketData, newsData);
    }
  }

  private buildPredictionPrompt(
    symbol: string,
    marketData: MarketQuote,
    newsData: NewsItem[],
    technicalData?: TechnicalIndicator,
    ictAnalysis?: ICTAnalysisResult
  ): string {
    const recentNews = newsData.slice(0, 5).map(news => 
      `- ${news.title} (Impact: ${news.impact}, Sentiment: ${news.sentimentScore})`
    ).join('\n');

    const technicalSummary = technicalData ? `
Technical Indicators:
- RSI: ${technicalData.rsi.toFixed(2)}
- MACD: ${technicalData.macd.macd.toFixed(4)} (Signal: ${technicalData.macd.signal.toFixed(4)})
- SMA20: ${technicalData.sma20.toFixed(2)}, SMA50: ${technicalData.sma50.toFixed(2)}, SMA200: ${technicalData.sma200.toFixed(2)}
- Bollinger Bands: Upper ${technicalData.bollinger.upper.toFixed(2)}, Lower ${technicalData.bollinger.lower.toFixed(2)}
- Stochastic: %K ${technicalData.stochastic.k.toFixed(2)}, %D ${technicalData.stochastic.d.toFixed(2)}
- ATR: ${technicalData.atr.toFixed(4)}, ADX: ${technicalData.adx.toFixed(2)}
` : '';

    const ictSummary = ictAnalysis ? `
ICT Analysis:
- Market Structure: ${ictAnalysis.marketStructure.trend}
- Break of Structure: ${ictAnalysis.marketStructure.breakOfStructure}
- Order Blocks: ${ictAnalysis.levels.orderBlocks.bullish.length} bullish, ${ictAnalysis.levels.orderBlocks.bearish.length} bearish
- Fair Value Gaps: ${ictAnalysis.levels.fairValueGaps.bullish.length} bullish, ${ictAnalysis.levels.fairValueGaps.bearish.length} bearish
- Session Bias: London ${ictAnalysis.sessionAnalysis.londonSession.bias}, NY ${ictAnalysis.sessionAnalysis.newYorkSession.bias}
- Trade Setup: ${ictAnalysis.tradeSetup.direction} ${ictAnalysis.tradeSetup.setup}
- Overall Bias: ${ictAnalysis.overallBias} (Confidence: ${ictAnalysis.confidence}%)
` : '';

    return `
Analyze ${symbol} and provide a comprehensive market prediction in the following JSON format:

Current Market Data:
- Price: ${marketData.price}
- Change: ${marketData.change} (${marketData.changePercent}%)
- Volume: ${marketData.volume}
- 24h High: ${marketData.high24h}, Low: ${marketData.low24h}

Recent News:
${recentNews}

${technicalSummary}

${ictSummary}

Required JSON Response Format:
{
  "symbol": "${symbol}",
  "prediction": "Bullish|Bearish|Neutral",
  "confidence": 0-100,
  "timeframe": "1-2 weeks",
  "targetPrice": number,
  "probability": 0-100,
  "reasoning": ["reason1", "reason2", "reason3"],
  "fundamentalFactors": ["factor1", "factor2"],
  "technicalFactors": ["factor1", "factor2"],
  "riskFactors": ["risk1", "risk2"],
  "catalysts": ["catalyst1", "catalyst2"],
  "sentiment": {
    "score": -1 to 1,
    "label": "Extremely Bearish|Bearish|Neutral|Bullish|Extremely Bullish"
  },
  "scenarios": {
    "bullish": {"probability": 0-100, "target": number, "catalyst": "string"},
    "bearish": {"probability": 0-100, "target": number, "catalyst": "string"},
    "neutral": {"probability": 0-100, "range": {"high": number, "low": number}}
  }
}

Consider:
1. Current market structure and trend
2. Key support/resistance levels
3. Economic events and news impact
4. ICT concepts (order blocks, fair value gaps, market structure)
5. Risk-on vs risk-off sentiment
6. Correlation with other assets
7. Seasonal patterns
8. Central bank policies

Provide specific, actionable analysis with clear reasoning.`;
  }

  private generateMockPrediction(symbol: string, marketData: MarketQuote, newsData: NewsItem[]): AIMarketPrediction {
    const currentPrice = marketData.price;
    const changePercent = marketData.changePercent;
    const avgSentiment = newsData.reduce((sum, news) => sum + news.sentimentScore, 0) / newsData.length;
    
    // Determine prediction based on price action and sentiment
    let prediction: 'Bullish' | 'Bearish' | 'Neutral';
    let targetPrice: number;
    let confidence: number;
    
    if (changePercent > 1 && avgSentiment > 0.2) {
      prediction = 'Bullish';
      targetPrice = currentPrice * 1.08;
      confidence = 75 + Math.random() * 15;
    } else if (changePercent < -1 && avgSentiment < -0.2) {
      prediction = 'Bearish';
      targetPrice = currentPrice * 0.92;
      confidence = 70 + Math.random() * 20;
    } else {
      prediction = 'Neutral';
      targetPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.04);
      confidence = 50 + Math.random() * 25;
    }

    const sentimentScore = avgSentiment + (Math.random() - 0.5) * 0.3;
    const sentimentLabel = sentimentScore > 0.5 ? 'Extremely Bullish' :
                          sentimentScore > 0.2 ? 'Bullish' :
                          sentimentScore > -0.2 ? 'Neutral' :
                          sentimentScore > -0.5 ? 'Bearish' : 'Extremely Bearish';

    return {
      symbol,
      prediction,
      confidence,
      timeframe: '2-3 weeks',
      targetPrice,
      probability: confidence,
      reasoning: this.generateReasoningForPrediction(symbol, prediction, changePercent, avgSentiment),
      fundamentalFactors: this.generateFundamentalFactors(symbol, prediction),
      technicalFactors: this.generateTechnicalFactors(prediction, changePercent),
      riskFactors: this.generateRiskFactors(symbol, prediction),
      catalysts: this.generateCatalysts(symbol, prediction),
      sentiment: {
        score: sentimentScore,
        label: sentimentLabel
      },
      scenarios: {
        bullish: {
          probability: prediction === 'Bullish' ? 70 : prediction === 'Neutral' ? 35 : 20,
          target: currentPrice * 1.08,
          catalyst: 'Positive economic data or risk-on sentiment'
        },
        bearish: {
          probability: prediction === 'Bearish' ? 70 : prediction === 'Neutral' ? 35 : 20,
          target: currentPrice * 0.92,
          catalyst: 'Negative economic data or risk-off sentiment'
        },
        neutral: {
          probability: prediction === 'Neutral' ? 60 : 30,
          range: { high: currentPrice * 1.03, low: currentPrice * 0.97 }
        }
      }
    };
  }

  private generateReasoningForPrediction(symbol: string, prediction: string, changePercent: number, sentiment: number): string[] {
    const reasoning: string[] = [];
    
    if (prediction === 'Bullish') {
      reasoning.push('Strong upward momentum confirmed by price action');
      reasoning.push('Positive news sentiment supporting bullish bias');
      if (symbol.includes('USD')) {
        reasoning.push('USD strength driven by Federal Reserve policy expectations');
      }
      reasoning.push('Technical indicators suggesting continuation of uptrend');
    } else if (prediction === 'Bearish') {
      reasoning.push('Downward pressure evident in recent price movement');
      reasoning.push('Negative sentiment from recent market developments');
      reasoning.push('Technical breakdown suggesting further decline');
      if (symbol.includes('Gold') || symbol.includes('XAU')) {
        reasoning.push('Dollar strength reducing gold appeal');
      }
    } else {
      reasoning.push('Mixed signals creating uncertain outlook');
      reasoning.push('Consolidation pattern suggesting range-bound movement');
      reasoning.push('Awaiting clear directional catalyst');
    }
    
    return reasoning;
  }

  private generateFundamentalFactors(symbol: string, prediction: string): string[] {
    const factors: string[] = [];
    
    if (symbol.includes('USD')) {
      factors.push('Federal Reserve monetary policy outlook');
      factors.push('US economic data performance vs expectations');
      factors.push('Treasury yield movements and curve dynamics');
    } else if (symbol.includes('EUR')) {
      factors.push('European Central Bank policy divergence');
      factors.push('Eurozone economic growth concerns');
      factors.push('Political stability across EU member states');
    } else if (symbol.includes('GBP')) {
      factors.push('Bank of England interest rate trajectory');
      factors.push('UK economic performance post-Brexit');
      factors.push('Sterling positioning and flow dynamics');
    } else if (symbol.includes('Gold') || symbol.includes('XAU')) {
      factors.push('Real interest rates and opportunity cost');
      factors.push('Central bank gold reserves and buying patterns');
      factors.push('Inflation expectations and currency debasement fears');
    } else if (symbol.includes('SPX') || symbol.includes('NAS')) {
      factors.push('Corporate earnings growth trajectory');
      factors.push('Federal Reserve policy impact on valuations');
      factors.push('Economic growth vs recession probability');
    }
    
    return factors;
  }

  private generateTechnicalFactors(prediction: string, changePercent: number): string[] {
    const factors: string[] = [];
    
    if (prediction === 'Bullish') {
      factors.push('Breaking above key resistance levels');
      factors.push('Momentum indicators showing bullish divergence');
      factors.push('Volume profile confirming upward pressure');
    } else if (prediction === 'Bearish') {
      factors.push('Breaking below critical support zones');
      factors.push('Bearish momentum building across timeframes');
      factors.push('Declining volume suggesting lack of buying interest');
    } else {
      factors.push('Trading within established range boundaries');
      factors.push('Mixed signals from oscillators and trend indicators');
      factors.push('Consolidation pattern awaiting directional break');
    }
    
    return factors;
  }

  private generateRiskFactors(symbol: string, prediction: string): string[] {
    return [
      'Unexpected central bank policy changes',
      'Geopolitical events causing market volatility',
      'Major economic data releases contradicting current trends',
      'Black swan events disrupting market assumptions',
      'Liquidity conditions changing rapidly'
    ];
  }

  private generateCatalysts(symbol: string, prediction: string): string[] {
    const catalysts: string[] = [];
    
    if (symbol.includes('USD')) {
      catalysts.push('Non-farm payrolls and employment data');
      catalysts.push('Federal Reserve meeting and policy statements');
      catalysts.push('Inflation data (CPI/PCE) releases');
    } else if (symbol.includes('Gold') || symbol.includes('XAU')) {
      catalysts.push('FOMC interest rate decisions');
      catalysts.push('Geopolitical tension escalation');
      catalysts.push('Dollar index major directional moves');
    } else if (symbol.includes('SPX') || symbol.includes('NAS')) {
      catalysts.push('Quarterly earnings announcements');
      catalysts.push('Federal Reserve policy guidance');
      catalysts.push('Economic recession probability updates');
    }
    
    catalysts.push('Major economic event risk');
    catalysts.push('Technical level breaks (support/resistance)');
    
    return catalysts;
  }

  // Generate trading signals based on AI analysis
  async generateTradingSignal(
    prediction: AIMarketPrediction,
    ictAnalysis?: ICTAnalysisResult
  ): Promise<AITradingSignal> {
    const signal: 'Buy' | 'Sell' | 'Hold' = 
      prediction.prediction === 'Bullish' ? 'Buy' :
      prediction.prediction === 'Bearish' ? 'Sell' : 'Hold';
    
    const currentPrice = prediction.targetPrice / (prediction.prediction === 'Bullish' ? 1.08 : 
                                                   prediction.prediction === 'Bearish' ? 1.08 : 1);
    
    const stopLoss = signal === 'Buy' ? currentPrice * 0.98 : 
                     signal === 'Sell' ? currentPrice * 1.02 : currentPrice;
    
    const riskReward = signal !== 'Hold' ? 
      Math.abs((prediction.targetPrice - currentPrice) / (currentPrice - stopLoss)) : 0;

    return {
      symbol: prediction.symbol,
      signal,
      strength: prediction.confidence,
      entry: {
        price: ictAnalysis?.tradeSetup.entry.price || currentPrice,
        timing: ictAnalysis?.tradeSetup.timeConstraints.optimal || 'Market hours',
        method: ictAnalysis?.tradeSetup.setup || 'Market order'
      },
      targets: {
        shortTerm: currentPrice * (signal === 'Buy' ? 1.02 : 0.98),
        mediumTerm: currentPrice * (signal === 'Buy' ? 1.05 : 0.95),
        longTerm: prediction.targetPrice
      },
      stopLoss,
      riskReward,
      holding_period: prediction.timeframe,
      reasoning: prediction.reasoning.join('. '),
      ictAlignment: ictAnalysis ? prediction.prediction.toLowerCase() === ictAnalysis.overallBias.toLowerCase() : false,
      newsImpact: prediction.sentiment.score
    };
  }

  // Generate market summary
  async generateMarketSummary(
    quotes: MarketQuote[],
    news: NewsItem[],
    predictions: AIMarketPrediction[]
  ): Promise<AIMarketSummary> {
    const avgSentiment = news.reduce((sum, item) => sum + item.sentimentScore, 0) / news.length;
    const bullishPredictions = predictions.filter(p => p.prediction === 'Bullish').length;
    const bearishPredictions = predictions.filter(p => p.prediction === 'Bearish').length;
    
    const overallSentiment: 'Risk On' | 'Risk Off' | 'Mixed' = 
      avgSentiment > 0.3 ? 'Risk On' :
      avgSentiment < -0.3 ? 'Risk Off' : 'Mixed';
    
    const volatility = quotes.reduce((sum, q) => sum + Math.abs(q.changePercent), 0) / quotes.length;
    const marketRegime: 'Trending' | 'Ranging' | 'Volatile' | 'Calm' = 
      volatility > 2 ? 'Volatile' :
      volatility > 1 ? 'Trending' :
      volatility > 0.5 ? 'Ranging' : 'Calm';

    return {
      timestamp: new Date().toISOString(),
      overallSentiment,
      marketRegime,
      dominantTheme: this.identifyDominantTheme(news),
      keyDrivers: this.extractKeyDrivers(news),
      sectorsToWatch: ['Technology', 'Financial Services', 'Energy', 'Healthcare'],
      currencyOutlook: this.generateCurrencyOutlook(predictions.filter(p => p.symbol.includes('USD') || p.symbol.includes('EUR') || p.symbol.includes('GBP'))),
      commodityOutlook: this.generateCommodityOutlook(predictions.filter(p => p.symbol.includes('XAU') || p.symbol.includes('Oil'))),
      warnings: this.generateMarketWarnings(volatility, avgSentiment),
      opportunities: this.identifyOpportunities(predictions, overallSentiment)
    };
  }

  private identifyDominantTheme(news: NewsItem[]): string {
    const themes = news.map(n => n.category);
    const themeCount = themes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(themeCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Mixed Themes';
  }

  private extractKeyDrivers(news: NewsItem[]): string[] {
    return news
      .filter(n => n.impact === 'High')
      .slice(0, 3)
      .map(n => n.title.split(':')[0] || n.title.substring(0, 50));
  }

  private generateCurrencyOutlook(predictions: AIMarketPrediction[]): { currency: string; bias: string; reasoning: string }[] {
    return predictions.map(p => ({
      currency: p.symbol,
      bias: p.prediction,
      reasoning: p.reasoning[0] || 'Based on technical and fundamental analysis'
    }));
  }

  private generateCommodityOutlook(predictions: AIMarketPrediction[]): { commodity: string; bias: string; reasoning: string }[] {
    return predictions.map(p => ({
      commodity: p.symbol,
      bias: p.prediction,
      reasoning: p.reasoning[0] || 'Supply/demand dynamics and macro factors'
    }));
  }

  private generateMarketWarnings(volatility: number, sentiment: number): string[] {
    const warnings: string[] = [];
    
    if (volatility > 2) {
      warnings.push('High volatility environment - use appropriate position sizing');
    }
    
    if (Math.abs(sentiment) > 0.7) {
      warnings.push('Extreme sentiment readings - potential reversal risk');
    }
    
    warnings.push('Monitor central bank communications for policy shifts');
    warnings.push('Geopolitical events remain key risk factor');
    
    return warnings;
  }

  private identifyOpportunities(predictions: AIMarketPrediction[], sentiment: string): string[] {
    const opportunities: string[] = [];
    
    const highConfidencePredictions = predictions.filter(p => p.confidence > 75);
    if (highConfidencePredictions.length > 0) {
      opportunities.push(`High confidence setups available in: ${highConfidencePredictions.map(p => p.symbol).join(', ')}`);
    }
    
    if (sentiment === 'Mixed') {
      opportunities.push('Mixed sentiment creating selective opportunities');
    }
    
    opportunities.push('Monitor session transitions for optimal entry timing');
    opportunities.push('Consider correlation plays across asset classes');
    
    return opportunities;
  }

  // Clear prediction cache
  clearCache(): void {
    this.predictionCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.predictionCache.size,
      keys: Array.from(this.predictionCache.keys())
    };
  }
}

export const aiPredictionService = new AIPredictionService(); 