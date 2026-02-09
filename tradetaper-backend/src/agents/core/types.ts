/**
 * Multi-Agent System Core Types
 *
 * Defines the foundational types and interfaces for the multi-agent orchestration system
 */

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  FAILED = 'failed',
  OFFLINE = 'offline',
}

export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface AgentCapability {
  name: string;
  proficiency: number; // 0-1, where 1 is expert level
  cost: number; // Cost per execution
  avgExecutionTime: number; // Milliseconds
}

export interface AgentMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgResponseTime: number;
  successRate: number;
  currentLoad: number; // 0-1, where 1 is fully loaded
  lastActive: Date;
  totalTokensUsed?: number;
  totalCost?: number;
}

export interface Task {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  data: any;
  requiredCapabilities: string[];
  assignedAgent?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string | string[]; // Single agent or broadcast
  type: 'request' | 'response' | 'broadcast' | 'notification';
  channel: string;
  data: any;
  timestamp: Date;
  correlationId?: string; // For tracing related messages
  priority?: TaskPriority;
}

export interface AgentConfig {
  name: string;
  type: string;
  capabilities: AgentCapability[];
  maxConcurrentTasks: number;
  timeout: number; // milliseconds
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  costBudget?: number; // Max cost per hour
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    cost?: number;
    confidence?: number;
    [key: string]: any;
  };
}

export interface ConsensusRequest {
  question: string;
  context: any;
  requiredConfidence: number;
  votingStrategy: 'majority' | 'weighted' | 'unanimous';
  participants: string[]; // Agent names
  timeout: number;
}

export interface ConsensusResponse {
  decision: any;
  confidence: number;
  votes: Array<{
    agent: string;
    vote: any;
    confidence: number;
    reasoning: string;
  }>;
  agreement: number; // 0-1, percentage of agents that agree
  metadata: {
    duration: number;
    participantCount: number;
  };
}

/**
 * Trading-specific types
 */
export interface MarketContext {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  sentiment: number; // -1 to 1
  volatility: number;
  volume: number;
  indicators?: Record<string, number>;
  news?: any[];
  economicEvents?: any[];
}

export interface TradePrediction {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  timeHorizon?: string;
  riskLevel: 'low' | 'medium' | 'high';
  metadata?: {
    agent: string;
    executionTime: number;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface AgentHealthCheck {
  agent: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  metrics: AgentMetrics;
  issues?: string[];
}
