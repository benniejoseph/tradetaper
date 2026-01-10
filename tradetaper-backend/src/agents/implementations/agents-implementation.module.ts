import { Module } from '@nestjs/common';
import { NotesModule } from '../../notes/notes.module';
import { MarketIntelligenceModule } from '../../market-intelligence/market-intelligence.module';
import { PredictiveTradesModule } from '../../predictive-trades/predictive-trades.module';
import { PsychologyAgent } from './psychology.agent';
import { MarketAnalystAgent } from './market-analyst.agent';
import { RiskManagerAgent } from './risk-manager.agent';
import { JournalAgent } from './journal.agent';
import { TradeAssistantAgent } from './trade-assistant.agent';
import { NewsSentimentAgent } from './news-sentiment.agent';
import { ICTBacktestAgent } from './ict-backtest.agent';

/**
 * Agents Implementation Module
 * 
 * Registers all AI agent implementations with the orchestrator.
 * Each agent auto-registers itself via the BaseAgent.onModuleInit.
 * 
 * Available Agents:
 * - PsychologyAgent: Trading psychology analysis
 * - MarketAnalystAgent: Market predictions & analysis
 * - RiskManagerAgent: Position sizing & risk assessment
 * - JournalAgent: Speech-to-text & text enhancement
 * - TradeAssistantAgent: Trade outcome predictions
 * - NewsSentimentAgent: News & sentiment analysis
 * - ICTBacktestAgent: ICT strategy backtesting & optimization
 */
@Module({
  imports: [
    NotesModule, // For PsychologyAgent, JournalAgent
    MarketIntelligenceModule, // For MarketAnalystAgent, ICTBacktestAgent
    PredictiveTradesModule, // For TradeAssistantAgent
  ],
  providers: [
    PsychologyAgent,
    MarketAnalystAgent,
    RiskManagerAgent,
    JournalAgent,
    TradeAssistantAgent,
    NewsSentimentAgent,
    ICTBacktestAgent,
  ],
  exports: [
    PsychologyAgent,
    MarketAnalystAgent,
    RiskManagerAgent,
    JournalAgent,
    TradeAssistantAgent,
    NewsSentimentAgent,
    ICTBacktestAgent,
  ],
})
export class AgentsImplementationModule {}

