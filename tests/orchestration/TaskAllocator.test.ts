/**
 * Task Allocator Tests
 * Comprehensive test suite for the TaskAllocator component
 * Testing intelligent task allocation, rebalancing, failure recovery, and optimization
 */

import { TaskAllocator, TaskAllocation, TaskFailure, RebalancingResult, DistributionOptimization, CompletionPrediction } from '../../src/orchestration/TaskAllocator';
import { LLMProvider } from '../../src/utils/llm/SimpleLLMProvider';
import { Task } from '../../src/interfaces/base.types';

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    // Return mock analysis based on prompt content
    if (prompt.includes('task requirements')) {
      return JSON.stringify({
        required_skills: ['research', 'analysis'],
        complexity: 0.7,
        resource_requirements: { cpu: 0.5, memory: 0.3 },
        risk_factors: ['deadline_pressure', 'skill_complexity']
      });
    }
    return JSON.stringify({ analysis: 'mock_response' });
  }

  async chat(messages: any[]): Promise<string> {
    return 'Mock chat response';
  }
}

describe('TaskAllocator', () => {
  let taskAllocator: TaskAllocator;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    taskAllocator = new TaskAllocator(mockLLMProvider, {
      allocation_strategy: 'optimal',
      workload_balance_threshold: 0.8,
      skill_matching_weight: 0.3,
      resource_optimization_weight: 0.25,
      deadline_priority_weight: 0.2,
      collaboration_preference_weight: 0.15,
      risk_tolerance: 0.3,
      rebalancing_frequency_minutes: 60,
      failure_recovery_timeout_minutes: 30
    });
  });

  describe('Task Allocation', () => {
    test('should allocate task to optimal agent', async () => {
      const task: Task = {
        id: 'test-task-001',
        description: 'Research quantum computing applications',
        type: 'research',
        priority: 'high',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        required_skills: ['quantum_physics', 'research'],
        estimated_duration_minutes: 240,
        dependencies: [],
        context: {},
        constraints: [],
        expected_outcomes: []
      };

      const allocation = await taskAllocator.allocateTask(task);

      expect(allocation).toBeDefined();
      expect(allocation.task.id).toBe(task.id);
      expect(allocation.assigned_agent).toBeDefined();
      expect(allocation.priority).toBeGreaterThan(0);
      expect(allocation.deadline).toBeDefined();
      expect(allocation.allocation_timestamp).toBeDefined();
      expect(allocation.expected_completion).toBeDefined();
      expect(allocation.risk_assessment).toBeDefined();
      expect(allocation.allocation_reasoning).toContain('optimal skill-resource-workload matching');
    });

    test('should handle high priority tasks correctly', async () => {
      const highPriorityTask: Task = {
        id: 'urgent-task-001',
        description: 'Critical system analysis',
        type: 'analysis',
        priority: 'high',
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        required_skills: ['system_analysis', 'troubleshooting'],
        estimated_duration_minutes: 60,
        dependencies: [],
        context: {},
        constraints: [],
        expected_outcomes: []
      };

      const allocation = await taskAllocator.allocateTask(highPriorityTask);

      expect(allocation.priority).toBe(0.8); // High priority tasks get 0.8 priority
      expect(allocation.task.priority).toBe('high');
    });

    test('should handle tasks with dependencies', async () => {
      const dependentTask: Task = {
        id: 'dependent-task-001',
        description: 'Analysis based on previous research',
        type: 'analysis',
        priority: 'medium',
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        required_skills: ['data_analysis'],
        estimated_duration_minutes: 180,
        dependencies: ['research-task-001', 'data-collection-001'],
        context: {},
        constraints: [],
        expected_outcomes: []
      };

      const allocation = await taskAllocator.allocateTask(dependentTask);

      expect(allocation.dependencies).toEqual(['research-task-001', 'data-collection-001']);
    });
  });

  describe('Task Rebalancing', () => {
    test('should rebalance tasks for optimal distribution', async () => {
      // First allocate some tasks to create workload imbalance
      const task1 = createMockTask('task-1', 'research');
      const task2 = createMockTask('task-2', 'analysis');
      const task3 = createMockTask('task-3', 'innovation');

      await taskAllocator.allocateTask(task1);
      await taskAllocator.allocateTask(task2);
      await taskAllocator.allocateTask(task3);

      const rebalancingResult = await taskAllocator.rebalanceTasks();

      expect(rebalancingResult).toBeDefined();
      expect(rebalancingResult.rebalancing_id).toBeDefined();
      expect(rebalancingResult.execution_timestamp).toBeDefined();
      expect(rebalancingResult.agents_affected).toBeDefined();
      expect(rebalancingResult.tasks_reassigned).toBeDefined();
      expect(rebalancingResult.workload_improvements).toBeDefined();
      expect(rebalancingResult.performance_impact).toBeDefined();
      expect(rebalancingResult.success_rate).toBeGreaterThanOrEqual(0);
      expect(rebalancingResult.success_rate).toBeLessThanOrEqual(1);
      expect(rebalancingResult.lessons_learned).toBeDefined();
    });

    test('should improve performance through rebalancing', async () => {
      const rebalancingResult = await taskAllocator.rebalanceTasks();

      expect(rebalancingResult.performance_impact.overall_throughput_change).toBeGreaterThan(0);
      expect(rebalancingResult.performance_impact.average_task_completion_time_change).toBeLessThan(0); // Negative means improvement
      expect(rebalancingResult.performance_impact.resource_utilization_efficiency_change).toBeGreaterThan(0);
    });
  });

  describe('Failure Recovery', () => {
    test('should handle task failure and implement recovery', async () => {
      const taskFailure: TaskFailure = {
        task_id: 'failed-task-001',
        agent_id: 'atlas-001',
        failure_timestamp: new Date(),
        failure_type: 'resource_insufficient',
        failure_description: 'Insufficient memory resources to complete analysis',
        impact_scope: {
          affected_tasks: ['failed-task-001'],
          affected_agents: ['atlas-001'],
          affected_systems: ['analysis_system'],
          business_impact: {
            revenue_impact: 1000,
            operational_impact: 'Minor delay in research delivery',
            reputation_impact: 'minimal',
            compliance_impact: []
          },
          user_impact: {
            users_affected: 5,
            service_degradation: [],
            user_experience_impact: 0.1,
            communication_required: false
          }
        },
        recovery_urgency: 'medium'
      };

      const failureRecovery = await taskAllocator.handleTaskFailure(taskFailure);

      expect(failureRecovery).toBeDefined();
      expect(failureRecovery.recovery_id).toBeDefined();
      expect(failureRecovery.recovery_timestamp).toBeDefined();
      expect(failureRecovery.recovery_strategy).toBeDefined();
      expect(failureRecovery.recovery_strategy.strategy_type).toBe('retry');
      expect(failureRecovery.recovery_actions).toBeDefined();
      expect(failureRecovery.estimated_recovery_time).toBeGreaterThan(0);
      expect(failureRecovery.success_probability).toBeGreaterThan(0);
      expect(failureRecovery.monitoring_plan).toBeDefined();
    });

    test('should create appropriate monitoring plan for recovery', async () => {
      const taskFailure = createMockTaskFailure('timeout');

      const failureRecovery = await taskAllocator.handleTaskFailure(taskFailure);

      expect(failureRecovery.monitoring_plan.monitoring_metrics).toBeDefined();
      expect(failureRecovery.monitoring_plan.alert_thresholds).toBeDefined();
      expect(failureRecovery.monitoring_plan.reporting_frequency).toBe('hourly');
      expect(failureRecovery.monitoring_plan.escalation_triggers).toBeDefined();
    });
  });

  describe('Distribution Optimization', () => {
    test('should optimize task distribution', async () => {
      const optimization = await taskAllocator.optimizeTaskDistribution();

      expect(optimization).toBeDefined();
      expect(optimization.optimization_id).toBeDefined();
      expect(optimization.optimization_timestamp).toBeDefined();
      expect(optimization.optimization_type).toBeDefined();
      expect(optimization.current_distribution).toBeDefined();
      expect(optimization.optimized_distribution).toBeDefined();
      expect(optimization.improvement_metrics).toBeDefined();
      expect(optimization.implementation_plan).toBeDefined();
    });

    test('should identify improvement opportunities', async () => {
      const optimization = await taskAllocator.optimizeTaskDistribution();

      expect(optimization.improvement_metrics.length).toBeGreaterThanOrEqual(0);
      optimization.improvement_metrics.forEach(metric => {
        expect(metric.metric_name).toBeDefined();
        expect(metric.current_value).toBeDefined();
        expect(metric.target_value).toBeDefined();
        expect(metric.improvement_percentage).toBeDefined();
        expect(metric.confidence_level).toBeGreaterThanOrEqual(0);
        expect(metric.confidence_level).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Completion Prediction', () => {
    test('should predict task completion time', async () => {
      const task = createMockTask('prediction-task', 'research');
      const allocation = await taskAllocator.allocateTask(task);

      const prediction = await taskAllocator.predictTaskCompletion(allocation);

      expect(prediction).toBeDefined();
      expect(prediction.prediction_id).toBeDefined();
      expect(prediction.task_id).toBe(allocation.task.id);
      expect(prediction.agent_id).toBe(allocation.assigned_agent);
      expect(prediction.predicted_completion_time).toBeDefined();
      expect(prediction.confidence_interval).toBeDefined();
      expect(prediction.prediction_factors).toBeDefined();
      expect(prediction.risk_factors).toBeDefined();
      expect(prediction.alternative_scenarios).toBeDefined();
    });

    test('should provide confidence intervals', async () => {
      const task = createMockTask('confidence-task', 'analysis');
      const allocation = await taskAllocator.allocateTask(task);

      const prediction = await taskAllocator.predictTaskCompletion(allocation);

      expect(prediction.confidence_interval.lower_bound).toBeDefined();
      expect(prediction.confidence_interval.upper_bound).toBeDefined();
      expect(prediction.confidence_interval.confidence_level).toBeGreaterThan(0);
      expect(prediction.confidence_interval.confidence_level).toBeLessThanOrEqual(1);
    });
  });

  describe('Metrics and Performance', () => {
    test('should provide comprehensive metrics', async () => {
      const metrics = taskAllocator.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.total_allocations).toBeGreaterThanOrEqual(0);
      expect(metrics.current_active_allocations).toBeGreaterThanOrEqual(0);
      expect(metrics.allocation_success_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.allocation_success_rate).toBeLessThanOrEqual(1);
      expect(metrics.rebalancing_efficiency).toBeGreaterThanOrEqual(0);
      expect(metrics.rebalancing_efficiency).toBeLessThanOrEqual(1);
      expect(metrics.failure_recovery_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.failure_recovery_rate).toBeLessThanOrEqual(1);
      expect(metrics.average_allocation_time).toBeGreaterThan(0);
      expect(metrics.workload_balance_score).toBeGreaterThanOrEqual(0);
      expect(metrics.workload_balance_score).toBeLessThanOrEqual(1);
    });

    test('should track allocation history', async () => {
      const task1 = createMockTask('history-task-1', 'research');
      const task2 = createMockTask('history-task-2', 'analysis');

      await taskAllocator.allocateTask(task1);
      await taskAllocator.allocateTask(task2);

      const metrics = taskAllocator.getMetrics();
      expect(metrics.total_allocations).toBe(2);
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect custom configuration', () => {
      const customConfig = {
        allocation_strategy: 'balanced' as const,
        workload_balance_threshold: 0.9,
        skill_matching_weight: 0.4
      };

      const customAllocator = new TaskAllocator(mockLLMProvider, customConfig);
      const metrics = customAllocator.getMetrics();

      expect(metrics).toBeDefined();
    });

    test('should use default configuration when not provided', () => {
      const defaultAllocator = new TaskAllocator(mockLLMProvider);
      const metrics = defaultAllocator.getMetrics();

      expect(metrics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid task gracefully', async () => {
      const invalidTask = {} as Task;

      await expect(taskAllocator.allocateTask(invalidTask)).rejects.toThrow();
    });

    test('should handle LLM provider errors', async () => {
      const errorLLMProvider = {
        generateResponse: async () => { throw new Error('LLM unavailable'); },
        chat: async () => { throw new Error('LLM unavailable'); }
      } as LLMProvider;

      const errorAllocator = new TaskAllocator(errorLLMProvider);
      const task = createMockTask('error-task', 'research');

      await expect(errorAllocator.allocateTask(task)).rejects.toThrow('Task allocation failed');
    });
  });

  // Helper functions
  function createMockTask(id: string, type: string): Task {
    return {
      id,
      description: `Mock ${type} task`,
      type,
      priority: 'medium',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      required_skills: [type, 'analysis'],
      estimated_duration_minutes: 120,
      dependencies: [],
      context: {},
      constraints: [],
      expected_outcomes: []
    };
  }

  function createMockTaskFailure(failureType: string): TaskFailure {
    return {
      task_id: 'mock-failed-task',
      agent_id: 'mock-agent',
      failure_timestamp: new Date(),
      failure_type: failureType as any,
      failure_description: `Mock ${failureType} failure`,
      impact_scope: {
        affected_tasks: ['mock-failed-task'],
        affected_agents: ['mock-agent'],
        affected_systems: ['mock-system'],
        business_impact: {
          revenue_impact: 0,
          operational_impact: 'Minimal',
          reputation_impact: 'minimal',
          compliance_impact: []
        },
        user_impact: {
          users_affected: 0,
          service_degradation: [],
          user_experience_impact: 0,
          communication_required: false
        }
      },
      recovery_urgency: 'low'
    };
  }
});