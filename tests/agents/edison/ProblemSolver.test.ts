/**
 * @jest-environment node
 */

import { 
  ProblemSolver, 
  type Problem, 
  type Solution, 
  type ProblemType,
  type Constraint,
  type Objective,
  type ProblemSolverConfig,
  type ValidationResult
} from '../../../src/agents/edison/ProblemSolver';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    // Mock responses based on prompt content
    if (prompt.includes('Analyze this problem')) {
      return JSON.stringify({
        complexity: 7,
        estimatedSolutionTime: 2,
        keyFactors: ['resource constraints', 'time limitations', 'technical complexity'],
        potentialApproaches: ['systematic analysis', 'iterative development', 'parallel processing'],
        similarProblems: ['previous optimization challenges'],
        recommendedStrategy: 'systematic'
      });
    }
    
    if (prompt.includes('Decompose this complex problem')) {
      return JSON.stringify([
        {
          description: 'Analyze current system performance',
          type: 'technical',
          dependencies: [],
          order: 0,
          complexity: 5
        },
        {
          description: 'Identify optimization opportunities',
          type: 'optimization',
          dependencies: ['0'],
          order: 1,
          complexity: 6
        }
      ]);
    }
    
    if (prompt.includes('Identify patterns')) {
      return JSON.stringify([
        {
          name: 'Performance Bottleneck Pattern',
          description: 'Recurring performance issues in high-load scenarios',
          applicability: 0.8,
          examples: ['Database query optimization', 'Cache management'],
          category: 'performance'
        }
      ]);
    }
    
    if (prompt.includes('Generate a solution using')) {
      return JSON.stringify({
        approach: 'Systematic performance optimization approach',
        steps: [
          {
            description: 'Profile current system performance',
            action: 'run performance profiling tools',
            estimatedDuration: 60,
            complexity: 4
          },
          {
            description: 'Implement caching strategy',
            action: 'add Redis caching layer',
            estimatedDuration: 120,
            complexity: 6
          }
        ],
        confidence: 0.8,
        risks: [
          {
            description: 'Caching might introduce data consistency issues',
            probability: 0.3,
            impact: 6,
            mitigation: 'Implement cache invalidation strategy'
          }
        ],
        benefits: [
          {
            description: 'Improved response times',
            value: 8,
            timeToRealize: 7
          }
        ]
      });
    }
    
    if (prompt.includes('Optimize this solution')) {
      return JSON.stringify({
        improvedApproach: 'Enhanced systematic optimization with monitoring',
        improvements: ['Add real-time monitoring', 'Implement automatic scaling'],
        tradeoffs: ['Increased complexity', 'Higher operational costs']
      });
    }
    
    if (prompt.includes('Validate this solution')) {
      return JSON.stringify({
        issues: ['Potential scalability concerns'],
        suggestions: ['Consider load balancing', 'Add monitoring dashboard']
      });
    }
    
    return '{}';
  }
}

describe('ProblemSolver', () => {
  let problemSolver: ProblemSolver;
  let mockLLMProvider: MockLLMProvider;
  
  const mockProblem: Problem = {
    id: 'test-problem-1',
    type: 'optimization',
    description: 'Optimize web application performance under high load',
    constraints: [
      {
        id: 'constraint-1',
        type: 'hard',
        description: 'Response time must be under 200ms',
        priority: 10
      },
      {
        id: 'constraint-2',
        type: 'soft',
        description: 'Minimize infrastructure costs',
        priority: 7
      }
    ],
    objectives: [
      {
        id: 'objective-1',
        description: 'Reduce average response time',
        metric: 'milliseconds',
        target: 150,
        weight: 0.6
      },
      {
        id: 'objective-2',
        description: 'Increase throughput',
        metric: 'requests per second',
        target: 1000,
        weight: 0.4
      }
    ],
    context: {
      currentResponseTime: 300,
      currentThroughput: 500,
      budget: 50000
    },
    complexity: 7
  };

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    problemSolver = new ProblemSolver(mockLLMProvider, {
      maxDecompositionDepth: 3,
      enableLearning: true,
      optimizationIterations: 2
    });
  });

  describe('Problem Analysis', () => {
    test('should analyze problem complexity correctly', async () => {
      const analysis = await problemSolver.analyzeProblem(mockProblem);
      
      expect(analysis).toBeDefined();
      expect(analysis.problemId).toBe('test-problem-1');
      expect(analysis.complexity).toBeGreaterThan(0);
      expect(analysis.complexity).toBeLessThanOrEqual(10);
      expect(analysis.keyFactors).toBeInstanceOf(Array);
      expect(analysis.potentialApproaches).toBeInstanceOf(Array);
      expect(analysis.recommendedStrategy).toBeDefined();
    });

    test('should cache analysis results', async () => {
      const analysis1 = await problemSolver.analyzeProblem(mockProblem);
      const analysis2 = await problemSolver.analyzeProblem(mockProblem);
      
      expect(analysis1).toEqual(analysis2);
    });

    test('should handle analysis errors gracefully', async () => {
      const invalidProblem = { ...mockProblem, id: undefined } as any;
      
      await expect(problemSolver.analyzeProblem(invalidProblem))
        .rejects.toThrow();
    });
  });

  describe('Problem Decomposition', () => {
    test('should decompose complex problems into sub-problems', async () => {
      const complexProblem = { ...mockProblem, complexity: 8 };
      const subProblems = await problemSolver.decomposeComplexProblem(complexProblem);
      
      expect(subProblems).toBeInstanceOf(Array);
      if (subProblems.length > 0) {
        expect(subProblems[0]).toHaveProperty('parentId', complexProblem.id);
        expect(subProblems[0]).toHaveProperty('order');
        expect(subProblems[0]).toHaveProperty('dependencies');
      }
    });

    test('should not decompose simple problems', async () => {
      const simpleProblem = { ...mockProblem, complexity: 3 };
      const subProblems = await problemSolver.decomposeComplexProblem(simpleProblem);
      
      expect(subProblems).toHaveLength(0);
    });

    test('should handle decomposition errors', async () => {
      const malformedProblem = { ...mockProblem, description: undefined } as any;
      
      await expect(problemSolver.decomposeComplexProblem(malformedProblem))
        .rejects.toThrow();
    });
  });

  describe('Pattern Recognition', () => {
    test('should identify patterns in data', async () => {
      const testData = [
        { type: 'performance', issue: 'slow queries', time: '2023-01-01' },
        { type: 'performance', issue: 'high CPU', time: '2023-01-02' },
        { type: 'error', issue: 'timeout', time: '2023-01-03' }
      ];

      const patterns = await problemSolver.identifyPatterns(testData);
      
      expect(patterns).toBeInstanceOf(Array);
      if (patterns.length > 0) {
        expect(patterns[0]).toHaveProperty('name');
        expect(patterns[0]).toHaveProperty('description');
        expect(patterns[0]).toHaveProperty('applicability');
        expect(patterns[0].applicability).toBeGreaterThanOrEqual(0);
        expect(patterns[0].applicability).toBeLessThanOrEqual(1);
      }
    });

    test('should handle empty data gracefully', async () => {
      const patterns = await problemSolver.identifyPatterns([]);
      expect(patterns).toBeInstanceOf(Array);
    });
  });

  describe('Solution Generation', () => {
    test('should generate multiple solutions for a problem', async () => {
      const solutions = await problemSolver.generateSolutions(mockProblem);
      
      expect(solutions).toBeInstanceOf(Array);
      expect(solutions.length).toBeGreaterThan(0);
      
      if (solutions.length > 0) {
        const solution = solutions[0];
        expect(solution).toHaveProperty('id');
        expect(solution).toHaveProperty('problemId', mockProblem.id);
        expect(solution).toHaveProperty('approach');
        expect(solution).toHaveProperty('steps');
        expect(solution).toHaveProperty('confidence');
        expect(solution.confidence).toBeGreaterThan(0);
        expect(solution.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('should include risk assessment in solutions', async () => {
      const solutions = await problemSolver.generateSolutions(mockProblem);
      
      if (solutions.length > 0) {
        const solution = solutions[0];
        expect(solution).toHaveProperty('risks');
        expect(solution.risks).toBeInstanceOf(Array);
        
        if (solution.risks.length > 0) {
          const risk = solution.risks[0];
          expect(risk).toHaveProperty('description');
          expect(risk).toHaveProperty('probability');
          expect(risk).toHaveProperty('impact');
          expect(risk).toHaveProperty('mitigation');
        }
      }
    });

    test('should include benefits in solutions', async () => {
      const solutions = await problemSolver.generateSolutions(mockProblem);
      
      if (solutions.length > 0) {
        const solution = solutions[0];
        expect(solution).toHaveProperty('benefits');
        expect(solution.benefits).toBeInstanceOf(Array);
        
        if (solution.benefits.length > 0) {
          const benefit = solution.benefits[0];
          expect(benefit).toHaveProperty('description');
          expect(benefit).toHaveProperty('value');
          expect(benefit).toHaveProperty('timeToRealize');
        }
      }
    });
  });

  describe('Solution Optimization', () => {
    test('should optimize existing solutions', async () => {
      const solutions = await problemSolver.generateSolutions(mockProblem);
      expect(solutions.length).toBeGreaterThan(0);
      
      const originalSolution = solutions[0];
      const optimizedSolution = await problemSolver.optimizeSolution(originalSolution);
      
      expect(optimizedSolution).toHaveProperty('optimizationScore');
      expect(optimizedSolution).toHaveProperty('improvements');
      expect(optimizedSolution).toHaveProperty('tradeoffs');
      expect(optimizedSolution.improvements).toBeInstanceOf(Array);
      expect(optimizedSolution.tradeoffs).toBeInstanceOf(Array);
    });

    test('should improve solution confidence through optimization', async () => {
      const solutions = await problemSolver.generateSolutions(mockProblem);
      expect(solutions.length).toBeGreaterThan(0);
      
      const originalSolution = solutions[0];
      const optimizedSolution = await problemSolver.optimizeSolution(originalSolution);
      
      expect(optimizedSolution.confidence).toBeGreaterThanOrEqual(originalSolution.confidence);
    });
  });

  describe('Solution Validation', () => {
    test('should validate solutions against problem constraints', async () => {
      const solutions = await problemSolver.generateSolutions(mockProblem);
      expect(solutions.length).toBeGreaterThan(0);
      
      const solution = solutions[0];
      const validation = await problemSolver.validateSolution(solution, mockProblem);
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('score');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('suggestions');
      expect(validation).toHaveProperty('constraintsSatisfied');
      expect(validation).toHaveProperty('objectivesMet');
      
      expect(validation.score).toBeGreaterThanOrEqual(0);
      expect(validation.score).toBeLessThanOrEqual(1);
      expect(validation.issues).toBeInstanceOf(Array);
      expect(validation.suggestions).toBeInstanceOf(Array);
    });

    test('should identify constraint violations', async () => {
      const strictProblem = {
        ...mockProblem,
        constraints: [
          {
            id: 'strict-constraint',
            type: 'hard' as const,
            description: 'Must be completed in 1 hour',
            priority: 10,
            validator: (solution: Solution) => solution.estimatedEffort <= 60
          }
        ]
      };

      const solutions = await problemSolver.generateSolutions(strictProblem);
      expect(solutions.length).toBeGreaterThan(0);
      
      const solution = solutions[0];
      const validation = await problemSolver.validateSolution(solution, strictProblem);
      
      // Should catch constraint violations
      if (solution.estimatedEffort > 60) {
        expect(validation.constraintsSatisfied).toBe(false);
        expect(validation.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Metrics and Performance', () => {
    test('should track solver metrics', async () => {
      // Generate some activity
      await problemSolver.analyzeProblem(mockProblem);
      await problemSolver.generateSolutions(mockProblem);
      await problemSolver.identifyPatterns([{ test: 'data' }]);
      
      const metrics = problemSolver.getMetrics();
      
      expect(metrics).toHaveProperty('patternsDiscovered');
      expect(metrics).toHaveProperty('problemsAnalyzed');
      expect(metrics).toHaveProperty('solutionsGenerated');
      expect(metrics).toHaveProperty('averageConfidence');
      
      expect(metrics.problemsAnalyzed).toBeGreaterThan(0);
      expect(metrics.solutionsGenerated).toBeGreaterThan(0);
    });

    test('should calculate average confidence correctly', async () => {
      const solutions = await problemSolver.generateSolutions(mockProblem);
      const metrics = problemSolver.getMetrics();
      
      if (solutions.length > 0) {
        expect(metrics.averageConfidence).toBeGreaterThan(0);
        expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect configuration limits', () => {
      const config: Partial<ProblemSolverConfig> = {
        maxDecompositionDepth: 2,
        optimizationIterations: 1,
        enableLearning: false
      };
      
      const customSolver = new ProblemSolver(mockLLMProvider, config);
      expect(customSolver).toBeDefined();
    });

    test('should handle different strategy preferences', async () => {
      const analyticalConfig: Partial<ProblemSolverConfig> = {
        solutionGenerationStrategies: ['analytical', 'systematic']
      };
      
      const analyticalSolver = new ProblemSolver(mockLLMProvider, analyticalConfig);
      const solutions = await analyticalSolver.generateSolutions(mockProblem);
      
      expect(solutions).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed problem data', async () => {
      const malformedProblem = {
        id: 'malformed',
        type: 'invalid-type' as ProblemType,
        description: '',
        constraints: [],
        objectives: [],
        context: {},
        complexity: -1
      };

      await expect(problemSolver.analyzeProblem(malformedProblem))
        .rejects.toThrow();
    });

    test('should handle LLM failures gracefully', async () => {
      const failingProvider: LLMProvider = {
        async generateResponse() {
          throw new Error('LLM service unavailable');
        }
      };
      
      const failingSolver = new ProblemSolver(failingProvider);
      
      await expect(failingSolver.analyzeProblem(mockProblem))
        .rejects.toThrow('Failed to analyze problem');
    });

    test('should handle empty or null inputs', async () => {
      await expect(problemSolver.identifyPatterns([]))
        .resolves.toBeInstanceOf(Array);
      
      const emptyProblem = {
        ...mockProblem,
        constraints: [],
        objectives: []
      };
      
      await expect(problemSolver.generateSolutions(emptyProblem))
        .resolves.toBeInstanceOf(Array);
    });
  });

  describe('Integration with Pattern Database', () => {
    test('should store and retrieve patterns', async () => {
      const initialMetrics = problemSolver.getMetrics();
      
      await problemSolver.identifyPatterns([
        { category: 'performance', data: 'test1' },
        { category: 'performance', data: 'test2' }
      ]);
      
      const updatedMetrics = problemSolver.getMetrics();
      expect(updatedMetrics.patternsDiscovered).toBeGreaterThan(initialMetrics.patternsDiscovered);
    });

    test('should apply relevant patterns to solution generation', async () => {
      // First, discover some patterns
      await problemSolver.identifyPatterns([
        { category: 'optimization', pattern: 'caching strategy' },
        { category: 'optimization', pattern: 'load balancing' }
      ]);
      
      // Then generate solutions - should include pattern-based solutions
      const solutions = await problemSolver.generateSolutions(mockProblem);
      expect(solutions.length).toBeGreaterThan(0);
      
      // Solutions should be enhanced by discovered patterns
      const metrics = problemSolver.getMetrics();
      expect(metrics.patternsDiscovered).toBeGreaterThan(0);
    });
  });

  describe('Learning and Adaptation', () => {
    test('should learn from solution outcomes', async () => {
      const config: Partial<ProblemSolverConfig> = {
        enableLearning: true
      };
      
      const learningSolver = new ProblemSolver(mockLLMProvider, config);
      
      const solutions = await learningSolver.generateSolutions(mockProblem);
      expect(solutions.length).toBeGreaterThan(0);
      
      // Simulate learning from feedback
      const initialMetrics = learningSolver.getMetrics();
      expect(initialMetrics).toBeDefined();
    });
  });
});

describe('ProblemSolver Edge Cases and Stress Tests', () => {
  let problemSolver: ProblemSolver;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    problemSolver = new ProblemSolver(mockLLMProvider);
  });

  test('should handle extremely complex problems', async () => {
    const ultraComplexProblem: Problem = {
      id: 'ultra-complex',
      type: 'optimization',
      description: 'Optimize global supply chain with 1000+ variables and real-time constraints',
      constraints: Array.from({ length: 50 }, (_, i) => ({
        id: `constraint-${i}`,
        type: i % 2 === 0 ? 'hard' as const : 'soft' as const,
        description: `Constraint ${i}`,
        priority: i
      })),
      objectives: Array.from({ length: 20 }, (_, i) => ({
        id: `objective-${i}`,
        description: `Objective ${i}`,
        metric: 'units',
        target: 100 + i,
        weight: 1 / 20
      })),
      context: { complexity: 'extreme' },
      complexity: 10
    };

    const analysis = await problemSolver.analyzeProblem(ultraComplexProblem);
    expect(analysis).toBeDefined();
    expect(analysis.complexity).toBe(10);
  });

  test('should handle concurrent problem solving', async () => {
    const problems = Array.from({ length: 5 }, (_, i) => ({
      id: `concurrent-problem-${i}`,
      type: 'technical' as const,
      description: `Concurrent problem ${i}`,
      constraints: [],
      objectives: [],
      context: {},
      complexity: 5
    }));

    const analysisPromises = problems.map(problem => 
      problemSolver.analyzeProblem(problem)
    );

    const analyses = await Promise.all(analysisPromises);
    expect(analyses).toHaveLength(5);
    analyses.forEach(analysis => {
      expect(analysis).toBeDefined();
      expect(analysis.complexity).toBeGreaterThan(0);
    });
  });

  test('should maintain performance with large datasets', async () => {
    const largeDa] = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      type: 'data-point',
      value: Math.random(),
      category: `category-${i % 10}`
    }));

    const startTime = Date.now();
    const patterns = await problemSolver.identifyPatterns(largeData);
    const endTime = Date.now();

    expect(patterns).toBeInstanceOf(Array);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});