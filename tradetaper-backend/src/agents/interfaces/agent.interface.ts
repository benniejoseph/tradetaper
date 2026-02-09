/**
 * Agent Interface - Core contract for all TradeTaper AI agents
 *
 * Each agent in the system must implement this interface to participate
 * in the multi-agent orchestration system.
 */
export interface IAgent {
  /** Unique identifier for this agent type */
  readonly agentId: string;

  /** Human-readable name */
  readonly name: string;

  /** Agent capabilities for routing */
  readonly capabilities: AgentCapability[];

  /** Agent priority (higher = preferred for matching capabilities) */
  readonly priority: number;

  /** Current health status */
  getHealth(): AgentHealth;

  /** Process a message and return response */
  handleMessage(message: AgentMessage): Promise<AgentResponse>;

  /** Initialize agent (called on registration) */
  onInit?(): Promise<void>;

  /** Cleanup (called on shutdown) */
  onDestroy?(): Promise<void>;
}

export interface AgentCapability {
  /** Capability identifier (e.g., 'chart-analysis', 'psychology', 'prediction') */
  id: string;
  /** Description for semantic routing */
  description: string;
  /** Keywords for matching */
  keywords: string[];
}

export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface AgentMessage<T = any> {
  /** Unique message ID */
  id: string;

  /** Source agent ID (or 'user' / 'system') */
  sourceAgent: string;

  /** Target agent ID (undefined = broadcast / router decides) */
  targetAgent?: string;

  /** Message type */
  type: 'request' | 'response' | 'event' | 'alert';

  /** Payload data */
  payload: T;

  /** Context for tracking and multi-agent coordination */
  context: MessageContext;

  /** Message metadata */
  metadata: MessageMetadata;
}

export interface MessageContext {
  /** User ID for authorization and personalization */
  userId: string;

  /** Session ID for conversation continuity */
  sessionId: string;

  /** Correlation ID for distributed tracing */
  correlationId: string;

  /** Optional trade ID for trade-specific operations */
  tradeId?: string;

  /** Parent message ID for request-response chains */
  parentMessageId?: string;

  /** Shared context data from previous agents */
  sharedState?: Record<string, any>;
}

export interface MessageMetadata {
  /** Message creation timestamp */
  timestamp: Date;

  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';

  /** Time-to-live in milliseconds */
  ttl?: number;

  /** Retry count */
  retryCount?: number;

  /** Maximum retries allowed */
  maxRetries?: number;
}

export interface AgentResponse<T = any> {
  /** Whether the agent successfully processed the message */
  success: boolean;

  /** Response data */
  data?: T;

  /** Error information if unsuccessful */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /** Metrics for observability */
  metrics?: {
    processingTimeMs: number;
    tokensUsed?: number;
    cacheHit?: boolean;
  };

  /** Optional follow-up messages to other agents */
  forwardTo?: Array<{
    agentId: string;
    payload: any;
  }>;
}

/** Agent status for registry */
export type AgentStatus =
  | 'registered'
  | 'initializing'
  | 'active'
  | 'paused'
  | 'error'
  | 'shutdown';

/** Registration info stored in registry */
export interface AgentRegistration {
  agent: IAgent;
  status: AgentStatus;
  registeredAt: Date;
  lastActiveAt: Date;
  messageCount: number;
  errorCount: number;
}
