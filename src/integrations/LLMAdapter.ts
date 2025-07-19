/**
 * LLM Provider Adapter
 * Unified interface for multiple LLM providers with Ollama as primary
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import axios, { AxiosInstance } from 'axios';

export interface LLMConfig {
  provider: 'ollama' | 'openai' | 'anthropic' | 'mistral' | 'groq';
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  systemPrompt?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  metadata?: Record<string, any>;
}

export interface LLMStreamResponse {
  delta: string;
  accumulated: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  capabilities?: string[];
  parameters?: number;
}

export abstract class LLMAdapter extends EventEmitter {
  protected config: LLMConfig;
  protected client: AxiosInstance;
  protected isConnected: boolean = false;

  constructor(config: LLMConfig) {
    super();
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: this.getHeaders(),
    });
  }

  /**
   * Get provider-specific headers
   */
  protected abstract getHeaders(): Record<string, string>;

  /**
   * Test connection to the LLM provider
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * List available models
   */
  abstract listModels(): Promise<ModelInfo[]>;

  /**
   * Generate a completion
   */
  abstract generateCompletion(messages: LLMMessage[]): Promise<LLMResponse>;

  /**
   * Generate a streaming completion
   */
  abstract generateStreamingCompletion(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamResponse) => void
  ): Promise<void>;

  /**
   * Get model information
   */
  abstract getModelInfo(modelId: string): Promise<ModelInfo>;

  /**
   * Calculate token count for messages
   */
  abstract countTokens(messages: LLMMessage[]): Promise<number>;

  /**
   * Retry logic for API calls
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= (this.config.retryAttempts || 3)) {
        throw error;
      }

      const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt - 1);
      logger.warn(`LLM API call failed, retrying in ${delay}ms...`, { attempt, error });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Format messages for the specific provider
   */
  protected formatMessages(messages: LLMMessage[]): any {
    return messages;
  }

  /**
   * Parse provider response
   */
  protected parseResponse(response: any): LLMResponse {
    throw new Error('parseResponse must be implemented by subclass');
  }
}

/**
 * Ollama Adapter - Primary implementation for local testing
 */
export class OllamaAdapter extends LLMAdapter {
  constructor(config: Omit<LLMConfig, 'provider'>) {
    super({
      ...config,
      provider: 'ollama',
      baseUrl: config.baseUrl || 'http://localhost:11434',
    });
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      this.isConnected = response.status === 200;
      
      if (this.isConnected) {
        logger.info('Successfully connected to Ollama');
        this.emit('connected', { provider: 'ollama', baseUrl: this.config.baseUrl });
      }
      
      return this.isConnected;
    } catch (error) {
      logger.error('Failed to connect to Ollama:', error);
      this.isConnected = false;
      return false;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      
      return models.map((model: any) => ({
        id: model.name,
        name: model.name,
        description: model.description || `Ollama model: ${model.name}`,
        contextLength: model.details?.parameter_size || 2048,
        capabilities: ['text-generation', 'chat'],
        parameters: model.details?.parameter_size,
      }));
    } catch (error) {
      logger.error('Failed to list Ollama models:', error);
      throw error;
    }
  }

  async generateCompletion(messages: LLMMessage[]): Promise<LLMResponse> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await this.client.post('/api/chat', {
          model: this.config.model,
          messages: this.formatMessages(messages),
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
            top_k: this.config.topK,
            num_predict: this.config.maxTokens,
          },
          stream: false,
        });

        return this.parseResponse(response.data);
      } catch (error) {
        logger.error('Ollama completion failed:', error);
        throw error;
      }
    });
  }

  async generateStreamingCompletion(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamResponse) => void
  ): Promise<void> {
    try {
      const response = await this.client.post('/api/chat', {
        model: this.config.model,
        messages: this.formatMessages(messages),
        options: {
          temperature: this.config.temperature,
          top_p: this.config.topP,
          top_k: this.config.topK,
          num_predict: this.config.maxTokens,
        },
        stream: true,
      }, {
        responseType: 'stream',
      });

      let accumulated = '';
      let promptTokens = 0;
      let completionTokens = 0;

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          try {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              const data = JSON.parse(line);
              
              if (data.message?.content) {
                accumulated += data.message.content;
                completionTokens++;
                
                onChunk({
                  delta: data.message.content,
                  accumulated,
                  done: false,
                  usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                  }
                });
              }
              
              if (data.done) {
                promptTokens = data.prompt_eval_count || 0;
                completionTokens = data.eval_count || completionTokens;
                
                onChunk({
                  delta: '',
                  accumulated,
                  done: true,
                  usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                  }
                });
              }
            }
          } catch (error) {
            logger.error('Error parsing Ollama stream chunk:', error);
          }
        });

        response.data.on('end', () => resolve());
        response.data.on('error', (error: Error) => reject(error));
      });
    } catch (error) {
      logger.error('Ollama streaming failed:', error);
      throw error;
    }
  }

  async getModelInfo(modelId: string): Promise<ModelInfo> {
    try {
      const response = await this.client.post('/api/show', {
        name: modelId,
      });

      const modelData = response.data;
      
      return {
        id: modelId,
        name: modelId,
        description: modelData.template || `Ollama model: ${modelId}`,
        contextLength: modelData.parameters?.num_ctx || 2048,
        capabilities: ['text-generation', 'chat'],
        parameters: modelData.parameters?.num_params,
      };
    } catch (error) {
      logger.error('Failed to get Ollama model info:', error);
      throw error;
    }
  }

  async countTokens(messages: LLMMessage[]): Promise<number> {
    // Ollama doesn't have a direct token counting endpoint
    // Estimate based on character count (rough approximation)
    const text = messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 characters
  }

  protected parseResponse(response: any): LLMResponse {
    return {
      content: response.message?.content || '',
      model: response.model || this.config.model,
      usage: response.prompt_eval_count && response.eval_count ? {
        promptTokens: response.prompt_eval_count,
        completionTokens: response.eval_count,
        totalTokens: response.prompt_eval_count + response.eval_count,
      } : undefined,
      finishReason: response.done ? 'stop' : 'length',
      metadata: {
        totalDuration: response.total_duration,
        loadDuration: response.load_duration,
        evalDuration: response.eval_duration,
      },
    };
  }

  /**
   * Pull a model from Ollama library
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      logger.info(`Pulling Ollama model: ${modelName}`);
      
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: true,
      }, {
        responseType: 'stream',
      });

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          try {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              const data = JSON.parse(line);
              
              if (data.status) {
                this.emit('model:pull:progress', {
                  model: modelName,
                  status: data.status,
                  completed: data.completed,
                  total: data.total,
                });
              }
            }
          } catch (error) {
            // Ignore parsing errors for progress updates
          }
        });

        response.data.on('end', () => {
          logger.info(`Successfully pulled model: ${modelName}`);
          this.emit('model:pull:complete', { model: modelName });
          resolve();
        });
        
        response.data.on('error', (error: Error) => {
          logger.error(`Failed to pull model ${modelName}:`, error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Failed to pull Ollama model:', error);
      throw error;
    }
  }

  /**
   * Delete a model from Ollama
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      await this.client.delete('/api/delete', {
        data: { name: modelName }
      });
      
      logger.info(`Deleted Ollama model: ${modelName}`);
      this.emit('model:deleted', { model: modelName });
    } catch (error) {
      logger.error('Failed to delete Ollama model:', error);
      throw error;
    }
  }

  /**
   * Create a custom model with Modelfile
   */
  async createModel(name: string, modelfile: string): Promise<void> {
    try {
      logger.info(`Creating custom Ollama model: ${name}`);
      
      const response = await this.client.post('/api/create', {
        name,
        modelfile,
        stream: true,
      }, {
        responseType: 'stream',
      });

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          try {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              const data = JSON.parse(line);
              
              if (data.status) {
                this.emit('model:create:progress', {
                  model: name,
                  status: data.status,
                });
              }
            }
          } catch (error) {
            // Ignore parsing errors for progress updates
          }
        });

        response.data.on('end', () => {
          logger.info(`Successfully created model: ${name}`);
          this.emit('model:create:complete', { model: name });
          resolve();
        });
        
        response.data.on('error', (error: Error) => {
          logger.error(`Failed to create model ${name}:`, error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Failed to create Ollama model:', error);
      throw error;
    }
  }
}

/**
 * OpenAI Adapter
 */
export class OpenAIAdapter extends LLMAdapter {
  constructor(config: Omit<LLMConfig, 'provider'>) {
    super({
      ...config,
      provider: 'openai',
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
    });
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      this.isConnected = response.status === 200;
      
      if (this.isConnected) {
        logger.info('Successfully connected to OpenAI');
        this.emit('connected', { provider: 'openai' });
      }
      
      return this.isConnected;
    } catch (error) {
      logger.error('Failed to connect to OpenAI:', error);
      this.isConnected = false;
      return false;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.get('/models');
      const models = response.data.data || [];
      
      return models
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          description: `OpenAI ${model.id}`,
          contextLength: this.getContextLength(model.id),
          capabilities: ['text-generation', 'chat', 'function-calling'],
        }));
    } catch (error) {
      logger.error('Failed to list OpenAI models:', error);
      throw error;
    }
  }

  private getContextLength(modelId: string): number {
    const contextLengths: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 16384,
      'gpt-3.5-turbo-16k': 16384,
    };
    
    return contextLengths[modelId] || 4096;
  }

  async generateCompletion(messages: LLMMessage[]): Promise<LLMResponse> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await this.client.post('/chat/completions', {
          model: this.config.model,
          messages: this.formatMessages(messages),
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          top_p: this.config.topP,
        });

        return this.parseResponse(response.data);
      } catch (error) {
        logger.error('OpenAI completion failed:', error);
        throw error;
      }
    });
  }

  async generateStreamingCompletion(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamResponse) => void
  ): Promise<void> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: this.formatMessages(messages),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        top_p: this.config.topP,
        stream: true,
      }, {
        responseType: 'stream',
      });

      let accumulated = '';
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                onChunk({
                  delta: '',
                  accumulated,
                  done: true,
                });
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                
                if (delta) {
                  accumulated += delta;
                  onChunk({
                    delta,
                    accumulated,
                    done: false,
                  });
                }
              } catch (error) {
                logger.error('Error parsing OpenAI stream chunk:', error);
              }
            }
          }
        });

        response.data.on('end', () => resolve());
        response.data.on('error', (error: Error) => reject(error));
      });
    } catch (error) {
      logger.error('OpenAI streaming failed:', error);
      throw error;
    }
  }

  async getModelInfo(modelId: string): Promise<ModelInfo> {
    try {
      const response = await this.client.get(`/models/${modelId}`);
      const model = response.data;
      
      return {
        id: model.id,
        name: model.id,
        description: `OpenAI ${model.id}`,
        contextLength: this.getContextLength(model.id),
        capabilities: ['text-generation', 'chat', 'function-calling'],
      };
    } catch (error) {
      logger.error('Failed to get OpenAI model info:', error);
      throw error;
    }
  }

  async countTokens(messages: LLMMessage[]): Promise<number> {
    // OpenAI uses tiktoken for accurate counting
    // For now, use estimation
    const text = messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4);
  }

  protected parseResponse(response: any): LLMResponse {
    const choice = response.choices?.[0];
    
    return {
      content: choice?.message?.content || '',
      model: response.model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
      finishReason: choice?.finish_reason,
      metadata: {
        id: response.id,
        created: response.created,
      },
    };
  }
}

/**
 * LLM Adapter Factory
 */
export class LLMAdapterFactory {
  private static adapters: Map<string, LLMAdapter> = new Map();

  /**
   * Create or get an LLM adapter
   */
  static create(config: LLMConfig): LLMAdapter {
    const key = `${config.provider}-${config.model}`;
    
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }

    let adapter: LLMAdapter;
    
    switch (config.provider) {
      case 'ollama':
        adapter = new OllamaAdapter(config);
        break;
      case 'openai':
        adapter = new OpenAIAdapter(config);
        break;
      // Add other providers as needed
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
    
    this.adapters.set(key, adapter);
    return adapter;
  }

  /**
   * Test all configured adapters
   */
  static async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [key, adapter] of this.adapters.entries()) {
      try {
        results[key] = await adapter.testConnection();
      } catch (error) {
        results[key] = false;
      }
    }
    
    return results;
  }

  /**
   * Clear all adapters
   */
  static clear(): void {
    this.adapters.clear();
  }
}

/**
 * Ollama-specific utilities
 */
export class OllamaUtils {
  /**
   * Check if Ollama is running
   */
  static async isRunning(baseUrl: string = 'http://localhost:11434'): Promise<boolean> {
    try {
      const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get recommended models for Vegapunk
   */
  static getRecommendedModels(): Array<{ name: string; description: string; size: string }> {
    return [
      {
        name: 'llama2',
        description: 'Meta\'s Llama 2 - Good balance of performance and resource usage',
        size: '7B',
      },
      {
        name: 'mistral',
        description: 'Mistral 7B - Excellent performance for its size',
        size: '7B',
      },
      {
        name: 'codellama',
        description: 'Code Llama - Optimized for code generation and analysis',
        size: '7B',
      },
      {
        name: 'mixtral',
        description: 'Mixtral 8x7B - MoE model with strong capabilities',
        size: '47B',
      },
      {
        name: 'phi',
        description: 'Microsoft Phi-2 - Small but capable',
        size: '2.7B',
      },
    ];
  }

  /**
   * Create optimized Modelfile for Vegapunk agents
   */
  static createVegapunkModelfile(baseModel: string, agentType: string): string {
    const systemPrompts: Record<string, string> = {
      atlas: 'You are Atlas, a security and automation specialist agent. Focus on system security, threat detection, and automated responses.',
      edison: 'You are Edison, an innovation and logic specialist agent. Excel at problem-solving, creative solutions, and logical reasoning.',
      pythagoras: 'You are Pythagoras, a data and research specialist agent. Analyze data, conduct research, and provide statistical insights.',
      lilith: 'You are Lilith, a creativity and exploration specialist agent. Think outside the box, explore unconventional solutions, and embrace creative chaos.',
      york: 'You are York, a resource and efficiency specialist agent. Optimize resource usage, improve system performance, and maximize efficiency.',
    };

    return `FROM ${baseModel}

# System prompt for ${agentType} agent
SYSTEM """${systemPrompts[agentType] || 'You are a specialized AI agent in the Vegapunk multi-agent system.'}"""

# Temperature for consistent behavior
PARAMETER temperature 0.7

# Context window
PARAMETER num_ctx 4096

# Response parameters
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1

# Stop sequences
PARAMETER stop "<|end|>"
PARAMETER stop "<|user|>"
PARAMETER stop "<|assistant|>"`;
  }
}