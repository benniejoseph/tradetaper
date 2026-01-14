import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SemanticCacheService } from './semantic-cache.service';
import { LLMCostManagerService } from './llm-cost-manager.service';
import { SecretsService } from '../../common/secrets/secrets.service';

/**
 * Multi-Model Orchestrator Service
 * 
 * Intelligently routes LLM requests across multiple models and providers.
 * Provides automatic fallbacks, cost optimization, and quality assurance.
 * 
 * Features:
 * - Multi-provider support (Google Gemini, OpenAI GPT, Anthropic Claude)
 * - Intelligent model selection based on task complexity
 * - Automatic fallback on failures
 * - Cost optimization through model selection
 * - Quality validation
 * - Semantic caching integration
 */

export interface LLMRequest {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
  taskComplexity?: 'simple' | 'medium' | 'complex';
  optimizeFor?: 'cost' | 'quality' | 'speed';
  userId?: string;
  requireJson?: boolean;
  qualityThreshold?: number;
  images?: string[]; // Array of base64 strings or URLs
  modelPreference?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  cached: boolean;
  metadata: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    executionTime: number;
    cacheHit: boolean;
    fallbackUsed: boolean;
    confidence?: number;
  };
}

interface ModelConfig {
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  priority: number; // Lower = higher priority
  enabled: boolean;
  maxRetries: number;
}

@Injectable()
export class MultiModelOrchestratorService {
  private readonly logger = new Logger(MultiModelOrchestratorService.name);
  private geminiClient: GoogleGenerativeAI;
  
  // Model configurations in priority order
  private readonly models: ModelConfig[] = [
    {
      name: 'gemini-2.0-flash',
      provider: 'google',
      priority: 0, // Highest priority
      enabled: true,
      maxRetries: 3,
    },
    {
      name: 'gemini-1.5-flash',
      provider: 'google',
      priority: 1,
      enabled: true,
      maxRetries: 2,
    },
    {
      name: 'gemini-1.5-pro',
      provider: 'google',
      priority: 3,
      enabled: true,
      maxRetries: 2,
    },
    // OpenAI models would go here (when API keys configured)
    // {
    //   name: 'gpt-3.5-turbo',
    //   provider: 'openai',
    //   priority: 2,
    //   enabled: false,
    //   maxRetries: 2,
    // },
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
    private readonly semanticCache: SemanticCacheService,
    private readonly costManager: LLMCostManagerService,
  ) {
    this.initializeClients();
  }

  /**
   * Initialize LLM clients
   */
  private initializeClients(): void {
    try {
      const geminiKey = this.secretsService.getGeminiApiKey();
      if (geminiKey) {
        this.geminiClient = new GoogleGenerativeAI(geminiKey);
        this.logger.log('✓ Gemini client initialized');
      } else {
        this.logger.warn('Gemini API key not found - Gemini models disabled');
        this.models.forEach(m => {
          if (m.provider === 'google') m.enabled = false;
        });
      }
    } catch (error) {
      this.logger.error(`Failed to initialize LLM clients: ${error.message}`);
    }
  }

  /**
   * Main completion method with intelligent routing and fallbacks
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    
    // 1. Check semantic cache first
    const taskComplexity = request.taskComplexity || 'medium';
    let selectedModel = request.modelPreference || this.selectModel(request);
    
    // Validate model preference validity if provided
    if (request.modelPreference && !this.getProviderForModel(request.modelPreference)) {
      this.logger.warn(`Invalid model preference: ${request.modelPreference}, falling back to auto-selection`);
      selectedModel = this.selectModel(request);
    }
    
    const cachedResponse = await this.semanticCache.get(
      request.prompt,
      selectedModel
    );
    
    if (cachedResponse) {
      this.logger.debug('Returning cached response');
      return {
        content: cachedResponse,
        model: selectedModel,
        provider: this.getProviderForModel(selectedModel),
        cached: true,
        metadata: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
          executionTime: Date.now() - startTime,
          cacheHit: true,
          fallbackUsed: false,
        },
      };
    }
    
    // 2. Check user budget (if userId provided)
    if (request.userId) {
      const estimatedTokens = this.costManager.estimateTokens(request.prompt);
      const estimatedCost = this.costManager.calculateCost(
        estimatedTokens,
        request.maxTokens || 1000,
        selectedModel
      );
      
      await this.costManager.checkBudget(request.userId, estimatedCost);
    }
    
    // 3. Try models with fallback
    const sortedModels = this.getSortedModels(request);
    
    for (const modelConfig of sortedModels) {
      if (!modelConfig.enabled) {
        continue;
      }
      
      try {
        this.logger.debug(`Trying model: ${modelConfig.name}`);
        
        const response = await this.executeWithRetry(
          request,
          modelConfig
        );
        
        // 4. Validate quality if threshold specified
        if (request.qualityThreshold) {
          const quality = this.assessQuality(response.content);
          if (quality < request.qualityThreshold) {
            this.logger.warn(
              `Response quality ${quality} below threshold ${request.qualityThreshold}`
            );
            continue; // Try next model
          }
        }
        
        // 5. Cache successful response
        await this.semanticCache.set(
          request.prompt,
          response.content,
          modelConfig.name,
          {
            tokensUsed: response.metadata.totalTokens,
            cost: response.metadata.cost,
          }
        );
        
        // 6. Record usage
        await this.costManager.recordUsage({
          promptTokens: response.metadata.promptTokens,
          completionTokens: response.metadata.completionTokens,
          totalTokens: response.metadata.totalTokens,
          cost: response.metadata.cost,
          model: modelConfig.name,
          userId: request.userId,
          operation: 'completion',
        });
        
        response.metadata.executionTime = Date.now() - startTime;
        
        return response;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Model ${modelConfig.name} failed: ${error.message}`
        );
        continue; // Try next model
      }
    }
    
    // All models failed
    throw new Error(
      `All LLM models failed. Last error: ${lastError?.message || 'Unknown'}`
    );
  }

  /**
   * Select optimal model based on request parameters
   */
  private selectModel(request: LLMRequest): string {
    const complexity = request.taskComplexity || 'medium';
    const optimizeFor = request.optimizeFor || 'cost';
    
    if (optimizeFor === 'cost') {
      // Always use cheapest model for simple tasks (2.0-flash is very cheap and fast)
      if (complexity === 'simple') {
        return 'gemini-2.0-flash';
      }
      // Use cost-effective model for medium tasks
      if (complexity === 'medium') {
        return 'gemini-2.0-flash';
      }
      // Use better model for complex tasks
      return 'gemini-1.5-pro';
    } else if (optimizeFor === 'quality') {
      // Use best available model
      return 'gemini-1.5-pro';
    } else {
      // Optimize for speed - use fastest model
      return 'gemini-2.0-flash';
    }
  }

  /**
   * Get sorted list of models to try
   */
  private getSortedModels(request: LLMRequest): ModelConfig[] {
    const primaryModel = this.selectModel(request);
    
    // Sort models: primary first, then by priority
    return this.models
      .filter(m => m.enabled)
      .sort((a, b) => {
        if (a.name === primaryModel) return -1;
        if (b.name === primaryModel) return 1;
        return a.priority - b.priority;
      });
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    request: LLMRequest,
    modelConfig: ModelConfig,
  ): Promise<LLMResponse> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= modelConfig.maxRetries; attempt++) {
      try {
        return await this.executeRequest(request, modelConfig);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < modelConfig.maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          this.logger.debug(
            `Attempt ${attempt} failed, retrying in ${backoffMs}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Execute actual LLM request
   */
  private async executeRequest(
    request: LLMRequest,
    modelConfig: ModelConfig,
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    
    if (modelConfig.provider === 'google') {
      return await this.executeGemini(request, modelConfig, startTime);
    }
    
    // Add other providers here (OpenAI, Anthropic, etc.)
    
    throw new Error(`Provider ${modelConfig.provider} not implemented`);
  }

  /**
   * Execute Gemini request
   */
  private async executeGemini(
    request: LLMRequest,
    modelConfig: ModelConfig,
    startTime: number,
  ): Promise<LLMResponse> {
    const model = this.geminiClient.getGenerativeModel({
      model: modelConfig.name,
    });
    
    const generationConfig: any = {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.maxTokens ?? 2048,
    };
    
    // Force JSON output if requested
    if (request.requireJson) {
      generationConfig.responseMimeType = 'application/json';
    }
    
    const parts: Array<any> = [];
    
    if (request.system) {
      // Gemini 1.5 usually takes system instruction in model config, but putting it in parts works for prompts often,
      // or we should use systemInstruction prop in getGenerativeModel. 
      // For now, prepeding to prompt is safer for compatibility across versions if systemInstruction not set.
      // But let's check if we can use systemInstruction in getGenerativeModel. 
      // Actually, let's just prepend to prompt for now or add as first text part.
      parts.push({ text: `System: ${request.system}\n\n` });
    }
    
    parts.push({ text: request.prompt });
    
    // Add images if present
    if (request.images && request.images.length > 0) {
      request.images.forEach(img => {
        // Simple base64 detection
        let mimeType = 'image/jpeg';
        let data = img;
        
        if (img.startsWith('data:')) {
          const matches = img.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            data = matches[2];
          }
        }
        
        parts.push({
          inlineData: {
            mimeType,
            data
          }
        });
      });
    }
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig,
    });
    
    const response = result.response;
    const text = response.text();
    
    // Estimate tokens (Gemini doesn't always provide token counts)
    const promptTokens = this.costManager.estimateTokens(request.prompt);
    const completionTokens = this.costManager.estimateTokens(text);
    const totalTokens = promptTokens + completionTokens;
    
    const cost = this.costManager.calculateCost(
      promptTokens,
      completionTokens,
      modelConfig.name
    );
    
    return {
      content: text,
      model: modelConfig.name,
      provider: 'google',
      cached: false,
      metadata: {
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        executionTime: Date.now() - startTime,
        cacheHit: false,
        fallbackUsed: false,
      },
    };
  }

  /**
   * Assess response quality (simple heuristic)
   */
  private assessQuality(response: string): number {
    // Simple quality metrics
    let score = 1.0;
    
    // Check length (too short or too long is bad)
    if (response.length < 50) score -= 0.3;
    if (response.length > 10000) score -= 0.2;
    
    // Check for error indicators
    const errorIndicators = ['error', 'sorry', 'cannot', 'unable'];
    if (errorIndicators.some(word => response.toLowerCase().includes(word))) {
      score -= 0.4;
    }
    
    // Check for completeness
    if (!response.trim().endsWith('.') && !response.trim().endsWith('}')) {
      score -= 0.2;
    }
    
    return Math.max(0, score);
  }

  /**
   * Get provider for model name
   */
  private getProviderForModel(modelName: string): string {
    const modelConfig = this.models.find(m => m.name === modelName);
    return modelConfig?.provider || 'unknown';
  }

  /**
   * Batch processing for multiple prompts
   */
  async batchComplete(requests: LLMRequest[]): Promise<LLMResponse[]> {
    this.logger.log(`Processing batch of ${requests.length} requests`);
    
    // Process in parallel with concurrency limit
    const concurrency = 5;
    const results: LLMResponse[] = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(req => this.complete(req).catch(err => {
          this.logger.error(`Batch request failed: ${err.message}`);
          return null;
        }))
      );
      
      results.push(...batchResults.filter(r => r !== null));
    }
    
    return results;
  }

  /**
   * Get service health and statistics
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    models: Array<{ name: string; enabled: boolean; provider: string }>;
    cacheStats: any;
    costStats: any;
  }> {
    const enabledModels = this.models.filter(m => m.enabled);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (enabledModels.length === 0) {
      status = 'unhealthy';
    } else if (enabledModels.length < 2) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      models: this.models.map(m => ({
        name: m.name,
        enabled: m.enabled,
        provider: m.provider,
      })),
      cacheStats: this.semanticCache.getEfficiencyReport(),
      costStats: await this.costManager.getSystemStats(),
    };
  }
}

