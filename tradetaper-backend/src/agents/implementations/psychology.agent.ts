import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { GeminiPsychologyService } from '../../notes/gemini-psychology.service';

/**
 * Psychology Agent
 * 
 * Analyzes trader behavior and provides psychological insights.
 * Wraps the existing GeminiPsychologyService with agent capabilities.
 * 
 * Capabilities:
 * - psychology-analysis: Analyze trading patterns for psychological insights
 */
@Injectable()
export class PsychologyAgent extends BaseAgent {
  readonly agentId = 'psychology-agent';
  readonly name = 'Psychology Agent';
  readonly priority = 15;
  
  readonly capabilities: AgentCapability[] = [
    {
      id: 'psychology-analysis',
      description: 'Analyze trading patterns to identify psychological factors affecting performance',
      keywords: ['psychology', 'behavior', 'mindset', 'emotions', 'fear', 'greed', 'discipline', 'revenge', 'fomo'],
    },
  ];
  
  constructor(
    registry: AgentRegistryService,
    eventBus: EventBusService,
    private readonly psychologyService: GeminiPsychologyService,
  ) {
    super(registry, eventBus);
  }
  
  /**
   * Process incoming messages
   */
  protected async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { payload, context } = message;
    
    // Extract text from various payload formats
    const text = this.extractTextForAnalysis(payload);
    
    if (!text) {
      return {
        success: false,
        error: {
          code: 'NO_TEXT_PROVIDED',
          message: 'No text content provided for psychological analysis',
        },
      };
    }
    
    return this.analyzeTraderPsychology(text, payload.tradeId, context);
  }
  
  /**
   * Extract text content from various payload formats
   */
  private extractTextForAnalysis(payload: any): string | null {
    // Direct text
    if (typeof payload === 'string') return payload;
    if (payload.text) return payload.text;
    if (payload.content) return payload.content;
    if (payload.notes) return payload.notes;
    
    // Build text from trades
    if (payload.trades && Array.isArray(payload.trades)) {
      const tradeNotes = payload.trades
        .filter((t: any) => t.notes)
        .map((t: any) => t.notes)
        .join('\n\n');
      return tradeNotes || null;
    }
    
    return null;
  }
  
  /**
   * Analyze trader psychology based on text content
   */
  private async analyzeTraderPsychology(
    text: string,
    tradeId: string | undefined,
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      // Call existing psychology service
      const insights = await this.psychologyService.analyzePsychologicalPatterns(text);
      
      // Check for high-risk patterns
      const hasRevengeTrade = insights.some((i: any) => 
        i.insightType?.toLowerCase().includes('revenge')
      );
      const hasFOMO = insights.some((i: any) => 
        i.insightType?.toLowerCase().includes('fomo')
      );
      const negativeSentiment = insights.some((i: any) => 
        i.sentiment === 'negative' && i.confidenceScore > 0.7
      );
      
      // Emit event for other agents to react
      this.emit('event', {
        type: 'psychology-analysis-complete',
        insights,
        tradeId,
        riskIndicators: {
          revengeTrade: hasRevengeTrade,
          fomo: hasFOMO,
          negativeSentiment,
        },
      }, context);
      
      // Emit alert if high-risk patterns detected
      if (hasRevengeTrade || (hasFOMO && negativeSentiment)) {
        this.emitAlert({
          type: 'trader-risk-alert',
          message: hasRevengeTrade 
            ? 'Potential revenge trading detected' 
            : 'FOMO with negative sentiment detected',
          insights,
          tradeId,
        }, context, 'high');
      }
      
      return {
        success: true,
        data: {
          insights,
          summary: this.summarizeInsights(insights),
          recommendations: this.generateRecommendations(insights),
          riskLevel: this.calculateRiskLevel(insights),
          sharedState: {
            lastPsychologyAnalysis: {
              timestamp: new Date(),
              riskLevel: this.calculateRiskLevel(insights),
              insightCount: insights.length,
            },
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: error instanceof Error ? error.message : 'Psychology analysis failed',
        },
      };
    }
  }
  
  /**
   * Summarize insights into brief description
   */
  private summarizeInsights(insights: any[]): string {
    if (!insights || insights.length === 0) {
      return 'No significant psychological patterns detected.';
    }
    
    const patterns = insights
      .filter((i: any) => i.insightType && i.insightType !== 'Parsing Error')
      .map((i: any) => i.insightType);
    
    if (patterns.length === 0) {
      return 'Analysis completed but no specific patterns identified.';
    }
    
    return `Detected patterns: ${patterns.join(', ')}`;
  }
  
  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(insights: any[]): string[] {
    const recommendations: string[] = [];
    
    for (const insight of insights) {
      const type = insight.insightType?.toLowerCase() || '';
      
      if (type.includes('revenge')) {
        recommendations.push('Take a break after losses - implement a mandatory cooling-off period');
      } else if (type.includes('fomo')) {
        recommendations.push('Stick to your trading plan - FOMO entries have lower success rates');
      } else if (type.includes('overtrading')) {
        recommendations.push('Consider reducing trade frequency and focusing on quality setups');
      } else if (type.includes('hesitation')) {
        recommendations.push('Review your entry criteria to build confidence in your setups');
      }
    }
    
    return recommendations.length > 0 
      ? [...new Set(recommendations)] // Remove duplicates
      : ['Continue maintaining your disciplined trading approach'];
  }
  
  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(insights: any[]): 'low' | 'medium' | 'high' {
    const highRiskPatterns = ['revenge', 'fomo', 'overtrading'];
    
    const highRiskCount = insights.filter((i: any) => {
      const type = i.insightType?.toLowerCase() || '';
      return highRiskPatterns.some(p => type.includes(p)) && 
             (i.confidenceScore || 0) > 0.6;
    }).length;
    
    if (highRiskCount >= 2) return 'high';
    if (highRiskCount === 1) return 'medium';
    return 'low';
  }
}
