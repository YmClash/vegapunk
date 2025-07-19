/**
 * @jest-environment node
 */

import {
  PythagorasAgent,
  PythagorasConfig,
  PythagorasMetrics,
  DataContext,
  ResearchInsight,
  PythagorasSession,
  PythagorasCapability
} from '../../../src/agents/pythagoras/PythagorasAgent';
import { Dataset } from '../../../src/agents/pythagoras/DataAnalyzer';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';
import { AgentContext, Goal, Task, DecisionOption } from '../../../src/interfaces/base.types';

// Comprehensive Mock LLM Provider for PythagorasAgent Integration Tests
class MockPythagorasLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    // Data Analysis Context
    if (prompt.includes('Analyze data quality')) {
      return JSON.stringify({
        completeness: 0.95,
        accuracy: 0.92,
        consistency: 0.88,
        validity: 0.90,
        uniqueness: 0.85,
        timeliness: 0.93
      });
    }

    // Research Context Analysis
    if (prompt.includes('identify research opportunities')) {
      return JSON.stringify({
        opportunities: [
          'Machine learning interpretability in healthcare',
          'Bias detection in AI decision systems',
          'Federated learning for privacy-preserving analytics'
        ],
        priority_areas: ['ethics', 'interpretability', 'privacy'],
        methodological_gaps: ['longitudinal studies', 'diverse populations'],
        emerging_trends: ['quantum ML', 'neuromorphic computing']
      });
    }

    // Mathematical Problem Analysis
    if (prompt.includes('analyze mathematical problem')) {
      return JSON.stringify({
        problem_type: 'optimization',
        complexity: 'high',
        recommended_approach: 'multi-objective optimization with constraints',
        computational_requirements: ['high_precision', 'parallel_processing'],
        expected_solution_time: 300,
        alternative_methods: ['genetic_algorithm', 'simulated_annealing']
      });
    }

    // Decision Analysis
    if (prompt.includes('analyze decision option')) {
      return JSON.stringify({
        feasibility: 0.85,
        impact: 0.9,
        risk: 0.3,
        resource_requirements: 'moderate',
        timeline: 'medium-term',
        dependencies: ['data_availability', 'computational_resources'],
        success_probability: 0.78
      });
    }

    // Insight Generation
    if (prompt.includes('generate insights from')) {
      return JSON.stringify([
        {
          title: 'Correlation Pattern Discovery',
          description: 'Strong correlation found between features X and Y with statistical significance',
          significance: 0.92,
          confidence: 0.87,
          evidence: [
            {
              type: 'statistical',
              source: 'correlation_analysis',
              strength: 0.9,
              data: { correlation: 0.85, p_value: 0.001 }
            }
          ],
          implications: ['Feature engineering opportunity', 'Potential causal relationship'],
          recommendations: ['Further investigate causality', 'Design controlled experiment']
        }
      ]);
    }

    // Research Hypothesis Generation
    if (prompt.includes('generate research hypotheses')) {
      return JSON.stringify([
        {
          statement: 'Deep learning models will show improved performance on multimodal healthcare data',
          rationale: 'Integration of diverse data types should capture more comprehensive patterns',
          testability: 0.9,
          novelty: 0.8,
          significance: 0.85,
          variables: ['model_architecture', 'data_modalities', 'performance_metrics'],
          predictions: ['higher_accuracy', 'better_generalization']
        }
      ]);
    }

    // Collaboration Analysis
    if (prompt.includes('evaluate collaboration')) {
      return JSON.stringify({
        agents: ['EdisonAgent', 'AtlasAgent'],
        synergies: [
          'Edison can provide innovative approaches for analysis methods',
          'Atlas can ensure secure handling of sensitive research data'
        ],
        collaboration_score: 0.82,
        recommended_roles: {
          'EdisonAgent': 'methodology_innovation',
          'AtlasAgent': 'data_security_compliance'
        }
      });
    }

    // Performance Optimization
    if (prompt.includes('optimize computational approach')) {
      return JSON.stringify({
        bottlenecks: ['memory_bandwidth', 'matrix_operations'],
        optimizations: ['vectorization', 'parallel_processing', 'caching'],
        expected_improvement: 0.35,
        resource_trade_offs: 'increased_memory_for_speed',
        implementation_complexity: 'moderate'
      });
    }

    // Research Quality Assessment
    if (prompt.includes('assess research quality')) {
      return JSON.stringify({
        methodology_rigor: 0.88,
        data_quality: 0.92,
        statistical_validity: 0.85,
        reproducibility: 0.90,
        ethical_compliance: 0.95,
        overall_quality: 0.88
      });
    }

    return 'Default Pythagoras response for data analysis and research';
  }
}

describe('PythagorasAgent', () => {
  let pythagorasAgent: PythagorasAgent;
  let mockLLMProvider: MockPythagorasLLMProvider;
  let sampleContext: AgentContext;
  let sampleDataset: Dataset;

  beforeEach(() => {
    mockLLMProvider = new MockPythagorasLLMProvider();
    
    const config: Partial<PythagorasConfig> = {
      dataAnalysisCapacity: 1000,
      researchDepth: 'advanced',
      computationalPrecision: 'double',
      enabledCapabilities: [
        'statistical_analysis',
        'machine_learning',
        'literature_review',
        'hypothesis_generation',
        'mathematical_computation',
        'optimization'
      ],
      learningRate: 0.1,
      researchDomains: ['artificial_intelligence', 'machine_learning', 'statistics'],
      collaborationPreferences: {
        shareDataInsights: true,
        shareResearchFindings: true,
        allowModelSharing: true,
        participateInPeerReview: true,
        enableKnowledgeTransfer: true
      },
      performanceTargets: {
        analysisAccuracy: 0.95,
        researchCompleteness: 0.9,
        computationEfficiency: 0.85,
        insightGeneration: 3,
        collaborationEffectiveness: 0.8
      }
    };

    pythagorasAgent = new PythagorasAgent(mockLLMProvider, config);

    sampleDataset = {
      id: 'healthcare-data',
      name: 'Healthcare Analytics Dataset',
      data: [
        { patient_id: 1, age: 35, diagnosis: 'diabetes', treatment_outcome: 'improved' },
        { patient_id: 2, age: 42, diagnosis: 'hypertension', treatment_outcome: 'stable' },
        { patient_id: 3, age: 28, diagnosis: 'diabetes', treatment_outcome: 'improved' },
        { patient_id: 4, age: 55, diagnosis: 'heart_disease', treatment_outcome: 'improved' },
        { patient_id: 5, age: 38, diagnosis: 'diabetes', treatment_outcome: 'declined' }
      ],
      schema: {
        columns: [
          { name: 'patient_id', type: 'number', nullable: false, unique: true },
          { name: 'age', type: 'number', nullable: false, unique: false },
          { name: 'diagnosis', type: 'categorical', nullable: false, unique: false },
          { name: 'treatment_outcome', type: 'categorical', nullable: false, unique: false }
        ],
        relationships: [],
        constraints: [],
        types: {
          patient_id: 'number',
          age: 'number',
          diagnosis: 'categorical',
          treatment_outcome: 'categorical'
        }
      },
      metadata: {
        source: 'healthcare_system',
        created: new Date(),
        lastUpdated: new Date(),
        version: '2.0',
        tags: ['healthcare', 'analytics', 'outcomes'],
        description: 'Patient treatment outcomes dataset'
      },
      size: 5,
      quality: {
        completeness: 1.0,
        accuracy: 0.95,
        consistency: 0.9,
        validity: 0.95,
        uniqueness: 1.0,
        timeliness: 0.9,
        issues: []
      }
    };

    sampleContext = {
      agentId: 'pythagoras-1',
      sessionId: 'session-123',
      currentTask: undefined,
      environment: {
        constraints: [],
        resources: {
          datasets: [sampleDataset],
          computational_power: 'high',
          memory: 'sufficient'
        },
        collaborators: ['EdisonAgent', 'AtlasAgent']
      },
      history: [],
      metadata: {
        timestamp: new Date(),
        priority: 'high',
        domain: 'healthcare_analytics'
      }
    };
  });

  describe('Core Agent Functionality', () => {
    test('should initialize with comprehensive configuration', () => {
      expect(pythagorasAgent).toBeInstanceOf(PythagorasAgent);
      expect(pythagorasAgent.getId()).toContain('PythagorasAgent');
      expect(pythagorasAgent.getCapabilities()).toContain('statistical_analysis');
      expect(pythagorasAgent.getCapabilities()).toContain('machine_learning');
      expect(pythagorasAgent.getCapabilities()).toContain('mathematical_computation');
    });

    test('should get agent metrics', () => {
      const metrics = pythagorasAgent.getMetrics();
      expect(metrics).toHaveProperty('datasetsAnalyzed');
      expect(metrics).toHaveProperty('researchPapersReviewed');
      expect(metrics).toHaveProperty('hypothesesGenerated');
      expect(metrics).toHaveProperty('computationsPerformed');
      expect(metrics).toHaveProperty('insightsGenerated');
      expect(metrics).toHaveProperty('collaborationScore');
      expect(typeof metrics.datasetsAnalyzed).toBe('number');
    });

    test('should get knowledge base summary', () => {
      const summary = pythagorasAgent.getKnowledgeBaseSummary();
      expect(summary).toHaveProperty('domains');
      expect(summary).toHaveProperty('concepts');
      expect(summary).toHaveProperty('relationships');
      expect(summary).toHaveProperty('lastUpdated');
      expect(typeof summary.domains).toBe('number');
    });
  });

  describe('Autonomous Agent Lifecycle', () => {
    test('should perceive data and research context effectively', async () => {
      const observations = await pythagorasAgent.perceive(sampleContext);
      
      expect(Array.isArray(observations)).toBe(true);
      expect(observations.length).toBeGreaterThan(0);
      
      // Should identify data analysis opportunities
      expect(observations.some(obs => obs.includes('Data analysis opportunities'))).toBe(true);
      
      // Should identify research opportunities
      expect(observations.some(obs => obs.includes('Research opportunities'))).toBe(true);
      
      // Should assess computational needs
      expect(observations.some(obs => obs.includes('Computational tasks'))).toBe(true);
      
      // Should evaluate collaboration potential
      expect(observations.some(obs => obs.includes('Collaboration potential'))).toBe(true);
    });

    test('should create comprehensive plans for complex goals', async () => {
      const goals: Goal[] = [
        {
          id: 'goal-1',
          description: 'Analyze healthcare data for treatment effectiveness patterns',
          priority: 9,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          successCriteria: ['statistical_significance', 'clinical_relevance'],
          constraints: ['privacy_compliance', 'ethical_guidelines']
        },
        {
          id: 'goal-2',
          description: 'Generate predictive model for patient outcomes',
          priority: 8,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          successCriteria: ['accuracy_above_85%', 'interpretability'],
          constraints: ['bias_prevention', 'validation_required']
        }
      ];

      const tasks = await pythagorasAgent.plan(goals, sampleContext);
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      
      tasks.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('type');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('status');
        expect(['data_analysis', 'research', 'computation', 'hypothesis_testing']).toContain(task.type);
      });
    });

    test('should make data-driven decisions', async () => {
      const options: DecisionOption[] = [
        {
          id: 'option-1',
          description: 'Use random forest for predictive modeling',
          estimatedCost: 100,
          estimatedTime: 120,
          riskLevel: 'low',
          expectedOutcome: 'high_accuracy_model'
        },
        {
          id: 'option-2',
          description: 'Use deep neural network for predictive modeling',
          estimatedCost: 300,
          estimatedTime: 480,
          riskLevel: 'medium',
          expectedOutcome: 'very_high_accuracy_model'
        },
        {
          id: 'option-3',
          description: 'Use ensemble of multiple algorithms',
          estimatedCost: 200,
          estimatedTime: 240,
          riskLevel: 'medium',
          expectedOutcome: 'robust_accurate_model'
        }
      ];

      const decision = await pythagorasAgent.decide(options, sampleContext);
      
      expect(decision).toBeDefined();
      expect(options).toContain(decision);
      expect(decision).toHaveProperty('id');
      expect(decision).toHaveProperty('description');
    });

    test('should execute data analysis tasks', async () => {
      const dataAnalysisTask: Task = {
        id: 'data-task-1',
        type: 'data_analysis',
        description: 'Perform comprehensive statistical analysis on healthcare dataset',
        priority: 8,
        status: 'pending',
        estimated_duration: 180,
        dependencies: [],
        required_resources: ['computational_power', 'dataset_access']
      };

      const result = await pythagorasAgent.execute(dataAnalysisTask, sampleContext);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('insights');
      expect(result.result).toBe('data_analysis_complete');
      expect(Array.isArray(result.insights)).toBe(true);
    });

    test('should execute research tasks', async () => {
      const researchTask: Task = {
        id: 'research-task-1',
        type: 'research',
        description: 'Conduct literature review on machine learning in healthcare',
        priority: 7,
        status: 'pending',
        estimated_duration: 300,
        dependencies: [],
        required_resources: ['literature_access', 'analysis_tools']
      };

      const result = await pythagorasAgent.execute(researchTask, sampleContext);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('findings');
      expect(result.result).toBe('research_complete');
    });

    test('should learn from experiences and improve', async () => {
      const experience = {
        insights: [
          {
            title: 'Improved Feature Selection Method',
            description: 'Correlation-based feature selection improved model accuracy',
            significance: 0.8,
            confidence: 0.9
          }
        ],
        analysisResults: {
          accuracy_improvement: 0.15,
          processing_time_reduction: 0.25,
          method: 'ensemble_learning'
        },
        researchFindings: {
          novel_patterns: ['temporal_correlation_patterns'],
          validation_success: true,
          peer_review_score: 8.5
        },
        collaborationData: {
          successful_interactions: 12,
          knowledge_shared: 5,
          joint_insights: 3
        }
      };

      await expect(
        pythagorasAgent.learn(experience, sampleContext)
      ).resolves.not.toThrow();
      
      // Verify learning improves future performance
      const metricsAfter = pythagorasAgent.getMetrics();
      expect(metricsAfter).toBeDefined();
    });
  });

  describe('Specialized Data Analysis Capabilities', () => {
    test('should perform comprehensive data analysis', async () => {
      const analysis = await pythagorasAgent.performComprehensiveDataAnalysis(sampleDataset);
      
      expect(analysis).toHaveProperty('descriptive');
      expect(analysis).toHaveProperty('correlations');
      expect(analysis).toHaveProperty('models');
      expect(analysis).toHaveProperty('insights');
      expect(analysis).toHaveProperty('recommendations');
      
      expect(Array.isArray(analysis.descriptive)).toBe(true);
      expect(Array.isArray(analysis.correlations)).toBe(true);
      expect(Array.isArray(analysis.models)).toBe(true);
      expect(Array.isArray(analysis.insights)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      
      // Verify quality of analysis
      expect(analysis.descriptive.length).toBeGreaterThan(0);
      expect(analysis.insights.length).toBeGreaterThan(0);
    });

    test('should identify data quality issues and recommendations', async () => {
      const analysis = await pythagorasAgent.performComprehensiveDataAnalysis(sampleDataset);
      
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      
      analysis.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });

    test('should generate actionable insights from data', async () => {
      const analysis = await pythagorasAgent.performComprehensiveDataAnalysis(sampleDataset);
      
      analysis.insights.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('significance');
        expect(insight).toHaveProperty('confidence');
        expect(insight.significance).toBeGreaterThan(0);
        expect(insight.significance).toBeLessThanOrEqual(1);
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Research Investigation Capabilities', () => {
    test('should conduct comprehensive research investigations', async () => {
      const investigation = await pythagorasAgent.conductResearchInvestigation(
        'machine learning interpretability in healthcare',
        'deep'
      );
      
      expect(investigation).toHaveProperty('literatureReview');
      expect(investigation).toHaveProperty('hypotheses');
      expect(investigation).toHaveProperty('experimentDesigns');
      expect(investigation).toHaveProperty('insights');
      expect(investigation).toHaveProperty('futureDirections');
      
      expect(investigation.literatureReview).toHaveProperty('id');
      expect(investigation.literatureReview).toHaveProperty('topic');
      expect(investigation.literatureReview).toHaveProperty('sources');
      expect(Array.isArray(investigation.hypotheses)).toBe(true);
      expect(Array.isArray(investigation.experimentDesigns)).toBe(true);
    });

    test('should generate testable hypotheses', async () => {
      const investigation = await pythagorasAgent.conductResearchInvestigation(
        'AI bias in medical diagnosis',
        'moderate'
      );
      
      investigation.hypotheses.forEach(hypothesis => {
        expect(hypothesis).toHaveProperty('id');
        expect(hypothesis).toHaveProperty('statement');
        expect(hypothesis).toHaveProperty('testability');
        expect(hypothesis).toHaveProperty('novelty');
        expect(hypothesis).toHaveProperty('significance');
        expect(hypothesis.testability).toBeGreaterThan(0.5);
        expect(hypothesis.novelty).toBeGreaterThan(0);
      });
    });

    test('should design rigorous experiments', async () => {
      const investigation = await pythagorasAgent.conductResearchInvestigation(
        'federated learning effectiveness',
        'moderate'
      );
      
      investigation.experimentDesigns.forEach(design => {
        expect(design).toHaveProperty('id');
        expect(design).toHaveProperty('title');
        expect(design).toHaveProperty('methodology');
        expect(design).toHaveProperty('participants');
        expect(design).toHaveProperty('variables');
        expect(design).toHaveProperty('procedures');
      });
    });

    test('should identify future research directions', async () => {
      const investigation = await pythagorasAgent.conductResearchInvestigation(
        'quantum machine learning',
        'shallow'
      );
      
      expect(Array.isArray(investigation.futureDirections)).toBe(true);
      expect(investigation.futureDirections.length).toBeGreaterThan(0);
      
      investigation.futureDirections.forEach(direction => {
        expect(typeof direction).toBe('string');
        expect(direction.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Mathematical Problem Solving', () => {
    test('should solve optimization problems', async () => {
      const optimizationProblem = {
        type: 'optimization' as const,
        description: 'Minimize treatment costs while maximizing patient outcomes',
        constraints: [
          { type: 'budget', limit: 100000 },
          { type: 'quality', minimum: 0.85 },
          { type: 'capacity', maximum: 1000 }
        ],
        objectives: [
          { type: 'minimize', target: 'cost' },
          { type: 'maximize', target: 'outcome_quality' }
        ]
      };

      const solution = await pythagorasAgent.solveComplexMathematicalProblem(optimizationProblem);
      
      expect(solution).toHaveProperty('solution');
      expect(solution).toHaveProperty('methodology');
      expect(solution).toHaveProperty('validation');
      expect(solution).toHaveProperty('insights');
      expect(solution).toHaveProperty('applications');
      
      expect(solution.validation.valid).toBe(true);
      expect(solution.validation.confidence).toBeGreaterThan(0.8);
      expect(Array.isArray(solution.insights)).toBe(true);
      expect(Array.isArray(solution.applications)).toBe(true);
    });

    test('should solve differential equations', async () => {
      const differentialProblem = {
        type: 'differential_equation' as const,
        description: 'Model disease spread dynamics in population',
        constraints: [
          { type: 'initial_conditions', values: [1000, 1, 0] },
          { type: 'parameter_bounds', ranges: [[0, 1], [0, 1]] }
        ],
        objectives: [
          { type: 'model', target: 'epidemic_dynamics' }
        ]
      };

      const solution = await pythagorasAgent.solveComplexMathematicalProblem(differentialProblem);
      
      expect(solution.solution).toBeDefined();
      expect(solution.methodology).toContain('differential equation');
      expect(solution.validation.valid).toBe(true);
    });

    test('should solve numerical computation problems', async () => {
      const numericalProblem = {
        type: 'numerical_computation' as const,
        description: 'Calculate statistical significance of treatment differences',
        constraints: [
          { type: 'precision', requirement: 'double' },
          { type: 'significance_level', value: 0.05 }
        ],
        objectives: [
          { type: 'compute', target: 'p_values' },
          { type: 'compute', target: 'effect_sizes' }
        ],
        data: {
          group1: [12, 15, 18, 22, 25],
          group2: [8, 11, 14, 17, 20]
        }
      };

      const solution = await pythagorasAgent.solveComplexMathematicalProblem(numericalProblem);
      
      expect(solution.solution).toBeDefined();
      expect(solution.methodology).toContain('numerical');
      expect(solution.applications.length).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    test('should create and manage research sessions', async () => {
      const goals: Goal[] = [
        {
          id: 'session-goal',
          description: 'Comprehensive healthcare data analysis',
          priority: 8,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];

      const tasks = await pythagorasAgent.plan(goals, sampleContext);
      expect(tasks.length).toBeGreaterThan(0);

      const session = pythagorasAgent.getCurrentSession();
      if (session) {
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('type');
        expect(session).toHaveProperty('progress');
        expect(session).toHaveProperty('startTime');
        expect(session.progress.completion).toBeGreaterThanOrEqual(0);
        expect(session.progress.completion).toBeLessThanOrEqual(1);
      }
    });

    test('should track session progress', async () => {
      const dataTask: Task = {
        id: 'progress-task',
        type: 'data_analysis',
        description: 'Track analysis progress',
        priority: 5,
        status: 'pending',
        estimated_duration: 60,
        dependencies: [],
        required_resources: []
      };

      await pythagorasAgent.execute(dataTask, sampleContext);
      
      const session = pythagorasAgent.getCurrentSession();
      if (session) {
        expect(session.progress.completion).toBeGreaterThan(0);
        expect(session.progress.milestonesAchieved.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Collaboration Capabilities', () => {
    test('should identify collaboration opportunities', async () => {
      const observations = await pythagorasAgent.perceive(sampleContext);
      
      const collaborationObs = observations.filter(obs => 
        obs.includes('Collaboration') || obs.includes('collaboration')
      );
      
      expect(collaborationObs.length).toBeGreaterThan(0);
    });

    test('should make collaborative decisions', async () => {
      const collaborativeContext: AgentContext = {
        ...sampleContext,
        environment: {
          ...sampleContext.environment,
          collaborators: ['EdisonAgent', 'AtlasAgent', 'LilithAgent']
        }
      };

      const options: DecisionOption[] = [
        {
          id: 'solo-analysis',
          description: 'Perform analysis independently',
          estimatedCost: 100,
          estimatedTime: 180,
          riskLevel: 'low'
        },
        {
          id: 'collaborative-analysis',
          description: 'Collaborate with other agents for comprehensive analysis',
          estimatedCost: 150,
          estimatedTime: 120,
          riskLevel: 'low'
        }
      ];

      const decision = await pythagorasAgent.decide(options, collaborativeContext);
      expect(decision).toBeDefined();
    });
  });

  describe('Performance and Quality Assurance', () => {
    test('should maintain high accuracy in analysis', async () => {
      const analysis = await pythagorasAgent.performComprehensiveDataAnalysis(sampleDataset);
      
      // Check that insights have high confidence and significance
      analysis.insights.forEach(insight => {
        expect(insight.confidence).toBeGreaterThan(0.7);
        expect(insight.significance).toBeGreaterThan(0.5);
      });
    });

    test('should handle large datasets efficiently', async () => {
      const largeDataset: Dataset = {
        ...sampleDataset,
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: Math.random() * 100,
          category: Math.random() > 0.5 ? 'A' : 'B',
          timestamp: new Date(Date.now() + i * 1000)
        })),
        size: 1000
      };

      const startTime = Date.now();
      const analysis = await pythagorasAgent.performComprehensiveDataAnalysis(largeDataset);
      const endTime = Date.now();

      expect(analysis).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(analysis.descriptive.length).toBeGreaterThan(0);
    });

    test('should validate research quality', async () => {
      const investigation = await pythagorasAgent.conductResearchInvestigation(
        'healthcare AI ethics',
        'moderate'
      );
      
      expect(investigation.literatureReview.quality).toBeDefined();
      expect(investigation.literatureReview.quality.overall).toBeGreaterThan(0.7);
      
      investigation.hypotheses.forEach(hypothesis => {
        expect(hypothesis.testability).toBeGreaterThan(0.6);
        expect(hypothesis.significance).toBeGreaterThan(0.5);
      });
    });

    test('should maintain computational efficiency', async () => {
      const optimizationProblem = {
        type: 'optimization' as const,
        description: 'Resource allocation optimization',
        constraints: [{ type: 'budget', limit: 50000 }],
        objectives: [{ type: 'maximize', target: 'efficiency' }]
      };

      const startTime = Date.now();
      const solution = await pythagorasAgent.solveComplexMathematicalProblem(optimizationProblem);
      const endTime = Date.now();

      expect(solution).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should solve within 5 seconds
      expect(solution.validation.valid).toBe(true);
    });
  });

  describe('Error Handling and Robustness', () => {
    test('should handle invalid data gracefully', async () => {
      const invalidDataset: Dataset = {
        ...sampleDataset,
        data: []
      };

      await expect(
        pythagorasAgent.performComprehensiveDataAnalysis(invalidDataset)
      ).rejects.toThrow();
    });

    test('should handle research topic validation', async () => {
      await expect(
        pythagorasAgent.conductResearchInvestigation('', 'moderate')
      ).rejects.toThrow();
    });

    test('should recover from computational errors', async () => {
      const problematicProblem = {
        type: 'optimization' as const,
        description: 'Invalid optimization problem',
        constraints: [],
        objectives: []
      };

      await expect(
        pythagorasAgent.solveComplexMathematicalProblem(problematicProblem)
      ).rejects.toThrow();
    });

    test('should handle resource constraints', async () => {
      const constrainedContext: AgentContext = {
        ...sampleContext,
        environment: {
          ...sampleContext.environment,
          resources: {
            computational_power: 'limited',
            memory: 'low'
          }
        }
      };

      const observations = await pythagorasAgent.perceive(constrainedContext);
      expect(observations).toBeDefined();
      expect(Array.isArray(observations)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should perform complete research and analysis workflow', async () => {
      // Step 1: Perception
      const observations = await pythagorasAgent.perceive(sampleContext);
      expect(observations.length).toBeGreaterThan(0);

      // Step 2: Planning
      const goals: Goal[] = [
        {
          id: 'workflow-goal',
          description: 'Complete healthcare analytics investigation',
          priority: 9,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];
      const tasks = await pythagorasAgent.plan(goals, sampleContext);
      expect(tasks.length).toBeGreaterThan(0);

      // Step 3: Execution
      const firstTask = tasks[0];
      const result = await pythagorasAgent.execute(firstTask, sampleContext);
      expect(result).toBeDefined();

      // Step 4: Analysis
      const analysis = await pythagorasAgent.performComprehensiveDataAnalysis(sampleDataset);
      expect(analysis.insights.length).toBeGreaterThan(0);

      // Step 5: Research
      const investigation = await pythagorasAgent.conductResearchInvestigation(
        'healthcare data analytics',
        'moderate'
      );
      expect(investigation.hypotheses.length).toBeGreaterThan(0);

      // Verify workflow coherence
      expect(analysis.insights[0].confidence).toBeGreaterThan(0.5);
      expect(investigation.literatureReview.quality.overall).toBeGreaterThan(0.7);
    });

    test('should integrate all capabilities for complex problem solving', async () => {
      const complexGoal: Goal = {
        id: 'complex-integration',
        description: 'Develop predictive model for patient outcomes with ethical considerations',
        priority: 10,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        successCriteria: ['high_accuracy', 'interpretability', 'ethical_compliance']
      };

      // Planning phase
      const tasks = await pythagorasAgent.plan([complexGoal], sampleContext);
      expect(tasks.length).toBeGreaterThan(0);

      // Analysis phase
      const analysis = await pythagorasAgent.performComprehensiveDataAnalysis(sampleDataset);
      expect(analysis.models.length).toBeGreaterThan(0);

      // Research phase
      const investigation = await pythagorasAgent.conductResearchInvestigation(
        'ethical AI in healthcare predictions',
        'deep'
      );
      expect(investigation.experimentDesigns.length).toBeGreaterThan(0);

      // Mathematical optimization
      const optimizationProblem = {
        type: 'optimization' as const,
        description: 'Optimize model parameters for accuracy and fairness',
        constraints: [
          { type: 'fairness', threshold: 0.8 },
          { type: 'accuracy', minimum: 0.85 }
        ],
        objectives: [
          { type: 'maximize', target: 'predictive_accuracy' },
          { type: 'maximize', target: 'fairness_score' }
        ]
      };

      const solution = await pythagorasAgent.solveComplexMathematicalProblem(optimizationProblem);
      expect(solution.validation.valid).toBe(true);

      // Verify integration quality
      expect(analysis.insights.length).toBeGreaterThan(0);
      expect(investigation.insights.length).toBeGreaterThan(0);
      expect(solution.insights.length).toBeGreaterThan(0);
    });
  });
});