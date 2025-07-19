import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
  };
}

interface OllamaHealthStatus {
  status: 'healthy' | 'unhealthy' | 'connecting';
  version?: string;
  models?: string[];
  error?: string;
  lastCheck: Date;
}

export class OllamaProvider extends EventEmitter {
  private baseUrl: string;
  private defaultModel: string;
  private isInitialized: boolean = false;
  private axiosInstance: AxiosInstance;
  private healthStatus: OllamaHealthStatus;

  constructor(baseUrl?: string, defaultModel?: string) {
    super();
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = defaultModel || process.env.OLLAMA_MODEL || 'qwen2:7b';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000,
      headers: {
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
      logger.info(`🔧 Initializing Ollama provider at ${this.baseUrl}`);
      
      // Check if Ollama service is running
      await this.checkHealth();
      
      // Ensure default model is available
      await this.ensureModel(this.defaultModel);
      
      this.isInitialized = true;
      this.emit('initialized');
      logger.info('✅ Ollama provider initialized successfully');
    } catch (error: any) {
      logger.error('❌ Ollama initialization failed:', error.message);
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
      const response = await this.axiosInstance.get('/api/version');
      const version = response.data.version;
      
      // Get list of available models
      const modelsResponse = await this.axiosInstance.get('/api/tags');
      const models = modelsResponse.data.models?.map((m: OllamaModel) => m.name) || [];
      
      this.healthStatus = {
        status: 'healthy',
        version,
        models,
        lastCheck: new Date()
      };
      
      logger.info(`✅ Ollama service healthy - Version: ${version}`);
      logger.info(`📦 Available models: ${models.join(', ')}`);
    } catch (error: any) {
      throw new Error(`Ollama service not available at ${this.baseUrl}. Please ensure Ollama is running with: ollama serve`);
    }
  }

  private async ensureModel(modelName: string): Promise<void> {
    try {
      // Check if model exists
      const response = await this.axiosInstance.get('/api/tags');
      const models = response.data.models || [];
      const modelExists = models.some((m: OllamaModel) => m.name === modelName);
      
      if (modelExists) {
        logger.info(`✅ Model ${modelName} is available`);
        return;
      }
      
      // Pull model if it doesn't exist
      logger.info(`📥 Pulling model ${modelName}... This may take a few minutes.`);
      
      const pullResponse = await this.axiosInstance.post('/api/pull', {
        name: modelName,
        stream: false
      });
      
      if (pullResponse.status === 200) {
        logger.info(`✅ Model ${modelName} pulled successfully`);
      }
    } catch (error: any) {
      logger.warn(`⚠️ Could not verify/pull model ${modelName}:`, error.message);
      logger.warn('Continuing anyway - model might be available under a different name');
    }
  }

  async generateResponse(prompt: string, options?: Partial<OllamaGenerateRequest['options']>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Ollama provider not initialized. Call initialize() first.');
    }

    try {
      const request: OllamaGenerateRequest = {
        model: this.defaultModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1024,
          ...options
        }
      };

      logger.debug('Generating response with Ollama:', { model: request.model });
      
      const response = await this.axiosInstance.post('/api/generate', request);
      
      if (!response.data.response) {
        throw new Error('No response received from Ollama');
      }

      return response.data.response;
    } catch (error: any) {
      logger.error('❌ Ollama generation failed:', error.message);
      this.emit('error', error);
      throw error;
    }
  }

  async streamResponse(
    prompt: string, 
    onChunk: (chunk: string) => void,
    options?: Partial<OllamaGenerateRequest['options']>
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Ollama provider not initialized. Call initialize() first.');
    }

    try {
      const request: OllamaGenerateRequest = {
        model: this.defaultModel,
        prompt,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 1024,
          ...options
        }
      };

      logger.debug('Starting stream generation with Ollama:', { model: request.model });
      
      const response = await this.axiosInstance.post('/api/generate', request, {
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                onChunk(data.response);
              }
              if (data.done) {
                logger.debug('✅ Stream generation completed');
                resolve();
              }
            } catch (parseError) {
              logger.warn('Failed to parse chunk:', parseError);
            }
          }
        });

        response.data.on('error', (error: Error) => {
          logger.error('Stream error:', error);
          reject(error);
        });

        response.data.on('end', () => {
          resolve();
        });
      });
    } catch (error: any) {
      logger.error('❌ Ollama streaming failed:', error.message);
      this.emit('error', error);
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/api/tags');
      const models = response.data.models || [];
      return models.map((m: OllamaModel) => m.name);
    } catch (error: any) {
      logger.error('Failed to list models:', error.message);
      return [];
    }
  }

  async getHealthStatus(): Promise<OllamaHealthStatus> {
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

  setModel(modelName: string): void {
    this.defaultModel = modelName;
    logger.info(`🔄 Switched to model: ${modelName}`);
  }

  getModel(): string {
    return this.defaultModel;
  }

  isReady(): boolean {
    return this.isInitialized && this.healthStatus.status === 'healthy';
  }
}