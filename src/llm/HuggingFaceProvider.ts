import { HfInference } from '@huggingface/inference';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import axios from 'axios';

interface HuggingFaceModel {
  id: string;
  pipeline_tag: string;
  library_name?: string;
  tags?: string[];
}

interface HuggingFaceGenerateOptions {
  temperature?: number;
  max_new_tokens?: number;
  do_sample?: boolean;
  top_k?: number;
  top_p?: number;
  repetition_penalty?: number;
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
  private client: HfInference;
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
    
    // Initialize the official Hugging Face client
    this.client = new HfInference(this.apiKey);

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
      
      // Mark as initialized without strict health check
      // The health check will be done on demand
      this.isInitialized = true;
      this.healthStatus = {
        status: 'healthy',
        model: this.currentModel,
        modelType: 'text-generation',
        lastCheck: new Date()
      };
      
      this.emit('initialized');
      logger.info('✅ Hugging Face provider initialized successfully');
      
      // Try health check in background (non-blocking)
      setTimeout(async () => {
        try {
          await this.checkHealth();
        } catch (error: any) {
          logger.warn('⚠️ Background health check failed, but provider remains available:', error.message);
        }
      }, 1000);
      
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
      // Test the model with a simple request using the official client
      logger.debug('Testing Hugging Face model health...');
      
      const result = await this.client.textGeneration({
        model: this.currentModel,
        inputs: "Hello",
        parameters: {
          max_new_tokens: 5,
          temperature: 0.7,
          return_full_text: false
        }
      });

      if (result && result.generated_text !== undefined) {
        this.healthStatus = {
          status: 'healthy',
          model: this.currentModel,
          modelType: 'text-generation',
          lastCheck: new Date()
        };
        
        logger.info(`✅ Hugging Face service healthy - Model: ${this.currentModel}`);
      } else {
        throw new Error('No response received from model');
      }
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      logger.error(`Hugging Face health check failed: ${errorMessage}`);
      
      this.healthStatus = {
        status: 'unhealthy',
        error: errorMessage,
        lastCheck: new Date()
      };
      
      throw new Error(`Hugging Face service not available: ${errorMessage}`);
    }
  }

  async generateResponse(prompt: string, options?: Partial<HuggingFaceGenerateOptions>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Hugging Face provider not initialized. Call initialize() first.');
    }

    if (!this.apiKey) {
      throw new Error('Hugging Face API key is required');
    }

    try {
      logger.debug('Generating response with Hugging Face:', { model: this.currentModel });
      
      const result = await this.client.textGeneration({
        model: this.currentModel,
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
        }
      });

      if (!result || result.generated_text === undefined) {
        throw new Error('No response received from Hugging Face');
      }

      // Clean up the response
      let generatedText = result.generated_text.trim();
      
      // Remove the original prompt if it's included in the response
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.substring(prompt.length).trim();
      }

      return generatedText;
    } catch (error: any) {
      logger.error('❌ Hugging Face generation failed:', error.message);
      
      // Handle specific error cases from the official client
      if (error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      } else if (error.message.includes('authorization') || error.message.includes('401')) {
        throw new Error('Invalid Hugging Face API key.');
      } else if (error.message.includes('503') || error.message.includes('loading')) {
        throw new Error('Model is currently loading. Please wait a moment and try again.');
      }
      
      this.emit('error', error);
      throw error;
    }
  }

  async streamResponse(
    prompt: string, 
    onChunk: (chunk: string) => void,
    options?: Partial<HuggingFaceGenerateOptions>
  ): Promise<void> {
    try {
      logger.debug('Streaming response with Hugging Face:', { model: this.currentModel });
      
      // Use the official client's textGenerationStream method
      const stream = this.client.textGenerationStream({
        model: this.currentModel,
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
        }
      });

      for await (const chunk of stream) {
        if (chunk.token && chunk.token.text) {
          onChunk(chunk.token.text);
        }
      }
      
      logger.debug('✅ Stream generation completed');
    } catch (error: any) {
      logger.warn('❌ Streaming not available, falling back to simulated streaming:', error.message);
      
      // Fallback to simulated streaming if real streaming fails
      try {
        const fullResponse = await this.generateResponse(prompt, options);
        
        // Simulate streaming by sending the response in chunks
        const words = fullResponse.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          onChunk(chunk);
          
          // Add a small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        logger.debug('✅ Simulated stream generation completed');
      } catch (fallbackError: any) {
        logger.error('❌ Hugging Face streaming failed:', fallbackError.message);
        this.emit('error', fallbackError);
        throw fallbackError;
      }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      logger.info('🔍 Fetching available Hugging Face models from API...');
      
      // Fetch text generation models from Hugging Face API
      const response = await axios.get('https://huggingface.co/api/models', {
        params: {
          pipeline_tag: 'text-generation',
          sort: 'downloads',
          direction: -1,
          limit: 20
        },
        headers: {
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined
        },
        timeout: 10000
      });

      if (response.data && Array.isArray(response.data)) {
        const models = response.data
          .filter((model: HuggingFaceModel) => 
            model.pipeline_tag === 'text-generation' && 
            model.id && 
            !model.id.includes('private') &&
            model.library_name !== 'diffusers' // Exclude image generation models
          )
          .map((model: HuggingFaceModel) => model.id)
          .slice(0, 15); // Limit to top 15 models

        logger.info(`✅ Found ${models.length} text generation models`);
        return models;
      } else {
        throw new Error('Invalid response format from Hugging Face API');
      }
    } catch (error: any) {
      logger.warn('⚠️ Failed to fetch models from API, using fallback list:', error.message);
      
      // Fallback to popular models if API fails
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
        'distilgpt2',
        'HuggingFaceTB/SmolLM3-3B',
        'HuggingFaceTB/SmolLM2-1.7B-Instruct'
      ];
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
    this.client = new HfInference(apiKey);
    logger.info('🔑 Hugging Face API key updated');
  }
}