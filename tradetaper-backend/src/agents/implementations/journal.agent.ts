import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { AIService } from '../../notes/ai.service';

/**
 * Journal Agent
 * 
 * Assists with trade journal entries using AI:
 * - Speech-to-text transcription
 * - Text enhancement (grammar, clarity, summarization)
 * - Auto-tagging and suggestions
 * 
 * Capabilities:
 * - journal-transcription: Convert voice notes to text
 * - journal-enhancement: Improve journal entry quality
 * - journal-suggestions: Generate tags and topics
 */
@Injectable()
export class JournalAgent extends BaseAgent {
  readonly agentId = 'journal-agent';
  readonly name = 'Journal Agent';
  readonly priority = 15;
  
  readonly capabilities: AgentCapability[] = [
    {
      id: 'journal-transcription',
      description: 'Convert audio recordings to text for journal entries',
      keywords: ['speech', 'voice', 'audio', 'transcribe', 'transcription', 'dictate'],
    },
    {
      id: 'journal-enhancement',
      description: 'Improve journal entry text quality, grammar, and clarity',
      keywords: ['enhance', 'improve', 'grammar', 'clarity', 'summarize', 'expand', 'edit'],
    },
    {
      id: 'journal-suggestions',
      description: 'Generate tags, titles, and related topics for journal entries',
      keywords: ['tags', 'suggest', 'title', 'topics', 'categorize', 'organize'],
    },
  ];
  
  constructor(
    registry: AgentRegistryService,
    eventBus: EventBusService,
    private readonly aiService: AIService,
  ) {
    super(registry, eventBus);
  }
  
  /**
   * Process incoming messages
   */
  protected async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { payload, context } = message;
    
    switch (payload.action) {
      case 'transcribe':
        return this.transcribeAudio(payload, context);
      
      case 'enhance':
        return this.enhanceText(payload, context);
      
      case 'suggest':
      case 'generate-suggestions':
        return this.generateSuggestions(payload, context);
      
      default:
        // Auto-detect based on payload content
        if (payload.audioBuffer) {
          return this.transcribeAudio(payload, context);
        }
        if (payload.text && payload.task) {
          return this.enhanceText(payload, context);
        }
        if (payload.content) {
          return this.generateSuggestions(payload, context);
        }
        
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${payload.action}. Supported: transcribe, enhance, suggest`,
          },
        };
    }
  }
  
  /**
   * Transcribe audio to text
   */
  private async transcribeAudio(
    data: { audioBuffer: Buffer; filename?: string },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const result = await this.aiService.speechToText(
        data.audioBuffer,
        data.filename || 'audio.mp3',
      );
      
      // Emit event for other agents
      this.emit('event', {
        type: 'journal-transcribed',
        transcript: result.transcript,
        confidence: result.confidence,
      }, context);
      
      return {
        success: true,
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          language: result.language,
        },
        metrics: {
          processingTimeMs: 0, // Will be set by base class
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSCRIPTION_FAILED',
          message: error instanceof Error ? error.message : 'Audio transcription failed',
        },
      };
    }
  }
  
  /**
   * Enhance journal text
   */
  private async enhanceText(
    data: { text: string; task: 'grammar' | 'clarity' | 'summarize' | 'expand' },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const result = await this.aiService.enhanceText(data.text, data.task);
      
      return {
        success: true,
        data: {
          originalText: data.text,
          enhancedText: result.enhancedText,
          suggestions: result.suggestions,
          task: data.task,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ENHANCEMENT_FAILED',
          message: error instanceof Error ? error.message : 'Text enhancement failed',
        },
      };
    }
  }
  
  /**
   * Generate suggestions for journal content
   */
  private async generateSuggestions(
    data: { content: string },
    context: AgentMessage['context'],
  ): Promise<AgentResponse> {
    try {
      const result = await this.aiService.generateNoteSuggestions(data.content);
      
      // Share tags with other agents for correlation
      this.emit('event', {
        type: 'journal-tags-generated',
        tags: result.tags,
        title: result.title,
      }, context);
      
      return {
        success: true,
        data: {
          suggestedTags: result.tags,
          suggestedTitle: result.title,
          relatedTopics: result.relatedTopics,
          sharedState: {
            lastJournalTags: result.tags,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SUGGESTIONS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate suggestions',
        },
      };
    }
  }
  
  /**
   * React to events from other agents
   */
  protected async onEvent(message: AgentMessage): Promise<void> {
    // React to trade closed events - could trigger journal reminder
    if (message.payload?.type === 'trade-closed') {
      this.logger.debug(`Trade closed - could prompt for journal entry`);
    }
  }
}
