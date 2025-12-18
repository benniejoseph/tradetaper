import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentOrchestratorService } from './agent-orchestrator.service';

/**
 * Agents Controller
 * 
 * Exposes multi-agent system endpoints:
 * - Risk calculations
 * - Trade assessments
 * - Portfolio analysis
 * - Agent status/stats
 */
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);
  
  constructor(private readonly orchestrator: AgentOrchestratorService) {}
  
  /**
   * Calculate position size based on risk parameters
   */
  @Post('risk/position-size')
  async calculatePositionSize(
    @Req() req: any,
    @Body() body: {
      accountBalance: number;
      riskPercent?: number;
      entryPrice: number;
      stopLoss: number;
      symbol?: string;
    },
  ) {
    const context = this.orchestrator.createContext(req.user.id);
    
    const response = await this.orchestrator.routeToCapability(
      'risk-calculation',
      {
        action: 'calculate-position',
        ...body,
      },
      context,
    );
    
    return response;
  }
  
  /**
   * Assess trade risk/reward
   */
  @Post('risk/assess-trade')
  async assessTradeRisk(
    @Req() req: any,
    @Body() body: {
      symbol?: string;
      direction?: 'buy' | 'sell';
      entryPrice: number;
      stopLoss: number;
      takeProfit?: number;
      accountBalance?: number;
    },
  ) {
    const context = this.orchestrator.createContext(req.user.id);
    
    const response = await this.orchestrator.routeToCapability(
      'trade-assessment',
      {
        action: 'assess-trade',
        ...body,
      },
      context,
    );
    
    return response;
  }
  
  /**
   * Analyze portfolio risk
   */
  @Post('risk/portfolio')
  async analyzePortfolioRisk(
    @Req() req: any,
    @Body() body: {
      openTrades: Array<{
        symbol: string;
        direction: 'buy' | 'sell';
        size: number;
        entryPrice: number;
        currentPrice: number;
        stopLoss?: number;
      }>;
      accountBalance: number;
    },
  ) {
    const context = this.orchestrator.createContext(req.user.id);
    
    const response = await this.orchestrator.routeToCapability(
      'portfolio-risk',
      {
        action: 'portfolio-analysis',
        ...body,
      },
      context,
    );
    
    return response;
  }
  
  /**
   * Get risk management rules
   */
  @Get('risk/rules')
  async getRiskRules(@Req() req: any) {
    const context = this.orchestrator.createContext(req.user.id);
    
    const response = await this.orchestrator.routeToCapability(
      'risk-calculation',
      { action: 'get-risk-rules' },
      context,
    );
    
    return response;
  }
  
  /**
   * Get market prediction for a symbol
   */
  @Post('market/predict')
  async getMarketPrediction(
    @Req() req: any,
    @Body() body: { symbol: string },
  ) {
    const context = this.orchestrator.createContext(req.user.id);
    
    const response = await this.orchestrator.routeToCapability(
      'market-prediction',
      {
        action: 'predict',
        symbol: body.symbol,
      },
      context,
    );
    
    return response;
  }
  
  /**
   * Analyze trading psychology from text
   */
  @Post('psychology/analyze')
  async analyzePsychology(
    @Req() req: any,
    @Body() body: { text: string; tradeId?: string },
  ) {
    const context = this.orchestrator.createContext(req.user.id);
    
    const response = await this.orchestrator.routeToCapability(
      'psychology-analysis',
      {
        text: body.text,
        tradeId: body.tradeId,
      },
      context,
    );
    
    return response;
  }
  
  /**
   * Execute multi-agent workflow: analyze trade then assess risk
   */
  @Post('workflow/full-analysis')
  async fullTradeAnalysis(
    @Req() req: any,
    @Body() body: {
      symbol: string;
      entryPrice: number;
      stopLoss: number;
      takeProfit?: number;
      notes?: string;
    },
  ) {
    const context = this.orchestrator.createContext(req.user.id);
    
    // Execute multi-agent workflow
    const response = await this.orchestrator.executeWorkflow(
      [
        { capability: 'market-prediction' },
        { capability: 'trade-assessment' },
        { capability: 'psychology-analysis' },
      ],
      {
        symbol: body.symbol,
        entryPrice: body.entryPrice,
        stopLoss: body.stopLoss,
        takeProfit: body.takeProfit,
        text: body.notes,
      },
      context,
    );
    
    return response;
  }
  
  /**
   * Get agent orchestrator stats
   */
  @Get('stats')
  async getStats() {
    return this.orchestrator.getStats();
  }
}
