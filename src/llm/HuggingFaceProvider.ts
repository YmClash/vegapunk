import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface HuggingFaceModel {
  id: string;
  pipeline_tag: string;
  library_name?: string;
  tags?: string[];
}

interface HuggingFaceGenerateRequest {
  inputs: string;
  parameters?: {
    temperature?: number;
    max_length?: number;
    max_new_tokens?: number;
    do_sample?: boolean;
    top_k?: number;
    top_p?: number;
    repetition_penalty?: number;
    return_full_text?: boolean;
  };
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

interface HuggingFaceHealthStatus {
  status: 'healthy' | 'unhealthy' | 'connecting';
  model?: string;
  modelType?: string;
  error?: string;
  lastCheck: Date;
}

export class HuggingFaceProvider extends EventEmitter {
  private apiKey: string;
  private defaultModel: string;
  private currentModel: string;
  private isInitialized: boolean = false;
  private axiosInstance: AxiosInstance;
  private healthStatus: HuggingFaceHealthStatus;
  private baseUrl: string = 'https://huggingface.co/api/models';

  constructor(apiKey?: string, defaultModel?: string) {
    super();
    this.apiKey = apiKey || process.env['HUGGING_FACE_API_KEY'] || '';
    this.defaultModel = defaultModel || process.env['HUGGING_FACE_MODEL'] || 'HuggingFaceTB/SmolLM3-3B';
    this.currentModel = this.defaultModel;
    
    if (!this.apiKey) {
      logger.warn('⚠️ No Hugging Face API key provided. Please set HUGGING_FACE_API_KEY environment variable');
    }
    
    this.axiosInstance = axios.create({
      timeout: 120000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.healthStatus = {
      status: 'connecting',
      lastCheck: new Date()
    };
  }

  async initialize(): Promise<void> {
    try {
      logger.info(`🔧 Initializing Hugging Face provider with model ${this.defaultModel}`);
      
      // Check if API key is available
      if (!this.apiKey) {
        throw new Error('Hugging Face API key is required');
      }
      
      // Check model availability
      await this.checkHealth();
      
      this.isInitialized = true;
      this.emit('initialized');
      logger.info('✅ Hugging Face provider initialized successfully');
    } catch (error: any) {
      logger.error('❌ Hugging Face initialization failed:', error.message);
      this.healthStatus = {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date()
      };
      throw error;
    }
  }

  private async checkHealth(): Promise<void> {
    try {
      // Test the model with a simple request
      const testRequest: HuggingFaceGenerateRequest = {
        inputs: "Hello",
        parameters: {
          max_new_tokens: 10,
          temperature: 0.7,
          return_full_text: false
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };

      const response = await this.axiosInstance.post(
        `${this.baseUrl}/${this.currentModel}`,
        testRequest
      );

      if (response.status === 200) {
        this.healthStatus = {
          status: 'healthy',
          model: this.currentModel,
          modelType: 'text-generation',
          lastCheck: new Date()
        };
        
        logger.info(`✅ Hugging Face service healthy - Model: ${this.currentModel}`);
      }
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Invalid API key';
            break;
          case 404:
            errorMessage = `Model ${this.currentModel} not found`;
            break;
          case 503:
            errorMessage = 'Model is loading, please wait';
            break;
          default:
            errorMessage = error.response.data?.error || error.message;
        }
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(`Hugging Face service not available: ${errorMessage}`);
    }
  }

  async generateResponse(prompt: string, options?: Partial<HuggingFaceGenerateRequest['parameters']>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Hugging Face provider not initialized. Call initialize() first.');
    }

    if (!this.apiKey) {
      throw new Error('Hugging Face API key is required');
    }

    try {
      const request: HuggingFaceGenerateRequest = {
        inputs: prompt,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 512,
          do_sample: true,
          top_k: 50,
          top_p: 0.9,
          repetition_penalty: 1.1,
          return_full_text: false,
          ...options
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };

      logger.debug('Generating response with Hugging Face:', { model: this.currentModel });
      
      const response = await this.axiosInstance.post(
        `${this.baseUrl}/${this.currentModel}`,
        request
      );
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('No response received from Hugging Face');
      }

      // Handle different response formats
      let generatedText = '';
      const firstResult = response.data[0];
      
      if (typeof firstResult === 'string') {
        generatedText = firstResult;
      } else if (firstResult.generated_text !== undefined) {
        generatedText = firstResult.generated_text;
      } else if (firstResult.text !== undefined) {
        generatedText = firstResult.text;
      } else {
        throw new Error('Unexpected response format from Hugging Face');
      }

      // Clean up the response
      generatedText = generatedText.trim();
      
      // Remove the original prompt if it's included in the response
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.substring(prompt.length).trim();
      }

      return generatedText;
    } catch (error: any) {
      logger.error('❌ Hugging Face generation failed:', error.message);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 503:
            throw new Error('Model is currently loading. Please wait a moment and try again.');
          case 429:
            throw new Error('Rate limit exceeded. Please wait before making another request.');
          case 401:
            throw new Error('Invalid Hugging Face API key.');
          default:
            throw new Error(`Hugging Face API error: ${error.response.data?.error || error.message}`);
        }
      }
      
      this.emit('error', error);
      throw error;
    }
  }

  async streamResponse(
    prompt: string, 
    onChunk: (chunk: string) => void,
    options?: Partial<HuggingFaceGenerateRequest['parameters']>
  ): Promise<void> {
    // Hugging Face Inference API doesn't support streaming by default
    // We'll simulate streaming by generating the full response and sending it in chunks
    try {
      logger.debug('Simulating stream generation with Hugging Face:', { model: this.currentModel });
      
      const fullResponse = await this.generateResponse(prompt, options);
      
      // Simulate streaming by sending the response in chunks
      const chunkSize = 5; // Characters per chunk
      const words = fullResponse.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        onChunk(chunk);
        
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      logger.debug('✅ Stream generation completed');
    } catch (error: any) {
      logger.error('❌ Hugging Face streaming failed:', error.message);
      this.emit('error', error);
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      // Popular text generation models on Hugging Face
      return [
        'microsoft/DialoGPT-medium',
        'microsoft/DialoGPT-large',
        'facebook/blenderbot-400M-distill',
        'facebook/blenderbot-3B',
        'microsoft/GODEL-v1_1-base-seq2seq',
        'google/flan-t5-base',
        'google/flan-t5-large',
        'bigscience/bloom-560m',
        'gpt2',
        'gpt2-medium',
        'gpt2-large',
        'distilgpt2'
      ];
    } catch (error: any) {
      logger.error('Failed to list models:', error.message);
      return [];
    }
  }

  async getHealthStatus(): Promise<HuggingFaceHealthStatus> {
    // Update health status if it's been more than 30 seconds
    const timeSinceLastCheck = Date.now() - this.healthStatus.lastCheck.getTime();
    if (timeSinceLastCheck > 30000) {
      try {
        await this.checkHealth();
      } catch (error) {
        // Health check failed, status already updated in checkHealth
      }
    }
    
    return this.healthStatus;
  }

  async setModel(modelName: string): Promise<void> {
    try {
      const availableModels = await this.listModels();
      if (!availableModels.includes(modelName)) {
        logger.warn(`Model ${modelName} not in predefined list, but attempting to use it anyway`);
      }
      
      this.currentModel = modelName;
      logger.info(`🔄 Switched to model: ${modelName}`);
      this.emit('modelChanged', modelName);
      
      // Update health status for new model
      await this.checkHealth();
    } catch (error: any) {
      logger.error(`Failed to switch to model ${modelName}:`, error.message);
      throw error;
    }
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async loadModel(modelName: string): Promise<void> {
    try {
      logger.info(`🔄 Loading model: ${modelName}...`);
      
      // Test the model with a simple request to warm it up
      await this.generateResponse('Hello', { max_new_tokens: 5 });
      
      logger.info(`✅ Model ${modelName} loaded successfully`);
    } catch (error: any) {
      logger.error(`Failed to load model ${modelName}:`, error.message);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.healthStatus.status === 'healthy' && !!this.apiKey;
  }

  getApiKeyStatus(): boolean {
    return !!this.apiKey;
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    logger.info('🔑 Hugging Face API key updated');
  }
}