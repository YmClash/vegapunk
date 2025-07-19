/**
 * Simplified LLM Provider for testing and development
 * Avoids external dependencies while maintaining the interface
 */

import { createLogger } from '@utils/logger';

export interface SimpleLLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SimpleLLMConfig {
  provider: 'mock' | 'ollama' | 'openai' | 'mistral';
  model: string;
  endpoint?: string;
  apiKey?: string;
}

export class SimpleLLMProvider {
  protected readonly logger = createLogger('SimpleLLMProvider');
  protected readonly config: SimpleLLMConfig;

  constructor(config?: Partial<SimpleLLMConfig>) {
    this.config = {
      provider: 'mock',
      model: 'mock-model',
      ...config
    };
  }

  async complete(request: SimpleLLMRequest): Promise<string> {
    this.logger.debug('LLM request', { prompt: request.prompt.substring(0, 100) });

    // Simple mock response based on request content
    if (request.prompt.toLowerCase().includes('threat')) {
      return 'This appears to be a security-related query. Recommend immediate investigation and containment measures.';
    }
    
    if (request.prompt.toLowerCase().includes('ethical')) {
      return 'From an ethical perspective, this action should be evaluated against principles of autonomy, beneficence, and justice.';
    }
    
    if (request.prompt.toLowerCase().includes('maintenance')) {
      return 'System maintenance should be scheduled during low-usage periods with proper backup procedures.';
    }
    
    if (request.prompt.toLowerCase().includes('decision')) {
      return 'Based on the analysis, I recommend proceeding with the highest-benefit, lowest-risk option while maintaining ethical compliance.';
    }

    // Default response
    return `Processed request: ${request.prompt.substring(0, 50)}... [Mock LLM Response]`;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available for mock provider
  }

  getModelInfo() {
    return {
      name: this.config.model,
      provider: this.config.provider
    };
  }
}

// Factory for creating LLM providers
export class LLMProviderFactory {
  static create(config?: Partial<SimpleLLMConfig>): SimpleLLMProvider {
    return new SimpleLLMProvider(config);
  }
}

// Export as default for backward compatibility
export { SimpleLLMProvider as LLMProvider };