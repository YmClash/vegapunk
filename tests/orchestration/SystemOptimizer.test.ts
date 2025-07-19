/**
 * System Optimizer Tests
 * Comprehensive test suite for the SystemOptimizer component
 * Testing global system optimization, adaptive learning, and performance tuning
 */

import { SystemOptimizer, SystemConditions, SystemOptimization, WorkloadBalance, Adaptation, SystemLearning, StrategyImprovement } from '../../src/orchestration/SystemOptimizer';
import { LLMProvider } from '../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    if (prompt.includes('system optimization')) {
      return JSON.stringify({
        optimization_strategies: ['load_balancing', 'resource_optimization', 'performance_tuning'],
        optimization_priorities: ['throughput', 'latency', 'reliability'],
        estimated_improvements: { performance: 15, efficiency: 20, reliability: 10 }
      });
    }
    if (prompt.includes('workload balancing')) {
      return JSON.stringify({
        balancing_strategy: 'dynamic_allocation',
        rebalancing_actions: ['redistribute_tasks', 'scale_resources'],
        expected_improvements: { load_distribution: 0.85, efficiency: 0.78 }
      });
    }
    if (prompt.includes('adaptive learning')) {
      return JSON.stringify({
        learning_insights: ['pattern_recognition', 'performance_correlation'],
        behavioral_patterns: ['peak_usage_trends', 'resource_bottlenecks'],
        optimization_recommendations: ['proactive_scaling', 'predictive_maintenance']
      });
    }
    return JSON.stringify({ analysis: 'mock_response' });
  }

  async chat(messages: any[]): Promise<string> {
    return 'Mock chat response';
  }
}

describe('SystemOptimizer', () => {
  let systemOptimizer: SystemOptimizer;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    systemOptimizer = new SystemOptimizer(mockLLMProvider, {
      optimization_frequency_minutes: 60,
      learning_rate: 0.01,
      adaptation_threshold: 0.1,
      performance_target_threshold: 0.85,
      workload_balance_target: 0.8,
      resource_utilization_target: 0.75,
      auto_optimization: true,
      learning_window_hours: 24,
      strategy_update_frequency_hours: 168
    });
  });

  describe('System Performance Optimization', () => {
    test('should optimize system performance comprehensively', async () => {
      const optimization = await systemOptimizer.optimizeSystemPerformance();

      expect(optimization).toBeDefined();
      expect(optimization.optimization_id).toBeDefined();
      expect(optimization.optimization_timestamp).toBeDefined();
      expect(optimization.optimization_type).toBeDefined();
      expect(optimization.current_performance_state).toBeDefined();
      expect(optimization.optimization_strategies).toBeDefined();
      expect(optimization.implementation_plan).toBeDefined();
      expect(optimization.expected_improvements).toBeDefined();
      expect(optimization.resource_adjustments).toBeDefined();
      expect(optimization.risk_assessment).toBeDefined();
    });

    test('should identify performance bottlenecks', async () => {
      const optimization = await systemOptimizer.optimizeSystemPerformance();

      expect(optimization.current_performance_state.bottlenecks).toBeDefined();
      optimization.current_performance_state.bottlenecks.forEach(bottleneck => {
        expect(bottleneck.component).toBeDefined();
        expect(bottleneck.bottleneck_type).toBeDefined();
        expect(bottleneck.severity).toBeGreaterThanOrEqual(0);
        expect(bottleneck.severity).toBeLessThanOrEqual(1);
        expect(bottleneck.impact_scope).toBeDefined();
        expect(bottleneck.resolution_strategies).toBeDefined();
      });
    });

    test('should provide realistic improvement estimates', async () => {
      const optimization = await systemOptimizer.optimizeSystemPerformance();

      expect(optimization.expected_improvements.performance_gain).toBeGreaterThanOrEqual(0);
      expect(optimization.expected_improvements.efficiency_improvement).toBeGreaterThanOrEqual(0);
      expect(optimization.expected_improvements.reliability_enhancement).toBeGreaterThanOrEqual(0);
      expect(optimization.expected_improvements.cost_reduction).toBeGreaterThanOrEqual(0);
      expect(optimization.expected_improvements.user_experience_improvement).toBeGreaterThanOrEqual(0);
      expect(optimization.expected_improvements.confidence_level).toBeGreaterThan(0);
      expect(optimization.expected_improvements.confidence_level).toBeLessThanOrEqual(1);
    });

    test('should create implementable optimization plans', async () => {
      const optimization = await systemOptimizer.optimizeSystemPerformance();

      expect(optimization.implementation_plan.implementation_phases).toBeDefined();
      expect(optimization.implementation_plan.total_duration_minutes).toBeGreaterThan(0);
      expect(optimization.implementation_plan.resource_requirements).toBeDefined();
      expect(optimization.implementation_plan.risk_mitigation_strategies).toBeDefined();
      expect(optimization.implementation_plan.success_criteria).toBeDefined();
      expect(optimization.implementation_plan.rollback_procedures).toBeDefined();
    });
  });

  describe('Workload Balancing', () => {
    test('should balance agent workloads effectively', async () => {
      const workloadBalance = await systemOptimizer.balanceAgentWorkloads();

      expect(workloadBalance).toBeDefined();
      expect(workloadBalance.balance_id).toBeDefined();
      expect(workloadBalance.balance_timestamp).toBeDefined();
      expect(workloadBalance.current_workload_distribution).toBeDefined();
      expect(workloadBalance.optimized_distribution).toBeDefined();
      expect(workloadBalance.rebalancing_actions).toBeDefined();
      expect(workloadBalance.performance_impact).toBeDefined();
      expect(workloadBalance.agent_satisfaction_impact).toBeDefined();
    });

    test('should redistribute workloads based on agent capabilities', async () => {
      const workloadBalance = await systemOptimizer.balanceAgentWorkloads();

      workloadBalance.rebalancing_actions.forEach(action => {
        expect(action.action_type).toBeDefined();
        expect(action.source_agent).toBeDefined();
        expect(action.target_agent).toBeDefined();
        expect(action.workload_transfer_amount).toBeGreaterThan(0);
        expect(action.rationale).toBeDefined();
        expect(action.expected_impact).toBeDefined();
      });
    });

    test('should improve overall system balance', async () => {
      const workloadBalance = await systemOptimizer.balanceAgentWorkloads();

      expect(workloadBalance.balance_improvement.overall_balance_score).toBeGreaterThanOrEqual(0);
      expect(workloadBalance.balance_improvement.overall_balance_score).toBeLessThanOrEqual(1);
      expect(workloadBalance.balance_improvement.load_variance_reduction).toBeGreaterThanOrEqual(0);
      expect(workloadBalance.balance_improvement.efficiency_gain).toBeGreaterThanOrEqual(0);
      expect(workloadBalance.balance_improvement.throughput_improvement).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Adaptive System Behavior', () => {
    test('should adapt to changing system conditions', async () => {
      const conditions: SystemConditions = {
        workload_patterns: [
          {
            pattern_id: 'peak-hours',
            pattern_type: 'cyclical',
            time_period: {
              start_time: new Date(),
              end_time: new Date(Date.now() + 4 * 60 * 60 * 1000),
              recurrence_pattern: 'daily',
              duration_minutes: 240
            },
            intensity: 0.9,
            resource_impact: [
              {
                resource_type: 'cpu',
                impact_magnitude: 0.8,
                impact_duration: 240,
                recovery_time: 60
              }
            ],
            predictability: 0.85,
            trend_direction: 'increasing'
          }
        ],
        resource_availability: {
          computational_resources: {
            cpu_availability: {
              total_capacity: 100,
              available_capacity: 60,
              reserved_capacity: 20,
              utilization_percentage: 60,
              efficiency_score: 0.8
            },
            memory_availability: {
              total_capacity: 100,
              available_capacity: 75,
              reserved_capacity: 10,
              utilization_percentage: 75,
              efficiency_score: 0.85
            },
            storage_availability: {
              total_capacity: 1000,
              available_capacity: 800,
              reserved_capacity: 100,
              utilization_percentage: 20,
              efficiency_score: 0.9
            },
            network_bandwidth: {
              total_capacity: 1000,
              available_capacity: 850,
              reserved_capacity: 50,
              utilization_percentage: 15,
              efficiency_score: 0.95
            }
          },
          agent_capacity: [
            {
              agent_id: 'atlas-001',
              agent_type: 'AtlasAgent',
              current_workload: 0.7,
              available_capacity: 0.3,
              efficiency_rating: 0.85,
              specialization_areas: ['ethics', 'knowledge_synthesis'],
              performance_trend: 'stable'
            }
          ],
          infrastructure_status: {
            health_score: 0.9,
            maintenance_requirements: [],
            upgrade_opportunities: [],
            bottlenecks: [],
            redundancy_status: []
          },
          external_dependencies: [],
          scalability_options: []
        },
        performance_metrics: {
          overall_throughput: 85,
          average_response_time: 250,
          error_rate: 0.02,
          resource_utilization_efficiency: 0.78,
          user_satisfaction_score: 0.88,
          system_stability_score: 0.92
        },
        agent_status: [
          {
            agent_id: 'atlas-001',
            operational_status: 'active',
            current_workload: 0.7,
            performance_score: 0.85,
            health_indicators: { cpu_usage: 0.6, memory_usage: 0.5, error_rate: 0.01 },
            recent_activities: ['ethics_analysis', 'knowledge_synthesis'],
            collaboration_status: 'available'
          }
        ],
        environmental_factors: [
          {
            factor_type: 'external_load',
            factor_name: 'Peak user activity',
            impact_level: 'high',
            current_intensity: 0.8,
            trend_direction: 'increasing',
            predictability: 0.9
          }
        ],
        user_demands: [
          {
            demand_type: 'performance',
            description: 'Faster response times during peak hours',
            priority: 'high',
            target_metrics: { response_time: 200, throughput: 120 },
            user_segments: ['enterprise_users'],
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ],
        system_constraints: [
          {
            constraint_type: 'resource',
            description: 'Limited CPU capacity during peak hours',
            impact_level: 'medium',
            affected_components: ['task_processing', 'agent_coordination'],
            mitigation_options: ['load_balancing', 'resource_scaling']
          }
        ]
      };

      const adaptation = await systemOptimizer.adaptToChangingConditions(conditions);

      expect(adaptation).toBeDefined();
      expect(adaptation.adaptation_id).toBeDefined();
      expect(adaptation.adaptation_timestamp).toBeDefined();
      expect(adaptation.triggering_conditions).toBeDefined();
      expect(adaptation.adaptation_strategies).toBeDefined();
      expect(adaptation.system_adjustments).toBeDefined();
      expect(adaptation.adaptation_effectiveness).toBeDefined();
      expect(adaptation.monitoring_requirements).toBeDefined();
    });

    test('should learn from system behavior patterns', async () => {
      const learning = await systemOptimizer.learnFromSystemBehavior();

      expect(learning).toBeDefined();
      expect(learning.learning_id).toBeDefined();
      expect(learning.learning_timestamp).toBeDefined();
      expect(learning.behavioral_patterns_identified).toBeDefined();
      expect(learning.performance_correlations).toBeDefined();
      expect(learning.optimization_insights).toBeDefined();
      expect(learning.predictive_models_updated).toBeDefined();
      expect(learning.confidence_metrics).toBeDefined();
    });

    test('should update behavioral models based on learning', async () => {
      const learning = await systemOptimizer.learnFromSystemBehavior();

      learning.behavioral_patterns_identified.forEach(pattern => {
        expect(pattern.pattern_name).toBeDefined();
        expect(pattern.pattern_type).toBeDefined();
        expect(pattern.frequency).toBeDefined();
        expect(pattern.impact_scope).toBeDefined();
        expect(pattern.confidence_level).toBeGreaterThan(0);
        expect(pattern.confidence_level).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Orchestration Strategy Improvement', () => {
    test('should improve orchestration strategies', async () => {
      const strategyImprovement = await systemOptimizer.improveOrchestrationStrategies();

      expect(strategyImprovement).toBeDefined();
      expect(strategyImprovement.improvement_id).toBeDefined();
      expect(strategyImprovement.improvement_timestamp).toBeDefined();
      expect(strategyImprovement.current_strategies).toBeDefined();
      expect(strategyImprovement.improvement_opportunities).toBeDefined();
      expect(strategyImprovement.new_strategies).toBeDefined();
      expect(strategyImprovement.implementation_roadmap).toBeDefined();
      expect(strategyImprovement.success_metrics).toBeDefined();
    });

    test('should identify strategy improvement opportunities', async () => {
      const strategyImprovement = await systemOptimizer.improveOrchestrationStrategies();

      strategyImprovement.improvement_opportunities.forEach(opportunity => {
        expect(opportunity.area).toBeDefined();
        expect(opportunity.current_performance).toBeGreaterThanOrEqual(0);
        expect(opportunity.target_performance).toBeGreaterThan(opportunity.current_performance);
        expect(opportunity.improvement_potential).toBeGreaterThan(0);
        expect(opportunity.implementation_complexity).toBeDefined();
        expect(opportunity.risk_level).toBeDefined();
      });
    });

    test('should create realistic implementation roadmaps', async () => {
      const strategyImprovement = await systemOptimizer.improveOrchestrationStrategies();

      expect(strategyImprovement.implementation_roadmap.phases).toBeDefined();
      expect(strategyImprovement.implementation_roadmap.total_duration_weeks).toBeGreaterThan(0);
      expect(strategyImprovement.implementation_roadmap.resource_requirements).toBeDefined();
      expect(strategyImprovement.implementation_roadmap.success_criteria).toBeDefined();
      expect(strategyImprovement.implementation_roadmap.risk_mitigation).toBeDefined();
    });
  });

  describe('Performance Monitoring and Metrics', () => {
    test('should provide comprehensive system metrics', async () => {
      const metrics = systemOptimizer.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.total_optimizations_performed).toBeGreaterThanOrEqual(0);
      expect(metrics.average_optimization_effectiveness).toBeGreaterThanOrEqual(0);
      expect(metrics.average_optimization_effectiveness).toBeLessThanOrEqual(1);
      expect(metrics.workload_balancing_success_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.workload_balancing_success_rate).toBeLessThanOrEqual(1);
      expect(metrics.adaptive_learning_progress).toBeGreaterThanOrEqual(0);
      expect(metrics.strategy_improvement_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.system_stability_improvement).toBeGreaterThanOrEqual(0);
      expect(metrics.resource_utilization_optimization).toBeGreaterThanOrEqual(0);
    });

    test('should track optimization trends over time', async () => {
      // Perform multiple optimizations
      await systemOptimizer.optimizeSystemPerformance();
      await systemOptimizer.balanceAgentWorkloads();
      await systemOptimizer.learnFromSystemBehavior();

      const metrics = systemOptimizer.getMetrics();
      expect(metrics.optimization_trend).toBeDefined();
      expect(metrics.performance_trend).toBeDefined();
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect custom configuration parameters', () => {
      const customConfig = {
        optimization_frequency_minutes: 30,
        learning_rate: 0.02,
        adaptation_threshold: 0.05,
        performance_target_threshold: 0.9
      };

      const customOptimizer = new SystemOptimizer(mockLLMProvider, customConfig);
      const metrics = customOptimizer.getMetrics();

      expect(metrics).toBeDefined();
    });

    test('should use default configuration when not provided', () => {
      const defaultOptimizer = new SystemOptimizer(mockLLMProvider);
      const metrics = defaultOptimizer.getMetrics();

      expect(metrics).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle LLM provider errors gracefully', async () => {
      const errorLLMProvider = {
        generateResponse: async () => { throw new Error('LLM unavailable'); },
        chat: async () => { throw new Error('LLM unavailable'); }
      } as LLMProvider;

      const errorOptimizer = new SystemOptimizer(errorLLMProvider);

      await expect(errorOptimizer.optimizeSystemPerformance())
        .rejects.toThrow('System optimization failed');
    });

    test('should handle invalid system conditions', async () => {
      const invalidConditions = {} as SystemConditions;

      await expect(systemOptimizer.adaptToChangingConditions(invalidConditions))
        .rejects.toThrow();
    });

    test('should maintain system stability during optimization failures', async () => {
      // Simulate optimization failure
      const originalGenerateResponse = mockLLMProvider.generateResponse;
      mockLLMProvider.generateResponse = async () => {
        throw new Error('Temporary LLM failure');
      };

      try {
        await systemOptimizer.optimizeSystemPerformance();
      } catch (error) {
        // Expect controlled failure
        expect(error).toBeDefined();
      }

      // Restore LLM provider
      mockLLMProvider.generateResponse = originalGenerateResponse;

      // System should still be functional
      const metrics = systemOptimizer.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Integration and Compatibility', () => {
    test('should integrate with different agent types', async () => {
      const conditions = createMockSystemConditions(['atlas-001', 'edison-001', 'pythagoras-001']);
      const adaptation = await systemOptimizer.adaptToChangingConditions(conditions);

      expect(adaptation.system_adjustments.agent_adjustments).toBeDefined();
      adaptation.system_adjustments.agent_adjustments.forEach(adjustment => {
        expect(adjustment.agent_id).toBeDefined();
        expect(adjustment.adjustment_type).toBeDefined();
        expect(adjustment.adjustment_parameters).toBeDefined();
      });
    });

    test('should handle resource scaling scenarios', async () => {
      const scalingConditions = createMockSystemConditions(['atlas-001'], true);
      const adaptation = await systemOptimizer.adaptToChangingConditions(scalingConditions);

      expect(adaptation.system_adjustments.resource_adjustments).toBeDefined();
      adaptation.system_adjustments.resource_adjustments.forEach(adjustment => {
        expect(adjustment.resource_type).toBeDefined();
        expect(adjustment.adjustment_action).toBeDefined();
        expect(adjustment.target_capacity).toBeGreaterThan(0);
      });
    });
  });

  // Helper functions
  function createMockSystemConditions(agentIds: string[], highLoad: boolean = false): SystemConditions {
    return {
      workload_patterns: [
        {
          pattern_id: 'standard-load',
          pattern_type: highLoad ? 'burst' : 'steady',
          time_period: {
            start_time: new Date(),
            end_time: new Date(Date.now() + 60 * 60 * 1000),
            recurrence_pattern: 'daily',
            duration_minutes: 60
          },
          intensity: highLoad ? 0.9 : 0.5,
          resource_impact: [],
          predictability: 0.8,
          trend_direction: 'stable'
        }
      ],
      resource_availability: {
        computational_resources: {
          cpu_availability: {
            total_capacity: 100,
            available_capacity: highLoad ? 20 : 70,
            reserved_capacity: 10,
            utilization_percentage: highLoad ? 80 : 30,
            efficiency_score: 0.8
          },
          memory_availability: {
            total_capacity: 100,
            available_capacity: 60,
            reserved_capacity: 10,
            utilization_percentage: 40,
            efficiency_score: 0.85
          },
          storage_availability: {
            total_capacity: 1000,
            available_capacity: 800,
            reserved_capacity: 100,
            utilization_percentage: 20,
            efficiency_score: 0.9
          },
          network_bandwidth: {
            total_capacity: 1000,
            available_capacity: 900,
            reserved_capacity: 50,
            utilization_percentage: 10,
            efficiency_score: 0.95
          }
        },
        agent_capacity: agentIds.map(id => ({
          agent_id: id,
          agent_type: `${id.split('-')[0]}Agent`,
          current_workload: highLoad ? 0.8 : 0.4,
          available_capacity: highLoad ? 0.2 : 0.6,
          efficiency_rating: 0.8,
          specialization_areas: ['general'],
          performance_trend: 'stable' as const
        })),
        infrastructure_status: {
          health_score: 0.9,
          maintenance_requirements: [],
          upgrade_opportunities: [],
          bottlenecks: [],
          redundancy_status: []
        },
        external_dependencies: [],
        scalability_options: []
      },
      performance_metrics: {
        overall_throughput: highLoad ? 60 : 80,
        average_response_time: highLoad ? 400 : 200,
        error_rate: highLoad ? 0.05 : 0.01,
        resource_utilization_efficiency: highLoad ? 0.6 : 0.8,
        user_satisfaction_score: highLoad ? 0.7 : 0.9,
        system_stability_score: highLoad ? 0.8 : 0.95
      },
      agent_status: agentIds.map(id => ({
        agent_id: id,
        operational_status: 'active' as const,
        current_workload: highLoad ? 0.8 : 0.4,
        performance_score: 0.8,
        health_indicators: {
          cpu_usage: highLoad ? 0.8 : 0.4,
          memory_usage: highLoad ? 0.7 : 0.3,
          error_rate: 0.01
        },
        recent_activities: ['task_execution'],
        collaboration_status: 'available' as const
      })),
      environmental_factors: [],
      user_demands: [],
      system_constraints: []
    };
  }
});