import { Injectable, Logger } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { KnowledgeBaseService } from '../../knowledge-base/knowledge-base.service';
import { MultiModelOrchestratorService } from '../llm/multi-model-orchestrator.service';

@Injectable()
export class ICTMentorAgent extends BaseAgent {
  readonly agentId = 'ict-mentor-agent';
  readonly name = 'ICT Mentor Agent';
  readonly priority = 90; // High priority for user interaction

  readonly capabilities: AgentCapability[] = [
    {
      id: 'mentor-qa',
      description: 'Answer trading questions using personal ICT knowledge base',
      keywords: [
        'question',
        'how to',
        'explain',
        'what is',
        'mentor',
        'concept',
      ],
    },
    {
      id: 'audit-trade',
      description: 'Audit and critique a trade screenshot/setup',
      keywords: [
        'audit',
        'critique',
        'review',
        'chart',
        'screenshot',
        'mistake',
      ],
    },
    {
      id: 'ingest-knowledge',
      description: 'Ingest new knowledge into the mentor brain',
      keywords: ['learn', 'ingest', 'transcript', 'read', 'upload'],
    },
  ];

  constructor(
    registry: AgentRegistryService,
    eventBus: EventBusService,
    private readonly knowledgeBase: KnowledgeBaseService,
    private readonly llm: MultiModelOrchestratorService,
  ) {
    super(registry, eventBus);
  }

  protected async processMessage(
    message: AgentMessage,
  ): Promise<AgentResponse> {
    const { payload, context } = message;

    switch (payload.action) {
      case 'ask':
      case 'mentor-qa':
        return this.handleQA(payload.question, context);

      case 'audit-trade':
      case 'analyze-chart':
        return this.handleTradeAudit(payload, context);

      case 'ingest':
      case 'ingest-knowledge':
        return this.handleIngestion(payload);

      default:
        // Default to QA if question is present
        if (payload.question) {
          return this.handleQA(payload.question, context);
        }
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: 'Unknown action for Mentor Agent',
          },
        };
    }
  }

  /**
   * Handle Question & Answer (RAG)
   */
  private async handleQA(
    question: string,
    context: any,
  ): Promise<AgentResponse> {
    try {
      // 1. Retrieve relevant context
      const relevantDocs = await this.knowledgeBase.search(question, 4);
      const contextString = relevantDocs
        .map((d) => `[Source: ${d.document.title}]\n${d.content}`)
        .join('\n\n');

      // 2. Construct Prompt
      const prompt = `
        You are an expert ICT (Inner Circle Trader) Mentor. 
        Answer the student's question based strictly on the provided Context below.
        If the answer is not in the context, say "I don't have that in my training data yet."
        
        Context:
        ${contextString}

        Student Question: ${question}
        
        Answer (be concise and strict like ICT):
      `;

      // 3. Generate Answer
      const response = await this.llm.complete({
        prompt,
        modelPreference: 'gemini-1.5-flash', // Fast & Cheap
        taskComplexity: 'medium',
      });

      return {
        success: true,
        data: {
          answer: response.content,
          sources: relevantDocs.map((d) => d.document.title),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'MENTOR_ERROR', message: error.message },
      };
    }
  }

  /**
   * Handle Trade Audit (Multimodal Vision)
   */
  private async handleTradeAudit(
    payload: any,
    context: any,
  ): Promise<AgentResponse> {
    const { imageUrl, description } = payload;

    // We can also RAG here: fetch context about the specific setup user mentions
    let contextString = '';
    if (description) {
      const relevantDocs = await this.knowledgeBase.search(description, 2);
      contextString = relevantDocs.map((d) => d.content).join('\n\n');
    }

    const prompt = `
      Look at this trade chart. The user says: "${description}".
      
      Using standard ICT concepts (Fair Value Gaps, Order Blocks, Liquidity Sweeps, Market Structure Shift), critique this setup.
      1. Identify the key arrays visible.
      2. Validated if the entry makes sense.
      3. Point out any dangers/risks (e.g. trading into higher timeframe resistance).
      4. Give a score out of 10.

      Relevant Knowledge Context:
      ${contextString}
    `;

    // Note: LLM Service must support images. Assuming 'images' param or similar in payload for the orchestrator
    // For now, passing prompt. Real implementation would pass image buffer/url to multimodal capabilities.
    const response = await this.llm.complete({
      prompt,
      // Pass image if the Orchestrator supports it, or assume prompt includes image reference handling
      // In a real implementation: images: [imageUrl]
      modelPreference: 'gemini-1.5-flash',
      taskComplexity: 'complex',
    });

    return {
      success: true,
      data: {
        critique: response.content,
        // score: 'N/A', // Score parsing requires structured output which we can implement later
      },
    };
  }

  /**
   * Handle text ingestion requests
   */
  private async handleIngestion(payload: any): Promise<AgentResponse> {
    const { title, content, type } = payload;
    try {
      const doc = await this.knowledgeBase.ingestText(title, content, type);
      return {
        success: true,
        data: { docId: doc.id, chunkCount: doc.chunkCount },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INGEST_FAIL', message: error.message },
      };
    }
  }
}
