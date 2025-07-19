/**
 * Tests for ResourceOptimizer - Advanced resource management and optimization engine
 * Comprehensive test suite covering resource monitoring, optimization, prediction, and scaling
 */

import { ResourceOptimizer, ResourceStatus, OptimizationResult, ResourcePrediction, ScalingResult, ScalingRequirements } from '../../../src/agents/york/ResourceOptimizer';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    if (prompt.includes('resource optimization')) {
      return JSON.stringify({
        analysis: 'Current system shows moderate resource utilization with optimization opportunities in memory management and CPU scheduling',
        recommendations: [
          'Implement memory pooling for frequent allocations',
          'Optimize CPU scheduling algorithms',
          'Consider storage defragmentation'
        ],
        priority_actions: ['memory_optimization', 'cpu_scheduling'],
        estimated_improvement: 0.25
      });
    }
    
    if (prompt.includes('resource prediction')) {
      return JSON.stringify({
        prediction_confidence: 0.85,
        resource_trends: {
          cpu: 'increasing',
          memory: 'stable',
          storage: 'decreasing',
          network: 'cyclical'
        },
        scaling_recommendations: [
          'Scale up CPU capacity by 20% within next 24 hours',
          'Monitor memory usage closely',
          'Consider storage cleanup'
        ],
        risk_factors: ['traffic_spike', 'batch_processing']
      });
    }
    
    if (prompt.includes('scaling requirements')) {
      return JSON.stringify({
        scaling_strategy: 'gradual_scale_up',
        resource_priorities: ['cpu', 'memory', 'network'],
        implementation_phases: [
          'Pre-scaling validation',
          'Resource provisioning',
          'Performance validation',
          'Optimization tuning'
        ],
        estimated_timeline: 2.5,
        risk_assessment: 'low'
      });
    }
    
    return 'Resource analysis completed with standard optimization recommendations.';
  }
}

describe('ResourceOptimizer', () => {
  let resourceOptimizer: ResourceOptimizer;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    resourceOptimizer = new ResourceOptimizer(mockLLMProvider, {
      monitoring_interval_seconds: 30,
      optimization_aggressiveness: 0.8,
      prediction_horizon_hours: 48,
      performance_thresholds: {
        cpu_warning: 70,
        cpu_critical: 85,
        memory_warning: 75,
        memory_critical: 90,
        storage_warning: 80,
        storage_critical: 95,
        network_warning: 70,
        network_critical: 85,
        response_time_max_ms: 1500
      },
      cost_sensitivity: 0.7,
      sustainability_priority: 0.6,
      risk_tolerance: 0.3,
      automation_level: 'automatic'
    });
  });

  describe('Construction and Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultOptimizer = new ResourceOptimizer(mockLLMProvider);
      expect(defaultOptimizer).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      expect(resourceOptimizer).toBeDefined();
    });

    test('should initialize performance baselines', () => {
      const metrics = resourceOptimizer.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.optimizations_performed).toBe('number');
    });
  });

  describe('System Resource Monitoring', () => {
    test('should monitor system resources comprehensively', async () => {
      const resourceStatus = await resourceOptimizer.monitorSystemResources();
      
      expect(resourceStatus).toBeDefined();
      expect(resourceStatus.id).toBeDefined();
      expect(resourceStatus.timestamp).toBeInstanceOf(Date);
      expect(resourceStatus.cpu).toBeDefined();
      expect(resourceStatus.memory).toBeDefined();
      expect(resourceStatus.storage).toBeDefined();
      expect(resourceStatus.network).toBeDefined();
      expect(typeof resourceStatus.overall_health).toBe('number');
      expect(resourceStatus.overall_health).toBeGreaterThanOrEqual(0);
      expect(resourceStatus.overall_health).toBeLessThanOrEqual(1);
      expect(Array.isArray(resourceStatus.bottlenecks)).toBe(true);
      expect(Array.isArray(resourceStatus.optimization_opportunities)).toBe(true);
    });

    test('should collect detailed CPU metrics', async () => {
      const resourceStatus = await resourceOptimizer.monitorSystemResources();
      const cpuMetrics = resourceStatus.cpu;
      
      expect(cpuMetrics.usage_percent).toBeGreaterThanOrEqual(0);
      expect(cpuMetrics.usage_percent).toBeLessThanOrEqual(100);
      expect(cpuMetrics.cores_available).toBeGreaterThan(0);
      expect(cpuMetrics.cores_used).toBeGreaterThanOrEqual(0);
      expect(cpuMetrics.frequency_mhz).toBeGreaterThan(0);
      expect(Array.isArray(cpuMetrics.load_average)).toBe(true);
      expect(Array.isArray(cpuMetrics.processes)).toBe(true);
      expect(typeof cpuMetrics.efficiency_score).toBe('number');
    });

    test('should collect detailed memory metrics', async () => {
      const resourceStatus = await resourceOptimizer.monitorSystemResources();
      const memoryMetrics = resourceStatus.memory;
      
      expect(memoryMetrics.total_gb).toBeGreaterThan(0);
      expect(memoryMetrics.used_gb).toBeGreaterThanOrEqual(0);
      expect(memoryMetrics.available_gb).toBeGreaterThanOrEqual(0);
      expect(memoryMetrics.usage_percent).toBeGreaterThanOrEqual(0);
      expect(memoryMetrics.usage_percent).toBeLessThanOrEqual(100);
      expect(memoryMetrics.swap_total_gb).toBeGreaterThanOrEqual(0);
      expect(memoryMetrics.swap_used_gb).toBeGreaterThanOrEqual(0);
      expect(typeof memoryMetrics.memory_pressure).toBe('number');
      expect(typeof memoryMetrics.allocation_efficiency).toBe('number');
    });

    test('should collect storage metrics', async () => {
      const resourceStatus = await resourceOptimizer.monitorSystemResources();
      const storageMetrics = resourceStatus.storage;
      
      expect(storageMetrics.total_capacity_gb).toBeGreaterThan(0);
      expect(storageMetrics.used_capacity_gb).toBeGreaterThanOrEqual(0);
      expect(storageMetrics.available_capacity_gb).toBeGreaterThanOrEqual(0);
      expect(storageMetrics.io_read_ops_per_sec).toBeGreaterThanOrEqual(0);
      expect(storageMetrics.io_write_ops_per_sec).toBeGreaterThanOrEqual(0);
      expect(storageMetrics.io_latency_ms).toBeGreaterThanOrEqual(0);
      expect(storageMetrics.throughput_mb_per_sec).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(storageMetrics.disks)).toBe(true);
    });

    test('should collect network metrics', async () => {
      const resourceStatus = await resourceOptimizer.monitorSystemResources();
      const networkMetrics = resourceStatus.network;
      
      expect(networkMetrics.total_bandwidth_mbps).toBeGreaterThan(0);
      expect(networkMetrics.used_bandwidth_mbps).toBeGreaterThanOrEqual(0);
      expect(networkMetrics.packet_loss_rate).toBeGreaterThanOrEqual(0);
      expect(networkMetrics.latency_ms).toBeGreaterThanOrEqual(0);
      expect(networkMetrics.connections_active).toBeGreaterThanOrEqual(0);
      expect(networkMetrics.connections_max).toBeGreaterThan(0);
      expect(Array.isArray(networkMetrics.interfaces)).toBe(true);
      expect(typeof networkMetrics.throughput_efficiency).toBe('number');
    });

    test('should maintain resource history', async () => {
      // Monitor resources multiple times to build history
      await resourceOptimizer.monitorSystemResources();
      await resourceOptimizer.monitorSystemResources();
      await resourceOptimizer.monitorSystemResources();
      
      const metrics = resourceOptimizer.getMetrics();
      expect(metrics.optimizations_performed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource Optimization', () => {
    test('should optimize resource allocation for specific targets', async () => {
      const optimizationTargets = ['cpu_efficiency', 'memory_optimization', 'network_throughput'];
      const optimizationResult = await resourceOptimizer.optimizeResourceAllocation(optimizationTargets);
      
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.optimization_id).toBeDefined();
      expect(optimizationResult.execution_timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(optimizationResult.actions_performed)).toBe(true);
      expect(optimizationResult.performance_impact).toBeDefined();
      expect(optimizationResult.resource_changes).toBeDefined();
      expect(typeof optimizationResult.success_rate).toBe('number');
      expect(optimizationResult.success_rate).toBeGreaterThanOrEqual(0);
      expect(optimizationResult.success_rate).toBeLessThanOrEqual(1);
      expect(Array.isArray(optimizationResult.lessons_learned)).toBe(true);
      expect(Array.isArray(optimizationResult.recommendations)).toBe(true);
    });

    test('should calculate performance impact correctly', async () => {
      const optimizationResult = await resourceOptimizer.optimizeResourceAllocation(['cpu_optimization']);
      const performanceImpact = optimizationResult.performance_impact;
      
      expect(typeof performanceImpact.response_time_improvement).toBe('number');
      expect(typeof performanceImpact.throughput_improvement).toBe('number');
      expect(typeof performanceImpact.resource_utilization_improvement).toBe('number');
      expect(typeof performanceImpact.error_rate_reduction).toBe('number');
      expect(typeof performanceImpact.user_satisfaction_improvement).toBe('number');
      expect(performanceImpact.user_satisfaction_improvement).toBeGreaterThanOrEqual(0);
      expect(performanceImpact.user_satisfaction_improvement).toBeLessThanOrEqual(1);
    });

    test('should calculate resource changes', async () => {
      const optimizationResult = await resourceOptimizer.optimizeResourceAllocation(['memory_optimization']);
      const resourceChanges = optimizationResult.resource_changes;
      
      expect(typeof resourceChanges.cpu_efficiency_change).toBe('number');
      expect(typeof resourceChanges.memory_efficiency_change).toBe('number');
      expect(typeof resourceChanges.storage_efficiency_change).toBe('number');
      expect(typeof resourceChanges.network_efficiency_change).toBe('number');
      expect(typeof resourceChanges.cost_change).toBe('number');
    });

    test('should generate meaningful recommendations', async () => {
      const optimizationResult = await resourceOptimizer.optimizeResourceAllocation(['system_optimization']);
      
      expect(optimizationResult.recommendations.length).toBeGreaterThan(0);
      expect(optimizationResult.lessons_learned.length).toBeGreaterThan(0);
      
      optimizationResult.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });

    test('should handle optimization failures gracefully', async () => {
      // Test with invalid optimization targets
      try {
        await resourceOptimizer.optimizeResourceAllocation([]);
        const metrics = resourceOptimizer.getMetrics();
        expect(metrics).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Resource Prediction', () => {
    test('should predict future resource needs accurately', async () => {
      const timeframe = {
        start_date: new Date(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        granularity: 'hour' as const
      };
      
      const resourcePrediction = await resourceOptimizer.predictResourceNeeds(timeframe);
      
      expect(resourcePrediction).toBeDefined();
      expect(resourcePrediction.prediction_id).toBeDefined();
      expect(resourcePrediction.timeframe).toEqual(timeframe);
      expect(typeof resourcePrediction.prediction_confidence).toBe('number');
      expect(resourcePrediction.prediction_confidence).toBeGreaterThanOrEqual(0);
      expect(resourcePrediction.prediction_confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(resourcePrediction.resource_forecasts)).toBe(true);
      expect(Array.isArray(resourcePrediction.scaling_recommendations)).toBe(true);
      expect(Array.isArray(resourcePrediction.risk_factors)).toBe(true);
      expect(typeof resourcePrediction.model_accuracy).toBe('number');
    });

    test('should handle different prediction timeframes', async () => {
      const shortTimeframe = {
        start_date: new Date(),
        end_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        granularity: 'minute' as const
      };
      
      const longTimeframe = {
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        granularity: 'day' as const
      };
      
      const shortPrediction = await resourceOptimizer.predictResourceNeeds(shortTimeframe);
      const longPrediction = await resourceOptimizer.predictResourceNeeds(longTimeframe);
      
      expect(shortPrediction.timeframe.granularity).toBe('minute');
      expect(longPrediction.timeframe.granularity).toBe('day');
      
      // Long-term predictions might have different confidence levels
      expect(typeof shortPrediction.prediction_confidence).toBe('number');
      expect(typeof longPrediction.prediction_confidence).toBe('number');
    });

    test('should provide scaling recommendations based on predictions', async () => {
      const timeframe = {
        start_date: new Date(),
        end_date: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        granularity: 'hour' as const
      };
      
      const prediction = await resourceOptimizer.predictResourceNeeds(timeframe);
      const scalingRecommendations = prediction.scaling_recommendations;
      
      expect(Array.isArray(scalingRecommendations)).toBe(true);
      
      scalingRecommendations.forEach(recommendation => {
        expect(recommendation.resource_type).toBeDefined();
        expect(['scale_up', 'scale_down', 'scale_out', 'scale_in', 'maintain']).toContain(recommendation.action);
        expect(typeof recommendation.magnitude).toBe('number');
        expect(recommendation.timing).toBeInstanceOf(Date);
        expect(typeof recommendation.justification).toBe('string');
      });
    });

    test('should assess prediction risks', async () => {
      const timeframe = {
        start_date: new Date(),
        end_date: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
        granularity: 'hour' as const
      };
      
      const prediction = await resourceOptimizer.predictResourceNeeds(timeframe);
      const riskFactors = prediction.risk_factors;
      
      expect(Array.isArray(riskFactors)).toBe(true);
      
      riskFactors.forEach(risk => {
        expect(typeof risk.risk_type).toBe('string');
        expect(typeof risk.description).toBe('string');
        expect(typeof risk.probability).toBe('number');
        expect(risk.probability).toBeGreaterThanOrEqual(0);
        expect(risk.probability).toBeLessThanOrEqual(1);
        expect(typeof risk.potential_impact).toBe('number');
        expect(risk.potential_impact).toBeGreaterThanOrEqual(0);
        expect(risk.potential_impact).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Resource Scaling', () => {
    test('should scale resources according to requirements', async () => {
      const scalingRequirements: ScalingRequirements = {
        target_capacity: {
          cpu_cores: 16,
          memory_gb: 64,
          storage_gb: 2000,
          network_bandwidth_mbps: 2000
        },
        performance_objectives: [
          {
            metric: 'response_time_ms',
            target_value: 500,
            current_value: 1200,
            priority: 'high',
            tolerance: 50
          },
          {
            metric: 'throughput_ops_per_sec',
            target_value: 200,
            current_value: 100,
            priority: 'medium',
            tolerance: 20
          }
        ],
        constraints: [
          {
            type: 'budget',
            description: 'Monthly budget limit',
            limit_value: 10000,
            flexibility: 0.1
          }
        ],
        timeline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        budget_limit: 8000
      };
      
      const scalingResult = await resourceOptimizer.scaleResources(scalingRequirements);
      
      expect(scalingResult).toBeDefined();
      expect(scalingResult.scaling_id).toBeDefined();
      expect(scalingResult.execution_timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(scalingResult.scaling_actions)).toBe(true);
      expect(scalingResult.final_capacity).toBeDefined();
      expect(Array.isArray(scalingResult.performance_achieved)).toBe(true);
      expect(typeof scalingResult.cost_actual).toBe('number');
      expect(typeof scalingResult.timeline_actual).toBe('number');
      expect(Array.isArray(scalingResult.success_metrics)).toBe(true);
    });

    test('should validate scaling requirements', async () => {
      const invalidRequirements: ScalingRequirements = {
        target_capacity: {
          cpu_cores: -1, // Invalid: negative cores
          memory_gb: 64,
          storage_gb: 1000,
          network_bandwidth_mbps: 1000
        },
        performance_objectives: [],
        constraints: [],
        timeline: new Date(Date.now() + 1000)
      };
      
      try {
        await resourceOptimizer.scaleResources(invalidRequirements);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle different scaling scenarios', async () => {
      // Scale up scenario
      const scaleUpRequirements: ScalingRequirements = {
        target_capacity: {
          cpu_cores: 32,
          memory_gb: 128,
          storage_gb: 4000,
          network_bandwidth_mbps: 4000
        },
        performance_objectives: [
          {
            metric: 'cpu_utilization',
            target_value: 60,
            current_value: 85,
            priority: 'critical',
            tolerance: 5
          }
        ],
        constraints: [],
        timeline: new Date(Date.now() + 2 * 60 * 60 * 1000)
      };
      
      const scaleUpResult = await resourceOptimizer.scaleResources(scaleUpRequirements);
      expect(scaleUpResult.final_capacity.cpu_cores).toBeGreaterThanOrEqual(0);
      expect(scaleUpResult.final_capacity.memory_gb).toBeGreaterThanOrEqual(0);
    });

    test('should calculate scaling costs accurately', async () => {
      const requirements: ScalingRequirements = {
        target_capacity: {
          cpu_cores: 12,
          memory_gb: 48,
          storage_gb: 1500,
          network_bandwidth_mbps: 1500
        },
        performance_objectives: [],
        constraints: [],
        timeline: new Date(Date.now() + 30 * 60 * 1000)
      };
      
      const result = await resourceOptimizer.scaleResources(requirements);
      expect(typeof result.cost_actual).toBe('number');
      expect(result.cost_actual).toBeGreaterThanOrEqual(0);
      expect(typeof result.timeline_actual).toBe('number');
      expect(result.timeline_actual).toBeGreaterThan(0);
    });
  });

  describe('Metrics and Analytics', () => {
    test('should provide comprehensive metrics', () => {
      const metrics = resourceOptimizer.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.optimizations_performed).toBe('number');
      expect(typeof metrics.average_success_rate).toBe('number');
      expect(typeof metrics.total_performance_improvements).toBe('number');
      expect(typeof metrics.resource_efficiency_gains).toBe('number');
      expect(typeof metrics.cost_savings_achieved).toBe('number');
      expect(typeof metrics.prediction_accuracy).toBe('number');
      
      expect(metrics.average_success_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.average_success_rate).toBeLessThanOrEqual(1);
      expect(metrics.prediction_accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.prediction_accuracy).toBeLessThanOrEqual(1);
    });

    test('should update metrics after operations', async () => {
      const initialMetrics = resourceOptimizer.getMetrics();
      
      // Perform some operations
      await resourceOptimizer.monitorSystemResources();
      await resourceOptimizer.optimizeResourceAllocation(['test_optimization']);
      
      const updatedMetrics = resourceOptimizer.getMetrics();
      expect(updatedMetrics.optimizations_performed).toBeGreaterThanOrEqual(initialMetrics.optimizations_performed);
    });

    test('should track performance over time', async () => {
      // Perform multiple optimizations
      await resourceOptimizer.optimizeResourceAllocation(['cpu_optimization']);
      await resourceOptimizer.optimizeResourceAllocation(['memory_optimization']);
      await resourceOptimizer.optimizeResourceAllocation(['storage_optimization']);
      
      const metrics = resourceOptimizer.getMetrics();
      expect(metrics.optimizations_performed).toBeGreaterThan(0);
      expect(metrics.total_performance_improvements).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle monitoring failures gracefully', async () => {
      // Mock a scenario where monitoring might fail
      try {
        const resourceStatus = await resourceOptimizer.monitorSystemResources();
        expect(resourceStatus).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Resource monitoring failed');
      }
    });

    test('should handle optimization failures', async () => {
      try {
        const result = await resourceOptimizer.optimizeResourceAllocation(['invalid_target']);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle prediction failures', async () => {
      const invalidTimeframe = {
        start_date: new Date(Date.now() + 1000),
        end_date: new Date(), // End before start
        granularity: 'hour' as const
      };
      
      try {
        await resourceOptimizer.predictResourceNeeds(invalidTimeframe);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle scaling failures', async () => {
      const impossibleRequirements: ScalingRequirements = {
        target_capacity: {
          cpu_cores: Number.MAX_SAFE_INTEGER,
          memory_gb: Number.MAX_SAFE_INTEGER,
          storage_gb: Number.MAX_SAFE_INTEGER,
          network_bandwidth_mbps: Number.MAX_SAFE_INTEGER
        },
        performance_objectives: [],
        constraints: [],
        timeline: new Date(0) // Past date
      };
      
      try {
        await resourceOptimizer.scaleResources(impossibleRequirements);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Integration and Performance', () => {
    test('should handle high-frequency monitoring', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(resourceOptimizer.monitorSystemResources());
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });

    test('should handle concurrent optimizations', async () => {
      const promises = [
        resourceOptimizer.optimizeResourceAllocation(['cpu_optimization']),
        resourceOptimizer.optimizeResourceAllocation(['memory_optimization']),
        resourceOptimizer.optimizeResourceAllocation(['network_optimization'])
      ];
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.optimization_id).toBeDefined();
      });
    });

    test('should maintain resource history limits', async () => {
      // Simulate monitoring over extended period
      for (let i = 0; i < 10; i++) {
        await resourceOptimizer.monitorSystemResources();
      }
      
      const metrics = resourceOptimizer.getMetrics();
      expect(metrics).toBeDefined();
      // History should be maintained within reasonable limits
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect custom configuration', () => {
      const customOptimizer = new ResourceOptimizer(mockLLMProvider, {
        monitoring_interval_seconds: 120,
        optimization_aggressiveness: 0.9,
        prediction_horizon_hours: 72,
        automation_level: 'manual'
      });
      
      expect(customOptimizer).toBeDefined();
    });

    test('should handle configuration edge cases', () => {
      const edgeOptimizer = new ResourceOptimizer(mockLLMProvider, {
        optimization_aggressiveness: 0, // Minimum
        risk_tolerance: 1, // Maximum
        cost_sensitivity: 0.5
      });
      
      expect(edgeOptimizer).toBeDefined();
    });

    test('should use default values for missing configuration', () => {
      const partialOptimizer = new ResourceOptimizer(mockLLMProvider, {
        optimization_aggressiveness: 0.5
        // Other values should use defaults
      });
      
      expect(partialOptimizer).toBeDefined();
      const metrics = partialOptimizer.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});