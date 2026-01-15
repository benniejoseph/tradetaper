import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketIntelligenceService } from './market-intelligence.service';
import { NewsAnalysisService } from './news-analysis.service';
import { ICTAnalysisService } from './ict-analysis.service';
import { EconomicCalendarService } from './economic-calendar.service';
import { AIMarketPredictionService } from './ai-market-prediction.service';
import { MarketSentimentService } from './market-sentiment.service'; // Added

@Controller('market-intelligence')
export class MarketIntelligenceController {
  private readonly logger = new Logger(MarketIntelligenceController.name);

  constructor(
    private readonly marketIntelligenceService: MarketIntelligenceService,
    private readonly newsAnalysisService: NewsAnalysisService,
    private readonly ictAnalysisService: ICTAnalysisService,
    private readonly economicCalendarService: EconomicCalendarService,
    private readonly aiPredictionService: AIMarketPredictionService,
    private readonly marketSentimentService: MarketSentimentService, // Added
  ) {}

  // Public endpoint for testing live data integration
  @Get('public/status')
  async getPublicStatus() {
    this.logger.log('Getting public market intelligence status');
    return {
      status: 'active',
      message: 'Live Market Intelligence System Online',
      timestamp: new Date().toISOString(),
      features: [
        'Real-time market quotes',
        'Live economic calendar',
        'AI-powered news sentiment',
        'ICT analysis',
        'Market sentiment indicators',
      ],
      dataSources: {
        priceData: ['Alpha Vantage', 'Tradermade', 'FMP', 'Polygon'],
        news: ['NewsAPI', 'Alpha Vantage News', 'FMP News'],
        economic: ['Trading Economics', 'Economic Calendar API'],
        sentiment: ['CNN Fear & Greed', 'VIX Analysis', 'News Sentiment'],
      },
    };
  }

  // Public endpoint for live quotes without auth
  @Get('public/quotes')
  async getPublicLiveQuotes(@Query('symbols') symbols?: string) {
    this.logger.log('Getting public live quotes');
    const symbolArray = symbols
      ? symbols.split(',')
      : ['EURUSD', 'XAUUSD', 'SPY'];

    try {
      const quotes =
        await this.marketIntelligenceService.getLiveQuotes(symbolArray);
      return {
        quotes,
        timestamp: new Date().toISOString(),
        symbols: symbolArray,
        source: 'live_apis',
      };
    } catch (error) {
      this.logger.error('Failed to get public live quotes', error);
      return {
        quotes: [],
        timestamp: new Date().toISOString(),
        symbols: symbolArray,
        source: 'fallback',
        error: 'Live data temporarily unavailable',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMarketIntelligenceDashboard() {
    this.logger.log('Getting comprehensive market intelligence dashboard');
    try {
      return await this.marketIntelligenceService.getComprehensiveMarketIntelligence();
    } catch (error) {
      this.logger.error('Failed to get market intelligence dashboard', error);
      throw new HttpException(
        'Failed to fetch market intelligence data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('news')
  async getMarketNews(
    @Query('category') category?: string,
  ) {
    this.logger.log(`Getting market news (Category: ${category || 'All'})`);
    try {
      // Use new category filter in service
      const newsResult = await this.newsAnalysisService.getMarketNews(category);
      return newsResult;
    } catch (error) {
      this.logger.error('Failed to get market news', error);
      throw new HttpException(
        'Failed to fetch market news',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('ai-analysis')
  async getAISentimentAnalysis() {
    this.logger.log('Getting AI Sentiment Report');
    try {
      return await this.marketSentimentService.generateSentimentReport();
    } catch (error) {
      this.logger.error('Failed to get AI analysis', error);
       throw new HttpException(
        'Failed to fetch AI analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('ict-analysis/:symbol')
  async getICTAnalysis(@Param('symbol') symbol: string) {
    this.logger.log(`Getting ICT analysis for symbol: ${symbol}`);
    try {
      return await this.ictAnalysisService.getComprehensiveICTAnalysis(symbol);
    } catch (error) {
      this.logger.error(`Failed to get ICT analysis for ${symbol}`, error);
      throw new HttpException(
        'Failed to fetch ICT analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('ict-opportunities')
  async getICTTradeOpportunities(@Query('symbols') symbols?: string) {
    this.logger.log('Getting ICT trade opportunities');
    try {
      const symbolArray = symbols
        ? symbols.split(',')
        : ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500', 'NASDAQ100'];
      return await this.ictAnalysisService.getTradeOpportunities(symbolArray);
    } catch (error) {
      this.logger.error('Failed to get ICT trade opportunities', error);
      throw new HttpException(
        'Failed to fetch ICT trade opportunities',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('economic-calendar')
  async getEconomicCalendar(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('importance') importance?: string,
  ) {
    this.logger.log('Getting economic calendar');
    try {
      return await this.economicCalendarService.getEconomicCalendar(
        from,
        to,
        importance,
      );
    } catch (error) {
      this.logger.error('Failed to get economic calendar', error);
      throw new HttpException(
        'Failed to fetch economic calendar',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('economic-impact/:eventId')
  async getEconomicImpactAnalysis(@Param('eventId') eventId: string) {
    this.logger.log(`Getting economic impact analysis for event: ${eventId}`);
    try {
      return await this.economicCalendarService.getEconomicImpactAnalysis(
        eventId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get economic impact analysis for ${eventId}`,
        error,
      );
      throw new HttpException(
        'Failed to fetch economic impact analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('predictions/:symbol')
  async getAIPredictions(@Param('symbol') symbol: string) {
    this.logger.log(`Getting AI predictions for symbol: ${symbol}`);
    try {
      return await this.aiPredictionService.generateMarketPrediction(symbol);
    } catch (error) {
      this.logger.error(`Failed to get AI predictions for ${symbol}`, error);
      throw new HttpException(
        'Failed to fetch AI predictions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('market-sentiment')
  async getMarketSentiment(@Query('symbols') symbols?: string) {
    this.logger.log('Getting overall market sentiment');
    try {
      const symbolArray = symbols
        ? symbols.split(',')
        : ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500', 'NASDAQ100'];
      return await this.marketIntelligenceService.getMarketSentiment(
        symbolArray,
      );
    } catch (error) {
      this.logger.error('Failed to get market sentiment', error);
      throw new HttpException(
        'Failed to fetch market sentiment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('live-quotes')
  async getLiveQuotes(@Query('symbols') symbols: string) {
    this.logger.log(`Getting live quotes for symbols: ${symbols}`);
    try {
      const symbolArray = symbols.split(',');
      return await this.marketIntelligenceService.getLiveQuotes(symbolArray);
    } catch (error) {
      this.logger.error('Failed to get live quotes', error);
      throw new HttpException(
        'Failed to fetch live quotes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('market-structure/:symbol')
  async getMarketStructure(@Param('symbol') symbol: string) {
    this.logger.log(`Getting market structure analysis for symbol: ${symbol}`);
    try {
      return await this.ictAnalysisService.getMarketStructureAnalysis(symbol);
    } catch (error) {
      this.logger.error(`Failed to get market structure for ${symbol}`, error);
      throw new HttpException(
        'Failed to fetch market structure analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
