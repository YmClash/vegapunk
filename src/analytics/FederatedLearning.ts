/**
 * Federated Learning System
 * Privacy-preserving distributed learning across multiple agents
 */

import { EventEmitter } from 'events';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

export interface ModelUpdate {
  agentId: string;
  modelVersion: string;
  parameters: Map<string, number[]>;
  metrics: {
    loss: number;
    accuracy: number;
    samples: number;
  };
  timestamp: Date;
  signature: string;
}

export interface FederatedModel {
  id: string;
  version: string;
  architecture: string;
  parameters: Map<string, number[]>;
  metadata: {
    created: Date;
    lastUpdated: Date;
    contributors: string[];
    totalSamples: number;
    averageAccuracy: number;
  };
}

export interface LearningRound {
  roundId: string;
  startTime: Date;
  endTime?: Date;
  participants: string[];
  targetModel: string;
  aggregationMethod: 'fedavg' | 'fedprox' | 'scaffold' | 'adaptive';
  status: 'active' | 'aggregating' | 'completed' | 'failed';
  updates: ModelUpdate[];
  result?: FederatedModel;
}

export interface PrivacyConfig {
  differentialPrivacy: boolean;
  epsilon: number; // Privacy budget
  delta: number; // Privacy parameter
  clippingThreshold: number;
  noiseScale: number;
  secureAggregation: boolean;
  homomorphicEncryption: boolean;
}

export interface LearningConfig {
  minParticipants: number;
  roundTimeout: number;
  convergenceThreshold: number;
  maxRounds: number;
  learningRate: number;
  batchSize: number;
  validationSplit: number;
}

export class FederatedLearningSystem extends EventEmitter {
  private llmProvider: LLMProvider;
  private models: Map<string, FederatedModel> = new Map();
  private activeRounds: Map<string, LearningRound> = new Map();
  private privacyConfig: PrivacyConfig;
  private learningConfig: LearningConfig;
  private updateQueue: ModelUpdate[] = [];
  private aggregationInterval: NodeJS.Timeout | null = null;

  constructor(
    llmProvider: LLMProvider,
    privacyConfig?: Partial<PrivacyConfig>,
    learningConfig?: Partial<LearningConfig>
  ) {
    super();
    this.llmProvider = llmProvider;
    
    // Default privacy configuration
    this.privacyConfig = {
      differentialPrivacy: true,
      epsilon: 1.0,
      delta: 1e-5,
      clippingThreshold: 1.0,
      noiseScale: 0.1,
      secureAggregation: true,
      homomorphicEncryption: false,
      ...privacyConfig
    };
    
    // Default learning configuration
    this.learningConfig = {
      minParticipants: 3,
      roundTimeout: 300000, // 5 minutes
      convergenceThreshold: 0.001,
      maxRounds: 100,
      learningRate: 0.01,
      batchSize: 32,
      validationSplit: 0.2,
      ...learningConfig
    };
    
    this.startAggregationCycle();
  }

  /**
   * Initialize a new federated learning round
   */
  async initiateLearningRound(
    modelId: string,
    participants: string[],
    aggregationMethod: LearningRound['aggregationMethod'] = 'fedavg'
  ): Promise<string> {
    try {
      if (participants.length < this.learningConfig.minParticipants) {
        throw new Error(`Minimum ${this.learningConfig.minParticipants} participants required`);
      }
      
      const roundId = `round-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const round: LearningRound = {
        roundId,
        startTime: new Date(),
        participants,
        targetModel: modelId,
        aggregationMethod,
        status: 'active',
        updates: []
      };
      
      this.activeRounds.set(roundId, round);
      
      // Notify participants
      this.emit('round:started', {
        roundId,
        modelId,
        participants
      });
      
      // Set timeout for round
      setTimeout(() => {
        if (this.activeRounds.get(roundId)?.status === 'active') {
          this.finalizeRound(roundId);
        }
      }, this.learningConfig.roundTimeout);
      
      logger.info(`Initiated federated learning round ${roundId} with ${participants.length} participants`);
      return roundId;
    } catch (error) {
      logger.error('Failed to initiate learning round:', error);
      throw error;
    }
  }

  /**
   * Submit model update from an agent
   */
  async submitModelUpdate(
    roundId: string,
    update: Omit<ModelUpdate, 'signature'>
  ): Promise<void> {
    try {
      const round = this.activeRounds.get(roundId);
      if (!round) {
        throw new Error('Round not found or already completed');
      }
      
      if (round.status !== 'active') {
        throw new Error('Round is not accepting updates');
      }
      
      if (!round.participants.includes(update.agentId)) {
        throw new Error('Agent not authorized for this round');
      }
      
      // Apply privacy preservation
      const privateUpdate = await this.applyPrivacyMechanisms(update);
      
      // Sign the update
      const signature = this.signUpdate(privateUpdate);
      const signedUpdate: ModelUpdate = {
        ...privateUpdate,
        signature
      };
      
      round.updates.push(signedUpdate);
      this.updateQueue.push(signedUpdate);
      
      this.emit('update:received', {
        roundId,
        agentId: update.agentId,
        updateNumber: round.updates.length
      });
      
      // Check if all updates received
      if (round.updates.length === round.participants.length) {
        await this.finalizeRound(roundId);
      }
    } catch (error) {
      logger.error('Failed to submit model update:', error);
      throw error;
    }
  }

  /**
   * Apply privacy-preserving mechanisms
   */
  private async applyPrivacyMechanisms(
    update: Omit<ModelUpdate, 'signature'>
  ): Promise<Omit<ModelUpdate, 'signature'>> {
    try {
      let parameters = new Map(update.parameters);
      
      // Apply differential privacy
      if (this.privacyConfig.differentialPrivacy) {
        parameters = this.addDifferentialNoise(parameters);
      }
      
      // Apply gradient clipping
      parameters = this.clipGradients(parameters);
      
      // Apply secure aggregation preparation
      if (this.privacyConfig.secureAggregation) {
        parameters = await this.prepareSecureAggregation(parameters);
      }
      
      return {
        ...update,
        parameters
      };
    } catch (error) {
      logger.error('Failed to apply privacy mechanisms:', error);
      throw error;
    }
  }

  /**
   * Add differential privacy noise
   */
  private addDifferentialNoise(
    parameters: Map<string, number[]>
  ): Map<string, number[]> {
    const noisyParams = new Map<string, number[]>();
    
    for (const [key, values] of parameters.entries()) {
      const noisyValues = values.map(value => {
        // Laplace noise for differential privacy
        const noise = this.laplacianNoise(
          0,
          this.privacyConfig.clippingThreshold / this.privacyConfig.epsilon
        );
        return value + noise * this.privacyConfig.noiseScale;
      });
      noisyParams.set(key, noisyValues);
    }
    
    return noisyParams;
  }

  /**
   * Generate Laplacian noise
   */
  private laplacianNoise(mu: number, b: number): number {
    const u = Math.random() - 0.5;
    return mu - b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Clip gradients to bound sensitivity
   */
  private clipGradients(
    parameters: Map<string, number[]>
  ): Map<string, number[]> {
    const clippedParams = new Map<string, number[]>();
    const threshold = this.privacyConfig.clippingThreshold;
    
    for (const [key, values] of parameters.entries()) {
      // Calculate L2 norm
      const norm = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
      
      // Clip if necessary
      if (norm > threshold) {
        const scale = threshold / norm;
        clippedParams.set(
          key,
          values.map(val => val * scale)
        );
      } else {
        clippedParams.set(key, values);
      }
    }
    
    return clippedParams;
  }

  /**
   * Prepare parameters for secure aggregation
   */
  private async prepareSecureAggregation(
    parameters: Map<string, number[]>
  ): Promise<Map<string, number[]>> {
    // In a real implementation, this would involve:
    // 1. Secret sharing
    // 2. Homomorphic encryption
    // 3. Secure multi-party computation
    // For now, we'll simulate with basic masking
    
    const maskedParams = new Map<string, number[]>();
    
    for (const [key, values] of parameters.entries()) {
      const mask = crypto.randomBytes(values.length * 4);
      const maskedValues = values.map((val, i) => {
        const maskValue = mask.readFloatLE(i * 4);
        return val + maskValue;
      });
      maskedParams.set(key, maskedValues);
    }
    
    return maskedParams;
  }

  /**
   * Finalize a learning round and aggregate updates
   */
  private async finalizeRound(roundId: string): Promise<void> {
    try {
      const round = this.activeRounds.get(roundId);
      if (!round) return;
      
      round.status = 'aggregating';
      this.emit('round:aggregating', { roundId });
      
      // Perform aggregation based on method
      const aggregatedModel = await this.aggregateUpdates(
        round.updates,
        round.aggregationMethod
      );
      
      // Update global model
      this.models.set(aggregatedModel.id, aggregatedModel);
      
      // Complete round
      round.endTime = new Date();
      round.status = 'completed';
      round.result = aggregatedModel;
      
      this.emit('round:completed', {
        roundId,
        modelId: aggregatedModel.id,
        participants: round.participants.length,
        accuracy: aggregatedModel.metadata.averageAccuracy
      });
      
      // Clean up
      setTimeout(() => {
        this.activeRounds.delete(roundId);
      }, 3600000); // Keep for 1 hour for reference
      
      logger.info(`Completed federated learning round ${roundId}`);
    } catch (error) {
      logger.error('Failed to finalize round:', error);
      const round = this.activeRounds.get(roundId);
      if (round) {
        round.status = 'failed';
      }
    }
  }

  /**
   * Aggregate model updates using specified method
   */
  private async aggregateUpdates(
    updates: ModelUpdate[],
    method: LearningRound['aggregationMethod']
  ): Promise<FederatedModel> {
    try {
      switch (method) {
        case 'fedavg':
          return this.federatedAveraging(updates);
        case 'fedprox':
          return this.federatedProximal(updates);
        case 'scaffold':
          return this.scaffoldAggregation(updates);
        case 'adaptive':
          return this.adaptiveAggregation(updates);
        default:
          throw new Error(`Unknown aggregation method: ${method}`);
      }
    } catch (error) {
      logger.error('Aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Federated Averaging (FedAvg)
   */
  private federatedAveraging(updates: ModelUpdate[]): FederatedModel {
    const aggregatedParams = new Map<string, number[]>();
    const totalSamples = updates.reduce((sum, u) => sum + u.metrics.samples, 0);
    
    // Get all parameter keys
    const paramKeys = new Set<string>();
    updates.forEach(update => {
      update.parameters.forEach((_, key) => paramKeys.add(key));
    });
    
    // Weighted average for each parameter
    for (const key of paramKeys) {
      const weightedSum = new Array(
        updates[0].parameters.get(key)?.length || 0
      ).fill(0);
      
      for (const update of updates) {
        const values = update.parameters.get(key);
        if (values) {
          const weight = update.metrics.samples / totalSamples;
          values.forEach((val, i) => {
            weightedSum[i] += val * weight;
          });
        }
      }
      
      aggregatedParams.set(key, weightedSum);
    }
    
    const modelId = `model-${Date.now()}`;
    return {
      id: modelId,
      version: '1.0',
      architecture: 'federated',
      parameters: aggregatedParams,
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        contributors: updates.map(u => u.agentId),
        totalSamples,
        averageAccuracy: updates.reduce((sum, u) => sum + u.metrics.accuracy, 0) / updates.length
      }
    };
  }

  /**
   * Federated Proximal (FedProx)
   */
  private federatedProximal(updates: ModelUpdate[]): FederatedModel {
    // FedProx adds a proximal term to handle heterogeneity
    const mu = 0.01; // Proximal parameter
    const baseModel = this.federatedAveraging(updates);
    
    // Apply proximal regularization
    const proximalParams = new Map<string, number[]>();
    
 n    for (const [key, values] of baseModel.parameters.entries()) {
      const proximalValues = values.map((val, i) => {
        // Add proximal term to prevent divergence
        const proximalTerm = updates.reduce((sum, update) => {
          const updateVal = update.parameters.get(key)?.[i] || 0;
          return sum + mu * (val - updateVal) ** 2;
        }, 0) / updates.length;
        
        return val - this.learningConfig.learningRate * proximalTerm;
      });
      proximalParams.set(key, proximalValues);
    }
    
    return {
      ...baseModel,
      parameters: proximalParams
    };
  }

  /**
   * SCAFFOLD aggregation for handling data heterogeneity
   */
  private scaffoldAggregation(updates: ModelUpdate[]): FederatedModel {
    // SCAFFOLD uses control variates to correct for client drift
    const baseModel = this.federatedAveraging(updates);
    const scaffoldParams = new Map<string, number[]>();
    
    // Calculate global control variate
    for (const [key, values] of baseModel.parameters.entries()) {
      const controlVariate = new Array(values.length).fill(0);
      
      // Average local updates
      for (const update of updates) {
        const localValues = update.parameters.get(key);
        if (localValues) {
          localValues.forEach((val, i) => {
            controlVariate[i] += (val - values[i]) / updates.length;
          });
        }
      }
      
      // Apply SCAFFOLD correction
      const correctedValues = values.map((val, i) => {
        return val + this.learningConfig.learningRate * controlVariate[i];
      });
      
      scaffoldParams.set(key, correctedValues);
    }
    
    return {
      ...baseModel,
      parameters: scaffoldParams
    };
  }

  /**
   * Adaptive aggregation based on model performance
   */
  private async adaptiveAggregation(updates: ModelUpdate[]): Promise<FederatedModel> {
    try {
      // Use LLM to analyze update patterns and determine optimal aggregation
      const prompt = `Analyze these federated learning updates and determine optimal aggregation weights:

Updates:
${updates.map(u => `Agent ${u.agentId}: accuracy=${u.metrics.accuracy}, loss=${u.metrics.loss}, samples=${u.metrics.samples}`).join('\n')}

Consider:
1. Model accuracy and loss
2. Number of training samples
3. Potential data distribution differences
4. Model convergence patterns

Provide aggregation weights for each agent (must sum to 1.0):`;

      const response = await this.llmProvider.generateResponse([
        { role: 'system', content: 'You are an expert in federated learning optimization.' },
        { role: 'user', content: prompt }
      ]);

      // Parse weights from response
      const weights = this.parseAggregationWeights(response, updates.length);
      
      // Apply adaptive weights
      const aggregatedParams = new Map<string, number[]>();
      const paramKeys = new Set<string>();
      updates.forEach(update => {
        update.parameters.forEach((_, key) => paramKeys.add(key));
      });
      
      for (const key of paramKeys) {
        const weightedSum = new Array(
          updates[0].parameters.get(key)?.length || 0
        ).fill(0);
        
        updates.forEach((update, idx) => {
          const values = update.parameters.get(key);
          if (values) {
            values.forEach((val, i) => {
              weightedSum[i] += val * weights[idx];
            });
          }
        });
        
        aggregatedParams.set(key, weightedSum);
      }
      
      const modelId = `model-adaptive-${Date.now()}`;
      return {
        id: modelId,
        version: '1.0',
        architecture: 'federated-adaptive',
        parameters: aggregatedParams,
        metadata: {
          created: new Date(),
          lastUpdated: new Date(),
          contributors: updates.map(u => u.agentId),
          totalSamples: updates.reduce((sum, u) => sum + u.metrics.samples, 0),
          averageAccuracy: updates.reduce((sum, u, i) => sum + u.metrics.accuracy * weights[i], 0)
        }
      };
    } catch (error) {
      logger.error('Adaptive aggregation failed, falling back to FedAvg:', error);
      return this.federatedAveraging(updates);
    }
  }

  /**
   * Parse aggregation weights from LLM response
   */
  private parseAggregationWeights(response: string, count: number): number[] {
    const weights: number[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const match = line.match(/\d+\.\d+/);
      if (match) {
        weights.push(parseFloat(match[0]));
      }
    }
    
    // Ensure we have the right number of weights
    if (weights.length !== count) {
      // Fall back to equal weights
      return new Array(count).fill(1 / count);
    }
    
    // Normalize to sum to 1
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(w => w / sum);
  }

  /**
   * Sign model update for integrity
   */
  private signUpdate(update: Omit<ModelUpdate, 'signature'>): string {
    const data = JSON.stringify({
      agentId: update.agentId,
      modelVersion: update.modelVersion,
      metrics: update.metrics,
      timestamp: update.timestamp
    });
    
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): FederatedModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get active learning rounds
   */
  getActiveRounds(): LearningRound[] {
    return Array.from(this.activeRounds.values()).filter(
      round => round.status === 'active'
    );
  }

  /**
   * Get learning statistics
   */
  getStatistics(): any {
    const stats = {
      totalModels: this.models.size,
      activeRounds: this.getActiveRounds().length,
      totalRounds: Array.from(this.activeRounds.values()).length,
      averageRoundDuration: 0,
      averageParticipants: 0,
      convergenceRate: 0,
      privacyBudgetUsed: 0
    };
    
    const completedRounds = Array.from(this.activeRounds.values()).filter(
      r => r.status === 'completed'
    );
    
    if (completedRounds.length > 0) {
      stats.averageRoundDuration = completedRounds.reduce((sum, r) => {
        return sum + (r.endTime!.getTime() - r.startTime.getTime());
      }, 0) / completedRounds.length / 1000; // in seconds
      
      stats.averageParticipants = completedRounds.reduce(
        (sum, r) => sum + r.participants.length, 0
      ) / completedRounds.length;
      
      // Calculate convergence rate based on accuracy improvements
      const accuracies = completedRounds
        .map(r => r.result?.metadata.averageAccuracy || 0)
        .filter(a => a > 0);
      
      if (accuracies.length > 1) {
        const improvements = accuracies.slice(1).map((a, i) => a - accuracies[i]);
        stats.convergenceRate = improvements.reduce((a, b) => a + b, 0) / improvements.length;
      }
    }
    
    // Estimate privacy budget usage
    stats.privacyBudgetUsed = this.updateQueue.length * this.privacyConfig.epsilon;
    
    return stats;
  }

  /**
   * Start periodic aggregation cycle
   */
  private startAggregationCycle(): void {
    this.aggregationInterval = setInterval(() => {
      // Process queued updates
      if (this.updateQueue.length > 0) {
        const updates = this.updateQueue.splice(0, 10); // Process up to 10 at a time
        this.emit('updates:processing', { count: updates.length });
      }
      
      // Check for stuck rounds
      for (const [roundId, round] of this.activeRounds.entries()) {
        const elapsed = Date.now() - round.startTime.getTime();
        if (elapsed > this.learningConfig.roundTimeout && round.status === 'active') {
          this.finalizeRound(roundId);
        }
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Export federated model
   */
  async exportModel(modelId: string, format: 'json' | 'onnx' = 'json'): Promise<string> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error('Model not found');
      }
      
      if (format === 'json') {
        return JSON.stringify(model, (key, value) => {
          if (value instanceof Map) {
            return Object.fromEntries(value);
          }
          return value;
        }, 2);
      }
      
      // ONNX format would require actual conversion
      throw new Error('ONNX export not yet implemented');
    } catch (error) {
      logger.error('Failed to export model:', error);
      throw error;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    this.removeAllListeners();
    this.models.clear();
    this.activeRounds.clear();
    this.updateQueue = [];
  }
}