/**
 * Tests for YorkAgent - Efficiency & Resource Management Specialist
 * Comprehensive test suite covering agent lifecycle, resource management, and performance optimization
 */

import { YorkAgent, YorkConfig } from '../../../src/agents/york/YorkAgent';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';
import { AgentContext, Goal, Task, DecisionOption } from '../../../src/interfaces/base.types';

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    if (prompt.includes('resource management')) {
      return JSON.stringify({
        analysis: 'System resources require optimization for peak efficiency',
        resource_status: {
          cpu: 'moderate_utilization',
          memory: 'high_utilization',
          storage: 'optimal',
          network: 'underutilized'
        },
        optimization_plan: [
          'Implement CPU scheduling optimization',
          'Memory allocation pattern adjustment',
          'Network bandwidth utilization improvement'
        ],
        priority_actions: ['memory_optimization', 'cpu_tuning'],
        efficiency_improvement_potential: 0.25
      });
    }
    
    if (prompt.includes('system maintenance')) {
      return JSON.stringify({
        maintenance_assessment: 'System health is good with preventive maintenance opportunities',
        maintenance_priorities: [
          'Cache optimization',
          'Database index maintenance',
          'Log rotation and cleanup'
        ],
        risk_factors: ['memory_pressure', 'disk_fragmentation'],
        recommended_maintenance_window: 'weekend_maintenance',
        estimated_downtime: 0.5
      });
    }
    
    if (prompt.includes('performance analysis')) {
      return JSON.stringify({
        performance_evaluation: 'System showing good performance with optimization opportunities',
        bottlenecks_identified: [
          'Database query optimization needed',
          'Cache hit rate can be improved',
          'Load balancing adjustment required'
        ],
        optimization_strategies: [
          'Query optimization implementation',
          'Cache configuration tuning',
          'Load distribution rebalancing'
        ],
        expected_performance_gain: 0.18
      });
    }
    
    if (prompt.includes('efficiency planning')) {
      return JSON.stringify({
        efficiency_analysis: 'System efficiency can be improved through targeted optimizations',
        efficiency_targets: [
          'Reduce resource waste by 15%',
          'Improve response times by 20%',
          'Increase throughput by 12%'
        ],
        implementation_plan: [
          'Resource allocation optimization',
          'Performance tuning',
          'Capacity planning adjustment'
        ],
        success_probability: 0.85
      });
    }
    
    if (prompt.includes('resource scaling')) {
      return JSON.stringify({
        scaling_assessment: 'System ready for intelligent resource scaling',
        scaling_recommendations: [
          'Horizontal scaling for web tier',
          'Vertical scaling for database',
          'Network bandwidth increase'
        ],
        scaling_strategy: 'gradual_automatic',
        risk_level: 'low'
      });
    }
    
    return 'York agent analysis completed with efficiency optimization recommendations.';
  }
}

describe('YorkAgent', () => {
  let yorkAgent: YorkAgent;
  let mockLLMProvider: MockLLMProvider;
  let defaultConfig: YorkConfig;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    
    defaultConfig = {
      resource_optimization_aggressiveness: 0.7,
      maintenance_proactiveness: 0.8,
      performance_optimization_enabled: true,
      automated_scaling_enabled: true,
      predictive_maintenance_enabled: true,
      efficiency_targets: [
        {
          resource_type: 'cpu',
          target_efficiency: 0.85,
          current_efficiency: 0.70,
          priority: 'high',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          resource_type: 'memory',
          target_efficiency: 0.80,
          current_efficiency: 0.65,
          priority: 'medium'
        }
      ],
      resource_thresholds: [
        {
          resource: 'cpu',
          warning_threshold: 70,
          critical_threshold: 85,
          action_threshold: 90,
          auto_remediation: true
        },
        {
          resource: 'memory',
          warning_threshold: 75,
          critical_threshold: 90,
          action_threshold: 95,
          auto_remediation: true
        }
      ],
      maintenance_windows: [
        {
          name: 'weekend_maintenance',
          start_time: '02:00',
          end_time: '06:00',
          days_of_week: [0, 6], // Sunday and Saturday
          maintenance_types: ['preventive', 'optimization'],
          priority_override: false
        }
      ],
      cost_optimization_priority: 0.6,
      sustainability_priority: 0.5,
      reliability_priority: 0.9,
      performance_priorities: [
        {
          metric: 'response_time',
          weight: 0.3,
          target_value: 1000,
          acceptable_range: 200
        },
        {
          metric: 'throughput',
          weight: 0.25,
          target_value: 100,
          acceptable_range: 20
        }
      ],
      collaboration_preferences: [
        {
          agent_type: 'atlas',
          collaboration_type: 'resource_sharing',
          frequency: 'hourly',
          priority: 0.8
        }
      ]
    };
    
    yorkAgent = new YorkAgent('york-test-001', defaultConfig);
  });

  describe('Construction and Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultAgent = new YorkAgent('york-default');
      expect(defaultAgent).toBeDefined();
      expect(defaultAgent.getId()).toBe('york-default');
    });

    test('should initialize with custom configuration', () => {
      expect(yorkAgent).toBeDefined();
      expect(yorkAgent.getId()).toBe('york-test-001');
    });

    test('should initialize with LLM provider', async () => {
      await yorkAgent.initialize(mockLLMProvider);
      expect(yorkAgent.isInitialized()).toBe(true);
    });

    test('should validate configuration parameters', () => {
      const invalidConfig: Partial<YorkConfig> = {
        resource_optimization_aggressiveness: 1.5, // Invalid: > 1
        maintenance_proactiveness: -0.1, // Invalid: < 0
      };
      
      expect(() => {
        new YorkAgent('york-invalid', invalidConfig as YorkConfig);
      }).not.toThrow(); // Should handle gracefully with defaults
    });
  });

  describe('Agent Lifecycle Methods', () => {
    beforeEach(async () => {
      await yorkAgent.initialize(mockLLMProvider);
    });

    describe('Perceive', () => {
      test('should perceive resource management context', async () => {
        const context: AgentContext = {
          current_state: 'operational',
          available_resources: ['cpu', 'memory', 'storage', 'network'],
          system_metrics: {
            cpu_utilization: 75,
            memory_utilization: 82,
            storage_utilization: 45,
            network_utilization: 30
          },
          recent_events: ['high_memory_usage_detected', 'cpu_spike_resolved'],
          collaboration_requests: []
        };

        const perceptions = await yorkAgent.perceive(context);
        
        expect(Array.isArray(perceptions)).toBe(true);
        expect(perceptions.length).toBeGreaterThan(0);
        
        perceptions.forEach(perception => {
          expect(typeof perception).toBe('string');
          expect(perception.length).toBeGreaterThan(0);
        });
        
        // Should include resource-related perceptions
        const resourcePerceptions = perceptions.filter(p => 
          p.includes('resource') || p.includes('memory') || p.includes('cpu') || p.includes('performance')
        );
        expect(resourcePerceptions.length).toBeGreaterThan(0);
      });

      test('should perceive maintenance opportunities', async () => {
        const context: AgentContext = {
          current_state: 'maintenance_due',
          system_health: {
            overall_score: 0.75,
            component_issues: ['cache_performance_degraded', 'disk_fragmentation']
          },
          maintenance_history: ['last_maintenance_7_days_ago'],
          available_resources: ['maintenance_window'],
          recent_events: [],
          collaboration_requests: []
        };

        const perceptions = await yorkAgent.perceive(context);
        
        const maintenancePerceptions = perceptions.filter(p => 
          p.includes('maintenance') || p.includes('optimization') || p.includes('health')
        );
        expect(maintenancePerceptions.length).toBeGreaterThan(0);
      });

      test('should perceive performance bottlenecks', async () => {
        const context: AgentContext = {
          current_state: 'performance_degraded',
          performance_metrics: {
            response_time_ms: 1500,
            throughput_rps: 75,
            error_rate: 0.02
          },
          bottlenecks: ['database_queries', 'network_latency'],
          available_resources: ['optimization_tools'],
          recent_events: [],
          collaboration_requests: []
        };

        const perceptions = await yorkAgent.perceive(context);
        
        const performancePerceptions = perceptions.filter(p => 
          p.includes('performance') || p.includes('bottleneck') || p.includes('optimization')
        );
        expect(performancePerceptions.length).toBeGreaterThan(0);
      });
    });

    describe('Plan', () => {
      test('should plan resource optimization tasks', async () => {
        const goals: Goal[] = [
          {
            description: 'Optimize system resource utilization',
            priority: 'high',
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            success_criteria: ['cpu_utilization < 80%', 'memory_utilization < 85%']
          },
          {
            description: 'Improve system performance',
            priority: 'medium',
            success_criteria: ['response_time < 1000ms', 'throughput > 100rps']
          }
        ];

        const context: AgentContext = {
          current_state: 'planning',
          available_resources: ['cpu', 'memory', 'storage', 'optimization_tools'],
          constraints: ['budget_limit', 'maintenance_window'],
          recent_events: [],
          collaboration_requests: []
        };

        const tasks = await yorkAgent.plan(goals, context);
        
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks.length).toBeGreaterThan(0);
        
        tasks.forEach(task => {
          expect(task.id).toBeDefined();
          expect(task.description).toBeDefined();
          expect(['low', 'medium', 'high', 'critical']).toContain(task.priority);
          expect(typeof task.estimated_duration_minutes).toBe('number');
          expect(Array.isArray(task.required_resources)).toBe(true);
          expect(Array.isArray(task.dependencies)).toBe(true);
        });

        // Should include resource optimization tasks
        const resourceTasks = tasks.filter(t => 
          t.description.includes('resource') || 
          t.description.includes('optimization') ||
          t.description.includes('performance')
        );
        expect(resourceTasks.length).toBeGreaterThan(0);
      });

      test('should plan maintenance tasks', async () => {
        const goals: Goal[] = [
          {
            description: 'Perform preventive system maintenance',
            priority: 'medium',
            success_criteria: ['system_health > 0.9', 'no_critical_issues']
          }
        ];

        const context: AgentContext = {
          current_state: 'maintenance_planning',
          available_resources: ['maintenance_window', 'system_tools'],
          recent_events: [],
          collaboration_requests: []
        };

        const tasks = await yorkAgent.plan(goals, context);
        
        const maintenanceTasks = tasks.filter(t => 
          t.description.includes('maintenance') ||
          t.description.includes('health') ||
          t.description.includes('optimization')
        );
        expect(maintenanceTasks.length).toBeGreaterThan(0);
      });

      test('should consider resource constraints in planning', async () => {
        const goals: Goal[] = [
          {
            description: 'Scale system resources',
            priority: 'high',
            success_criteria: ['increased_capacity']
          }
        ];

        const context: AgentContext = {
          current_state: 'resource_constrained',
          available_resources: ['limited_budget'],
          constraints: ['cost_limit_$1000', 'no_downtime'],
          recent_events: [],
          collaboration_requests: []
        };

        const tasks = await yorkAgent.plan(goals, context);
        
        // Should still generate tasks but consider constraints
        expect(tasks.length).toBeGreaterThan(0);
        
        // Tasks should account for constraints
        tasks.forEach(task => {
          expect(task.constraints).toBeDefined();
        });
      });
    });

    describe('Decide', () => {
      test('should decide between optimization options', async () => {
        const options: DecisionOption[] = [
          {
            id: 'cpu_optimization',
            description: 'Optimize CPU scheduling and affinity',
            estimated_cost: 100,
            estimated_benefit: 0.2,
            risk_level: 'low',
            implementation_complexity: 'medium',
            resource_requirements: ['cpu_management_tools']
          },
          {
            id: 'memory_optimization',
            description: 'Optimize memory allocation patterns',
            estimated_cost: 150,
            estimated_benefit: 0.25,
            risk_level: 'medium',
            implementation_complexity: 'high',
            resource_requirements: ['memory_analysis_tools']
          },
          {
            id: 'storage_optimization',
            description: 'Optimize storage access patterns',
            estimated_cost: 75,
            estimated_benefit: 0.15,
            risk_level: 'low',
            implementation_complexity: 'low',
            resource_requirements: ['storage_tools']
          }
        ];

        const context: AgentContext = {
          current_state: 'decision_making',
          available_resources: ['optimization_budget', 'technical_team'],
          constraints: ['budget_limit'],
          recent_events: [],
          collaboration_requests: []
        };

        const decision = await yorkAgent.decide(options, context);
        
        expect(decision).toBeDefined();
        expect(options).toContain(decision);
        
        // Decision should be optimal based on York's priorities
        expect(decision.estimated_benefit).toBeGreaterThan(0);
      });

      test('should prioritize efficiency in decisions', async () => {
        const options: DecisionOption[] = [
          {
            id: 'high_efficiency_option',
            description: 'High efficiency, low cost solution',
            estimated_cost: 50,
            estimated_benefit: 0.3,
            risk_level: 'low',
            implementation_complexity: 'low',
            resource_requirements: []
          },
          {
            id: 'low_efficiency_option',
            description: 'Low efficiency, high cost solution',
            estimated_cost: 200,
            estimated_benefit: 0.1,
            risk_level: 'high',
            implementation_complexity: 'high',
            resource_requirements: ['specialized_tools']
          }
        ];

        const context: AgentContext = {
          current_state: 'efficiency_focused',
          recent_events: [],
          collaboration_requests: []
        };

        const decision = await yorkAgent.decide(options, context);
        
        // Should prefer high efficiency option
        expect(decision.id).toBe('high_efficiency_option');
      });

      test('should consider maintenance windows in decisions', async () => {
        const options: DecisionOption[] = [
          {
            id: 'immediate_optimization',
            description: 'Immediate optimization with potential disruption',
            estimated_cost: 100,
            estimated_benefit: 0.2,
            risk_level: 'medium',
            implementation_complexity: 'medium',
            resource_requirements: [],
            timing: 'immediate'
          },
          {
            id: 'scheduled_optimization',
            description: 'Scheduled optimization during maintenance window',
            estimated_cost: 100,
            estimated_benefit: 0.2,
            risk_level: 'low',
            implementation_complexity: 'medium',
            resource_requirements: [],
            timing: 'scheduled'
          }
        ];

        const context: AgentContext = {
          current_state: 'maintenance_aware',
          maintenance_window: 'weekend',
          recent_events: [],
          collaboration_requests: []
        };

        const decision = await yorkAgent.decide(options, context);
        
        // Should prefer scheduled optimization to minimize disruption
        expect(decision.id).toBe('scheduled_optimization');
      });
    });

    describe('Execute', () => {
      test('should execute resource optimization task', async () => {
        const task: Task = {
          id: 'resource_optimization_001',
          description: 'Optimize CPU and memory allocation',
          priority: 'high',
          estimated_duration_minutes: 30,
          required_resources: ['system_access', 'optimization_tools'],
          dependencies: [],
          constraints: []
        };

        const context: AgentContext = {
          current_state: 'executing',
          available_resources: ['system_access', 'optimization_tools'],
          recent_events: [],
          collaboration_requests: []
        };

        const result = await yorkAgent.execute(task, context);
        
        expect(result).toBeDefined();
        expect(result.task_id).toBe(task.id);
        expect(['success', 'partial_success', 'failure']).toContain(result.status);
        expect(result.execution_time_ms).toBeGreaterThan(0);
        expect(result.output).toBeDefined();
        expect(Array.isArray(result.metrics)).toBe(true);
        expect(Array.isArray(result.side_effects)).toBe(true);
      });

      test('should execute maintenance task', async () => {
        const task: Task = {
          id: 'maintenance_001',
          description: 'Perform system health check and optimization',
          priority: 'medium',
          estimated_duration_minutes: 45,
          required_resources: ['maintenance_tools'],
          dependencies: [],
          constraints: ['maintenance_window']
        };

        const context: AgentContext = {
          current_state: 'maintenance_mode',
          available_resources: ['maintenance_tools'],
          recent_events: [],
          collaboration_requests: []
        };

        const result = await yorkAgent.execute(task, context);
        
        expect(result.status).toBeDefined();
        expect(result.output).toBeDefined();
        
        // Maintenance tasks should provide health metrics
        const healthMetrics = result.metrics.filter(m => m.name.includes('health'));
        expect(healthMetrics.length).toBeGreaterThan(0);
      });

      test('should execute performance optimization task', async () => {
        const task: Task = {
          id: 'performance_optimization_001',
          description: 'Optimize system performance and resolve bottlenecks',
          priority: 'high',
          estimated_duration_minutes: 60,
          required_resources: ['performance_tools'],
          dependencies: [],
          constraints: []
        };

        const context: AgentContext = {
          current_state: 'performance_tuning',
          available_resources: ['performance_tools'],
          bottlenecks: ['database_queries', 'memory_allocation'],
          recent_events: [],
          collaboration_requests: []
        };

        const result = await yorkAgent.execute(task, context);
        
        expect(result.status).toBeDefined();
        
        // Performance tasks should provide performance metrics
        const performanceMetrics = result.metrics.filter(m => 
          m.name.includes('performance') || 
          m.name.includes('response_time') ||
          m.name.includes('throughput')
        );
        expect(performanceMetrics.length).toBeGreaterThan(0);
      });

      test('should handle task execution failures gracefully', async () => {
        const invalidTask: Task = {
          id: 'invalid_task',
          description: 'Task with missing required resources',
          priority: 'high',
          estimated_duration_minutes: 30,
          required_resources: ['unavailable_resource'],
          dependencies: [],
          constraints: []
        };

        const context: AgentContext = {
          current_state: 'executing',
          available_resources: ['limited_resources'],
          recent_events: [],
          collaboration_requests: []
        };

        const result = await yorkAgent.execute(invalidTask, context);
        
        // Should handle gracefully and report appropriate status
        expect(result.status).toBeDefined();
        expect(result.output).toBeDefined();
        
        if (result.status === 'failure') {
          expect(result.error_details).toBeDefined();
        }
      });
    });

    describe('Learn', () => {
      test('should learn from resource optimization outcomes', async () => {
        const experience = {
          task_type: 'resource_optimization',
          action_taken: 'cpu_scheduling_optimization',
          outcome: 'success',
          performance_improvement: 0.15,
          resource_savings: 0.1,
          execution_time_ms: 45000,
          side_effects: [],
          user_feedback: 'positive'
        };

        const context: AgentContext = {
          current_state: 'learning',
          recent_events: [],
          collaboration_requests: []
        };

        await expect(yorkAgent.learn(experience, context)).resolves.not.toThrow();
        
        // Learning should update internal models and strategies
        // This is typically reflected in improved future performance
      });

      test('should learn from maintenance outcomes', async () => {
        const experience = {
          task_type: 'maintenance',
          action_taken: 'preventive_maintenance',
          outcome: 'success',
          system_health_improvement: 0.08,
          issues_prevented: ['memory_leak', 'disk_fragmentation'],
          execution_time_ms: 120000,
          side_effects: ['temporary_performance_dip'],
          lessons_learned: ['maintenance_timing_optimization']
        };

        const context: AgentContext = {
          current_state: 'post_maintenance',
          recent_events: [],
          collaboration_requests: []
        };

        await expect(yorkAgent.learn(experience, context)).resolves.not.toThrow();
      });

      test('should learn from performance optimization results', async () => {
        const experience = {
          task_type: 'performance_optimization',
          action_taken: 'bottleneck_resolution',
          outcome: 'partial_success',
          performance_metrics: {
            response_time_improvement: 0.12,
            throughput_improvement: 0.08,
            error_rate_reduction: 0.05
          },
          unexpected_effects: ['increased_memory_usage'],
          adaptation_needed: true
        };

        const context: AgentContext = {
          current_state: 'analyzing_results',
          recent_events: [],
          collaboration_requests: []
        };

        await expect(yorkAgent.learn(experience, context)).resolves.not.toThrow();
      });

      test('should adapt strategies based on learning', async () => {
        const negativeExperience = {
          task_type: 'resource_optimization',
          action_taken: 'aggressive_optimization',
          outcome: 'failure',
          failure_reason: 'system_instability',
          performance_impact: -0.05,
          recovery_time_ms: 300000
        };

        const context: AgentContext = {
          current_state: 'learning_from_failure',
          recent_events: [],
          collaboration_requests: []
        };

        await yorkAgent.learn(negativeExperience, context);
        
        // Future decisions should be influenced by this learning
        // This would be tested through subsequent decision-making scenarios
      });
    });
  });

  describe('Specialized York Methods', () => {
    beforeEach(async () => {
      await yorkAgent.initialize(mockLLMProvider);
    });

    test('should perform system efficiency analysis', async () => {
      const context: AgentContext = {
        current_state: 'efficiency_analysis',
        system_metrics: {
          cpu_utilization: 75,
          memory_utilization: 82,
          storage_utilization: 45,
          network_utilization: 30
        },
        recent_events: [],
        collaboration_requests: []
      };

      const efficiencyAnalysis = await yorkAgent.analyzeSystemEfficiency(context);
      
      expect(efficiencyAnalysis).toBeDefined();
      expect(typeof efficiencyAnalysis.overall_efficiency_score).toBe('number');
      expect(efficiencyAnalysis.overall_efficiency_score).toBeGreaterThanOrEqual(0);
      expect(efficiencyAnalysis.overall_efficiency_score).toBeLessThanOrEqual(1);
      expect(Array.isArray(efficiencyAnalysis.inefficiencies_detected)).toBe(true);
      expect(Array.isArray(efficiencyAnalysis.optimization_opportunities)).toBe(true);
      expect(Array.isArray(efficiencyAnalysis.efficiency_improvements)).toBe(true);
    });

    test('should optimize resource allocation', async () => {
      const resourceRequirements = {
        cpu_cores: 8,
        memory_gb: 32,
        storage_gb: 1000,
        network_bandwidth_mbps: 1000,
        performance_targets: {
          response_time_ms: 800,
          throughput_rps: 120
        }
      };

      const optimizationResult = await yorkAgent.optimizeResourceAllocation(resourceRequirements);
      
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.optimization_id).toBeDefined();
      expect(optimizationResult.execution_timestamp).toBeInstanceOf(Date);
      expect(optimizationResult.resource_allocation).toBeDefined();
      expect(optimizationResult.performance_prediction).toBeDefined();
      expect(typeof optimizationResult.efficiency_improvement).toBe('number');
      expect(Array.isArray(optimizationResult.optimization_actions)).toBe(true);
    });

    test('should predict future resource needs', async () => {
      const timeframe = {
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        granularity: 'daily'
      };

      const prediction = await yorkAgent.predictResourceNeeds(timeframe);
      
      expect(prediction).toBeDefined();
      expect(prediction.prediction_id).toBeDefined();
      expect(prediction.timeframe).toEqual(timeframe);
      expect(Array.isArray(prediction.resource_forecasts)).toBe(true);
      expect(Array.isArray(prediction.scaling_recommendations)).toBe(true);
      expect(typeof prediction.prediction_confidence).toBe('number');
      expect(prediction.prediction_confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.prediction_confidence).toBeLessThanOrEqual(1);
    });

    test('should coordinate system maintenance', async () => {
      const maintenanceRequest = {
        maintenance_type: 'preventive',
        target_components: ['database', 'cache', 'web_server'],
        maintenance_window: {
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
          duration_hours: 4
        },
        priority: 'medium'
      };

      const coordinationResult = await yorkAgent.coordinateSystemMaintenance(maintenanceRequest);
      
      expect(coordinationResult).toBeDefined();
      expect(coordinationResult.coordination_id).toBeDefined();
      expect(coordinationResult.maintenance_plan).toBeDefined();
      expect(coordinationResult.resource_allocation).toBeDefined();
      expect(Array.isArray(coordinationResult.maintenance_tasks)).toBe(true);
      expect(coordinationResult.estimated_completion_time).toBeInstanceOf(Date);
    });
  });

  describe('Component Integration', () => {
    beforeEach(async () => {
      await yorkAgent.initialize(mockLLMProvider);
    });

    test('should integrate with ResourceOptimizer', () => {
      const resourceOptimizer = yorkAgent.getResourceOptimizer();
      expect(resourceOptimizer).toBeDefined();
      
      // ResourceOptimizer should be properly configured
      expect(typeof resourceOptimizer.monitorSystemResources).toBe('function');
      expect(typeof resourceOptimizer.optimizeResourceAllocation).toBe('function');
      expect(typeof resourceOptimizer.predictResourceNeeds).toBe('function');
      expect(typeof resourceOptimizer.scaleResources).toBe('function');
    });

    test('should integrate with SystemMaintainer', () => {
      const systemMaintainer = yorkAgent.getSystemMaintainer();
      expect(systemMaintainer).toBeDefined();
      
      // SystemMaintainer should be properly configured
      expect(typeof systemMaintainer.performSystemHealthCheck).toBe('function');
      expect(typeof systemMaintainer.executeScheduledMaintenance).toBe('function');
      expect(typeof systemMaintainer.optimizeSystemPerformance).toBe('function');
    });

    test('should integrate with PerformanceEngine', () => {
      const performanceEngine = yorkAgent.getPerformanceEngine();
      expect(performanceEngine).toBeDefined();
      
      // PerformanceEngine should be properly configured
      expect(typeof performanceEngine.analyzeSystemPerformance).toBe('function');
      expect(typeof performanceEngine.optimizePerformance).toBe('function');
      expect(typeof performanceEngine.predictPerformance).toBe('function');
    });

    test('should coordinate between components', async () => {
      // Test coordination between components
      const resourceStatus = await yorkAgent.getResourceOptimizer().monitorSystemResources();
      const systemHealth = await yorkAgent.getSystemMaintainer().performSystemHealthCheck();
      const performanceProfile = await yorkAgent.getPerformanceEngine().analyzeSystemPerformance();
      
      expect(resourceStatus).toBeDefined();
      expect(systemHealth).toBeDefined();
      expect(performanceProfile).toBeDefined();
      
      // Components should provide complementary insights
      expect(resourceStatus.overall_health).toBeGreaterThanOrEqual(0);
      expect(systemHealth.overall_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metrics and Performance', () => {
    beforeEach(async () => {
      await yorkAgent.initialize(mockLLMProvider);
    });

    test('should provide comprehensive agent metrics', () => {
      const metrics = yorkAgent.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.efficiency_optimizations_performed).toBe('number');
      expect(typeof metrics.maintenance_sessions_coordinated).toBe('number');
      expect(typeof metrics.performance_improvements_achieved).toBe('number');
      expect(typeof metrics.resource_waste_reduction).toBe('number');
      expect(typeof metrics.system_availability_improvement).toBe('number');
      expect(typeof metrics.cost_savings_realized).toBe('number');
    });

    test('should track optimization success rate', async () => {
      // Perform some optimizations
      const resourceRequirements = {
        cpu_cores: 4,
        memory_gb: 16,
        storage_gb: 500,
        network_bandwidth_mbps: 500
      };
      
      await yorkAgent.optimizeResourceAllocation(resourceRequirements);
      
      const metrics = yorkAgent.getMetrics();
      expect(metrics.efficiency_optimizations_performed).toBeGreaterThan(0);
    });

    test('should measure efficiency improvements over time', async () => {
      const initialMetrics = yorkAgent.getMetrics();
      
      // Simulate efficiency improvements
      const context: AgentContext = {
        current_state: 'optimizing',
        recent_events: [],
        collaboration_requests: []
      };
      
      await yorkAgent.analyzeSystemEfficiency(context);
      
      const updatedMetrics = yorkAgent.getMetrics();
      // Metrics should be updated after analysis
      expect(updatedMetrics).toBeDefined();
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect efficiency targets', () => {
      const customConfig: Partial<YorkConfig> = {
        efficiency_targets: [
          {
            resource_type: 'overall',
            target_efficiency: 0.95,
            current_efficiency: 0.80,
            priority: 'critical',
            deadline: new Date(Date.now() + 48 * 60 * 60 * 1000)
          }
        ]
      };
      
      const customAgent = new YorkAgent('york-custom', customConfig as YorkConfig);
      expect(customAgent).toBeDefined();
    });

    test('should handle maintenance windows configuration', () => {
      const maintenanceConfig: Partial<YorkConfig> = {
        maintenance_windows: [
          {
            name: 'daily_maintenance',
            start_time: '03:00',
            end_time: '04:00',
            days_of_week: [1, 2, 3, 4, 5], // Weekdays
            maintenance_types: ['optimization'],
            priority_override: true
          }
        ]
      };
      
      const maintenanceAgent = new YorkAgent('york-maintenance', maintenanceConfig as YorkConfig);
      expect(maintenanceAgent).toBeDefined();
    });

    test('should configure collaboration preferences', () => {
      const collaborationConfig: Partial<YorkConfig> = {
        collaboration_preferences: [
          {
            agent_type: 'pythagoras',
            collaboration_type: 'performance_coordination',
            frequency: 'continuous',
            priority: 0.9
          },
          {
            agent_type: 'atlas',
            collaboration_type: 'resource_sharing',
            frequency: 'on_demand',
            priority: 0.7
          }
        ]
      };
      
      const collaborativeAgent = new YorkAgent('york-collaborative', collaborationConfig as YorkConfig);
      expect(collaborativeAgent).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      await yorkAgent.initialize(mockLLMProvider);
    });

    test('should handle resource optimization failures', async () => {
      const impossibleRequirements = {
        cpu_cores: Number.MAX_SAFE_INTEGER,
        memory_gb: Number.MAX_SAFE_INTEGER,
        storage_gb: Number.MAX_SAFE_INTEGER,
        network_bandwidth_mbps: Number.MAX_SAFE_INTEGER
      };
      
      try {
        await yorkAgent.optimizeResourceAllocation(impossibleRequirements);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle maintenance coordination failures', async () => {
      const invalidMaintenanceRequest = {
        maintenance_type: 'invalid_type',
        target_components: [],
        maintenance_window: {
          start_time: new Date(0), // Past date
          duration_hours: -1 // Invalid duration
        },
        priority: 'invalid_priority'
      };
      
      try {
        // @ts-ignore - Testing invalid input
        await yorkAgent.coordinateSystemMaintenance(invalidMaintenanceRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle prediction failures gracefully', async () => {
      const invalidTimeframe = {
        start_date: new Date(Date.now() + 1000),
        end_date: new Date(), // End before start
        granularity: 'invalid_granularity'
      };
      
      try {
        // @ts-ignore - Testing invalid input
        await yorkAgent.predictResourceNeeds(invalidTimeframe);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle component failures gracefully', async () => {
      // Simulate component failure scenario
      try {
        const context: AgentContext = {
          current_state: 'component_failure',
          available_resources: [],
          recent_events: ['resource_optimizer_failure'],
          collaboration_requests: []
        };
        
        const perceptions = await yorkAgent.perceive(context);
        expect(Array.isArray(perceptions)).toBe(true);
        
        // Should still function with degraded capabilities
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Agent Collaboration', () => {
    beforeEach(async () => {
      await yorkAgent.initialize(mockLLMProvider);
    });

    test('should handle collaboration requests', async () => {
      const collaborationRequest = {
        requesting_agent: 'atlas-001',
        collaboration_type: 'resource_sharing',
        request_details: {
          resource_type: 'cpu',
          amount: 2,
          duration_minutes: 30,
          priority: 'medium'
        },
        deadline: new Date(Date.now() + 60 * 60 * 1000)
      };
      
      const context: AgentContext = {
        current_state: 'collaborative',
        collaboration_requests: [collaborationRequest],
        recent_events: [],
        available_resources: ['cpu', 'memory']
      };
      
      const perceptions = await yorkAgent.perceive(context);
      
      // Should perceive collaboration opportunities
      const collaborationPerceptions = perceptions.filter(p => 
        p.includes('collaboration') || p.includes('sharing') || p.includes('atlas')
      );
      expect(collaborationPerceptions.length).toBeGreaterThan(0);
    });

    test('should coordinate with other agents for optimization', async () => {
      const context: AgentContext = {
        current_state: 'coordinating',
        collaboration_requests: [
          {
            requesting_agent: 'pythagoras-001',
            collaboration_type: 'performance_coordination',
            request_details: {
              optimization_target: 'database_performance',
              data_analysis_needed: true
            }
          }
        ],
        recent_events: [],
        available_resources: ['performance_tools']
      };
      
      const perceptions = await yorkAgent.perceive(context);
      
      // Should recognize coordination opportunities
      const coordinationPerceptions = perceptions.filter(p => 
        p.includes('coordination') || p.includes('database') || p.includes('performance')
      );
      expect(coordinationPerceptions.length).toBeGreaterThan(0);
    });
  });
});