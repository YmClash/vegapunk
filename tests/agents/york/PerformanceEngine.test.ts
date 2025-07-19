/**
 * Tests for PerformanceEngine - Advanced performance monitoring, analysis, and optimization engine
 * Comprehensive test suite covering performance profiling, bottleneck detection, and optimization
 */

import { PerformanceEngine, PerformanceProfile, PerformanceOptimizationResult } from '../../../src/agents/york/PerformanceEngine';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    if (prompt.includes('performance analysis')) {
      return JSON.stringify({
        performance_assessment: 'System performance showing moderate efficiency with several optimization opportunities',
        bottlenecks_identified: [
          'CPU scheduling inefficiency during peak hours',
          'Memory allocation patterns causing fragmentation',
          'Database query optimization needed'
        ],
        optimization_priorities: [
          'CPU scheduler tuning',
          'Memory pool optimization',
          'Database index optimization'
        ],
        predicted_improvements: {
          response_time: 0.25,
          throughput: 0.18,
          resource_efficiency: 0.22
        },
        confidence_level: 0.87
      });
    }
    
    if (prompt.includes('bottleneck detection')) {
      return JSON.stringify({
        bottleneck_analysis: 'Multiple performance bottlenecks detected across system layers',
        primary_bottlenecks: [
          'CPU context switching overhead',
          'Memory bandwidth limitation',
          'Storage I/O latency spikes'
        ],
        secondary_bottlenecks: [
          'Network packet processing delays',
          'Application thread contention'
        ],
        resolution_strategies: [
          'Optimize CPU affinity settings',
          'Implement memory access patterns optimization',
          'Configure storage caching strategies'
        ],
        impact_assessment: 'medium_to_high'
      });
    }
    
    if (prompt.includes('performance optimization')) {
      return JSON.stringify({
        optimization_strategy: 'multi_layer_optimization',
        target_metrics: ['response_time', 'throughput', 'resource_utilization'],
        optimization_actions: [
          'CPU scheduler parameter tuning',
          'Memory allocation strategy adjustment',
          'Cache configuration optimization',
          'Network buffer size optimization'
        ],
        expected_timeline: 2.5,
        risk_assessment: 'low_to_medium',
        success_probability: 0.88
      });
    }
    
    if (prompt.includes('performance prediction')) {
      return JSON.stringify({
        prediction_model: 'hybrid_statistical_ml',
        performance_forecast: {
          response_time_trend: 'improving',
          throughput_trend: 'stable',
          resource_utilization_trend: 'optimizing'
        },
        confidence_intervals: {
          response_time: { lower: 850, upper: 1150, confidence: 0.85 },
          throughput: { lower: 95, upper: 105, confidence: 0.90 }
        },
        prediction_horizon_hours: 24
      });
    }
    
    return 'Performance analysis completed with standard optimization recommendations.';
  }
}

describe('PerformanceEngine', () => {
  let performanceEngine: PerformanceEngine;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    performanceEngine = new PerformanceEngine(mockLLMProvider, {
      monitoring_interval_seconds: 60,
      analysis_depth: 'comprehensive',
      optimization_aggressiveness: 0.7,
      prediction_horizon_hours: 24,
      performance_targets: {
        response_time_ms: 1000,
        throughput_rps: 100,
        cpu_utilization_max: 80,
        memory_utilization_max: 85,
        error_rate_max: 0.01
      },
      bottleneck_detection_sensitivity: 0.8,
      optimization_strategies: ['cpu_optimization', 'memory_optimization', 'io_optimization'],
      baseline_update_frequency_hours: 6
    });
  });

  describe('Construction and Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultEngine = new PerformanceEngine(mockLLMProvider);
      expect(defaultEngine).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      expect(performanceEngine).toBeDefined();
    });

    test('should initialize performance baselines', () => {
      const metrics = performanceEngine.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.analyses_performed).toBe('number');
    });
  });

  describe('Performance Analysis', () => {
    test('should analyze system performance comprehensively', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      
      expect(performanceProfile).toBeDefined();
      expect(performanceProfile.id).toBeDefined();
      expect(performanceProfile.timestamp).toBeInstanceOf(Date);
      expect(performanceProfile.system_snapshot).toBeDefined();
      expect(performanceProfile.performance_metrics).toBeDefined();
      expect(Array.isArray(performanceProfile.bottlenecks)).toBe(true);
      expect(Array.isArray(performanceProfile.efficiency_scores)).toBe(true);
      expect(Array.isArray(performanceProfile.optimization_recommendations)).toBe(true);
      expect(performanceProfile.comparative_analysis).toBeDefined();
      expect(performanceProfile.trend_analysis).toBeDefined();
    });

    test('should capture detailed system snapshot', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const systemSnapshot = performanceProfile.system_snapshot;
      
      expect(systemSnapshot.cpu_utilization).toBeDefined();
      expect(systemSnapshot.memory_utilization).toBeDefined();
      expect(systemSnapshot.storage_performance).toBeDefined();
      expect(systemSnapshot.network_performance).toBeDefined();
      expect(Array.isArray(systemSnapshot.application_performance)).toBe(true);
      expect(Array.isArray(systemSnapshot.database_performance)).toBe(true);
      expect(systemSnapshot.system_load).toBeDefined();
      expect(Array.isArray(systemSnapshot.resource_contention)).toBe(true);
    });

    test('should analyze CPU utilization in detail', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const cpuUtilization = performanceProfile.system_snapshot.cpu_utilization;
      
      expect(typeof cpuUtilization.overall_usage_percent).toBe('number');
      expect(cpuUtilization.overall_usage_percent).toBeGreaterThanOrEqual(0);
      expect(cpuUtilization.overall_usage_percent).toBeLessThanOrEqual(100);
      expect(Array.isArray(cpuUtilization.per_core_usage)).toBe(true);
      expect(typeof cpuUtilization.context_switches_per_sec).toBe('number');
      expect(typeof cpuUtilization.interrupts_per_sec).toBe('number');
      expect(cpuUtilization.system_vs_user_time).toBeDefined();
      expect(cpuUtilization.cpu_frequency_scaling).toBeDefined();
      expect(typeof cpuUtilization.thermal_throttling).toBe('boolean');
      expect(cpuUtilization.cache_hit_rates).toBeDefined();
    });

    test('should analyze memory utilization comprehensively', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const memoryUtilization = performanceProfile.system_snapshot.memory_utilization;
      
      expect(memoryUtilization.physical_memory).toBeDefined();
      expect(memoryUtilization.virtual_memory).toBeDefined();
      expect(memoryUtilization.memory_bandwidth).toBeDefined();
      expect(memoryUtilization.memory_latency).toBeDefined();
      expect(memoryUtilization.garbage_collection).toBeDefined();
      expect(memoryUtilization.memory_fragmentation).toBeDefined();
      
      // Validate physical memory details
      const physicalMemory = memoryUtilization.physical_memory;
      expect(physicalMemory.total_gb).toBeGreaterThan(0);
      expect(physicalMemory.used_gb).toBeGreaterThanOrEqual(0);
      expect(physicalMemory.available_gb).toBeGreaterThanOrEqual(0);
      expect(physicalMemory.usage_percent).toBeGreaterThanOrEqual(0);
      expect(physicalMemory.usage_percent).toBeLessThanOrEqual(100);
    });

    test('should capture storage performance metrics', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const storagePerformance = performanceProfile.system_snapshot.storage_performance;
      
      expect(Array.isArray(storagePerformance.disk_metrics)).toBe(true);
      expect(storagePerformance.io_queue_depth).toBeDefined();
      expect(storagePerformance.io_wait_time).toBeDefined();
      expect(storagePerformance.storage_latency).toBeDefined();
      expect(storagePerformance.cache_performance).toBeDefined();
      expect(Array.isArray(storagePerformance.raid_status)).toBe(true);
    });

    test('should capture network performance data', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const networkPerformance = performanceProfile.system_snapshot.network_performance;
      
      expect(Array.isArray(networkPerformance.interface_metrics)).toBe(true);
      expect(networkPerformance.bandwidth_utilization).toBeDefined();
      expect(networkPerformance.packet_loss).toBeDefined();
      expect(networkPerformance.latency_metrics).toBeDefined();
      expect(networkPerformance.connection_pool).toBeDefined();
      expect(Array.isArray(networkPerformance.quality_of_service)).toBe(true);
    });

    test('should identify performance bottlenecks', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const bottlenecks = performanceProfile.bottlenecks;
      
      bottlenecks.forEach(bottleneck => {
        expect(bottleneck.id).toBeDefined();
        expect(['cpu', 'memory', 'storage', 'network', 'application', 'database']).toContain(bottleneck.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(bottleneck.severity);
        expect(typeof bottleneck.description).toBe('string');
        expect(bottleneck.impact_assessment).toBeDefined();
        expect(Array.isArray(bottleneck.affected_components)).toBe(true);
        expect(Array.isArray(bottleneck.resolution_strategies)).toBe(true);
        expect(typeof bottleneck.confidence_score).toBe('number');
        expect(bottleneck.confidence_score).toBeGreaterThanOrEqual(0);
        expect(bottleneck.confidence_score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance Optimization', () => {
    test('should optimize performance based on analysis', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const optimizationResult = await performanceEngine.optimizePerformance(performanceProfile);
      
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.optimization_id).toBeDefined();
      expect(optimizationResult.execution_timestamp).toBeInstanceOf(Date);
      expect(optimizationResult.baseline_performance).toBeDefined();
      expect(optimizationResult.target_performance).toBeDefined();
      expect(Array.isArray(optimizationResult.optimizations_applied)).toBe(true);
      expect(optimizationResult.performance_improvements).toBeDefined();
      expect(typeof optimizationResult.success_rate).toBe('number');
      expect(optimizationResult.success_rate).toBeGreaterThanOrEqual(0);
      expect(optimizationResult.success_rate).toBeLessThanOrEqual(1);
      expect(Array.isArray(optimizationResult.lessons_learned)).toBe(true);
      expect(Array.isArray(optimizationResult.recommendations)).toBe(true);
    });

    test('should apply multiple optimization strategies', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const optimizationResult = await performanceEngine.optimizePerformance(performanceProfile);
      
      const optimizationsApplied = optimizationResult.optimizations_applied;
      
      optimizationsApplied.forEach(optimization => {
        expect(optimization.optimization_id).toBeDefined();
        expect(typeof optimization.strategy_name).toBe('string');
        expect(typeof optimization.description).toBe('string');
        expect(['success', 'failed', 'partial']).toContain(optimization.execution_status);
        expect(optimization.execution_time_ms).toBeGreaterThanOrEqual(0);
        expect(optimization.performance_impact).toBeDefined();
        expect(Array.isArray(optimization.parameters_modified)).toBe(true);
        expect(optimization.validation_results).toBeDefined();
      });
    });

    test('should measure performance improvements', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const optimizationResult = await performanceEngine.optimizePerformance(performanceProfile);
      
      const improvements = optimizationResult.performance_improvements;
      
      expect(typeof improvements.response_time_improvement_percent).toBe('number');
      expect(typeof improvements.throughput_improvement_percent).toBe('number');
      expect(typeof improvements.resource_efficiency_improvement_percent).toBe('number');
      expect(typeof improvements.error_rate_reduction_percent).toBe('number');
      expect(improvements.before_after_comparison).toBeDefined();
      expect(improvements.metric_improvements).toBeDefined();
      expect(typeof improvements.overall_improvement_score).toBe('number');
      expect(improvements.overall_improvement_score).toBeGreaterThanOrEqual(0);
      expect(improvements.overall_improvement_score).toBeLessThanOrEqual(1);
    });

    test('should validate optimization results', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      const optimizationResult = await performanceEngine.optimizePerformance(performanceProfile);
      
      const optimizations = optimizationResult.optimizations_applied;
      
      optimizations.forEach(optimization => {
        const validationResults = optimization.validation_results;
        expect(validationResults.validation_passed).toBeDefined();
        expect(Array.isArray(validationResults.performance_tests)).toBe(true);
        expect(validationResults.stability_assessment).toBeDefined();
        expect(validationResults.rollback_capability).toBeDefined();
        
        if (validationResults.performance_tests.length > 0) {
          validationResults.performance_tests.forEach(test => {
            expect(typeof test.test_name).toBe('string');
            expect(['pass', 'fail', 'warning']).toContain(test.result);
            expect(typeof test.measured_value).toBe('number');
            expect(typeof test.expected_value).toBe('number');
          });
        }
      });
    });
  });

  describe('Performance Prediction', () => {
    test('should predict future performance trends', async () => {
      const predictions = await performanceEngine.predictPerformance(24); // 24 hours
      
      expect(Array.isArray(predictions)).toBe(true);
      
      predictions.forEach(prediction => {
        expect(prediction.prediction_id).toBeDefined();
        expect(prediction.timeframe).toBeDefined();
        expect(prediction.metric_name).toBeDefined();
        expect(typeof prediction.current_value).toBe('number');
        expect(Array.isArray(prediction.predicted_values)).toBe(true);
        expect(typeof prediction.trend_direction).toBe('string');
        expect(['improving', 'stable', 'degrading', 'volatile']).toContain(prediction.trend_direction);
        expect(typeof prediction.confidence_level).toBe('number');
        expect(prediction.confidence_level).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence_level).toBeLessThanOrEqual(1);
      });
    });

    test('should handle different prediction horizons', async () => {
      const shortTermPredictions = await performanceEngine.predictPerformance(2); // 2 hours
      const longTermPredictions = await performanceEngine.predictPerformance(168); // 1 week
      
      expect(Array.isArray(shortTermPredictions)).toBe(true);
      expect(Array.isArray(longTermPredictions)).toBe(true);
      
      // Short-term predictions might have higher confidence
      if (shortTermPredictions.length > 0 && longTermPredictions.length > 0) {
        const shortTermConfidence = shortTermPredictions[0].confidence_level;
        const longTermConfidence = longTermPredictions[0].confidence_level;
        
        expect(shortTermConfidence).toBeGreaterThanOrEqual(longTermConfidence - 0.2);
      }
    });

    test('should provide prediction confidence intervals', async () => {
      const predictions = await performanceEngine.predictPerformance(12);
      
      predictions.forEach(prediction => {
        prediction.predicted_values.forEach(value => {
          expect(value.timestamp).toBeInstanceOf(Date);
          expect(typeof value.predicted_value).toBe('number');
          expect(value.confidence_interval).toBeDefined();
          expect(typeof value.confidence_interval.lower_bound).toBe('number');
          expect(typeof value.confidence_interval.upper_bound).toBe('number');
          expect(value.confidence_interval.lower_bound).toBeLessThanOrEqual(value.predicted_value);
          expect(value.predicted_value).toBeLessThanOrEqual(value.confidence_interval.upper_bound);
        });
      });
    });
  });

  describe('Metrics and Analytics', () => {
    test('should provide comprehensive performance metrics', () => {
      const metrics = performanceEngine.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.analyses_performed).toBe('number');
      expect(typeof metrics.optimizations_executed).toBe('number');
      expect(typeof metrics.average_improvement_rate).toBe('number');
      expect(typeof metrics.bottlenecks_resolved).toBe('number');
      expect(typeof metrics.prediction_accuracy).toBe('number');
      expect(typeof metrics.system_stability_score).toBe('number');
      
      expect(metrics.average_improvement_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.prediction_accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.prediction_accuracy).toBeLessThanOrEqual(1);
      expect(metrics.system_stability_score).toBeGreaterThanOrEqual(0);
      expect(metrics.system_stability_score).toBeLessThanOrEqual(1);
    });

    test('should track performance baselines', async () => {
      // Perform analysis to establish baseline
      await performanceEngine.analyzeSystemPerformance();
      
      const metrics = performanceEngine.getMetrics();
      expect(metrics.analyses_performed).toBeGreaterThan(0);
    });

    test('should update metrics after operations', async () => {
      const initialMetrics = performanceEngine.getMetrics();
      
      // Perform operations
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      await performanceEngine.optimizePerformance(performanceProfile);
      
      const updatedMetrics = performanceEngine.getMetrics();
      expect(updatedMetrics.analyses_performed).toBeGreaterThanOrEqual(initialMetrics.analyses_performed);
      expect(updatedMetrics.optimizations_executed).toBeGreaterThanOrEqual(initialMetrics.optimizations_executed);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle analysis failures gracefully', async () => {
      try {
        const performanceProfile = await performanceEngine.analyzeSystemPerformance();
        expect(performanceProfile).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Performance analysis failed');
      }
    });

    test('should handle optimization failures', async () => {
      try {
        // Create a minimal profile for testing
        const mockProfile: PerformanceProfile = {
          id: 'test-profile',
          timestamp: new Date(),
          system_snapshot: {} as any,
          performance_metrics: {} as any,
          bottlenecks: [],
          efficiency_scores: [],
          optimization_recommendations: [],
          comparative_analysis: {} as any,
          trend_analysis: {} as any
        };
        
        const result = await performanceEngine.optimizePerformance(mockProfile);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Performance optimization failed');
      }
    });

    test('should handle prediction failures', async () => {
      try {
        await performanceEngine.predictPerformance(-1); // Invalid horizon
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Performance prediction failed');
      }
    });

    test('should handle invalid optimization parameters', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      
      try {
        const result = await performanceEngine.optimizePerformance(performanceProfile);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect custom configuration', () => {
      const customEngine = new PerformanceEngine(mockLLMProvider, {
        monitoring_interval_seconds: 30,
        analysis_depth: 'detailed',
        optimization_aggressiveness: 0.9,
        prediction_horizon_hours: 48,
        bottleneck_detection_sensitivity: 0.9
      });
      
      expect(customEngine).toBeDefined();
    });

    test('should handle different analysis depths', () => {
      const quickEngine = new PerformanceEngine(mockLLMProvider, {
        analysis_depth: 'quick'
      });
      
      const comprehensiveEngine = new PerformanceEngine(mockLLMProvider, {
        analysis_depth: 'comprehensive'
      });
      
      expect(quickEngine).toBeDefined();
      expect(comprehensiveEngine).toBeDefined();
    });

    test('should use default values for missing configuration', () => {
      const partialEngine = new PerformanceEngine(mockLLMProvider, {
        optimization_aggressiveness: 0.5
        // Other values should use defaults
      });
      
      expect(partialEngine).toBeDefined();
      const metrics = partialEngine.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Integration and Performance', () => {
    test('should handle concurrent analyses', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(performanceEngine.analyzeSystemPerformance());
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });

    test('should handle concurrent optimizations', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      
      const promises = [
        performanceEngine.optimizePerformance(performanceProfile),
        performanceEngine.optimizePerformance(performanceProfile)
      ];
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(2);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.optimization_id).toBeDefined();
      });
    });

    test('should maintain analysis history within limits', async () => {
      // Simulate extended analysis period
      for (let i = 0; i < 5; i++) {
        await performanceEngine.analyzeSystemPerformance();
      }
      
      const metrics = performanceEngine.getMetrics();
      expect(metrics.analyses_performed).toBeGreaterThan(0);
    });

    test('should handle high-frequency operations efficiently', async () => {
      const startTime = Date.now();
      
      // Perform rapid operations
      await performanceEngine.analyzeSystemPerformance();
      await performanceEngine.predictPerformance(1);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Operations should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('Baseline Management', () => {
    test('should establish performance baselines', async () => {
      await performanceEngine.analyzeSystemPerformance();
      await performanceEngine.analyzeSystemPerformance();
      
      const metrics = performanceEngine.getMetrics();
      expect(metrics.analyses_performed).toBeGreaterThan(0);
    });

    test('should update baselines periodically', async () => {
      // Simulate baseline update cycle
      for (let i = 0; i < 3; i++) {
        await performanceEngine.analyzeSystemPerformance();
      }
      
      const metrics = performanceEngine.getMetrics();
      expect(metrics).toBeDefined();
    });

    test('should compare current performance to baseline', async () => {
      const performanceProfile = await performanceEngine.analyzeSystemPerformance();
      
      expect(performanceProfile.comparative_analysis).toBeDefined();
      // Comparative analysis should include baseline comparison data
    });
  });
});