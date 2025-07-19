/**
 * Enhanced LLM Provider
 * Bridges the new LLM Adapter with existing LLMProvider interface
 */

import { LLMProvider, LLMRequest, LLMResponse, LLMConfig } from './LLMProvider';
import { OllamaAdapter, OpenAIAdapter, LLMAdapterFactory, LLMMessage } from '../../integrations/LLMAdapter';
import { createLogger } from '../logger';

/**
 * Enhanced Ollama Provider using the new adapter
 */
export class EnhancedOllamaProvider extends LLMProvider {
  private adapter: OllamaAdapter;
  private readonly logger = createLogger('EnhancedOllamaProvider');

  constructor(config: LLMConfig) {
    super(config);
    this.adapter = new OllamaAdapter({
      model: config.model,
      baseUrl: config.endpoint,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      timeout: config.timeout,
    });
  }

  async complete(request: LLMRequest): Promise<string> {
    try {
      const messages: LLMMessage[] = [];
      
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const response = await this.adapter.generateCompletion(messages);
      return response.content;
    } catch (error) {
      this.logger.error('Enhanced Ollama completion failed', error);
      throw error;
    }
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const messages: LLMMessage[] = [];
      
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const startTime = Date.now();
      const response = await this.adapter.generateCompletion(messages);
      const duration = Date.now() - startTime;

      return {
        content: response.content,
        usage: response.usage,
        metadata: {
          model: response.model,
          provider: 'ollama',
          duration,
          ...response.metadata,
        },
      };
    } catch (error) {
      this.logger.error('Enhanced Ollama generation failed', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await this.adapter.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * Pull a model from Ollama
   */
  async pullModel(modelName?: string): Promise<void> {
    const model = modelName || this.config.model;
    this.logger.info(`Pulling Ollama model: ${model}`);
    await this.adapter.pullModel(model);
  }

  /**
   * List available models
   */
  async listModels() {
    return await this.adapter.listModels();
  }

  /**
   * Create custom model with Modelfile
   */
  async createCustomModel(name: string, modelfile: string): Promise<void> {
    await this.adapter.createModel(name, modelfile);
  }

  /**
   * Stream completion
   */
  async streamCompletion(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    const messages: LLMMessage[] = [];
    
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const startTime = Date.now();
    let fullResponse = '';
    let usage = undefined;

    await this.adapter.generateStreamingCompletion(
      messages,
      (chunk) => {
        if (chunk.delta) {
          onChunk(chunk.delta);
          fullResponse += chunk.delta;
        }
        if (chunk.done && chunk.usage) {
          usage = chunk.usage;
        }
      }
    );

    const duration = Date.now() - startTime;

    return {
      content: fullResponse,
      usage,
      metadata: {
        model: this.config.model,
        provider: 'ollama',
        duration,
      },
    };
  }
}

/**
 * Enhanced OpenAI Provider using the new adapter
 */
export class EnhancedOpenAIProvider extends LLMProvider {
  private adapter: OpenAIAdapter;
  private readonly logger = createLogger('EnhancedOpenAIProvider');

  constructor(config: LLMConfig) {
    super(config);
    this.adapter = new OpenAIAdapter({
      model: config.model,
      apiKey: config.apiKey,
      baseUrl: config.endpoint,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      timeout: config.timeout,
    });
  }

  async complete(request: LLMRequest): Promise<string> {
    try {
      const messages: LLMMessage[] = [];
      
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const response = await this.adapter.generateCompletion(messages);
      return response.content;
    } catch (error) {
      this.logger.error('Enhanced OpenAI completion failed', error);
      throw error;
    }
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const messages: LLMMessage[] = [];
      
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const startTime = Date.now();
      const response = await this.adapter.generateCompletion(messages);
      const duration = Date.now() - startTime;

      return {
        content: response.content,
        usage: response.usage,
        metadata: {
          model: response.model,
          provider: 'openai',
          duration,
          ...response.metadata,
        },
      };
    } catch (error) {
      this.logger.error('Enhanced OpenAI generation failed', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await this.adapter.testConnection();
    } catch {
      return false;
    }
  }
}

/**
 * Enhanced LLM Provider Factory
 */
export class EnhancedLLMProviderFactory {
  /**
   * Create enhanced provider
   */
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'ollama':
      case 'local':
        return new EnhancedOllamaProvider({
          ...config,
          endpoint: config.endpoint ?? 'http://localhost:11434',
        });
      case 'openai':
        return new EnhancedOpenAIProvider(config);
      default:
        // Fall back to original providers for unsupported types
        const { LLMProviderFactory } = require('./LLMProvider');
        return LLMProviderFactory.create(config);
    }
  }

  /**
   * Auto-detect available provider with enhanced features
   */
  static async detectAvailableProvider(): Promise<LLMProvider | null> {
    // First try Ollama as it's the preferred local option
    try {
      const ollamaProvider = new EnhancedOllamaProvider({
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL ?? 'mistral',
        endpoint: process.env.OLLAMA_ENDPOINT ?? 'http://localhost:11434',
      });
      
      if (await ollamaProvider.isAvailable()) {
        return ollamaProvider;
      }
    } catch (error) {
      // Continue to next provider
    }

    // Fall back to other providers
    const { LLMProviderFactory } = require('./LLMProvider');
    return LLMProviderFactory.detectAvailableProvider();
  }

  /**
   * Create provider with automatic model pull for Ollama
   */
  static async createWithAutoPull(config: LLMConfig): Promise<LLMProvider> {
    const provider = this.create(config);
    
    if (config.provider === 'ollama' && provider instanceof EnhancedOllamaProvider) {
      try {
        // Check if model exists
        const models = await provider.listModels();
        const modelExists = models.some(m => m.name === config.model);
        
        if (!modelExists) {
          console.log(`Model ${config.model} not found. Pulling...`);
          await provider.pullModel();
          console.log(`Model ${config.model} pulled successfully.`);
        }
      } catch (error) {
        console.error('Failed to auto-pull model:', error);
      }
    }
    
    return provider;
  }
}