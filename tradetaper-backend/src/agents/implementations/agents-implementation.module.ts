import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { ICTMentorAgent } from './ict-mentor.agent';
import { TraderPsychCoachAgent } from './trader-psych-coach.agent';
import { KnowledgeBaseModule } from '../../knowledge-base/knowledge-base.module';
import { Trade } from '../../trades/entities/trade.entity';
import { MT5Account } from '../../users/entities/mt5-account.entity';
import { Account } from '../../users/entities/account.entity';

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
 * - ICTMentorAgent: ICT mentorship with Knowledge Base RAG & Vision
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, MT5Account, Account]),
    NotesModule, // For PsychologyAgent, JournalAgent
    MarketIntelligenceModule, // For MarketAnalystAgent, ICTBacktestAgent
    PredictiveTradesModule, // For TradeAssistantAgent
    KnowledgeBaseModule, // For ICTMentorAgent
  ],
  providers: [
    PsychologyAgent,
    MarketAnalystAgent,
    RiskManagerAgent,
    JournalAgent,
    TradeAssistantAgent,
    NewsSentimentAgent,
    ICTBacktestAgent,
    ICTMentorAgent,
    TraderPsychCoachAgent,
  ],
  exports: [
    PsychologyAgent,
    MarketAnalystAgent,
    RiskManagerAgent,
    JournalAgent,
    TradeAssistantAgent,
    NewsSentimentAgent,
    ICTBacktestAgent,
    ICTMentorAgent,
    TraderPsychCoachAgent,
  ],
})
export class AgentsImplementationModule {}
