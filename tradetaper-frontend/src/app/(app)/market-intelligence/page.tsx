'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { 
  FaGlobeAmericas, 
  FaBrain, 
  FaChartLine, 
  FaNewspaper, 
  FaRobot,
  FaLightbulb,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaSync,
  FaEye,
  FaFire,
  FaThermometerHalf,
  FaGem,
  FaPlay,
  FaRocket,
  FaBullseye,
  FaShieldAlt,
  FaCalendarAlt,
  FaDollarSign,
  FaImage,
  FaUpload,
  FaTrophy,
  FaTrash,
  FaWater,
  FaCube,
  FaCrosshairs,
  FaChartBar
} from 'react-icons/fa';
import CompleteICTAnalysis from '@/components/market-intelligence/CompleteICTAnalysis';
import ICTConceptsDetail from '@/components/market-intelligence/ICTConceptsDetail';
import TradingViewChart from '@/components/market-intelligence/TradingViewChart';

interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

interface ICTTradeOpportunity {
  symbol: string;
  setup: string;
  direction: 'long' | 'short';
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: number;
  reasoning: string;
  timeframe: string;
  ictConcepts: string[];
  marketConditions: string[];
}

interface AIMarketPrediction {
  symbol: string;
  timeframe: string;
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    targetPrice: number;
    timeToTarget: number;
    probability: number;
  };
  technicalAnalysis: {
    trend: string;
    momentum: number;
    volatility: string;
  };
  fundamentalFactors: {
    economic: number;
    geopolitical: number;
    sentiment: number;
  };
  riskFactors: string[];
  rationale: string;
}

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: Date;
  time: string;
  importance: 'low' | 'medium' | 'high';
  actual?: number | string;
  forecast?: number | string;
  previous?: number | string;
  description: string;
  impact: {
    expected: 'bullish' | 'bearish' | 'neutral';
    explanation: string;
    affectedSymbols: string[];
    volatilityRating: number;
  };
}

interface MarketIntelligenceData {
  timestamp: Date;
  marketQuotes: MarketQuote[];
  marketNews: any[];
  marketSentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;
    confidence: number;
    factors: string[];
  };
  economicEvents: EconomicEvent[];
  ictOpportunities: ICTTradeOpportunity[];
  aiPredictions: AIMarketPrediction[];
  summary: {
    totalOpportunities: number;
    highImpactEvents: number;
    averageSentimentScore: number;
    topMovers: Array<{symbol: string, changePercent: number}>;
  };
}

export default function MarketIntelligencePage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [marketData, setMarketData] = useState<MarketIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [activeTab, setActiveTab] = useState('complete-ict');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Chart Analysis states
  const [uploadedCharts, setUploadedCharts] = useState<{timeframe: string; file: File; preview: string}[]>([]);
  const [analyzingCharts, setAnalyzingCharts] = useState(false);
  const [chartAnalysisResult, setChartAnalysisResult] = useState<any>(null);

  // Focus on XAUUSD (Gold) as the primary symbol for ICT analysis
  const primarySymbol = 'XAUUSD';
  const majorSymbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500', 'NASDAQ100'];

  useEffect(() => {
    fetchMarketIntelligence();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMarketIntelligence, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Helper function to fetch real AI predictions from backend
  const fetchRealAIPredictions = async (symbols: string[]) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    
    try {
      // NOTE: AI predictions endpoint not yet available - returning empty array
      // const response = await fetch(`${API_BASE_URL}/market-intelligence/ai-predictions?symbols=${primarySymbol}`)
      //   .then(res => res.ok ? res.json() : null)
      //   .catch(() => null);
      
      const response = null; // Temporarily disabled until backend endpoint is ready
      
      if (response && response.predictions) {
        return response.predictions.map((pred: any) => ({
          symbol: pred.symbol,
          timeframe: pred.timeframe || '1H',
          prediction: {
            direction: pred.prediction.direction,
            confidence: pred.prediction.confidence / 100, // Convert to 0-1
            targetPrice: pred.prediction.targetPrice,
            timeToTarget: pred.prediction.timeToTarget,
            probability: pred.prediction.probability / 100 // Convert to 0-1
          },
          technicalAnalysis: {
            trend: pred.technicalAnalysis.trend,
            momentum: pred.technicalAnalysis.momentum,
            volatility: pred.technicalAnalysis.volatility
          },
          fundamentalFactors: pred.fundamentalFactors || {
            economic: 0.5,
            geopolitical: 0.3,
            sentiment: 0.6
          },
          riskFactors: pred.riskFactors || [],
          rationale: pred.rationale || 'AI analysis complete'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching real AI predictions:', error);
      return [];
    }
  };

  // Helper function to fetch real ICT data from backend
  const fetchRealICTData = async (symbols: string[]) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    
    try {
      // Fetch ICT analysis ONLY for XAUUSD (Gold)
      const ictPromises = [primarySymbol].map(symbol => 
        fetch(`${API_BASE_URL}/ict/complete-analysis?symbol=${symbol}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );
      
      const ictResults = await Promise.all(ictPromises);
      
      // Transform real ICT data to match UI interface
      const ictOpportunities: ICTTradeOpportunity[] = [];
      
      ictResults.forEach((result, index) => {
        if (result && result.success && result.data) {
          const analysis = result.data;
          
          // Extract trading plan array (it's an array of strings)
          const planArray = Array.isArray(analysis.tradingPlan) ? analysis.tradingPlan : [];
          const analysisArray = Array.isArray(analysis.analysis) ? analysis.analysis : [];
          
          // Determine direction from overallBias
          const direction = analysis.overallBias === 'bullish' ? 'long' : 
                           analysis.overallBias === 'bearish' ? 'short' : 'long';
          
          // Extract entry zones if available
          const entryZones = Array.isArray(analysis.entryZones) ? analysis.entryZones : [];
          const firstEntry = entryZones.length > 0 ? entryZones[0] : null;
          
          ictOpportunities.push({
            symbol: primarySymbol,
            setup: analysis.primarySetup || 'ICT Analysis',
            direction: direction,
            confidence: analysis.ictScore || 50,
            entry: firstEntry?.price || analysis.currentPrice || 0,
            stopLoss: firstEntry?.range?.low || 0,
            takeProfit: Array.isArray(analysis.takeProfit) ? analysis.takeProfit : 
                        (firstEntry?.range?.high ? [firstEntry.range.high] : []),
            riskReward: analysis.riskReward || 2.5,
            reasoning: analysisArray.join(' ') || planArray.join(' ') || 'Complete ICT analysis available',
            timeframe: analysis.timeframe || '1H',
            ictConcepts: Array.isArray(analysis.ictConcepts) ? analysis.ictConcepts : 
                        ['Liquidity', 'Market Structure', 'Fair Value Gap', 'Order Block', 'Kill Zone'],
            marketConditions: Array.isArray(analysis.marketConditions) ? analysis.marketConditions : [
              analysis.killZone?.active ? `✅ ${analysis.killZone.name}` : '⏸️ Outside Kill Zone',
              `Bias: ${analysis.overallBias}`,
              `Score: ${analysis.ictScore}/100`
            ]
          });
        }
      });
      
      // If no live data available (markets closed), provide demo ICT opportunity for XAUUSD
      if (ictOpportunities.length === 0) {
        console.log('📊 Markets closed - providing demo ICT opportunity for XAUUSD');
        return [
          {
            symbol: 'XAUUSD',
            setup: 'Bullish Order Block + FVG Confluence',
            direction: 'long' as const,
            confidence: 85,
            entry: 2655.50,
            stopLoss: 2648.00,
            takeProfit: [2668.00, 2675.00, 2685.00],
            riskReward: 3.7,
            reasoning: 'Strong Bullish Order Block formed at 2655.50 with unmitigated Fair Value Gap. Price swept sell-side liquidity below 2650 and reversed sharply. Currently in discount zone (below 50% Fib). London Kill Zone optimal for entry. Power of Three showing Accumulation phase completion.',
            timeframe: '1H',
            ictConcepts: ['Order Block', 'Fair Value Gap', 'Liquidity Sweep', 'Discount Array', 'London Kill Zone'],
            marketConditions: [
              '⏸️ Markets Closed (Demo Mode - Will Update with Live Data)',
              '💰 Discount Zone (Strong Buy Bias)',
              '🎯 Power of Three: Accumulation → Manipulation'
            ]
          }
        ];
      }
      
      return ictOpportunities;
    } catch (error) {
      console.error('Error fetching real ICT data:', error);
      return [];
    }
  };

  const fetchMarketIntelligence = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      // Get real live data from multiple endpoints
      try {
        const [statusResponse, quotesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/market-intelligence/public/status`),
          fetch(`${API_BASE_URL}/market-intelligence/public/quotes?symbols=EURUSD,XAUUSD,SPY,GBPUSD,USDJPY,GBPJPY`)
        ]);
        
        if (statusResponse.ok && quotesResponse.ok) {
          const statusData = await statusResponse.json();
          const quotesData = await quotesResponse.json();
          
          console.log('✅ Live Market Intelligence Status:', statusData);
          console.log('✅ Live Market Quotes:', quotesData);
          
          // Ensure quotes array exists
          const quotes = Array.isArray(quotesData?.quotes) ? quotesData.quotes : [];
          
          // Build real data structure from live APIs matching MarketIntelligenceData interface
          const realMarketData: MarketIntelligenceData = {
            timestamp: new Date(),
            marketQuotes: quotes.map((q: any) => ({
              symbol: q.symbol,
              bid: q.bid,
              ask: q.ask,
              change: q.change,
              changePercent: q.changePercent,
              high: q.high || q.ask * 1.01,
              low: q.low || q.bid * 0.99,
              volume: q.volume || 0,
              timestamp: new Date()
            })),
            marketNews: [{
              id: 'live-system-1',
              title: '🔴 LIVE: Real Market Data Active',
              summary: `Live data streaming from ${statusData.dataSources.priceData.join(', ')}. System status: ${statusData.status}`,
              source: 'TradeTaper Live System',
              publishedAt: statusData.timestamp,
              sentiment: 'bullish' as const,
              impact: 'high' as const
            }],
            marketSentiment: {
              overall: quotes.length > 0 && quotes.some((q: any) => q.changePercent > 0) ? 'bullish' as const : 'bearish' as const,
              score: quotes.length > 0 ? Math.abs(quotes.reduce((sum: number, q: any) => sum + q.changePercent, 0)) / quotes.length : 0,
              confidence: 0.8,
              factors: ['Live market data', 'Real-time analysis']
            },
            economicEvents: [{
              id: 'live-calendar-1',
              title: 'Live Market Session Active',
              country: 'US',
              currency: 'USD',
              date: new Date(),
              time: new Date().toTimeString().slice(0, 5),
              importance: 'high' as const,
              description: 'Real-time market data session',
              impact: {
                expected: 'neutral' as const,
                explanation: 'Live data flowing',
                affectedSymbols: quotes.map((q: any) => q.symbol),
                volatilityRating: 0.5
              }
            }],
            // Fetch real ICT data from backend
            ictOpportunities: await fetchRealICTData(quotes.map((q: any) => q.symbol).slice(0, 3)),
            // Fetch real AI predictions from backend
            aiPredictions: await fetchRealAIPredictions(quotes.map((q: any) => q.symbol)),
            summary: {
              totalOpportunities: quotes.length,
              highImpactEvents: 1,
              averageSentimentScore: quotes.length > 0 ? Math.abs(quotes.reduce((sum: number, q: any) => sum + q.changePercent, 0)) / quotes.length : 0,
              topMovers: quotes
                .sort((a: any, b: any) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
                .slice(0, 3)
                .map((q: any) => ({
                  symbol: q.symbol,
                  changePercent: q.changePercent
                }))
            }
          };
          
          setMarketData(realMarketData);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch live market data:', error);
      }
      
      // If live data fails, try authenticated endpoint
      const authResponse = await fetch(`${API_BASE_URL}/market-intelligence`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (authResponse.ok) {
        const data = await authResponse.json();
        setMarketData(data);
      } else {
        console.error('❌ Failed to fetch any market intelligence data - no fallback available');
        setMarketData(null);
      }
    } catch (error) {
      console.error('Error fetching market intelligence:', error);
      setMarketData(generateMockMarketData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockMarketData = (): MarketIntelligenceData => {
    const mockQuotes: MarketQuote[] = majorSymbols.map(symbol => ({
      symbol,
      bid: getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.02),
      ask: getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.02) + 0.0001,
      change: (Math.random() - 0.5) * 50,
      changePercent: (Math.random() - 0.5) * 4,
      high: getBasePriceForSymbol(symbol) * 1.01,
      low: getBasePriceForSymbol(symbol) * 0.99,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      timestamp: new Date(),
    }));

    const mockICTOpportunities: ICTTradeOpportunity[] = [
      {
        symbol: 'XAUUSD',
        setup: 'Liquidity Sweep and Reversal',
        direction: 'long',
        confidence: 85,
        entry: 2028.50,
        stopLoss: 2025.00,
        takeProfit: [2035.00, 2040.00, 2045.00],
        riskReward: 3.2,
        reasoning: 'Sell-side liquidity sweep below previous low followed by strong bullish displacement. Price showing signs of institutional accumulation.',
        timeframe: '15M/1H',
        ictConcepts: ['Liquidity Sweep', 'Market Structure Shift', 'Order Block', 'Fair Value Gap'],
        marketConditions: ['Clear break of structure to upside', 'Liquidity grabbed below lows', 'Strong displacement candle'],
      },
      {
        symbol: 'EURUSD',
        setup: 'Order Block Rejection',
        direction: 'short',
        confidence: 78,
        entry: 1.0865,
        stopLoss: 1.0885,
        takeProfit: [1.0835, 1.0815],
        riskReward: 2.5,
        reasoning: 'Price approaching bearish order block with signs of institutional distribution. Looking for rejection at premium pricing.',
        timeframe: '1H/4H',
        ictConcepts: ['Order Block', 'Premium/Discount Pricing', 'Smart Money Distribution'],
        marketConditions: ['Price at premium levels', 'Approaching key order block', 'Bearish divergence'],
      },
    ];

    const mockPredictions: AIMarketPrediction[] = majorSymbols.map(symbol => ({
      symbol,
      timeframe: '1D',
      prediction: {
        direction: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)] as any,
        confidence: 60 + Math.random() * 30,
        targetPrice: getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.03),
        timeToTarget: 24 + Math.random() * 48,
        probability: 70 + Math.random() * 20,
      },
      technicalAnalysis: {
        trend: ['strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish'][Math.floor(Math.random() * 5)],
        momentum: (Math.random() - 0.5) * 100,
        volatility: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      },
      fundamentalFactors: {
        economic: (Math.random() - 0.5) * 40,
        geopolitical: (Math.random() - 0.5) * 30,
        sentiment: (Math.random() - 0.5) * 50,
      },
      riskFactors: ['Central bank policy changes', 'Economic data surprises', 'Geopolitical tensions'],
      rationale: `AI analysis indicates ${symbol} showing technical strength with fundamental support.`,
    }));

    return {
      timestamp: new Date(),
      marketQuotes: mockQuotes,
      marketNews: [],
      marketSentiment: {
        overall: 'neutral',
        score: 0.1,
        confidence: 75,
        factors: ['Mixed economic signals', 'Moderate volatility'],
      },
      economicEvents: [],
      ictOpportunities: mockICTOpportunities,
      aiPredictions: mockPredictions,
      summary: {
        totalOpportunities: mockICTOpportunities.length,
        highImpactEvents: 2,
        averageSentimentScore: 0.1,
        topMovers: mockQuotes
          .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
          .slice(0, 3)
          .map(q => ({ symbol: q.symbol, changePercent: q.changePercent })),
      },
    };
  };

  const getBasePriceForSymbol = (symbol: string): number => {
    const basePrices: Record<string, number> = {
      'XAUUSD': 2660.50, // Updated to realistic 2025 Gold price
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 149.50,
      'SPX500': 4750.00,
      'NASDAQ100': 16250.00,
    };
    return basePrices[symbol] || 1.0000;
  };

  const formatPrice = (price: number, symbol: string): string => {
    if (symbol.includes('JPY')) {
      return price.toFixed(3);
    } else if (['SPX500', 'NASDAQ100'].includes(symbol)) {
      return price.toFixed(2);
    } else if (symbol === 'XAUUSD') {
      return price.toFixed(2);
    }
    return price.toFixed(5);
  };

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-emerald-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  // Chart Analysis Functions
  const handleChartUpload = (e: React.ChangeEvent<HTMLInputElement>, timeframe: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setUploadedCharts(prev => [
        ...prev,
        {
          timeframe,
          file,
          preview: reader.result as string
        }
      ]);
    };
    
    reader.readAsDataURL(file);
  };

  const removeChart = (index: number) => {
    setUploadedCharts(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeCharts = async () => {
    if (uploadedCharts.length === 0) {
      alert('Please upload at least one chart image');
      return;
    }

    setAnalyzingCharts(true);
    setChartAnalysisResult(null);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const formData = new FormData();

      // Add all chart images with their timeframes
      uploadedCharts.forEach((chart, index) => {
        formData.append('charts', chart.file);
        formData.append('timeframes', chart.timeframe);
      });

      formData.append('symbol', selectedSymbol);

      const response = await fetch(`${API_BASE_URL}/ict/analyze-chart-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze charts');
      }

      const result = await response.json();
      setChartAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing charts:', error);
      alert('Failed to analyze charts. Please try again.');
    } finally {
      setAnalyzingCharts(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <FaSync className="animate-spin text-4xl text-emerald-600 mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading Market Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-600 mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load market data</p>
          <button
            onClick={fetchMarketIntelligence}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black p-2 sm:p-4 lg:p-6 overflow-auto">
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <FaBrain className="inline-block mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                AI Market Intelligence
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Professional-grade market analysis powered by ICT strategies and AI predictions
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Last updated: {marketData?.timestamp ? new Date(marketData.timestamp).toLocaleTimeString() : 'Unknown'}
              </div>
              <button
                onClick={fetchMarketIntelligence}
                className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center text-sm sm:text-base"
              >
                <FaSync className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6 overflow-x-auto">
          <nav className="flex space-x-2 sm:space-x-4 min-w-max pb-2">
            {[
              { id: 'complete-ict', label: 'Complete ICT', icon: FaTrophy },
              { id: 'live-chart', label: 'Live Chart', icon: FaChartLine },
              { id: 'liquidity', label: 'Liquidity', icon: FaWater },
              { id: 'market-structure', label: 'Structure', icon: FaChartBar },
              { id: 'fvg', label: 'FVG', icon: FaCrosshairs },
              { id: 'order-blocks', label: 'Order Blocks', icon: FaCube },
              { id: 'ict-analysis', label: 'ICT Analysis', icon: FaBullseye },
              { id: 'chart-analysis', label: 'Chart Analysis', icon: FaImage },
              { id: 'ai-predictions', label: 'AI Predictions', icon: FaRobot },
              { id: 'economic-calendar', label: 'Economic Calendar', icon: FaCalendarAlt },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="mr-1 sm:mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Complete ICT Analysis Tab */}
        {activeTab === 'complete-ict' && (
          <CompleteICTAnalysis symbol={selectedSymbol} />
        )}

        {/* Live TradingView Chart Tab */}
        {activeTab === 'live-chart' && (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  <FaChartLine className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
                  Live {selectedSymbol} Chart - 4H Timeframe
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Professional TradingView chart with ICT analysis tools enabled
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Symbol:</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {majorSymbols.map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TradingView Chart */}
            <div className="flex-1 w-full overflow-hidden rounded-lg border-2 border-gray-700 min-h-[600px]">
              <TradingViewChart 
                symbol={selectedSymbol}
                interval="240"
                theme="dark"
                height={0}
              />
            </div>

            {/* ICT Concepts Reference */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-700">
                <h5 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">Premium Zone</h5>
                <p className="text-xs text-red-800 dark:text-red-300">Above 50% Fib - Look for shorts</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <h5 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Discount Zone</h5>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">Below 50% Fib - Look for longs</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <h5 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Order Blocks</h5>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">Last bullish/bearish candle before move</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <h5 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Fair Value Gaps</h5>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">Price imbalances to be filled</p>
              </div>
            </div>
          </div>
        )}

        {/* Liquidity Detail Tab */}
        {activeTab === 'liquidity' && (
          <ICTConceptsDetail symbol={selectedSymbol} concept="liquidity" />
        )}

        {/* Market Structure Detail Tab */}
        {activeTab === 'market-structure' && (
          <ICTConceptsDetail symbol={selectedSymbol} concept="market-structure" />
        )}

        {/* Fair Value Gaps Detail Tab */}
        {activeTab === 'fvg' && (
          <ICTConceptsDetail symbol={selectedSymbol} concept="fvg" />
        )}

        {/* Order Blocks Detail Tab */}
        {activeTab === 'order-blocks' && (
          <ICTConceptsDetail symbol={selectedSymbol} concept="order-blocks" />
        )}

        {/* ICT Analysis Tab */}
        {activeTab === 'ict-analysis' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <FaBullseye className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
                ICT Trade Opportunities
              </h3>
              {marketData.ictOpportunities.length === 0 ? (
                <div className="text-center py-8">
                  <FaInfoCircle className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No ICT Opportunities Available</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    ICT analysis requires live market data. Please check back when market data is available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {marketData.ictOpportunities?.map((opportunity, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-gray-900 dark:text-white mr-3">
                          {opportunity.symbol}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          opportunity.direction === 'long' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {opportunity.direction.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getConfidenceColor(opportunity.confidence)}`}>
                          {opportunity.confidence}% Confidence
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          R:R {opportunity.riskReward}:1
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Setup</p>
                        <p className="text-gray-900 dark:text-white">{opportunity.setup}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entry</p>
                        <p className="text-gray-900 dark:text-white">{formatPrice(opportunity.entry, opportunity.symbol)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stop Loss</p>
                        <p className="text-red-600">{formatPrice(opportunity.stopLoss, opportunity.symbol)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Take Profit Targets</p>
                      <div className="flex space-x-4">
                        {opportunity.takeProfit?.map((tp, tpIndex) => (
                          <span key={tpIndex} className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 rounded text-sm">
                            TP{tpIndex + 1}: {formatPrice(tp, opportunity.symbol)}
                          </span>
                        )) || <span className="text-gray-500">No targets available</span>}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">ICT Concepts</p>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.ictConcepts?.map((concept, conceptIndex) => (
                          <span key={conceptIndex} className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 rounded text-sm">
                            {concept}
                          </span>
                        )) || <span className="text-gray-500">No concepts identified</span>}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Reasoning</p>
                      <p className="text-gray-700 dark:text-gray-300">{opportunity.reasoning}</p>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart Analysis Tab */}
        {activeTab === 'chart-analysis' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <FaImage className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
                ICT Chart Image Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload multiple chart images (different timeframes) to get a complete ICT analysis using AI-powered vision.
                Supports: 1m, 5m, 15m, 1h, 4h, 1d, 1w timeframes.
              </p>

              {/* Symbol Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {majorSymbols.map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
              </div>

              {/* Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {['1m', '5m', '15m', '1h', '4h', '1d', '1w'].map((timeframe) => {
                  const existingChart = uploadedCharts.find(c => c.timeframe === timeframe);
                  
                  return (
                    <div key={timeframe} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center relative">
                      <label className="cursor-pointer block">
                        {!existingChart ? (
                          <>
                            <FaUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{timeframe} Chart</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to upload</p>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleChartUpload(e, timeframe)}
                            />
                          </>
                        ) : (
                          <div className="relative">
                            <img src={existingChart.preview} alt={`${timeframe} chart`} className="w-full h-32 object-cover rounded" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">{timeframe}</p>
                            <button
                              onClick={() => removeChart(uploadedCharts.indexOf(existingChart))}
                              className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center">
                <button
                  onClick={analyzeCharts}
                  disabled={uploadedCharts.length === 0 || analyzingCharts}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
                >
                  {analyzingCharts ? (
                    <>
                      <FaSync className="animate-spin mr-2" />
                      Analyzing Charts...
                    </>
                  ) : (
                    <>
                      <FaBrain className="mr-2" />
                      Analyze Charts ({uploadedCharts.length})
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Results */}
              {chartAnalysisResult && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    <FaLightbulb className="inline-block mr-2 text-yellow-500" />
                    ICT Analysis Results
                  </h4>

                  {/* Complete Narrative */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-6 mb-6">
                    <h5 className="font-bold text-gray-900 dark:text-white mb-3">Complete ICT Narrative</h5>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {chartAnalysisResult.completeNarrative}
                    </p>
                  </div>

                  {/* Per-Timeframe Analysis */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-gray-900 dark:text-white">Timeframe Analysis</h5>
                    {chartAnalysisResult.timeframeAnalyses?.map((tf: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h6 className="font-bold text-gray-900 dark:text-white">{tf.timeframe}</h6>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            tf.bias === 'BULLISH' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {tf.bias}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{tf.narrative}</p>
                        
                        {/* ICT Concepts Found */}
                        <div className="flex flex-wrap gap-2">
                          {tf.conceptsIdentified?.map((concept: string, ci: number) => (
                            <span key={ci} className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 rounded text-xs">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trading Recommendation */}
                  {chartAnalysisResult.tradingRecommendation && (
                    <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-6">
                      <h5 className="font-bold text-gray-900 dark:text-white mb-3">
                        <FaRocket className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
                        Trading Recommendation
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Setup</p>
                          <p className="font-medium text-gray-900 dark:text-white">{chartAnalysisResult.tradingRecommendation.setup}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Direction</p>
                          <p className="font-medium text-gray-900 dark:text-white">{chartAnalysisResult.tradingRecommendation.direction}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Entry Zone</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {chartAnalysisResult.tradingRecommendation.entryZone?.min} - {chartAnalysisResult.tradingRecommendation.entryZone?.max}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Risk/Reward</p>
                          <p className="font-medium text-emerald-600 dark:text-emerald-400">{chartAnalysisResult.tradingRecommendation.riskReward}R</p>
                        </div>
                      </div>
                      <p className="mt-4 text-gray-700 dark:text-gray-300">
                        {chartAnalysisResult.tradingRecommendation.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Predictions Tab */}
        {activeTab === 'ai-predictions' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <FaRobot className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
                AI Market Predictions
              </h3>
              {marketData.aiPredictions.length === 0 ? (
                <div className="text-center py-8">
                  <FaRobot className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI Predictions Available</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    AI predictions require live market data and analysis. Please check back when market data is available.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketData.aiPredictions?.map((prediction, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {prediction.symbol}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        prediction.prediction.direction === 'bullish' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : prediction.prediction.direction === 'bearish'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {prediction.prediction.direction.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                        <span className={`font-medium ${getConfidenceColor(prediction.prediction.confidence)}`}>
                          {prediction.prediction.confidence.toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Target Price</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatPrice(prediction.prediction.targetPrice, prediction.symbol)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Time to Target</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {prediction.prediction.timeToTarget.toFixed(0)}h
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Momentum</span>
                        <span className={`font-medium ${
                          prediction.technicalAnalysis.momentum > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {prediction.technicalAnalysis.momentum.toFixed(0)}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {prediction.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Quotes Tab */}
        {/* Economic Calendar Tab */}
        {activeTab === 'economic-calendar' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <FaCalendarAlt className="inline-block mr-2 text-orange-600" />
                Upcoming Economic Events
              </h3>
              <div className="text-center py-8">
                <FaCalendarAlt className="text-4xl text-gray-400 mb-4 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400">
                  Economic calendar integration coming soon. This will show high-impact events, 
                  their expected market impact, and trading recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 