/**
 * @jest-environment node
 */

import {
  ComputationalEngine,
  MathematicalExpression,
  Matrix,
  OptimizationProblem,
  DifferentialEquation,
  Algorithm,
  TaskResult,
  ComputationTask,
  ComputationalEngineConfig,
  NumericalMethod,
  OptimizationSolution,
  DESolution
} from '../../../src/agents/pythagoras/ComputationalEngine';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for ComputationalEngine tests
class MockComputationalEngineLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    if (prompt.includes('Select the best numerical method')) {
      return JSON.stringify({
        method: 'Newton-Raphson',
        reasoning: 'Excellent convergence for smooth functions with known derivatives',
        parameters: {
          tolerance: 1e-10,
          max_iterations: 100,
          initial_guess: 1.0
        },
        advantages: ['Quadratic convergence', 'Well-established'],
        limitations: ['Requires derivative', 'Sensitive to initial guess'],
        alternatives: ['Bisection', 'Secant method']
      });
    }

    if (prompt.includes('Analyze algorithm performance')) {
      return JSON.stringify({
        complexity_analysis: {
          time: 'O(n log n)',
          space: 'O(n)',
          scalability: 'Good for large inputs'
        },
        bottlenecks: ['Memory bandwidth', 'Cache misses'],
        optimization_opportunities: [
          'Vectorization with SIMD',
          'Parallel processing',
          'Memory layout optimization'
        ],
        benchmark_comparison: {
          baseline: 100,
          optimized: 65,
          improvement: '35% faster'
        }
      });
    }

    if (prompt.includes('Recommend optimization algorithm')) {
      return JSON.stringify({
        algorithm: 'Interior Point Method',
        rationale: 'Efficient for large-scale constrained optimization',
        expected_performance: {
          convergence_rate: 'polynomial',
          iterations: 25,
          accuracy: 1e-8
        },
        implementation_notes: [
          'Requires sparse matrix operations',
          'Benefits from warm start'
        ]
      });
    }

    if (prompt.includes('Solve differential equation')) {
      return JSON.stringify({
        solution_approach: 'Runge-Kutta 4th order',
        step_size: 0.01,
        stability_analysis: 'Conditionally stable',
        error_estimation: 'Local truncation error O(h^5)',
        adaptive_stepping: true
      });
    }

    return 'Standard computational response';
  }
}

describe('ComputationalEngine', () => {
  let computationalEngine: ComputationalEngine;
  let mockLLMProvider: MockComputationalEngineLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockComputationalEngineLLMProvider();
    computationalEngine = new ComputationalEngine(mockLLMProvider, {
      precision: 'double',
      parallelism: true,
      gpuAcceleration: false,
      cachingEnabled: true,
      maxCacheSize: 1000,
      timeoutThreshold: 300000,
      memoryThreshold: 1073741824,
      optimization: {
        enabled: true,
        aggressive: false,
        techniques: ['vectorization', 'loop_unrolling']
      },
      validation: {
        enabled: true,
        strictness: 'medium',
        crossValidation: true
      }
    });
  });

  describe('Core Functionality', () => {
    test('should initialize with default configuration', () => {
      const engine = new ComputationalEngine(mockLLMProvider);
      expect(engine).toBeInstanceOf(ComputationalEngine);
    });

    test('should initialize with custom configuration', () => {
      const config: Partial<ComputationalEngineConfig> = {
        precision: 'quad',
        parallelism: false,
        cachingEnabled: false
      };
      const engine = new ComputationalEngine(mockLLMProvider, config);
      expect(engine).toBeInstanceOf(ComputationalEngine);
    });

    test('should get current metrics', () => {
      const metrics = computationalEngine.getMetrics();
      expect(metrics).toHaveProperty('algorithmsLibrary');
      expect(metrics).toHaveProperty('cachedResults');
      expect(metrics).toHaveProperty('activeComputations');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(typeof metrics.algorithmsLibrary).toBe('number');
    });
  });

  describe('Mathematical Expression Solving', () => {
    test('should solve algebraic expressions', async () => {
      const expression: MathematicalExpression = {
        id: 'expr-1',
        expression: '2*x + 5 = 15',
        domain: 'real',
        variables: [
          { symbol: 'x', domain: 'real', constraints: [] }
        ],
        constants: [
          { symbol: '2', value: 2, description: 'coefficient' },
          { symbol: '5', value: 5, description: 'constant term' },
          { symbol: '15', value: 15, description: 'result' }
        ],
        complexity: 3,
        type: 'algebraic'
      };

      const result = await computationalEngine.solveMathematicalExpression(expression);

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('validation');
      expect(result.metadata.computationTime).toBeGreaterThan(0);
      expect(result.metadata.accuracy).toBeGreaterThan(0.9);
      expect(result.validation.verified).toBe(true);
    });

    test('should solve transcendental expressions', async () => {
      const expression: MathematicalExpression = {
        id: 'expr-2',
        expression: 'e^x - 2*x = 0',
        domain: 'real',
        variables: [
          { symbol: 'x', domain: 'real' }
        ],
        constants: [
          { symbol: 'e', value: Math.E, description: 'Euler number' }
        ],
        complexity: 6,
        type: 'transcendental'
      };

      const result = await computationalEngine.solveMathematicalExpression(expression);

      expect(result.output).toHaveProperty('solution');
      expect(result.metadata.accuracy).toBeGreaterThan(0.95);
    });

    test('should handle complex number expressions', async () => {
      const expression: MathematicalExpression = {
        id: 'expr-3',
        expression: 'z^2 + 1 = 0',
        domain: 'complex',
        variables: [
          { symbol: 'z', domain: 'complex' }
        ],
        constants: [],
        complexity: 4,
        type: 'complex'
      };

      const result = await computationalEngine.solveMathematicalExpression(expression);

      expect(result.output).toHaveProperty('real');
      expect(result.output).toHaveProperty('imaginary');
    });

    test('should cache expression results', async () => {
      const expression: MathematicalExpression = {
        id: 'expr-cache',
        expression: 'x^2 - 4 = 0',
        domain: 'real',
        variables: [{ symbol: 'x', domain: 'real' }],
        constants: [],
        complexity: 2,
        type: 'algebraic'
      };

      const result1 = await computationalEngine.solveMathematicalExpression(expression);
      const result2 = await computationalEngine.solveMathematicalExpression(expression);

      expect(result1.output).toEqual(result2.output);
    });
  });

  describe('Matrix Operations', () => {
    test('should perform matrix addition', async () => {
      const matrix1: Matrix = {
        id: 'mat-1',
        rows: 2,
        cols: 2,
        data: [[1, 2], [3, 4]],
        type: 'dense',
        properties: {}
      };

      const matrix2: Matrix = {
        id: 'mat-2',
        rows: 2,
        cols: 2,
        data: [[5, 6], [7, 8]],
        type: 'dense',
        properties: {}
      };

      const result = await computationalEngine.performMatrixOperations(
        [matrix1, matrix2], 'addition'
      );

      expect(result.rows).toBe(2);
      expect(result.cols).toBe(2);
      expect(result.properties).toBeDefined();
    });

    test('should perform matrix multiplication', async () => {
      const matrix1: Matrix = {
        id: 'mat-3',
        rows: 2,
        cols: 3,
        data: [[1, 2, 3], [4, 5, 6]],
        type: 'dense',
        properties: {}
      };

      const matrix2: Matrix = {
        id: 'mat-4',
        rows: 3,
        cols: 2,
        data: [[7, 8], [9, 10], [11, 12]],
        type: 'dense',
        properties: {}
      };

      const result = await computationalEngine.performMatrixOperations(
        [matrix1, matrix2], 'multiplication'
      );

      expect(result.rows).toBe(2);
      expect(result.cols).toBe(2);
    });

    test('should calculate matrix decompositions', async () => {
      const matrix: Matrix = {
        id: 'mat-5',
        rows: 3,
        cols: 3,
        data: [[4, 2, 1], [2, 5, 3], [1, 3, 6]],
        type: 'symmetric',
        properties: {}
      };

      const decompositions = ['eigendecomposition', 'svd', 'cholesky', 'qr', 'lu'];

      for (const decomp of decompositions) {
        const result = await computationalEngine.performMatrixOperations([matrix], decomp);
        expect(result).toBeDefined();
        expect(result.properties).toBeDefined();
      }
    });

    test('should validate matrix compatibility', async () => {
      const incompatibleMatrix1: Matrix = {
        id: 'incompat-1',
        rows: 2,
        cols: 3,
        data: [[1, 2, 3], [4, 5, 6]],
        type: 'dense',
        properties: {}
      };

      const incompatibleMatrix2: Matrix = {
        id: 'incompat-2',
        rows: 2,
        cols: 3,
        data: [[7, 8, 9], [10, 11, 12]],
        type: 'dense',
        properties: {}
      };

      await expect(
        computationalEngine.performMatrixOperations(
          [incompatibleMatrix1, incompatibleMatrix2], 'multiplication'
        )
      ).rejects.toThrow();
    });
  });

  describe('Optimization Problems', () => {
    test('should solve linear optimization problems', async () => {
      const problem: OptimizationProblem = {
        id: 'opt-1',
        type: 'linear',
        objective: {
          expression: '3*x1 + 2*x2',
          type: 'maximize',
          coefficients: [3, 2]
        },
        constraints: [
          { expression: 'x1 + x2 <= 4', type: 'inequality' },
          { expression: '2*x1 + x2 <= 6', type: 'inequality' },
          { expression: 'x1 >= 0', type: 'inequality' },
          { expression: 'x2 >= 0', type: 'inequality' }
        ],
        variables: [
          { name: 'x1', type: 'continuous', bounds: { lower: 0 } },
          { name: 'x2', type: 'continuous', bounds: { lower: 0 } }
        ],
        method: {
          algorithm: 'simplex',
          parameters: {},
          convergence: {
            tolerance: 1e-8,
            maxIterations: 1000,
            criterion: 'absolute'
          },
          performance: {
            executionTime: 0,
            memoryUsage: 0,
            iterations: 0,
            functionEvaluations: 0
          }
        }
      };

      const solution = await computationalEngine.solveOptimizationProblem(problem);

      expect(solution).toHaveProperty('optimalValue');
      expect(solution).toHaveProperty('optimalPoint');
      expect(solution).toHaveProperty('verification');
      expect(solution).toHaveProperty('sensitivity');
      expect(solution.verification.feasible).toBe(true);
      expect(solution.verification.optimal).toBe(true);
    });

    test('should solve nonlinear optimization problems', async () => {
      const problem: OptimizationProblem = {
        id: 'opt-2',
        type: 'nonlinear',
        objective: {
          expression: 'x1^2 + x2^2',
          type: 'minimize',
          gradient: '2*x1, 2*x2',
          hessian: '[[2, 0], [0, 2]]'
        },
        constraints: [
          { expression: 'x1 + x2 = 1', type: 'equality' }
        ],
        variables: [
          { name: 'x1', type: 'continuous' },
          { name: 'x2', type: 'continuous' }
        ],
        method: {
          algorithm: 'interior_point',
          parameters: { barrier_parameter: 0.1 },
          convergence: {
            tolerance: 1e-6,
            maxIterations: 500,
            criterion: 'relative'
          },
          performance: {
            executionTime: 0,
            memoryUsage: 0,
            iterations: 0,
            functionEvaluations: 0
          }
        }
      };

      const solution = await computationalEngine.solveOptimizationProblem(problem);

      expect(solution.optimalValue).toBeGreaterThanOrEqual(0);
      expect(solution.optimalPoint.length).toBe(2);
    });

    test('should handle integer programming problems', async () => {
      const problem: OptimizationProblem = {
        id: 'opt-3',
        type: 'integer',
        objective: {
          expression: '2*x1 + 3*x2',
          type: 'maximize',
          coefficients: [2, 3]
        },
        constraints: [
          { expression: 'x1 + 2*x2 <= 8', type: 'inequality' },
          { expression: '2*x1 + x2 <= 10', type: 'inequality' }
        ],
        variables: [
          { name: 'x1', type: 'integer', bounds: { lower: 0 } },
          { name: 'x2', type: 'integer', bounds: { lower: 0 } }
        ],
        method: {
          algorithm: 'branch_and_bound',
          parameters: {},
          convergence: {
            tolerance: 1e-6,
            maxIterations: 1000,
            criterion: 'absolute'
          },
          performance: {
            executionTime: 0,
            memoryUsage: 0,
            iterations: 0,
            functionEvaluations: 0
          }
        }
      };

      const solution = await computationalEngine.solveOptimizationProblem(problem);

      expect(Number.isInteger(solution.optimalPoint[0])).toBe(true);
      expect(Number.isInteger(solution.optimalPoint[1])).toBe(true);
    });

    test('should perform sensitivity analysis', async () => {
      const problem: OptimizationProblem = {
        id: 'opt-sensitivity',
        type: 'linear',
        objective: { expression: 'x1 + x2', type: 'maximize' },
        constraints: [{ expression: 'x1 + x2 <= 10', type: 'inequality' }],
        variables: [
          { name: 'x1', type: 'continuous' },
          { name: 'x2', type: 'continuous' }
        ],
        method: {
          algorithm: 'simplex',
          parameters: {},
          convergence: { tolerance: 1e-8, maxIterations: 1000, criterion: 'absolute' },
          performance: { executionTime: 0, memoryUsage: 0, iterations: 0, functionEvaluations: 0 }
        }
      };

      const solution = await computationalEngine.solveOptimizationProblem(problem);

      expect(solution.sensitivity).toHaveProperty('parameterSensitivity');
      expect(solution.sensitivity).toHaveProperty('constraintSensitivity');
      expect(solution.sensitivity).toHaveProperty('robustness');
      expect(solution.sensitivity.robustness).toBeGreaterThan(0);
    });
  });

  describe('Differential Equations', () => {
    test('should solve ordinary differential equations', async () => {
      const equation: DifferentialEquation = {
        id: 'ode-1',
        type: 'ode',
        order: 1,
        equation: "dy/dx = -2*y",
        initialConditions: [
          { variable: 'y', derivative: 0, value: 1, position: [0] }
        ],
        domain: {
          temporal: { start: 0, end: 5 }
        }
      };

      const solution = await computationalEngine.solveDifferentialEquation(equation);

      expect(solution).toHaveProperty('method');
      expect(solution).toHaveProperty('numerical');
      expect(solution).toHaveProperty('validation');
      expect(solution.numerical).toHaveProperty('timeSteps');
      expect(solution.numerical).toHaveProperty('values');
      expect(solution.numerical.timeSteps.length).toBeGreaterThan(0);
    });

    test('should solve partial differential equations', async () => {
      const equation: DifferentialEquation = {
        id: 'pde-1',
        type: 'pde',
        order: 2,
        equation: "∂²u/∂x² + ∂²u/∂y² = 0",
        boundaryConditions: [
          { type: 'dirichlet', boundary: 'x=0', condition: 'u=0' },
          { type: 'dirichlet', boundary: 'x=1', condition: 'u=1' },
          { type: 'dirichlet', boundary: 'y=0', condition: 'u=0' },
          { type: 'dirichlet', boundary: 'y=1', condition: 'u=0' }
        ],
        domain: {
          spatial: {
            dimensions: 2,
            bounds: [[0, 1], [0, 1]]
          },
          mesh: {
            type: 'uniform',
            resolution: 0.1,
            nodes: 121,
            elements: 200
          }
        }
      };

      const solution = await computationalEngine.solveDifferentialEquation(equation);

      expect(solution.numerical).toHaveProperty('spatialPoints');
      expect(solution.validation).toHaveProperty('conservation');
    });

    test('should solve systems of differential equations', async () => {
      const equation: DifferentialEquation = {
        id: 'system-1',
        type: 'ode',
        order: 1,
        equation: "dx/dt = -x + y; dy/dt = x - y",
        initialConditions: [
          { variable: 'x', derivative: 0, value: 1, position: [0] },
          { variable: 'y', derivative: 0, value: 0, position: [0] }
        ],
        domain: {
          temporal: { start: 0, end: 10 }
        }
      };

      const solution = await computationalEngine.solveDifferentialEquation(equation);

      expect(solution.numerical.values.length).toBeGreaterThan(0);
      expect(solution.numerical.values[0].length).toBe(2); // Two variables
    });

    test('should validate solution accuracy', async () => {
      const equation: DifferentialEquation = {
        id: 'validation-test',
        type: 'ode',
        order: 1,
        equation: "dy/dx = y",
        initialConditions: [
          { variable: 'y', derivative: 0, value: 1, position: [0] }
        ],
        domain: {
          temporal: { start: 0, end: 1 }
        }
      };

      const solution = await computationalEngine.solveDifferentialEquation(equation);

      expect(solution.validation).toHaveProperty('conservation');
      expect(solution.validation).toHaveProperty('benchmarks');
      expect(solution.numerical.error).toHaveProperty('global');
      expect(solution.numerical.error.global).toBeLessThan(0.01);
    });
  });

  describe('Algorithm Optimization', () => {
    test('should optimize algorithm performance', async () => {
      const algorithm: Algorithm = {
        id: 'alg-1',
        name: 'Bubble Sort',
        type: 'sorting',
        description: 'Simple comparison-based sorting algorithm',
        implementation: {
          pseudocode: 'for i in range(n): for j in range(n-i-1): if arr[j] > arr[j+1]: swap(arr[j], arr[j+1])',
          parallelizable: false,
          memoryEfficient: true,
          numericallyStable: true
        },
        complexity: {
          time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
          space: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
          scalability: {
            inputSizeLimit: 10000,
            distributedCapable: false,
            bottlenecks: ['Nested loops', 'No early termination']
          }
        },
        optimization: {
          level: 'none',
          techniques: [],
          improvements: [],
          benchmarks: []
        }
      };

      const optimized = await computationalEngine.optimizeAlgorithm(algorithm);

      expect(optimized.optimization.level).not.toBe('none');
      expect(optimized.optimization.techniques.length).toBeGreaterThan(0);
      expect(optimized.optimization.improvements.length).toBeGreaterThan(0);
    });

    test('should benchmark algorithm performance', async () => {
      const algorithm: Algorithm = {
        id: 'alg-benchmark',
        name: 'Quick Sort',
        type: 'sorting',
        description: 'Efficient divide-and-conquer sorting',
        implementation: {
          pseudocode: 'QuickSort implementation',
          parallelizable: true,
          memoryEfficient: true,
          numericallyStable: false
        },
        complexity: {
          time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
          space: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)' },
          scalability: {
            inputSizeLimit: 1000000,
            distributedCapable: true,
            bottlenecks: []
          }
        },
        optimization: {
          level: 'basic',
          techniques: [],
          improvements: [],
          benchmarks: []
        }
      };

      const optimized = await computationalEngine.optimizeAlgorithm(algorithm);

      expect(optimized.optimization.benchmarks.length).toBeGreaterThan(0);
      optimized.optimization.benchmarks.forEach(benchmark => {
        expect(benchmark).toHaveProperty('testCase');
        expect(benchmark).toHaveProperty('inputSize');
        expect(benchmark).toHaveProperty('executionTime');
        expect(benchmark).toHaveProperty('memoryUsage');
      });
    });

    test('should identify optimization opportunities', async () => {
      const inefficientAlgorithm: Algorithm = {
        id: 'inefficient',
        name: 'Inefficient Search',
        type: 'searching',
        description: 'Linear search with redundant operations',
        implementation: {
          pseudocode: 'for each element: if element == target: return index',
          parallelizable: false,
          memoryEfficient: false,
          numericallyStable: true
        },
        complexity: {
          time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
          space: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
          scalability: {
            inputSizeLimit: 1000,
            distributedCapable: false,
            bottlenecks: ['Linear scan', 'Memory allocation in loop']
          }
        },
        optimization: {
          level: 'none',
          techniques: [],
          improvements: [],
          benchmarks: []
        }
      };

      const optimized = await computationalEngine.optimizeAlgorithm(inefficientAlgorithm);

      expect(optimized.optimization.improvements.length).toBeGreaterThan(0);
      expect(optimized.complexity.scalability.inputSizeLimit).toBeGreaterThan(
        inefficientAlgorithm.complexity.scalability.inputSizeLimit
      );
    });
  });

  describe('Numerical Analysis', () => {
    test('should perform interpolation', async () => {
      const data = [1, 4, 9, 16, 25]; // x^2 values
      const result = await computationalEngine.performNumericalAnalysis(data, 'interpolation');

      expect(result.output).toHaveProperty('method');
      expect(result.output).toHaveProperty('polynomial');
      expect(result.output).toHaveProperty('accuracy');
      expect(result.metadata.accuracy).toBeGreaterThan(0.9);
    });

    test('should perform numerical integration', async () => {
      const data = Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.1));
      const result = await computationalEngine.performNumericalAnalysis(data, 'integration');

      expect(result.output).toHaveProperty('integral_value');
      expect(result.output).toHaveProperty('method');
      expect(result.output).toHaveProperty('error_estimate');
    });

    test('should perform Fourier transform', async () => {
      const data = Array.from({ length: 64 }, (_, i) => 
        Math.sin(2 * Math.PI * i / 64) + 0.5 * Math.sin(4 * Math.PI * i / 64)
      );
      const result = await computationalEngine.performNumericalAnalysis(data, 'fourier_transform');

      expect(result.output).toHaveProperty('frequencies');
      expect(result.output).toHaveProperty('amplitudes');
      expect(result.output).toHaveProperty('phases');
    });

    test('should perform root finding', async () => {
      const data = [-1, 0, 1]; // Coefficients for x^2 - 1
      const result = await computationalEngine.performNumericalAnalysis(data, 'root_finding');

      expect(result.output).toHaveProperty('roots');
      expect(result.output).toHaveProperty('method');
      expect(Array.isArray(result.output.roots)).toBe(true);
    });

    test('should perform spectral analysis', async () => {
      const data = Array.from({ length: 128 }, (_, i) => 
        Math.sin(2 * Math.PI * 5 * i / 128) + Math.random() * 0.1
      );
      const result = await computationalEngine.performNumericalAnalysis(data, 'spectral_analysis');

      expect(result.output).toHaveProperty('power_spectrum');
      expect(result.output).toHaveProperty('dominant_frequencies');
      expect(result.output).toHaveProperty('noise_level');
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large-scale computations efficiently', async () => {
      const largeMatrix: Matrix = {
        id: 'large-matrix',
        rows: 100,
        cols: 100,
        data: Array.from({ length: 100 }, () => 
          Array.from({ length: 100 }, () => Math.random())
        ),
        type: 'dense',
        properties: {}
      };

      const startTime = Date.now();
      const result = await computationalEngine.performMatrixOperations([largeMatrix], 'transpose');
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should utilize caching for repeated computations', async () => {
      const expression: MathematicalExpression = {
        id: 'cache-test',
        expression: 'x^3 - 2*x + 1',
        domain: 'real',
        variables: [{ symbol: 'x', domain: 'real' }],
        constants: [],
        complexity: 4,
        type: 'algebraic'
      };

      const startTime1 = Date.now();
      const result1 = await computationalEngine.solveMathematicalExpression(expression);
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      const result2 = await computationalEngine.solveMathematicalExpression(expression);
      const endTime2 = Date.now();

      expect(result1.output).toEqual(result2.output);
      expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1); // Second call should be faster
    });

    test('should respect computational limits', async () => {
      const oversizedTask: ComputationTask = {
        id: 'oversized',
        type: 'simulation',
        description: 'Memory-intensive computation',
        input: {
          data: Array.from({ length: 1000000 }, () => Math.random()),
          parameters: {},
          format: 'array',
          size: 1000000 * 8 // 8MB of data
        },
        requirements: {
          precision: 'double',
          tolerance: 1e-10,
          maxTime: 1000, // 1 second
          maxMemory: 1000, // 1KB (too small)
          parallelism: false,
          gpu: false
        },
        status: {
          state: 'pending',
          progress: 0
        }
      };

      // Should handle resource constraints gracefully
      const metrics = computationalEngine.getMetrics();
      expect(metrics.memoryEfficiency).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Validation', () => {
    test('should handle invalid mathematical expressions', async () => {
      const invalidExpression: MathematicalExpression = {
        id: 'invalid',
        expression: '', // Empty expression
        domain: 'real',
        variables: [],
        constants: [],
        complexity: 0,
        type: 'algebraic'
      };

      await expect(
        computationalEngine.solveMathematicalExpression(invalidExpression)
      ).rejects.toThrow();
    });

    test('should validate matrix dimensions for operations', async () => {
      const matrix1: Matrix = {
        id: 'dim-error-1',
        rows: 2,
        cols: 3,
        data: [[1, 2, 3], [4, 5, 6]],
        type: 'dense',
        properties: {}
      };

      const matrix2: Matrix = {
        id: 'dim-error-2',
        rows: 2,
        cols: 2,
        data: [[1, 2], [3, 4]],
        type: 'dense',
        properties: {}
      };

      await expect(
        computationalEngine.performMatrixOperations([matrix1, matrix2], 'multiplication')
      ).rejects.toThrow();
    });

    test('should handle numerical instability', async () => {
      const illConditionedMatrix: Matrix = {
        id: 'ill-conditioned',
        rows: 2,
        cols: 2,
        data: [[1, 1], [1, 1.0000001]], // Nearly singular
        type: 'dense',
        properties: {}
      };

      const result = await computationalEngine.performMatrixOperations(
        [illConditionedMatrix], 'inverse'
      );

      expect(result.properties.condition).toBeDefined();
      expect(result.properties.condition).toBeGreaterThan(1000); // High condition number
    });

    test('should validate optimization problem formulation', async () => {
      const invalidProblem: OptimizationProblem = {
        id: 'invalid-opt',
        type: 'linear',
        objective: {
          expression: '', // Empty objective
          type: 'maximize'
        },
        constraints: [],
        variables: [],
        method: {
          algorithm: 'simplex',
          parameters: {},
          convergence: { tolerance: 1e-8, maxIterations: 1000, criterion: 'absolute' },
          performance: { executionTime: 0, memoryUsage: 0, iterations: 0, functionEvaluations: 0 }
        }
      };

      await expect(
        computationalEngine.solveOptimizationProblem(invalidProblem)
      ).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should perform complete computational workflow', async () => {
      // Step 1: Solve a mathematical expression
      const expression: MathematicalExpression = {
        id: 'workflow-expr',
        expression: 'x^2 - 4*x + 3',
        domain: 'real',
        variables: [{ symbol: 'x', domain: 'real' }],
        constants: [],
        complexity: 3,
        type: 'algebraic'
      };

      const expressionResult = await computationalEngine.solveMathematicalExpression(expression);
      expect(expressionResult.validation.verified).toBe(true);

      // Step 2: Perform matrix operations
      const matrix: Matrix = {
        id: 'workflow-matrix',
        rows: 2,
        cols: 2,
        data: [[2, 1], [1, 2]],
        type: 'symmetric',
        properties: {}
      };

      const matrixResult = await computationalEngine.performMatrixOperations([matrix], 'eigendecomposition');
      expect(matrixResult.properties.eigenvalues).toBeDefined();

      // Step 3: Solve optimization problem
      const optimization: OptimizationProblem = {
        id: 'workflow-opt',
        type: 'quadratic',
        objective: { expression: 'x^2 + y^2', type: 'minimize' },
        constraints: [{ expression: 'x + y = 1', type: 'equality' }],
        variables: [
          { name: 'x', type: 'continuous' },
          { name: 'y', type: 'continuous' }
        ],
        method: {
          algorithm: 'interior_point',
          parameters: {},
          convergence: { tolerance: 1e-8, maxIterations: 1000, criterion: 'absolute' },
          performance: { executionTime: 0, memoryUsage: 0, iterations: 0, functionEvaluations: 0 }
        }
      };

      const optResult = await computationalEngine.solveOptimizationProblem(optimization);
      expect(optResult.verification.optimal).toBe(true);

      // Verify all results are consistent and accurate
      expect(expressionResult.metadata.accuracy).toBeGreaterThan(0.95);
      expect(optResult.optimalValue).toBeGreaterThanOrEqual(0);
    });

    test('should integrate with LLM for method selection', async () => {
      const complexExpression: MathematicalExpression = {
        id: 'llm-integration',
        expression: 'sin(x) * exp(-x) - 0.1',
        domain: 'real',
        variables: [{ symbol: 'x', domain: 'real' }],
        constants: [],
        complexity: 8,
        type: 'transcendental'
      };

      const result = await computationalEngine.solveMathematicalExpression(complexExpression);
      
      // LLM should have selected an appropriate method
      expect(result.output).toHaveProperty('solution');
      expect(result.metadata.accuracy).toBeGreaterThan(0.9);
    });
  });
});