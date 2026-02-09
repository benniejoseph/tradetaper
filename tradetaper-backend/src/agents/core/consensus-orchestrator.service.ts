import { Injectable, Logger } from '@nestjs/common';
import { AgentRegistry } from './agent-registry.service';
import { MessageBusService } from './message-bus.service';
import {
  ConsensusRequest,
  ConsensusResponse,
  Task,
  TaskPriority,
  TaskStatus,
  TradePrediction,
} from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Consensus Orchestrator Service
 *
 * Coordinates multi-agent consensus for trading decisions.
 * Implements voting mechanisms to ensure high-confidence predictions.
 *
 * Features:
 * - Multi-agent voting (majority, weighted, unanimous)
 * - Confidence-based filtering
 * - Reasoning aggregation
 * - Timeout handling
 * - Consensus quality metrics
 */
@Injectable()
export class ConsensusOrchestratorService {
  private readonly logger = new Logger(ConsensusOrchestratorService.name);

  constructor(
    private readonly agentRegistry: AgentRegistry,
    private readonly messageBus: MessageBusService,
  ) {}

  /**
   * Coordinate consensus across multiple agents
   */
  async reachConsensus(request: ConsensusRequest): Promise<ConsensusResponse> {
    const startTime = Date.now();

    this.logger.log(
      `Reaching consensus on: ${request.question} (strategy: ${request.votingStrategy})`,
    );

    // 1. Create tasks for each participating agent
    const tasks = this.createTasksForAgents(request);

    // 2. Execute tasks and collect votes
    const votes = await this.collectVotes(tasks, request.timeout);

    // 3. Calculate consensus based on voting strategy
    const consensus = this.calculateConsensus(votes, request);

    const duration = Date.now() - startTime;

    this.logger.log(
      `Consensus reached: ${JSON.stringify(consensus.decision)} ` +
        `(confidence: ${consensus.confidence.toFixed(2)}, agreement: ${(consensus.agreement * 100).toFixed(1)}%, ` +
        `duration: ${duration}ms)`,
    );

    return {
      ...consensus,
      metadata: {
        duration,
        participantCount: votes.length,
      },
    };
  }

  /**
   * Create tasks for participating agents
   */
  private createTasksForAgents(request: ConsensusRequest): Task[] {
    const tasks: Task[] = [];

    for (const agentName of request.participants) {
      const agent = this.agentRegistry.getAgent(agentName);

      if (!agent) {
        this.logger.warn(`Agent ${agentName} not found, skipping`);
        continue;
      }

      if (!agent.canAcceptTask()) {
        this.logger.warn(`Agent ${agentName} cannot accept task, skipping`);
        continue;
      }

      const task: Task = {
        id: uuidv4(),
        type: 'consensus-vote',
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        data: {
          question: request.question,
          context: request.context,
        },
        requiredCapabilities: [],
        assignedAgent: agentName,
        createdAt: new Date(),
      };

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Collect votes from all agents
   */
  private async collectVotes(
    tasks: Task[],
    timeout: number,
  ): Promise<
    Array<{
      agent: string;
      vote: any;
      confidence: number;
      reasoning: string;
    }>
  > {
    const votes: any[] = [];

    // Execute tasks in parallel with timeout
    const votePromises = tasks.map(async (task) => {
      try {
        const agent = this.agentRegistry.getAgent(task.assignedAgent || '');

        if (!agent) {
          return null;
        }

        await agent.assignTask(task);
        const response = await agent.execute(task);

        if (response.success && response.data) {
          return {
            agent: task.assignedAgent,
            vote: response.data.prediction || response.data,
            confidence: response.metadata?.confidence || 0.7,
            reasoning: response.data.reasoning || 'No reasoning provided',
          };
        }

        return null;
      } catch (error) {
        this.logger.error(
          `Agent ${task.assignedAgent} vote failed: ${error.message}`,
        );
        return null;
      }
    });

    // Wait for all votes with timeout
    const results = (await Promise.race([
      Promise.allSettled(votePromises),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Consensus timeout')), timeout),
      ),
    ])) as PromiseSettledResult<any>[];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        votes.push(result.value);
      }
    }

    if (votes.length === 0) {
      throw new Error('No votes collected from agents');
    }

    return votes;
  }

  /**
   * Calculate consensus from votes
   */
  private calculateConsensus(
    votes: Array<{
      agent: string;
      vote: any;
      confidence: number;
      reasoning: string;
    }>,
    request: ConsensusRequest,
  ): ConsensusResponse {
    if (request.votingStrategy === 'majority') {
      return this.majorityVoting(votes, request.requiredConfidence);
    } else if (request.votingStrategy === 'weighted') {
      return this.weightedVoting(votes, request.requiredConfidence);
    } else if (request.votingStrategy === 'unanimous') {
      return this.unanimousVoting(votes, request.requiredConfidence);
    }

    // Default to weighted voting
    return this.weightedVoting(votes, request.requiredConfidence);
  }

  /**
   * Majority voting - simple majority wins
   */
  private majorityVoting(
    votes: any[],
    requiredConfidence: number,
  ): ConsensusResponse {
    // Count votes for each decision
    const voteCounts = new Map<string, number>();
    const voteDetails = new Map<string, any[]>();

    for (const vote of votes) {
      const decision = JSON.stringify(vote.vote);
      voteCounts.set(decision, (voteCounts.get(decision) || 0) + 1);

      if (!voteDetails.has(decision)) {
        voteDetails.set(decision, []);
      }
      voteDetails.get(decision)?.push(vote);
    }

    // Find majority
    let majority: string | null = null;
    let maxCount = 0;

    for (const [decision, count] of voteCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        majority = decision;
      }
    }

    const agreement = maxCount / votes.length;
    const majorityVotes = voteDetails.get(majority || '') || [];

    // Calculate average confidence
    const avgConfidence =
      majorityVotes.reduce((sum, v) => sum + v.confidence, 0) /
      majorityVotes.length;

    return {
      decision: JSON.parse(majority || '{}'),
      confidence: avgConfidence,
      votes,
      agreement,
      metadata: {
        duration: 0,
        participantCount: votes.length,
      },
    };
  }

  /**
   * Weighted voting - votes weighted by agent confidence
   */
  private weightedVoting(
    votes: any[],
    requiredConfidence: number,
  ): ConsensusResponse {
    // Group votes by decision
    const votesByDecision = new Map<string, any[]>();

    for (const vote of votes) {
      const decision = JSON.stringify(vote.vote);
      if (!votesByDecision.has(decision)) {
        votesByDecision.set(decision, []);
      }
      votesByDecision.get(decision)?.push(vote);
    }

    // Calculate weighted score for each decision
    const scores = new Map<string, number>();
    const totalWeight = votes.reduce((sum, v) => sum + v.confidence, 0);

    for (const [decision, decisionVotes] of votesByDecision.entries()) {
      const weight = decisionVotes.reduce((sum, v) => sum + v.confidence, 0);
      scores.set(decision, weight / totalWeight);
    }

    // Find highest scored decision
    let bestDecision: string | null = null;
    let bestScore = 0;

    for (const [decision, score] of scores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestDecision = decision;
      }
    }

    const winningVotes = votesByDecision.get(bestDecision || '') || [];
    const avgConfidence =
      winningVotes.reduce((sum, v) => sum + v.confidence, 0) /
      winningVotes.length;

    return {
      decision: JSON.parse(bestDecision || '{}'),
      confidence: avgConfidence,
      votes,
      agreement: bestScore,
      metadata: {
        duration: 0,
        participantCount: votes.length,
      },
    };
  }

  /**
   * Unanimous voting - all agents must agree
   */
  private unanimousVoting(
    votes: any[],
    requiredConfidence: number,
  ): ConsensusResponse {
    // Check if all votes are the same
    const firstVote = JSON.stringify(votes[0].vote);
    const allAgree = votes.every((v) => JSON.stringify(v.vote) === firstVote);

    const avgConfidence =
      votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;

    if (allAgree && avgConfidence >= requiredConfidence) {
      return {
        decision: votes[0].vote,
        confidence: avgConfidence,
        votes,
        agreement: 1.0,
        metadata: {
          duration: 0,
          participantCount: votes.length,
        },
      };
    } else {
      // No unanimous decision
      return {
        decision: { action: 'HOLD', reason: 'No unanimous consensus' },
        confidence: 0,
        votes,
        agreement: 0,
        metadata: {
          duration: 0,
          participantCount: votes.length,
        },
      };
    }
  }

  /**
   * Specialized method for trading predictions consensus
   */
  async getTradingConsensus(
    symbol: string,
    context: any,
    options: {
      requiredConfidence?: number;
      timeout?: number;
    } = {},
  ): Promise<{
    prediction: TradePrediction;
    consensus: ConsensusResponse;
  }> {
    // Get all agents capable of making trading predictions
    const predictionAgents = this.agentRegistry
      .getAgentsByCapability('trade-prediction')
      .map((a) => a.getName());

    if (predictionAgents.length === 0) {
      throw new Error('No prediction agents available');
    }

    const consensusRequest: ConsensusRequest = {
      question: `What is the trading prediction for ${symbol}?`,
      context,
      requiredConfidence: options.requiredConfidence || 0.75,
      votingStrategy: 'weighted',
      participants: predictionAgents,
      timeout: options.timeout || 30000,
    };

    const consensus = await this.reachConsensus(consensusRequest);

    // Convert consensus to trade prediction
    const prediction: TradePrediction = {
      symbol,
      action: consensus.decision.action || 'HOLD',
      confidence: consensus.confidence,
      reasoning: this.aggregateReasoning(consensus.votes),
      riskLevel: this.calculateRiskLevel(consensus),
      metadata: {
        agent: 'consensus-orchestrator',
        executionTime: consensus.metadata.duration,
      },
    };

    return {
      prediction,
      consensus,
    };
  }

  /**
   * Aggregate reasoning from multiple agents
   */
  private aggregateReasoning(
    votes: Array<{
      agent: string;
      vote: any;
      confidence: number;
      reasoning: string;
    }>,
  ): string {
    const reasonings = votes.map((v) => `${v.agent}: ${v.reasoning}`);
    return `Multi-agent consensus:\n${reasonings.join('\n')}`;
  }

  /**
   * Calculate risk level based on consensus
   */
  private calculateRiskLevel(
    consensus: ConsensusResponse,
  ): 'low' | 'medium' | 'high' {
    if (consensus.confidence > 0.8 && consensus.agreement > 0.8) {
      return 'low';
    } else if (consensus.confidence > 0.6 && consensus.agreement > 0.6) {
      return 'medium';
    } else {
      return 'high';
    }
  }
}
