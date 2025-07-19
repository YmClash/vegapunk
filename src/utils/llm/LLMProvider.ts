/**
 * LLM Provider abstraction for multi-model support
 * Supports OpenAI, Mistral, and local models (Ollama)
 */

import { createLogger } from '@utils/logger';
// import type { z } from 'zod'; // Commented out to avoid dependency issues
import type { ValidationSchema } from '@interfaces/base.types';

export interface LLMConfig {
  provider: 'openai' | 'mistral' | 'local' | 'ollama';
  model: string;
  apiKey?: string;
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  schema?: ValidationSchema; // For structured output
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    model: string;
    provider: string;
    duration: number;
  };
}

export abstract class LLMProvider {
  protected readonly logger = createLogger('LLMProvider');
  protected readonly config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate text completion
   */
  abstract complete(request: LLMRequest): Promise<string>;

  /**
   * Check if provider is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.config.provider;
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.config.model;
  }
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider extends LLMProvider {
  private openai?: any;

  constructor(config: LLMConfig) {
    super(config);
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const { OpenAI } = await import('openai');
      this.openai = new OpenAI({
        apiKey: this.config.apiKey ?? process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client', error);
    }
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const startTime = Date.now();

    try {
      const messages = [];
      
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

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
      });

      const duration = Date.now() - startTime;

      return {
        content: response.choices[0]?.message?.content ?? '',
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        metadata: {
          model: this.config.model,
          provider: 'openai',
          duration,
        },
      };
    } catch (error) {
      this.logger.error('OpenAI generation failed', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.openai) {
        await this.initializeClient();
      }
      
      // Test with minimal request
      await this.openai?.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Mistral Provider
 */
export class MistralProvider extends LLMProvider {
  private mistral?: any;

  constructor(config: LLMConfig) {
    super(config);
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const MistralAI = await import('@mistralai/mistralai');
      this.mistral = new MistralAI.default({
        apiKey: this.config.apiKey ?? process.env.MISTRAL_API_KEY,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Mistral client', error);
    }
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.mistral) {
      throw new Error('Mistral client not initialized');
    }

    const startTime = Date.now();

    try {
      const messages = [];
      
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

      const response = await this.mistral.chat({
        model: this.config.model,
        messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
      });

      const duration = Date.now() - startTime;

      return {
        content: response.choices[0]?.message?.content ?? '',
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        metadata: {
          model: this.config.model,
          provider: 'mistral',
          duration,
        },
      };
    } catch (error) {
      this.logger.error('Mistral generation failed', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.mistral) {
        await this.initializeClient();
      }
      
      // Test with minimal request
      await this.mistral.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Ollama Provider (Local models)
 */
export class OllamaProvider extends LLMProvider {
  constructor(config: LLMConfig) {
    super(config);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const endpoint = this.config.endpoint ?? process.env.OLLAMA_ENDPOINT ?? 'http://localhost:11434';

    try {
      const { default: axios } = await import('axios');
      
      const prompt = request.systemPrompt 
        ? `${request.systemPrompt}\n\nUser: ${request.prompt}\nAssistant:`
        : request.prompt;

      const response = await axios.post(`${endpoint}/api/generate`, {
        model: this.config.model,
        prompt,
        stream: false,
        options: {
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          num_predict: request.maxTokens ?? this.config.maxTokens ?? 2048,
        },
      }, {
        timeout: this.config.timeout ?? 30000,
      });

      const duration = Date.now() - startTime;

      return {
        content: response.data.response ?? '',
        metadata: {
          model: this.config.model,
          provider: 'ollama',
          duration,
        },
      };
    } catch (error) {
      this.logger.error('Ollama generation failed', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { default: axios } = await import('axios');
      const endpoint = this.config.endpoint ?? process.env.OLLAMA_ENDPOINT ?? 'http://localhost:11434';
      
      await axios.get(`${endpoint}/api/tags`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * LLM Provider Factory
 */
export class LLMProviderFactory {
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'mistral':
        return new MistralProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      case 'local':
        // For custom local endpoints
        return new OllamaProvider({
          ...config,
          endpoint: config.endpoint ?? process.env.LOCAL_LLM_ENDPOINT,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  /**
   * Auto-detect available provider
   */
  static async detectAvailableProvider(): Promise<LLMProvider | null> {
    const configs: LLMConfig[] = [
      {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL ?? 'mistral:latest',
      },
      {
        provider: 'openai',
        model: process.env.LLM_MODEL ?? 'gpt-4',
      },
      {
        provider: 'mistral',
        model: process.env.LLM_MODEL ?? 'mistral-large-latest',
      },
    ];

    for (const config of configs) {
      try {
        const provider = LLMProviderFactory.create(config);
        if (await provider.isAvailable()) {
          return provider;
        }
      } catch {
        // Continue to next provider
      }
    }

    return null;
  }
}